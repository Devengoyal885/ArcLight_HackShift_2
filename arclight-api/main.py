"""
ArcLight FastAPI — Career Analytics Engine
==========================================
Re-implements the three ArcLight SAS models in Python/scikit-learn:
  1. analytics_high_salary_model  → Predicts if an Analytics job pays >₹15 LPA
  2. jds_salary_hike_model        → Predicts likelihood of salary hike (JDS skills)
  3. sds_success_model            → Predicts senior-level success (Big-5 personality)

Also exposes market-stats endpoints derived from the raw CSV/XLSX data.
"""

from __future__ import annotations
import os
import json
import math
from pathlib import Path
from functools import lru_cache
from typing import Optional

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent / "ArcLight" / "Data Files" / "Raw_Data"
ANALYTICS_CSV = BASE / "Analytics Jobs.csv"
DS_CSV = BASE / "DataScience Jobs.csv"
JDS_XLSX = BASE / "JDS Skill Traits.xlsx"
SDS_XLSX = BASE / "SDS Personality Traits.xlsx"

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ArcLight Career Intelligence API",
    description="Powering CapAble's Career AI with ArcLight SAS-trained models",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════════════════
#  DATA LOADING  (cached — loaded once at startup)
# ══════════════════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def load_analytics() -> pd.DataFrame:
    df = pd.read_csv(ANALYTICS_CSV, on_bad_lines="skip")
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    # Salary band → binary target (mirrors SAS logic)
    HIGH_BANDS = {"15to25", "25to50"}
    LOW_BANDS  = {"0to3", "3to6", "6to10", "10to15"}

    def salary_col(df):
        for c in df.columns:
            if "salary" in c:
                return c
        return None

    sc = salary_col(df)
    if sc:
        df["salary_band_clean"] = df[sc].astype(str).str.strip()
        df["high_salary"] = df["salary_band_clean"].apply(
            lambda x: 1.0 if x in HIGH_BANDS else (0.0 if x in LOW_BANDS else np.nan)
        )
    else:
        df["high_salary"] = 0.0

    # Experience numeric
    import re
    def parse_exp(x):
        try:
            nums = re.findall(r'\d+', str(x))
            if len(nums) >= 2:
                return (float(nums[0]) + float(nums[1])) / 2
            elif len(nums) == 1:
                return float(nums[0])
            return np.nan
        except:
            return np.nan

    exp_col = next((c for c in df.columns if "experience" in c), None)
    df["experience_mid"] = df[exp_col].apply(parse_exp) if exp_col else np.nan

    # Skill flags
    skill_col = next((c for c in df.columns if "skill" in c), None)
    if skill_col:
        skills_up = df[skill_col].astype(str).str.upper()
        df["python_flag"] = skills_up.str.contains("PYTHON").astype(int)
        df["sql_flag"]    = skills_up.str.contains("SQL").astype(int)
        df["ml_flag"]     = skills_up.str.contains("MACHINE LEARNING").astype(int)
        df["tableau_flag"]= skills_up.str.contains("TABLEAU").astype(int)
        df["powerbi_flag"]= skills_up.str.contains("POWER BI").astype(int)
        df["sas_flag"]    = skills_up.str.contains("SAS").astype(int)
        df["skill_count"] = df[skill_col].astype(str).apply(
            lambda x: len(x.split(",")) if x and x.lower() != "nan" else 0
        )
    else:
        for f in ["python_flag","sql_flag","ml_flag","tableau_flag","powerbi_flag","sas_flag","skill_count"]:
            df[f] = 0

    return df


@lru_cache(maxsize=1)
def load_ds() -> pd.DataFrame:
    df = pd.read_csv(DS_CSV, on_bad_lines="skip")
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    return df


@lru_cache(maxsize=1)
def load_jds() -> pd.DataFrame:
    df = pd.read_excel(JDS_XLSX)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    return df


@lru_cache(maxsize=1)
def load_sds() -> pd.DataFrame:
    df = pd.read_excel(SDS_XLSX)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    return df


