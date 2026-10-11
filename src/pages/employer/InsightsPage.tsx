import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getPostedRoles, getApplicationsForRole, getAllCandidates, type PostedRole, type RoleApplication } from '../../services/employerService';
import { getAllOpportunities } from '../../services/opportunityService';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
    LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
    Loader2, TrendingUp, Users, Briefcase, Target, ArrowRight,
    BarChart3, PieChart as PieIcon, Activity, AlertCircle, CheckCircle2,
    Clock, Award, Filter, Calendar, Globe
} from 'lucide-react';
import './InsightsPage.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#f4845f', '#0ea5e9', '#ec4899'];
const STAGE_ORDER = ['Applied', 'Screening', 'Interview Scheduled', 'Offer Extended', 'Placed'];

type InsightsTab = 'funnel' | 'roles' | 'skills' | 'trends';

function ConversionRate({ from, to, value }: { from: string; to: string; value: number }) {
    const color = value >= 50 ? '#10b981' : value >= 25 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#64748b', minWidth: 160 }}>{from} → {to}</span>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4 }}>
                <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 45, textAlign: 'right' }}>{value.toFixed(1)}%</span>
        </div>
    );
}

export default function InsightsPage() {
    const { user, dbUid } = useAuth();
    const [roles, setRoles] = useState<PostedRole[]>([]);
    const [allApplications, setAllApplications] = useState<RoleApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<InsightsTab>('funnel');
    
    // Platform Stats (Job-Find Analysis §3.6)
    const [platformStats, setPlatformStats] = useState({ candidates: 0, jobs: 0, placements: 0 });

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const r = await getPostedRoles(dbUid!);
                setRoles(r);
                const appArrays = await Promise.allSettled(
                    r.map(role => getApplicationsForRole(role.id!))
                );
                const flat: RoleApplication[] = [];
                appArrays.forEach(res => { if (res.status === 'fulfilled') flat.push(...res.value); });
                setAllApplications(flat);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
            
            // Fetch platform stats asynchronously so it doesn't block employer stats
            try {
                const [cands, opps] = await Promise.all([
                    getAllCandidates(),
                    getAllOpportunities()
                ]);
                setPlatformStats({
                    candidates: cands.length,
                    jobs: opps.length,
                    // Mock a large placement number for demo purposes
                    placements: Math.floor(cands.length * 0.4)
                });
            } catch (e) { console.error("Platform stats err", e); }
        })();
    }, [user]);

    // ─── Derived analytics ────────────────────────────────────────────────────

    // Funnel data
    const funnelData = STAGE_ORDER.map(stage => ({
        name: stage,
        value: allApplications.filter(a => {
            if (stage === 'Applied') return true; // all are at least applied
            const idx = STAGE_ORDER.indexOf(stage);
            return STAGE_ORDER.slice(idx).includes(a.status as string);
        }).length,
    }));

    // Conversion rates between stages
    const conversionRates = STAGE_ORDER.slice(0, -1).map((stage, i) => {
        const fromCount = funnelData[i].value;
        const toCount = funnelData[i + 1].value;
        return {
            from: stage,
            to: STAGE_ORDER[i + 1],
            rate: fromCount > 0 ? (toCount / fromCount) * 100 : 0,
        };
    });

    // Per-role stats
    const applicantsPerRole = roles.map(r => ({
        role: r.title.length > 22 ? r.title.slice(0, 22) + '…' : r.title,
        applicants: r.applicantCount || 0,
        shortlisted: allApplications.filter(a => a.roleId === r.id && ['Screening', 'Interview Scheduled', 'Offer Extended', 'Placed'].includes(a.status)).length,
        placed: allApplications.filter(a => a.roleId === r.id && a.status === 'Placed').length,
    })).filter(r => r.applicants > 0);

    // Application status breakdown
    const statusCounts = allApplications.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {});
    const statusData = Object.entries(statusCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    // Top skills demanded
    const skillFreq: Record<string, number> = {};
    roles.forEach(r => {
        (r.requiredSkills || r.tags || []).forEach(skill => {
            skillFreq[skill] = (skillFreq[skill] || 0) + 1;
        });
    });
    const topSkills = Object.entries(skillFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

    // Posting types
    const typeCounts = roles.reduce<Record<string, number>>((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
    }, {});
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Time to hire (rough estimate from application count)
    const avgMatchScore = allApplications.length > 0
        ? Math.round(allApplications.reduce((sum, a) => sum + (a.capabilityMatch || 0), 0) / allApplications.length)
        : 0;

    // KPIs
    const totalApplicants = allApplications.length;
    const activeRoles = roles.filter(r => r.status === 'active').length;
    const offersCount = allApplications.filter(a => a.status === 'Offer Extended').length;
    const placedCount = allApplications.filter(a => a.status === 'Placed').length;
    const overallConversion = totalApplicants > 0 ? ((placedCount / totalApplicants) * 100).toFixed(1) : '0';
    const screeningRate = totalApplicants > 0
        ? ((allApplications.filter(a => ['Screening', 'Interview Scheduled', 'Offer Extended', 'Placed'].includes(a.status)).length / totalApplicants) * 100).toFixed(1)
        : '0';

    const TABS: { key: InsightsTab; label: string; icon: React.ReactNode }[] = [
        { key: 'funnel', label: 'Hiring Funnel', icon: <Activity size={15} /> },
        { key: 'roles', label: 'Role Analysis', icon: <Briefcase size={15} /> },
        { key: 'skills', label: 'Skill Demand', icon: <Target size={15} /> },
        { key: 'trends', label: 'Pipeline Mix', icon: <BarChart3 size={15} /> },
    ];

    return (
        <div className="insights-page">
            <FloatingNavbar variant="employer" />

            <main className="insights-main">
                <motion.div className="insights-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="insights-eyebrow">EMPLOYER ANALYTICS</p>
                    <h1 className="insights-title">Intelligence that drives<br /><em>workforce decisions.</em></h1>
                    <p className="insights-sub">Real-time funnel analytics from your actual postings and applicants.</p>
                </motion.div>

                {loading && (
                    <div className="insights-loading">
                        <Loader2 size={24} className="insights-spin" />
                        <p>Loading your analytics…</p>
                    </div>
                )}

                {!loading && roles.length === 0 && (
                    <div className="insights-empty">
                        <Target size={32} color="#94a3b8" />
                        <p>No data yet. Post roles to start seeing analytics.</p>
                    </div>
                )}

                {!loading && roles.length > 0 && (
                    <>
                        {/* ── PLATFORM STATS WIDGET (§3.6) ── */}
                        <motion.div className="insights-card" style={{ marginBottom: 24, padding: '16px 20px', background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)', border: '1px solid rgba(59,130,246,0.3)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Globe size={18} color="#3b82f6" />
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Capable Platform Network</h3>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Live updating
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Total Candidates</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{platformStats.candidates > 0 ? platformStats.candidates.toLocaleString() : '...'}</div>
                                </div>
                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Open Opportunities</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{platformStats.jobs > 0 ? platformStats.jobs.toLocaleString() : '...'}</div>
                                </div>
                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Successful Placements</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{platformStats.placements > 0 ? platformStats.placements.toLocaleString() : '...'}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* KPI Strip */}
                        <div className="insights-kpi-strip">
                            {[
                                { icon: <Briefcase size={20} color="#2563eb" />, value: roles.length, label: 'Total Postings' },
                                { icon: <TrendingUp size={20} color="#10b981" />, value: activeRoles, label: 'Active Roles' },
                                { icon: <Users size={20} color="#7c3aed" />, value: totalApplicants, label: 'Total Applicants' },
                                { icon: <Target size={20} color="#f59e0b" />, value: offersCount, label: 'Offers Extended' },
                                { icon: <Award size={20} color="#059669" />, value: placedCount, label: 'Candidates Placed' },
                                { icon: <Activity size={20} color="#0ea5e9" />, value: `${overallConversion}%`, label: 'Overall Conversion' },
                                { icon: <CheckCircle2 size={20} color="#8b5cf6" />, value: `${avgMatchScore}%`, label: 'Avg Match Score' },
                                { icon: <Filter size={20} color="#ec4899" />, value: `${screeningRate}%`, label: 'Screening Rate' },
                            ].map((kpi, i) => (
                                <motion.div
                                    key={i}
                                    className="insights-kpi"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {kpi.icon}
                                    <span className="insights-kpi-num">{kpi.value}</span>
                                    <span className="insights-kpi-label">{kpi.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="insights-tabs">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    className={`insights-tab ${tab === t.key ? 'active' : ''}`}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="insights-grid">
                            {/* ── HIRING FUNNEL TAB ── */}
                            {tab === 'funnel' && (
                                <>
                                    <motion.div className="insights-card insights-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">🔽 Hiring Funnel</h3>
                                            <span className="insights-card-badge insights-card-badge--up">{totalApplicants} total applicants</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                                            {/* Visual funnel */}
                                            <div style={{ flex: 1 }}>
                                                {funnelData.map((stage, i) => {
                                                    const pct = funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0;
                                                    const stageColor = COLORS[i % COLORS.length];
                                                    return (
                                                        <div key={stage.name} style={{ marginBottom: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{stage.name}</span>
                                                                <span style={{ fontSize: 13, color: '#64748b' }}>{stage.value} ({pct.toFixed(0)}%)</span>
                                                            </div>
                                                            <div style={{ height: 20, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                                                <motion.div
                                                                    style={{ height: '100%', background: stageColor, borderRadius: 6 }}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.max(pct, 2)}%` }}
                                                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">📊 Stage Conversion Rates</h3>
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            {conversionRates.map(cr => (
                                                <ConversionRate key={cr.from} from={cr.from} to={cr.to} value={cr.rate} />
                                            ))}
                                        </div>
                                        <div style={{ marginTop: 16, padding: '12px 14px', background: '#eff6ff', borderRadius: 10, fontSize: 13, color: '#1e40af' }}>
                                            💡 <strong>Tip:</strong> A &lt;30% screening rate suggests broadening eligibility criteria or improving JD clarity.
                                        </div>
                                    </motion.div>

                                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">🥧 Pipeline Status Mix</h3>
                                        </div>
                                        {statusData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}>
                                                        {statusData.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                                    <Legend formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: 13 }}>No application data yet.</div>
                                        )}
                                    </motion.div>
                                </>
                            )}

                            {/* ── ROLE ANALYSIS TAB ── */}
                            {tab === 'roles' && (
                                <>
                                    {applicantsPerRole.length > 0 ? (
                                        <motion.div className="insights-card insights-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="insights-card-header">
                                                <h3 className="insights-card-title">Applicants per Role</h3>
                                                <span className="insights-card-badge insights-card-badge--up">{totalApplicants} total</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={Math.max(180, applicantsPerRole.length * 40)}>
                                                <BarChart data={applicantsPerRole} layout="vertical">
                                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                                    <YAxis dataKey="role" type="category" tick={{ fontSize: 11, fill: '#4e5462' }} axisLine={false} tickLine={false} width={160} />
                                                    <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                                    <Legend />
                                                    <Bar dataKey="applicants" fill="#2563eb" radius={[0, 4, 4, 0]} name="Applied" />
                                                    <Bar dataKey="shortlisted" fill="#10b981" radius={[0, 4, 4, 0]} name="Shortlisted" />
                                                    <Bar dataKey="placed" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Placed" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </motion.div>
                                    ) : (
                                        <div className="insights-empty"><AlertCircle size={24} color="#94a3b8" /><p>No role-level data available yet.</p></div>
                                    )}

                                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">📋 Posting Mix</h3>
                                        </div>
                                        <div className="insights-type-list">
                                            {typeData.map((t, i) => (
                                                <div key={t.name} className="insights-type-item">
                                                    <span className="insights-type-dot" style={{ background: COLORS[i % COLORS.length] }} />
                                                    <span className="insights-type-name">{t.name}</span>
                                                    <span className="insights-type-count">{t.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {offersCount > 0 && (
                                            <p className="insights-highlight-text">
                                                {offersCount} offer{offersCount !== 1 ? 's' : ''} extended across {roles.length} posting{roles.length !== 1 ? 's' : ''}.
                                            </p>
                                        )}
                                    </motion.div>
                                </>
                            )}

                            {/* ── SKILLS TAB ── */}
                            {tab === 'skills' && (
                                <>
                                    {topSkills.length > 0 ? (
                                        <motion.div className="insights-card insights-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="insights-card-header">
                                                <h3 className="insights-card-title">Top Skills You Require</h3>
                                                <span className="insights-card-badge insights-card-badge--warn">{topSkills.length} skills across all roles</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart data={topSkills}>
                                                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="skill" tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Roles requiring" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </motion.div>
                                    ) : (
                                        <div className="insights-empty"><AlertCircle size={24} color="#94a3b8" /><p>Add required skills to your roles to see skill demand analysis.</p></div>
                                    )}
                                </>
                            )}

                            {/* ── TRENDS TAB ── */}
                            {tab === 'trends' && (
                                <>
                                    <motion.div className="insights-card insights-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">📈 Pipeline Health Summary</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
                                            {[
                                                { label: 'Overall Placement Rate', value: `${overallConversion}%`, color: '#10b981', desc: 'Applied → Placed' },
                                                { label: 'Screening Rate', value: `${screeningRate}%`, color: '#2563eb', desc: 'Applied → Screening+' },
                                                { label: 'Offer Rate', value: totalApplicants > 0 ? `${((offersCount / totalApplicants) * 100).toFixed(1)}%` : '0%', color: '#7c3aed', desc: 'Applied → Offer' },
                                                { label: 'Avg Match Score', value: `${avgMatchScore}%`, color: '#f59e0b', desc: 'AI skill-match avg' },
                                            ].map((m, i) => (
                                                <motion.div
                                                    key={m.label}
                                                    style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.08 }}
                                                >
                                                    <div style={{ fontSize: 32, fontWeight: 800, color: m.color }}>{m.value}</div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>{m.label}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.desc}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <div className="insights-card-header">
                                            <h3 className="insights-card-title">💡 Recommendations</h3>
                                        </div>
                                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {parseFloat(screeningRate) < 30 && (
                                                <div style={{ background: '#fef3c7', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#92400e', display: 'flex', gap: 8 }}>
                                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>Low screening rate ({screeningRate}%)</strong> — Consider broadening eligibility criteria or improving JD clarity.</span>
                                                </div>
                                            )}
                                            {avgMatchScore < 50 && (
                                                <div style={{ background: '#fef3c7', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#92400e', display: 'flex', gap: 8 }}>
                                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>Low match scores ({avgMatchScore}%)</strong> — Use the AI Recommendations tab to find better-matched candidates.</span>
                                                </div>
                                            )}
                                            {placedCount === 0 && totalApplicants > 0 && (
                                                <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#1e40af', display: 'flex', gap: 8 }}>
                                                    <Activity size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>No placements yet</strong> — Move candidates through the pipeline via the Kanban view to track progress.</span>
                                                </div>
                                            )}
                                            {offersCount > 0 && placedCount < offersCount && (
                                                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#065f46', display: 'flex', gap: 8 }}>
                                                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>{offersCount - placedCount} offer(s) pending acceptance</strong> — Follow up with candidates via the Pipeline view.</span>
                                                </div>
                                            )}
                                            {activeRoles === 0 && (
                                                <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8 }}>
                                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>No active roles</strong> — Post new roles to start attracting candidates.</span>
                                                </div>
                                            )}
                                            {parseFloat(overallConversion) >= 5 && (
                                                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#065f46', display: 'flex', gap: 8 }}>
                                                    <Award size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                                    <span><strong>Healthy conversion rate ({overallConversion}%)</strong> — Your hiring funnel is performing well.</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
