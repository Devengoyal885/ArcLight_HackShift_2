import React, { useState, useEffect, useCallback } from 'react';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  AreaChart, Area, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Brain, BarChart2, DollarSign, Wrench, Settings, MapPin, TrendingUp,
  Database, Cpu, Target, Package, Zap, Monitor, FileText
} from 'lucide-react';
import {
  checkHealth,
  getTopRoles,
  getSalaryDistribution,
  getSkillDemand,
  getTopLocations,
  getDSRoles,
  getExperienceDistribution,
  getModelInfo,
  predictHighSalary,
  predictSalaryHike,
  predictSeniorSuccess,
  type TopRole,
  type SalaryBand,
  type SkillDemand,
  type Location,
  type ExpGroup,
  type HighSalaryResult,
  type SalaryHikeResult,
  type SeniorSuccessResult,
  type ModelInfo,
} from '../../services/arclightService';
import './ArcLightPage.css';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Brain:    () => <span style={{ fontSize: '1.1rem' }}>🧠</span>,
  Chart:    () => <span style={{ fontSize: '1.1rem' }}>📊</span>,
  Target:   () => <span style={{ fontSize: '1.1rem' }}>🎯</span>,
  Map:      () => <span style={{ fontSize: '1.1rem' }}>🗺️</span>,
  Star:     () => <span style={{ fontSize: '1.1rem' }}>⭐</span>,
  Rocket:   () => <span style={{ fontSize: '1.1rem' }}>🚀</span>,
  Lamp:     () => <span style={{ fontSize: '0.9rem' }}>💡</span>,
  Person:   () => <span style={{ fontSize: '1.1rem' }}>👤</span>,
  Skills:   () => <span style={{ fontSize: '1.1rem' }}>🛠️</span>,
  Money:    () => <span style={{ fontSize: '1.1rem' }}>💰</span>,
  Trophy:   () => <span style={{ fontSize: '1.1rem' }}>🏆</span>,
  Dot:      ({ color }: { color: string }) => (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
  ),
};

// ── Color palettes ────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];
const TRAIT_COLORS: Record<string, string> = {
  Conscientiousness: '#10b981',
  Openness: '#06b6d4',
  Extraversion: '#6366f1',
  Agreeableness: '#f59e0b',
  Neuroticism: '#ef4444',
};

// ── Bar item component ────────────────────────────────────────────────────────
function BarItem({ label, value, max, color, delay = 0 }: { label: string; value: number; max: number; color: string; delay?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <motion.div 
      className="arc-bar-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="arc-bar-meta">
        <span className="arc-bar-label" title={label}>{label}</span>
        <span className="arc-bar-value">{value.toLocaleString()}</span>
      </div>
      <div className="arc-bar-track">
        <motion.div 
          className="arc-bar-fill" 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
          style={{ background: color }} 
        />
      </div>
    </motion.div>
  );
}