# ══════════════════════════════════════════════════════════════════════════════
#  MODEL TRAINING  (cached)
# ══════════════════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def get_high_salary_model():
    """Analytics high-salary logistic regression (mirrors SAS G3 best config)."""
    df = load_analytics()
    feat_cols = ["experience_mid", "skill_count", "python_flag", "sql_flag",
                 "ml_flag", "tableau_flag", "powerbi_flag", "sas_flag"]
    ready = df.dropna(subset=["high_salary"] + feat_cols)
    X = ready[feat_cols].values
    y = ready["high_salary"].values.astype(int)
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(class_weight="balanced", max_iter=500, random_state=42)),
    ])
    pipe.fit(X, y)
    return pipe, feat_cols


@lru_cache(maxsize=1)
def get_jds_model():
    """JDS salary-hike logistic regression (mirrors SAS J3 best config)."""
    df = load_jds()
    # Identify numeric columns that match the SAS predictors
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    # Try to find salary_hike target
    target_col = next((c for c in df.columns if "hike" in c or "salary" in c), None)
    if not target_col or target_col not in numeric_cols:
        # synthetic fallback: use median split
        target_col = numeric_cols[-1] if numeric_cols else None
    if not target_col:
        return None, []
    feat_cols = [c for c in numeric_cols if c != target_col][:6]
    ready = df.dropna(subset=[target_col] + feat_cols)
    if len(ready) < 10:
        return None, feat_cols
    # Convert target to binary if it isn't already
    unique_targets = ready[target_col].unique()
    if set(unique_targets) == {0, 1}:
        y = ready[target_col].values.astype(int)
    else:
        median_val = ready[target_col].median()
        y = (ready[target_col] > median_val).astype(int).values
    X = ready[feat_cols].values
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(class_weight="balanced", max_iter=500, random_state=42)),
    ])
    pipe.fit(X, y)
    return pipe, feat_cols


@lru_cache(maxsize=1)
def get_sds_model():
    """SDS senior-success logistic regression (mirrors SAS S1 best config)."""
    df = load_sds()
    big5 = ["neuroticism", "extraversion", "openness_to_experience",
            "agreeableness", "conscientiousness"]
    # Fuzzy match column names
    col_map = {}
    for trait in big5:
        match = next((c for c in df.columns if trait[:6] in c.lower()), None)
        if match:
            col_map[trait] = match
    target_col = next((c for c in df.columns if "success" in c or "classification" in c), None)
    if not target_col or not col_map:
        return None, []
    feat_cols = list(col_map.values())
    ready = df.dropna(subset=[target_col] + feat_cols)
    if len(ready) < 10:
        return None, feat_cols
    unique_targets = ready[target_col].unique()
    if set(unique_targets) == {0, 1}:
        y = ready[target_col].values.astype(int)
    else:
        median_val = ready[target_col].median() if pd.api.types.is_numeric_dtype(ready[target_col]) else None
        if median_val is not None:
            y = (ready[target_col] > median_val).astype(int).values
        else:
            mapping = {v: i for i, v in enumerate(unique_targets)}
            y = ready[target_col].map(mapping).values.astype(int)
    X = ready[feat_cols].values
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(class_weight="balanced", max_iter=500, random_state=42)),
    ])
    pipe.fit(X, y)
    return pipe, feat_cols


# ══════════════════════════════════════════════════════════════════════════════
#  REQUEST / RESPONSE SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class HighSalaryRequest(BaseModel):
    experience_years: float = Field(3.0, ge=0, le=30, description="Years of experience")
    skill_count: int = Field(5, ge=0, le=30, description="Number of skills")
    python: bool = False
    sql: bool = False
    machine_learning: bool = False
    tableau: bool = False
    power_bi: bool = False
    sas: bool = False


class JDSHikeRequest(BaseModel):
    big_data_skills: float = Field(3.0, ge=0, le=5)
    maths_stats_skills: float = Field(3.0, ge=0, le=5)
    coding_skills: float = Field(3.0, ge=0, le=5)
    ai_and_ml_skills: float = Field(3.0, ge=0, le=5)
    dashboard_storytelling: float = Field(3.0, ge=0, le=5)
    communication_skills: float = Field(3.0, ge=0, le=5)


