# ArcLight API & Dataset Integration

This document provides a detailed walkthrough of how the `ArcLight` dataset and original SAS models have been integrated into the CapAble platform via a dedicated Python FastAPI backend (`arclight-api`). 

## 1. Overview of the Architecture

The integration follows a three-tier architecture:
1. **Data Layer (The `ArcLight` folder)**: Contains the raw CSV/XLSX datasets and the original SAS (`.sas7bdat`) trained model artifacts.
2. **Backend Services (`arclight-api`)**: A Python FastAPI server (`main.py`) that serves as the bridge. It loads the raw data, re-implements the statistical models using `scikit-learn`, and exposes RESTful JSON endpoints.
3. **Frontend Application**: The React frontend (`ArcLightPage.tsx`) which calls these endpoints to visualize data with `recharts` and interactive forms.

## 2. Dataset Ingestion and Preprocessing

The datasets are stored in `ArcLight/Data Files/Raw_Data/`:
- `Analytics Jobs.csv` (3.6MB, ~12,000 records)
- `DataScience Jobs.csv`
- `JDS Skill Traits.xlsx`
- `SDS Personality Traits.xlsx`

### In-Memory Caching Strategy
Instead of using a traditional database for this localized dataset, the FastAPI server relies on **in-memory data loading using `pandas`**. Functions like `load_analytics()` are decorated with Python's `@lru_cache(maxsize=1)`. This ensures that the datasets are loaded from disk and parsed exactly once upon the first request, and subsequent API calls are served instantly from memory.

### Feature Engineering Pipeline
During the loading phase, raw textual columns are preprocessed to feed into the models:
- **Salary Bins**: Salary ranges (e.g., "15to25", "25to50") are parsed and categorized into a binary `high_salary` target (1 if >= 15 LPA, otherwise 0).
- **Experience Parsing**: String fields like "3-5 years" are extracted via Regular Expressions to numeric averages (`experience_mid`).
- **Skill Extraction**: Text fields listing comma-separated skills are parsed into binary flags (e.g., `python_flag`, `sql_flag`, `ml_flag`) using vectorized string matching (`str.contains`).

## 3. The Scikit-Learn Model Pipeline (SAS Replication)

The CapAble platform modernizes the original ArcLight SAS models by re-implementing them seamlessly in Python using `scikit-learn`. There are three core predictive models:

1. **Analytics High-Salary Model** (Mirrors `analytics_high_salary_model.sas7bdat`)
2. **JDS Salary Hike Predictor** (Mirrors `jds_salary_hike_model.sas7bdat`)
3. **SDS Senior Success Predictor** (Mirrors `sds_success_model.sas7bdat`)

### Training Procedure
These models are built dynamically in Python based on the loaded DataFrames:
1. **Extraction**: The specific features and target variables are extracted, dropping missing `NaN` values.
2. **Pipeline Construction**: A `sklearn.pipeline.Pipeline` is created consisting of:
   - `StandardScaler()`: Normalizes features to have zero mean and unit variance.
   - `LogisticRegression(class_weight="balanced")`: Matches the SAS `PROC LOGISTIC` routine. The `balanced` parameter is critical as it handles class imbalance naturally (e.g., if there are fewer 15LPA+ roles in the data).
3. **On-the-fly Fitting**: The models are `.fit()` the first time the endpoint is called and the Pipeline object is cached.

## 4. API Endpoints

The FastAPI server exposes two main categories of endpoints on port `8000`:

### A. Market Intelligence (Data Aggregation)
These endpoints aggregate data directly from the Pandas DataFrames to supply the frontend charts:
- `GET /api/market/top-roles`: Returns value counts for the top designations.
- `GET /api/market/salary-distribution`: Returns the percentage spread across salary bands.
- `GET /api/market/skill-demand`: Summarizes occurrences of Python, SQL, ML, Tableau, etc.
- `GET /api/market/top-locations`: Aggregates the primary cities of the job postings.

### B. AI Predictions (Inference)
These endpoints take JSON payloads (validated by Pydantic models) and return real-time predictions:
- `POST /api/predict/high-salary`
- `POST /api/predict/salary-hike`
- `POST /api/predict/senior-success`

**Inference Flow**:
1. The JSON payload is validated (e.g., ensuring experience is between 0 and 30).
2. The payload is mapped into a Numpy array matching the model's expected feature layout.
3. `model.predict_proba(X)` is called to generate a confidence probability percentage.
4. An actionable response is returned containing the probability score, a classification label, and specific hardcoded tips depending on feature deficits (e.g., "Add Python to your skillset (+12% salary boost)").

## 5. Startup & Usage

To start the API standalone locally:
```bash
cd arclight-api
python -m uvicorn main:app --port 8000 --reload
```
The React frontend uses `checkHealth()` to ping `http://localhost:8000/health` continuously. Once it receives an "ok" status, the UI dynamically switches from "Offline" mode to fetching the market data and unlocking the prediction forms.
