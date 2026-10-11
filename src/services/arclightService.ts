/**
 * ArcLight Career Intelligence API Service
 * ==========================================
 * Connects to FastAPI backend at http://localhost:8000
 * Implements all three ArcLight models + market intelligence endpoints.
 */

const isLocalHost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE = (import.meta.env.VITE_ARCLIGHT_API_URL as string) || (isLocalHost ? 'http://localhost:8000' : '');

export interface TopRole { role: string; count: number }
export interface SalaryBand { band: string; count: number; pct: number }
export interface SkillDemand { skill: string; jobs: number }
export interface Location { city: string; count: number }
export interface ExpGroup { group: string; count: number }

export interface HighSalaryResult {
  probability: number;
  prediction: string;
  confidence: string;
  tips: string[];
  model: string;
}

export interface SalaryHikeResult {
  probability: number;
  prediction: string;
  skill_scores: Record<string, number>;
  tips: string[];
  model: string;
}

export interface SeniorSuccessResult {
  probability: number;
  prediction: string;
  dominant_trait: string;
  personality_profile: Record<string, number>;
  tips: string[];
  model: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  source_dataset: string;
  algorithm: string;
  inputs: string[];
  target: string;
  sas_model_file: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error('ArcLight backend is offline or not configured for this domain.');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Market Intelligence ──────────────────────────────────────────────────────

export const getTopRoles = (limit = 10) =>
  apiFetch<{ roles: TopRole[] }>(`/api/market/top-roles?limit=${limit}`);

export const getSalaryDistribution = () =>
  apiFetch<{ distribution: SalaryBand[] }>('/api/market/salary-distribution');

export const getSkillDemand = () =>
  apiFetch<{ skills: SkillDemand[] }>('/api/market/skill-demand');

export const getTopLocations = (limit = 10) =>
  apiFetch<{ locations: Location[] }>(`/api/market/top-locations?limit=${limit}`);

export const getDSRoles = (limit = 10) =>
  apiFetch<{ roles: TopRole[] }>(`/api/market/ds-roles?limit=${limit}`);

export const getExperienceDistribution = () =>
  apiFetch<{ groups: ExpGroup[] }>('/api/market/experience-distribution');

// ── AI Predictions ───────────────────────────────────────────────────────────

export interface HighSalaryInput {
  experience_years: number;
  skill_count: number;
  python: boolean;
  sql: boolean;
  machine_learning: boolean;
  tableau: boolean;
  power_bi: boolean;
  sas: boolean;
}

export const predictHighSalary = (data: HighSalaryInput) =>
  apiFetch<HighSalaryResult>('/api/predict/high-salary', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export interface JDSHikeInput {
  big_data_skills: number;
  maths_stats_skills: number;
  coding_skills: number;
  ai_and_ml_skills: number;
  dashboard_storytelling: number;
  communication_skills: number;
}

export const predictSalaryHike = (data: JDSHikeInput) =>
  apiFetch<SalaryHikeResult>('/api/predict/salary-hike', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export interface SDSSuccessInput {
  neuroticism: number;
  extraversion: number;
  openness_to_experience: number;
  agreeableness: number;
  conscientiousness: number;
}

export const predictSeniorSuccess = (data: SDSSuccessInput) =>
  apiFetch<SeniorSuccessResult>('/api/predict/senior-success', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getModelInfo = () =>
  apiFetch<{ models: ModelInfo[] }>('/api/model-info');

export const checkHealth = async (): Promise<{ status: string }> => {
  if (!API_BASE) {
    throw new Error('ArcLight backend is not running on this domain.');
  }
  return apiFetch<{ status: string }>('/health');
};