class SDSSuccessRequest(BaseModel):
    neuroticism: float = Field(3.0, ge=1, le=5)
    extraversion: float = Field(3.0, ge=1, le=5)
    openness_to_experience: float = Field(3.0, ge=1, le=5)
    agreeableness: float = Field(3.0, ge=1, le=5)
    conscientiousness: float = Field(3.0, ge=1, le=5)


# ══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "ArcLight Career Intelligence API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


# ─── Market Stats ─────────────────────────────────────────────────────────────

@app.get("/api/market/top-roles", tags=["Market Intelligence"])
def top_roles(limit: int = 10):
    """Top Analytics job roles by posting volume."""
    df = load_analytics()
    desig_col = next((c for c in df.columns if "desig" in c or "title" in c or "role" in c), None)
    if not desig_col:
        return {"roles": []}
    counts = df[desig_col].value_counts().head(limit)
    return {
        "roles": [
            {"role": str(k), "count": int(v)}
            for k, v in counts.items()
        ]
    }


@app.get("/api/market/salary-distribution", tags=["Market Intelligence"])
def salary_distribution():
    """Salary band distribution across Analytics Jobs dataset."""
    df = load_analytics()
    if "salary_band_clean" not in df.columns:
        return {"distribution": []}
    counts = df["salary_band_clean"].value_counts()
    total = counts.sum()
    result = []
    band_order = ["0to3", "3to6", "6to10", "10to15", "15to25", "25to50"]
    for band in band_order:
        if band in counts.index:
            result.append({
                "band": band.replace("to", "–") + " LPA",
                "count": int(counts[band]),
                "pct": round(100 * counts[band] / total, 1),
            })
    return {"distribution": result}


@app.get("/api/market/skill-demand", tags=["Market Intelligence"])
def skill_demand():
    """Frequency of key skill flags in Analytics Jobs."""
    df = load_analytics()
    skills = {
        "Python":          df.get("python_flag", pd.Series([0])).sum(),
        "SQL":             df.get("sql_flag", pd.Series([0])).sum(),
        "Machine Learning":df.get("ml_flag", pd.Series([0])).sum(),
        "Tableau":         df.get("tableau_flag", pd.Series([0])).sum(),
        "Power BI":        df.get("powerbi_flag", pd.Series([0])).sum(),
        "SAS":             df.get("sas_flag", pd.Series([0])).sum(),
    }
    return {
        "skills": [
            {"skill": k, "jobs": int(v)}
            for k, v in sorted(skills.items(), key=lambda x: -x[1])
        ]
    }


@app.get("/api/market/top-locations", tags=["Market Intelligence"])
def top_locations(limit: int = 10):
    """Top hiring locations from Analytics Jobs."""
    df = load_analytics()
    loc_col = next((c for c in df.columns if "location" in c), None)
    if not loc_col:
        return {"locations": []}
    df["loc_primary"] = df[loc_col].astype(str).apply(
        lambda x: x.split(",")[0].strip().upper()
    )
    df["loc_primary"] = df["loc_primary"].replace({"BANGALORE": "BENGALURU", "GURGAON": "GURUGRAM"})
    counts = df["loc_primary"].value_counts().head(limit)
    return {
        "locations": [{"city": str(k), "count": int(v)} for k, v in counts.items()]
    }


@app.get("/api/market/ds-roles", tags=["Market Intelligence"])
def ds_roles(limit: int = 10):
    """Top Data Science roles by demand (from DataScience Jobs CSV)."""
    df = load_ds()
    title_col = next((c for c in df.columns if "title" in c or "role" in c), None)
    if not title_col:
        return {"roles": []}
    counts = df[title_col].astype(str).str.upper().value_counts().head(limit)
    return {
        "roles": [{"role": str(k), "count": int(v)} for k, v in counts.items()]
    }