// ── Slider input ──────────────────────────────────────────────────────────────
function SliderInput({
  label, value, min = 1, max = 5, step = 0.5, onChange, color = '#6366f1'
}: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; color?: string;
}) {
  return (
    <div className="arc-form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="arc-form-label">{label}</label>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</span>
      </div>
      <div className="arc-slider-wrapper">
        <input
          type="range" className="arc-slider"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ accentColor: color }}
        />
        <div className="arc-slider-labels">
          <span>{min} Low</span>
          <span>High {max}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ArcLightPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [activeTab, setActiveTab] = useState<'market' | 'salary' | 'skills' | 'personality' | 'models'>('market');

  // Market data
  const [topRoles, setTopRoles] = useState<TopRole[]>([]);
  const [salaryDist, setSalaryDist] = useState<SalaryBand[]>([]);
  const [skillDemand, setSkillDemand] = useState<SkillDemand[]>([]);
  const [topLocations, setTopLocations] = useState<Location[]>([]);
  const [expGroups, setExpGroups] = useState<ExpGroup[]>([]);
  const [dsRoles, setDSRoles] = useState<TopRole[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  // Model A — High Salary
  const [salaryInput, setSalaryInput] = useState({
    experience_years: 3, skill_count: 6,
    python: true, sql: true, machine_learning: false,
    tableau: false, power_bi: false, sas: false,
  });
  const [salaryResult, setSalaryResult] = useState<HighSalaryResult | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Model B — Hike
  const [hikeInput, setHikeInput] = useState({
    big_data_skills: 3, maths_stats_skills: 3, coding_skills: 3,
    ai_and_ml_skills: 3, dashboard_storytelling: 3, communication_skills: 3,
  });
  const [hikeResult, setHikeResult] = useState<SalaryHikeResult | null>(null);
  const [hikeLoading, setHikeLoading] = useState(false);

  // Model C — Senior Success
  const [personalityInput, setPersonalityInput] = useState({
    neuroticism: 2, extraversion: 3.5, openness_to_experience: 4,
    agreeableness: 3.5, conscientiousness: 4,
  });
  const [successResult, setSuccessResult] = useState<SeniorSuccessResult | null>(null);
  const [successLoading, setSuccessLoading] = useState(false);

  // Model info
  const [models, setModels] = useState<ModelInfo[]>([]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkHealth()
      .then(() => {
        setApiStatus('online');
        loadAllMarketData();
        getModelInfo().then(r => setModels(r.models)).catch(() => {});
      })
      .catch(() => setApiStatus('offline'));
  }, []);

  const loadAllMarketData = async () => {
    setMarketLoading(true);
    try {
      const [roles, dist, skills, locs, exp, ds] = await Promise.all([
        getTopRoles(10),
        getSalaryDistribution(),
        getSkillDemand(),
        getTopLocations(10),
        getExperienceDistribution(),
        getDSRoles(8),
      ]);
      setTopRoles(roles.roles);
      setSalaryDist(dist.distribution);
      setSkillDemand(skills.skills);
      setTopLocations(locs.locations);
      setExpGroups(exp.groups);
      setDSRoles(ds.roles);
    } catch (e) {
      console.error(e);
    } finally {
      setMarketLoading(false);
    }
  };

  // ── Predictions ───────────────────────────────────────────────────────────
  const runHighSalary = async () => {
    setSalaryLoading(true);
    try { setSalaryResult(await predictHighSalary(salaryInput)); } catch (e) {} finally { setSalaryLoading(false); }
  };

  const runHike = async () => {
    setHikeLoading(true);
    try { setHikeResult(await predictSalaryHike(hikeInput)); } catch (e) {} finally { setHikeLoading(false); }
  };

  const runSuccess = async () => {
    setSuccessLoading(true);
    try { setSuccessResult(await predictSeniorSuccess(personalityInput)); } catch (e) {} finally { setSuccessLoading(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const probColor = (p: number) => p >= 70 ? '#10b981' : p >= 45 ? '#f59e0b' : '#ef4444';

  const maxCount = (arr: Array<{count: number}>) => Math.max(...arr.map(i => i.count), 1);

  // ── Market Tab ────────────────────────────────────────────────────────────
  const renderMarket = () => {
    if (apiStatus === 'offline') return <OfflineState />;
    if (marketLoading) return <div className="arc-loading"><div className="arc-spinner"/><span>Loading market data from ArcLight…</span></div>;

    const totalJobs = salaryDist.reduce((s, b) => s + b.count, 0);

    return (
      <>
        {/* KPI row */}
        <div className="arc-grid-4">
          <div className="arc-card">
            <div className="arc-card-glow blue"/>
            <div className="arc-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><BarChart2 size={24} strokeWidth={2.5} /></div>
            <div className="arc-stat-value">{totalJobs.toLocaleString()}</div>
            <div className="arc-stat-label">Analytics Jobs Indexed</div>
            <div className="arc-stat-sub">Source: Analytics Jobs.csv</div>
          </div>
          <div className="arc-card">
            <div className="arc-card-glow violet"/>
            <div className="arc-stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}><Wrench size={24} strokeWidth={2.5} /></div>
            <div className="arc-stat-value">{skillDemand.length}</div>
            <div className="arc-stat-label">Tracked Skill Signals</div>
            <div className="arc-stat-sub">Python, SQL, ML, Tableau…</div>
          </div>
          <div className="arc-card">
            <div className="arc-card-glow cyan"/>
            <div className="arc-stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}><MapPin size={24} strokeWidth={2.5} /></div>
            <div className="arc-stat-value">{topLocations.length}</div>
            <div className="arc-stat-label">Top Hiring Cities</div>
            <div className="arc-stat-sub">Bengaluru, Mumbai, Delhi…</div>
          </div>
          <div className="arc-card">
            <div className="arc-card-glow green"/>
            <div className="arc-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><TrendingUp size={24} strokeWidth={2.5} /></div>
            <div className="arc-stat-value">{salaryDist.filter(b => ['15–25 LPA','25–50 LPA'].some(h => b.band.includes(h.split(' ')[0]))).reduce((s, b) => s + b.pct, 0).toFixed(1)}%</div>
            <div className="arc-stat-label">High Salary Band Share</div>
            <div className="arc-stat-sub">₹15 LPA+ roles</div>
          </div>
        </div>

        {/* Top Roles + Salary Dist */}
        <div className="arc-grid-2">
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="arc-card-glow blue"/>
            <p className="arc-section-title">Top Analytics Roles by Volume</p>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRoles.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="role" 
                    type="category" 
                    width={160} 
                    tick={{ fontSize: 11, fill: 'var(--color-ink-600)' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => {
                      if (typeof val !== 'string') return val;
                      const truncated = val.length > 22 ? val.substring(0, 22) + '...' : val;
                      return truncated.replace(/ /g, '\u00A0');
                    }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {topRoles.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="arc-card-glow violet"/>
            <p className="arc-section-title">Salary Band Distribution</p>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryDist} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="band" tick={{ fontSize: 11, fill: 'var(--color-ink-600)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-600)' }} axisLine={false} tickLine={false} tickFormatter={(tick) => `${tick}%`} width={40} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} 
                    formatter={(value: any) => [`${value}%`, 'Percentage of Roles']}
                  />
                  <Area type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Skill Demand + Locations */}
        <div className="arc-grid-2">
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="arc-card-glow cyan"/>
            <p className="arc-section-title">Skill Demand in Analytics Jobs</p>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillDemand.slice(0, 6)}>
                  <defs>
                    <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="glowRadar" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <PolarGrid gridType="circle" stroke="rgba(0,0,0,0.08)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-ink-700)', fontSize: 13, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar 
                    name="Jobs" 
                    dataKey="jobs" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    fill="url(#colorRadar)" 
                    fillOpacity={1} 
                    filter="url(#glowRadar)"
                    dot={{ r: 3, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                  />
                  <Tooltip cursor={false} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="arc-card-glow green"/>
            <p className="arc-section-title">Top Hiring Locations</p>
            <div className="arc-bar-list">
              {topLocations.slice(0, 8).map((l, i) => (
                <BarItem key={i} label={l.city} value={l.count} max={maxCount(topLocations)} color={COLORS[i % COLORS.length]} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Data Science + Experience */}
        <div className="arc-grid-2">
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="arc-card-glow amber"/>
            <p className="arc-section-title">Top Data Science Roles</p>
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dsRoles.slice(0, 5)} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                    {dsRoles.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div className="arc-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="arc-card-glow pink"/>
            <p className="arc-section-title">Experience Level Distribution</p>
            <div className="arc-bar-list">
              {expGroups.map((g, i) => (
                <BarItem key={i} label={g.group} value={g.count} max={maxCount(expGroups)} color={COLORS[(i + 2) % COLORS.length]} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </div>
      </>
    );
  };

  // ── Salary Predictor Tab ────────────────────────────────────────────────
  const renderSalary = () => (
    <div className="arc-grid-2">
      <div className="arc-card">
        <div className="arc-card-glow blue"/>
        <p className="arc-section-title">Model A — High Salary Predictor</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--arc-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Powered by <strong style={{ color: '#a5b4fc' }}>ArcLight analytics_high_salary_model.sas7bdat</strong>.
          Enter your profile to predict if you'll land a <strong style={{ color: '#10b981' }}>₹15 LPA+</strong> Analytics role.
        </p>
        <div className="arc-predict-form">
          <div className="arc-form-row">
            <div className="arc-form-group">
              <label className="arc-form-label">Experience (Years)</label>
              <input type="number" className="arc-form-input"
                min={0} max={30} step={0.5} value={salaryInput.experience_years}
                onChange={e => setSalaryInput(p => ({ ...p, experience_years: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="arc-form-group">
              <label className="arc-form-label">Number of Skills Listed</label>
              <input type="number" className="arc-form-input"
                min={0} max={30} value={salaryInput.skill_count}
                onChange={e => setSalaryInput(p => ({ ...p, skill_count: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          <div className="arc-form-group">
            <label className="arc-form-label">Key Skills (check all that apply)</label>
            <div className="arc-checkbox-grid">
              {[
                ['python', 'Python'], ['sql', 'SQL'], ['machine_learning', 'Machine Learning'],
                ['tableau', 'Tableau'], ['power_bi', 'Power BI'], ['sas', 'SAS'],
              ].map(([key, label]) => (
                <label key={key} className="arc-checkbox-item">
                  <input type="checkbox"
                    checked={(salaryInput as any)[key]}
                    onChange={e => setSalaryInput(p => ({ ...p, [key]: e.target.checked }))} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="arc-predict-btn" onClick={runHighSalary} disabled={salaryLoading || apiStatus !== 'online'}>
            {salaryLoading ? '⏳ Predicting…' : '🚀 Predict High-Salary Probability'}
          </button>
          {apiStatus !== 'online' && <p style={{ fontSize: '0.72rem', color: '#ef4444', textAlign: 'center' }}>API offline — start the ArcLight server</p>}
        </div>
      </div>

      <div className="arc-card">
        <div className="arc-card-glow green"/>
        <p className="arc-section-title">Prediction Result</p>
        {!salaryResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--arc-dim)', gap: 12 }}>
            <span style={{ fontSize: '2.5rem' }}>💰</span>
            <span style={{ fontSize: '0.82rem' }}>Configure inputs and click Predict</span>
          </div>
        ) : (
          <motion.div className="arc-result-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <motion.div className="arc-result-prob" style={{ color: probColor(salaryResult.probability) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {salaryResult.probability}%
            </motion.div>
            <motion.div className="arc-result-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {salaryResult.prediction}
            </motion.div>
            <div className="arc-prob-bar">
              <motion.div className="arc-prob-fill" 
                initial={{ width: 0 }} 
                animate={{ width: `${salaryResult.probability}%` }} 
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, ${probColor(salaryResult.probability)}, ${probColor(salaryResult.probability)}88)` }} 
              />
            </div>
            <motion.div style={{ display: 'flex', gap: 8, marginBottom: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <span style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 99, fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 600 }}>
                {salaryResult.confidence} Confidence
              </span>
              <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, fontSize: '0.68rem', color: 'var(--arc-muted)', fontWeight: 600 }}>
                ArcLight Model
              </span>
            </motion.div>
            {salaryResult.tips.length > 0 && (
              <>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--arc-muted)', marginBottom: 8 }}>
                  💡 Recommendations
                </p>
                <motion.div className="arc-tips-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  {salaryResult.tips.map((tip, i) => (
                    <motion.div key={i} className="arc-tip-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}>
                      <span className="arc-tip-icon">💡</span>
                      {tip}
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );

  // ── Skills / Hike Tab ───────────────────────────────────────────────────
  const renderSkills = () => (
    <div className="arc-grid-2">
      <div className="arc-card">
        <div className="arc-card-glow violet"/>
        <p className="arc-section-title">Model B — JDS Salary Hike Predictor</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--arc-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Powered by <strong style={{ color: '#a5b4fc' }}>ArcLight jds_salary_hike_model.sas7bdat</strong>.
          Rate your skill proficiency to predict salary hike likelihood.
        </p>
        <div className="arc-predict-form">
          {[
            ['big_data_skills', 'Big Data Skills', '#06b6d4'],
            ['maths_stats_skills', 'Maths & Statistics', '#8b5cf6'],
            ['coding_skills', 'Coding / Programming', '#6366f1'],
            ['ai_and_ml_skills', 'AI & Machine Learning', '#10b981'],
            ['dashboard_storytelling', 'Dashboard & Storytelling', '#f59e0b'],
            ['communication_skills', 'Communication Skills', '#ec4899'],
          ].map(([key, label, color]) => (
            <SliderInput
              key={key}
              label={label as string}
              value={(hikeInput as any)[key]}
              onChange={v => setHikeInput(p => ({ ...p, [key]: v }))}
              color={color as string}
            />
          ))}
          <button className="arc-predict-btn" onClick={runHike} disabled={hikeLoading || apiStatus !== 'online'}>
            {hikeLoading ? '⏳ Calculating…' : '🎯 Predict Salary Hike Probability'}
          </button>
        </div>
      </div>

      <div className="arc-card">
        <div className="arc-card-glow cyan"/>
        <p className="arc-section-title">Hike Prediction Result</p>
        {!hikeResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--arc-dim)', gap: 12 }}>
            <span style={{ fontSize: '2.5rem' }}>📈</span>
            <span style={{ fontSize: '0.82rem' }}>Rate your skills and click Predict</span>
          </div>
        ) : (
          <motion.div className="arc-result-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <motion.div className="arc-result-prob" style={{ color: probColor(hikeResult.probability) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {hikeResult.probability}%
            </motion.div>
            <motion.div className="arc-result-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {hikeResult.prediction}
            </motion.div>
            <div className="arc-prob-bar">
              <motion.div className="arc-prob-fill" 
                initial={{ width: 0 }} 
                animate={{ width: `${hikeResult.probability}%` }} 
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, #8b5cf6, #06b6d4)` }} 
              />
            </div>

            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--arc-muted)', margin: '16px 0 8px' }}>
              Skill Breakdown
            </p>
            <motion.div className="arc-radar-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {Object.entries(hikeResult.skill_scores).map(([trait, val], i) => (
                <div key={trait} className="arc-trait-row">
                  <span className="arc-trait-name">{trait}</span>
                  <div className="arc-trait-track">
                    <motion.div className="arc-trait-fill" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(val as number / 5) * 100}%` }} 
                      transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                      style={{ background: COLORS[i % COLORS.length] }} 
                    />
                  </div>
                  <span className="arc-trait-val">{val as React.ReactNode}</span>
                </div>
              ))}
            </motion.div>

            {hikeResult.tips.length > 0 && (
              <motion.div className="arc-tips-list" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                {hikeResult.tips.map((tip, i) => (
                  <motion.div key={i} className="arc-tip-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.1 }}>
                    <span className="arc-tip-icon">💡</span>
                    {tip}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );

  // ── Personality / Senior Success Tab ──────────────────────────────────
  const renderPersonality = () => (
    <div className="arc-grid-2">
      <div className="arc-card">
        <div className="arc-card-glow pink"/>
        <p className="arc-section-title">Model C — SDS Senior Success Predictor</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--arc-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Powered by <strong style={{ color: '#a5b4fc' }}>ArcLight sds_success_model.sas7bdat</strong>.
          Rate yourself on the Big-5 personality traits to predict senior-level career success.
        </p>
        <div className="arc-predict-form">
          {[
            ['conscientiousness', 'Conscientiousness', '#10b981', 'Self-discipline, organisation, goal-orientation'],
            ['openness_to_experience', 'Openness to Experience', '#06b6d4', 'Curiosity, creativity, willingness to learn'],
            ['extraversion', 'Extraversion', '#6366f1', 'Social energy, assertiveness, confidence'],
            ['agreeableness', 'Agreeableness', '#f59e0b', 'Empathy, cooperation, team-friendliness'],
            ['neuroticism', 'Neuroticism', '#ef4444', 'Emotional reactivity, stress sensitivity (lower = better)'],
          ].map(([key, label, color, hint]) => (
            <div key={key} className="arc-form-group">
              <SliderInput
                label={label as string}
                value={(personalityInput as any)[key]}
                onChange={v => setPersonalityInput(p => ({ ...p, [key]: v }))}
                color={color as string}
              />
              <p style={{ fontSize: '0.68rem', color: 'var(--arc-dim)', margin: '-4px 0 0', lineHeight: 1.4 }}>{hint}</p>
            </div>
          ))}
          <button className="arc-predict-btn" onClick={runSuccess} disabled={successLoading || apiStatus !== 'online'}>
            {successLoading ? '⏳ Predicting…' : '🏆 Predict Senior Success Potential'}
          </button>
        </div>
      </div>

      <div className="arc-card">
        <div className="arc-card-glow amber"/>
        <p className="arc-section-title">Senior Success Result</p>
        {!successResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--arc-dim)', gap: 12 }}>
            <span style={{ fontSize: '2.5rem' }}>🏆</span>
            <span style={{ fontSize: '0.82rem' }}>Complete the Big-5 assessment</span>
          </div>
        ) : (
          <motion.div className="arc-result-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <motion.div className="arc-result-prob" style={{ color: probColor(successResult.probability) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {successResult.probability}%
            </motion.div>
            <motion.div className="arc-result-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {successResult.prediction}
            </motion.div>
            <motion.div style={{ display: 'flex', gap: 8, marginBottom: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <span style={{ padding: '3px 10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, fontSize: '0.68rem', color: '#fcd34d', fontWeight: 600 }}>
                ⭐ Dominant Trait: {successResult.dominant_trait}
              </span>
            </motion.div>
            <div className="arc-prob-bar" style={{ marginBottom: 16 }}>
              <motion.div className="arc-prob-fill" 
                initial={{ width: 0 }} 
                animate={{ width: `${successResult.probability}%` }} 
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, #f59e0b, #ec4899)` }} 
              />
            </div>

            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--arc-muted)', marginBottom: 8 }}>
              Big-5 Personality Profile
            </p>
            <motion.div className="arc-radar-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {Object.entries(successResult.personality_profile).map(([trait, val], i) => (
                <div key={trait} className="arc-trait-row">
                  <span className="arc-trait-name">{trait}</span>
                  <div className="arc-trait-track">
                    <motion.div className="arc-trait-fill" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(val as number / 5) * 100}%` }} 
                      transition={{ duration: 1, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                      style={{ background: TRAIT_COLORS[trait] || '#6366f1' }} 
                    />
                  </div>
                  <span className="arc-trait-val">{val as React.ReactNode}</span>
                </div>
              ))}
            </motion.div>

            {successResult.tips.length > 0 && (
              <motion.div className="arc-tips-list" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                {successResult.tips.map((tip, i) => (
                  <motion.div key={i} className="arc-tip-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.1 }}>
                    <span className="arc-tip-icon">💡</span>
                    {tip}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );

  // ── Models Info Tab ─────────────────────────────────────────────────────
  const renderModels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-ink-900)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
          ArcLight Model Registry
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--arc-muted)', maxWidth: 800, lineHeight: 1.6 }}>
          These models were built using the ArcLight SAS pipeline: stratified train/test split → 5-fold cross-validation → grid search → randomized search → final saved model.
          The Python FastAPI re-implements the same Logistic Regression architecture with identical class balancing.
        </p>
      </div>

      {models.length === 0 ? (
        <div className="arc-loading"><div className="arc-spinner"/><span>Loading model metadata…</span></div>
      ) : (
        <div className="arc-grid-3">
          {models.map((m, i) => (
            <motion.div 
              key={m.id} 
              className="arc-registry-card" 
              style={{ borderTopColor: COLORS[i % COLORS.length] }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <div style={{ position: 'absolute', top: -50, right: -50, width: 120, height: 120, background: `radial-gradient(circle, ${COLORS[i % COLORS.length]} 0%, transparent 70%)`, opacity: 0.15, filter: 'blur(20px)', pointerEvents: 'none' }} />
              
              <div>
                <h3 className="arc-registry-card-title">{m.name}</h3>
                <p className="arc-registry-card-desc">{m.description}</p>
              </div>

              <div className="arc-registry-meta">
                <div className="arc-registry-meta-item">
                  <Database size={14} className="arc-registry-meta-icon" style={{ color: COLORS[i % COLORS.length] }} />
                  <span>{m.source_dataset}</span>
                </div>
                <div className="arc-registry-meta-item">
                  <Cpu size={14} className="arc-registry-meta-icon" style={{ color: COLORS[i % COLORS.length] }} />
                  <span>{m.algorithm}</span>
                </div>
                <div className="arc-registry-meta-item">
                  <Target size={14} className="arc-registry-meta-icon" style={{ color: COLORS[i % COLORS.length] }} />
                  <span>{m.target}</span>
                </div>
              </div>

              <div className="arc-registry-chips">
                {m.inputs.map(inp => <span key={inp} className="arc-chip">{inp}</span>)}
              </div>
              
              <div className="arc-registry-file">
                <FileText size={12} style={{ opacity: 0.6 }} />
                <code style={{ background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: 6, color: '#6366f1', fontWeight: 600 }}>{m.sas_model_file}</code>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Architecture diagram */}
      <motion.div 
        className="arc-card" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        style={{ background: 'rgba(99,102,241,0.02)', gridColumn: '1 / -1' }}
      >
        <div className="arc-card-glow violet"/>
        <p className="arc-section-title">FastAPI Integration Architecture</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'center', textAlign: 'center', padding: '24px 0' }}>
          {[
            { label: 'ArcLight SAS Code\n+ .sas7bdat Models', icon: <Package size={28} strokeWidth={2.5} />, color: '#6366f1' },
            { label: '→', icon: null, color: 'transparent' },
            { label: 'FastAPI\nPython Backend\n:8000', icon: <Zap size={28} strokeWidth={2.5} />, color: '#8b5cf6' },
            { label: '→', icon: null, color: 'transparent' },
            { label: 'CapAble\nFrontend\nArcLight Tab', icon: <Monitor size={28} strokeWidth={2.5} />, color: '#06b6d4' },
          ].map((node, i) => (
            node.icon ? (
              <motion.div 
                key={i} 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ padding: '24px 16px', background: `${node.color}0a`, border: `1px solid ${node.color}25`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: `0 8px 32px ${node.color}10` }}
              >
                <div style={{ color: node.color, padding: 16, background: `${node.color}15`, borderRadius: '50%' }}>
                  {node.icon}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--arc-muted)', lineHeight: 1.5, whiteSpace: 'pre-line', fontWeight: 600 }}>
                  {node.label}
                </div>
              </motion.div>
            ) : (
              <div key={i} style={{ fontSize: '1.5rem', color: 'var(--arc-dim)', display: 'flex', justifyContent: 'center' }}>→</div>
            )
          ))}
        </div>
        
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--arc-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--arc-text)' }}>Data Flow:</strong> ArcLight raw CSV/XLSX datasets are loaded once and cached in memory.
            Scikit-learn Logistic Regression models mirror the SAS <code style={{ color: '#a5b4fc', background: 'rgba(165, 180, 252, 0.1)', padding: '2px 6px', borderRadius: 4 }}>PROC LOGISTIC</code> pipeline with identical class weighting.
            The React frontend calls REST endpoints via <code style={{ color: '#a5b4fc', background: 'rgba(165, 180, 252, 0.1)', padding: '2px 6px', borderRadius: 4 }}>arclightService.ts</code>, displays predictions in real-time,
            and shows market intelligence charts from the 3.6MB Analytics Jobs dataset.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              'GET /api/market/top-roles',
              'GET /api/market/salary-distribution',
              'GET /api/market/skill-demand',
              'POST /api/predict/high-salary',
              'POST /api/predict/salary-hike',
              'POST /api/predict/senior-success',
            ].map((ep, i) => (
              <motion.span 
                key={ep} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.8 + i * 0.05 }}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  fontSize: '0.72rem',
                  color: '#6366f1',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.05)',
                  cursor: 'default'
                }}
              >
                {ep}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className={`arc-page ${isEmbedded ? 'arc-embedded' : ''}`}>
      {!isEmbedded && <FloatingNavbar variant="candidate" />}
      <div className="arc-inner" style={isEmbedded ? { paddingTop: 0 } : undefined}>
        {/* Header */}
        <div className="arc-header">
          <div className="arc-header-left">
            <span className="arc-header-badge">
              <span className="arc-badge-dot"/>
              ArcLight × CapAble Intelligence
            </span>
            <h1 className="arc-header-title">
              Career <span>Intelligence</span>
            </h1>
            <p className="arc-header-sub">
              Market insights & AI predictions powered by ArcLight SAS analytics models
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div className={`arc-status-pill ${apiStatus}`}>
              <span>{apiStatus === 'online' ? '✅' : apiStatus === 'loading' ? '⏳' : '❌'}</span>
              ArcLight API {apiStatus === 'online' ? 'Connected' : apiStatus === 'loading' ? 'Connecting…' : 'Offline'}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--arc-dim)' }}>http://localhost:8000</span>
          </div>
        </div>

          {/* Tab Nav */}
        <div className="arc-tabs">
          {[
            { id: 'market',      icon: <BarChart2 size={16} strokeWidth={2.5} />, label: 'Market Intelligence' },
            { id: 'salary',      icon: <DollarSign size={16} strokeWidth={2.5} />, label: 'High-Salary Predictor' },
            { id: 'skills',      icon: <Wrench size={16} strokeWidth={2.5} />, label: 'Salary Hike Model' },
            { id: 'personality', icon: <Brain size={16} strokeWidth={2.5} />, label: 'Senior Success Model' },
            { id: 'models',      icon: <Settings size={16} strokeWidth={2.5} />, label: 'Model Registry' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`arc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ position: 'relative' }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="arc-tab-active-bg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tab.icon} {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            {activeTab === 'market'      && renderMarket()}
            {activeTab === 'salary'      && renderSalary()}
            {activeTab === 'skills'      && renderSkills()}
            {activeTab === 'personality' && renderPersonality()}
            {activeTab === 'models'      && renderModels()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function OfflineState() {
  return (
    <div className="arc-card">
      <div className="arc-error-box">
        <span className="arc-error-icon">⚠️</span>
        <p className="arc-error-title">ArcLight API Offline</p>
        <p className="arc-error-msg">
          The FastAPI backend is not running. Start it by navigating to the{' '}
          <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>arclight-api/</code>{' '}
          folder and running:<br/>
          <code style={{ color: '#a5b4fc' }}>python -m uvicorn main:app --port 8000</code>
        </p>
      </div>
    </div>
  );
}