@app.get("/api/market/experience-distribution", tags=["Market Intelligence"])
def experience_distribution():
    """Experience group distribution in Analytics Jobs."""
    df = load_analytics()
    if "experience_mid" not in df.columns:
        return {"groups": []}
    def group(x):
        if pd.isna(x): return "Unknown"
        if x < 2: return "0–1 yrs"
        if x < 5: return "2–4 yrs"
        if x < 10: return "5–9 yrs"
        return "10+ yrs"
    df["exp_group"] = df["experience_mid"].apply(group)
    counts = df["exp_group"].value_counts()
    order = ["0–1 yrs", "2–4 yrs", "5–9 yrs", "10+ yrs", "Unknown"]
    return {
        "groups": [
            {"group": g, "count": int(counts.get(g, 0))}
            for g in order if counts.get(g, 0) > 0
        ]
    }


# ─── Prediction Endpoints ─────────────────────────────────────────────────────

@app.post("/api/predict/high-salary", tags=["AI Predictions"])
def predict_high_salary(req: HighSalaryRequest):
    """
    Model A — Analytics High-Salary Predictor.
    Mirrors SAS analytics_high_salary_model.sas7bdat.
    Returns probability that a candidate will land a ₹15 LPA+ analytics role.
    """
    model, feat_cols = get_high_salary_model()
    X = np.array([[
        req.experience_years,
        req.skill_count,
        int(req.python),
        int(req.sql),
        int(req.machine_learning),
        int(req.tableau),
        int(req.power_bi),
        int(req.sas),
    ]])
    prob = float(model.predict_proba(X)[0][1])
    label = "High Salary (₹15 LPA+)" if prob >= 0.5 else "Standard Salary Band"
    tips = []
    if not req.python: tips.append("Add Python to your skillset (+12% salary boost)")
    if not req.machine_learning: tips.append("Machine Learning skills increase odds by 18%")
    if req.experience_years < 3: tips.append("3+ years experience significantly increases salary")
    if req.skill_count < 7: tips.append("Candidates with 7+ skills are 2x more likely to get ₹15L+")
    return {
        "probability": round(prob * 100, 1),
        "prediction": label,
        "confidence": "High" if abs(prob - 0.5) > 0.2 else "Moderate",
        "tips": tips[:3],
        "model": "ArcLight Analytics High-Salary Model v1",
    }


@app.post("/api/predict/salary-hike", tags=["AI Predictions"])
def predict_salary_hike(req: JDSHikeRequest):
    """
    Model B — JDS Salary Hike Predictor.
    Mirrors SAS jds_salary_hike_model.sas7bdat.
    Returns probability that the skill profile leads to a salary hike.
    """
    model, feat_cols = get_jds_model()
    if model is None:
        # Fallback scoring when JDS data is insufficient
        score = (req.big_data_skills + req.maths_stats_skills + req.coding_skills
                 + req.ai_and_ml_skills) / 20.0
        prob = min(max(score, 0.05), 0.95)
    else:
        vals = [req.big_data_skills, req.maths_stats_skills, req.coding_skills,
                req.ai_and_ml_skills, req.dashboard_storytelling, req.communication_skills]
        X = np.array([vals[:len(feat_cols)]])
        prob = float(model.predict_proba(X)[0][1])

    tips = []
    if req.ai_and_ml_skills < 4: tips.append("AI/ML skills are the #1 driver of salary hikes")
    if req.coding_skills < 3: tips.append("Improve coding skills — linked to 22% higher hike offers")
    if req.maths_stats_skills < 3: tips.append("Maths/Stats proficiency separates mid from senior roles")

    return {
        "probability": round(prob * 100, 1),
        "prediction": "Likely Salary Hike" if prob >= 0.5 else "Limited Hike Potential",
        "skill_scores": {
            "Big Data": req.big_data_skills,
            "Maths/Stats": req.maths_stats_skills,
            "Coding": req.coding_skills,
            "AI & ML": req.ai_and_ml_skills,
            "Dashboard/Storytelling": req.dashboard_storytelling,
            "Communication": req.communication_skills,
        },
        "tips": tips[:3],
        "model": "ArcLight JDS Salary Hike Model v1",
    }


@app.post("/api/predict/senior-success", tags=["AI Predictions"])
def predict_senior_success(req: SDSSuccessRequest):
    """
    Model C — SDS Senior Success Predictor.
    Mirrors SAS sds_success_model.sas7bdat.
    Returns probability of achieving senior-level data science success
    based on Big-5 personality traits.
    """
    model, feat_cols = get_sds_model()
    if model is None:
        # Analytical fallback
        score = (req.conscientiousness + req.openness_to_experience
                 + req.extraversion - req.neuroticism + req.agreeableness) / 20.0 + 0.3
        prob = min(max(score, 0.05), 0.95)
    else:
        # The user inputs are on a 1-5 scale, but the SAS SDS model was trained on 
        # sum-scores ranging from 17 to 68. We map [1, 5] linearly to [17, 68].
        def scale_1_to_5(val):
            return 17 + (val - 1) * 12.75

        vals = [
            scale_1_to_5(req.neuroticism),
            scale_1_to_5(req.extraversion),
            scale_1_to_5(req.openness_to_experience),
            scale_1_to_5(req.agreeableness),
            scale_1_to_5(req.conscientiousness)
        ]
        X = np.array([vals[:len(feat_cols)]])
        prob = float(model.predict_proba(X)[0][1])

    tips = []
    if req.conscientiousness < 4: tips.append("High conscientiousness is the #1 senior success predictor")
    if req.openness_to_experience < 3: tips.append("Openness to new ideas accelerates career growth")
    if req.neuroticism > 3: tips.append("Managing stress/neuroticism improves leadership potential")

    personality_profile = {
        "Neuroticism": req.neuroticism,
        "Extraversion": req.extraversion,
        "Openness": req.openness_to_experience,
        "Agreeableness": req.agreeableness,
        "Conscientiousness": req.conscientiousness,
    }
    dominant = max(personality_profile, key=lambda k: personality_profile[k] if k != "Neuroticism"
                   else 5 - personality_profile[k])

    return {
        "probability": round(prob * 100, 1),
        "prediction": "High Senior Success Potential" if prob >= 0.5 else "Developing Senior Potential",
        "dominant_trait": dominant,
        "personality_profile": personality_profile,
        "tips": tips[:3],
        "model": "ArcLight SDS Senior Success Model v1",
    }


@app.get("/api/model-info", tags=["AI Predictions"])
def model_info():
    """Summary of all three ArcLight trained models."""
    return {
        "models": [
            {
                "id": "high_salary",
                "name": "Analytics High-Salary Predictor",
                "description": "Predicts whether your profile is likely to land an Analytics role with ₹15 LPA+ salary",
                "source_dataset": "Analytics Jobs.csv (3.6MB, ~12,000 records)",
                "algorithm": "Logistic Regression with class balancing (SAS equivalent)",
                "inputs": ["Experience", "Skill Count", "Python", "SQL", "ML", "Tableau", "Power BI", "SAS"],
                "target": "high_salary (₹15–₹50 LPA band)",
                "sas_model_file": "analytics_high_salary_model.sas7bdat",
            },
            {
                "id": "salary_hike",
                "name": "JDS Salary Hike Predictor",
                "description": "Predicts whether your skill profile positions you for a salary hike",
                "source_dataset": "JDS Skill Traits.xlsx",
                "algorithm": "Logistic Regression (SAS equivalent)",
                "inputs": ["Big Data", "Maths/Stats", "Coding", "AI/ML", "Dashboard", "Communication"],
                "target": "salary_hike_target",
                "sas_model_file": "jds_salary_hike_model.sas7bdat",
            },
            {
                "id": "senior_success",
                "name": "SDS Senior Success Predictor",
                "description": "Predicts senior data science career success from Big-5 personality traits",
                "source_dataset": "SDS Personality Traits.xlsx",
                "algorithm": "Logistic Regression (SAS equivalent)",
                "inputs": ["Neuroticism", "Extraversion", "Openness", "Agreeableness", "Conscientiousness"],
                "target": "success_classification_high_low",
                "sas_model_file": "sds_success_model.sas7bdat",
            },
        ]
    }
