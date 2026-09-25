import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavbar } from "../../components/navigation/FloatingNavbar";
import { useAuth } from "../../context/AuthContext";
import {
    getPostedRoles, getApplicationsForRole, getAllCandidates,
    type PostedRole, type RoleApplication
} from "../../services/employerService";
import { getCapabilities } from "../../services/profileService";
import {
    Briefcase, Users, Target, Loader2, Search, AlertTriangle,
    RotateCcw, ArrowRight, ChevronDown, ChevronUp, Zap, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import "./WorkforcePage.css";

// ─── Normalization utility (shared-safe) ──────────────────────────────────────
// Normalizes capability/skill labels to prevent duplicate counting
// e.g. "python 3" -> "python", "REST APIs" -> "rest api"
function normalizeSkill(raw: string): string {
    return raw.trim().toLowerCase()
        .replace(/\s*3\.?\d*$/, "")            // strip version numbers
        .replace(/s$/, "")                      // basic de-plural
        .replace(/restful?/i, "rest")           // REST variants
        .replace(/apis?$/i, "api")              // API suffix
        .replace(/[-_]/g, " ");
}

function displaySkill(raw: string): string {
    // Keep the shortest/most common display form per normalized group
    return raw.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapabilityDemand {
    displayName: string;
    normalized: string;
    demandCount: number;          // # roles requiring it
    totalActiveRoles: number;
    roles: { id: string; title: string }[];
}

interface CapabilityGap {
    displayName: string;
    normalized: string;
    demand: number;
    supply: number;
    gap: number;
    roles: { id: string; title: string }[];
}

interface RoleHealth {
    role: PostedRole;
    applicants: number;
    requiredSkillCount: number;
}

interface WorkforceAnalytics {
    activeRoles: PostedRole[];
    totalApplicants: number;
    uniqueCapabilities: number;
    demandList: CapabilityDemand[];
    gapList: CapabilityGap[];
    roleHealth: RoleHealth[];
    candidateSupplyMap: Record<string, number>; // normalized -> count
    signals: string[];
}

export default function WorkforcePage() {
    const { user, dbUid } = useAuth();
    
    const [analytics, setAnalytics] = useState<WorkforceAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // Filters
    const [timeFilter, setTimeFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    const loadAnalytics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(false);
        try {
            // 1. Fetch Employer Roles
            const roles = await getPostedRoles(dbUid!);
            const activeRoles = roles.filter(r => r.status === "active");
            
            // Apply role filter if any
            const filteredRoles = roleFilter !== "all" 
                ? activeRoles.filter(r => r.id === roleFilter)
                : activeRoles;

            // 2. Fetch Candidates and Applications in parallel
            const [allCandidates, ...roleAppsResults] = await Promise.all([
                getAllCandidates(),
                ...filteredRoles.map(r => getApplicationsForRole(r.id!))
            ]);

            // Combine applications
            const allApps = roleAppsResults.flat();
            
            // 3. Process Capability Demand
            const rawDemand: Record<string, CapabilityDemand> = {};
            
            filteredRoles.forEach(role => {
                (role.requiredSkills || []).forEach(skill => {
                    const norm = normalizeSkill(skill);
                    if (!rawDemand[norm]) {
                        rawDemand[norm] = {
                            displayName: displaySkill(skill),
                            normalized: norm,
                            demandCount: 0,
                            totalActiveRoles: filteredRoles.length,
                            roles: []
                        };
                    }
                    rawDemand[norm].demandCount++;
                    rawDemand[norm].roles.push({ id: role.id!, title: role.title });
                });
            });

            const demandList = Object.values(rawDemand).sort((a, b) => b.demandCount - a.demandCount);
            const uniqueCapabilities = demandList.length;

            // 4. Process Talent Supply
            // For true supply, we look at candidates who have verified/evident capabilities matching our demand.
            // In a real app we might fetch user capabilities explicitly. Here we assume candidates have `skills` array.
            const supplyMap: Record<string, number> = {};
            demandList.forEach(d => supplyMap[d.normalized] = 0);
            
            allCandidates.forEach((candidate: any) => {
                const candidateSkills = (candidate.skills || []).map((s: any) => normalizeSkill(s as string));
                
                // Count this candidate towards supply for any demanded capability they possess
                Object.keys(supplyMap).forEach(normDemand => {
                    if (candidateSkills.includes(normDemand)) {
                        supplyMap[normDemand]++;
                    }
                });
            });

            // 5. Calculate Gaps
            const gapList: CapabilityGap[] = demandList.map(d => {
                const supply = supplyMap[d.normalized] || 0;
                // A gap exists if candidate supply is strictly less than demand (slots)
                // We define gap as demandCount - supply (lower bound 0)
                const gap = Math.max(0, d.demandCount - supply);
                return {
                    displayName: d.displayName,
                    normalized: d.normalized,
                    demand: d.demandCount,
                    supply,
                    gap,
                    roles: d.roles
                };
            }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);

            // 6. Role Health
            const roleHealth: RoleHealth[] = filteredRoles.map((role, i) => {
                const appsForRole = roleAppsResults[i].length;
                return {
                    role,
                    applicants: appsForRole,
                    requiredSkillCount: role.requiredSkills?.length || 0
                };
            });

            // 7. Generate Signals
            const signals: string[] = [];
            if (gapList.length > 0) {
                const topGap = gapList[0];
                signals.push(`${topGap.demand} active opportunities require ${topGap.displayName}, while only ${topGap.supply} accessible candidates show evidence.`);
            }
            const lowAppRoles = roleHealth.filter(r => r.applicants === 0);
            if (lowAppRoles.length > 0) {
                signals.push(`${lowAppRoles.length} active opportunities currently have no applicants.`);
            }
            if (demandList.length > 0) {
                const topDemand = demandList[0];
                signals.push(`${topDemand.displayName} is your most requested capability, required across ${Math.round((topDemand.demandCount / filteredRoles.length)*100)}% of your roles.`);
            }

            setAnalytics({
                activeRoles: filteredRoles,
                totalApplicants: allApps.length,
                uniqueCapabilities,
                demandList,
                gapList,
                roleHealth,
                candidateSupplyMap: supplyMap,
                signals
            });

        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user, roleFilter, timeFilter]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const [expandedGap, setExpandedGap] = useState<string | null>(null);
    const [expandedDemand, setExpandedDemand] = useState<string | null>(null);

    return (
        <div className="wf-page">
            <FloatingNavbar variant="employer" />
            
            <main className="wf-main">
                <motion.div className="wf-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="wf-eyebrow">WORKFORCE INTELLIGENCE</p>
                    <h1 className="wf-title">Skill demand +<br /><em>Talent supply.</em></h1>
                    <p className="wf-sub">Understand capability demand, talent supply, and workforce gaps across your opportunities.</p>
                </motion.div>


                {loading && (
                    <div className="wf-loading">
                        <Loader2 size={24} className="wf-spin" />
                        <p>Loading workforce analytics…</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="wf-error-state">
                        <AlertTriangle size={28} color="#f59e0b" />
                        <p>We couldn't load workforce intelligence.</p>
                        <button className="wf-retry-btn" onClick={loadAnalytics}><RotateCcw size={14}/> Retry</button>
                    </div>
                )}

                {!loading && !error && analytics?.activeRoles.length === 0 && (
                    <div className="wf-empty">
                        <Briefcase size={36} color="#94a3b8" />
                        <p>Workforce intelligence starts with your opportunity requirements.</p>
                        <p className="wf-empty-sub">Create an opportunity and CapAble will begin mapping your capability demand.</p>
                        <Link to="/employer/roles" className="wf-btn wf-btn--primary">Post Opportunity</Link>
                    </div>
                )}

                {!loading && !error && analytics && analytics.activeRoles.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        
                        {/* ─── Filters ─── */}
                        <div className="wf-filter-bar">
                            <div className="wf-filter-group">
                                <label>Date Range</label>
                                <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                                    <option value="all">All Time</option>
                                    <option value="30d">Last 30 Days</option>
                                    <option value="90d">Last 90 Days</option>
                                </select>
                            </div>
                            <div className="wf-filter-group">
                                <label>Opportunity</label>
                                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                                    <option value="all">All Opportunities</option>
                                    {analytics.activeRoles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ─── KPI Strip ─── */}
                        <div className="wf-kpi-strip">
                            <div className="wf-kpi">
                                <Briefcase size={20} color="#2563eb" />
                                <span className="wf-kpi-num">{analytics.activeRoles.length}</span>
                                <span className="wf-kpi-label">Active Opportunities</span>
                            </div>
                            <div className="wf-kpi">
                                <Target size={20} color="#7c3aed" />
                                <span className="wf-kpi-num">{analytics.uniqueCapabilities}</span>
                                <span className="wf-kpi-label">Unique Capabilities</span>
                            </div>
                            <div className="wf-kpi">
                                <Users size={20} color="#10b981" />
                                <span className="wf-kpi-num">{analytics.totalApplicants}</span>
                                <span className="wf-kpi-label">Talent Supply (Pipeline)</span>
                            </div>
                            <div className="wf-kpi">
                                <AlertTriangle size={20} color="#f59e0b" />
                                <span className="wf-kpi-num">{analytics.gapList.length}</span>
                                <span className="wf-kpi-label">Open Gaps</span>
                            </div>
                        </div>

                        {/* ─── Workforce Signals ─── */}
                        {analytics.signals.length > 0 && (
                            <div className="wf-signals">
                                <div className="wf-signals-header"><Zap size={16} color="#d97706"/> <h4>Workforce Signals</h4></div>
                                <ul className="wf-signals-list">
                                    {analytics.signals.map((sig, i) => <li key={i}>{sig}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="wf-layout">
                            {/* ─── Capability Demand vs Supply ─── */}
                            <div className="wf-capability-map">
                                <p className="wf-section-label">DEMAND VS TALENT SUPPLY</p>
                                
                                {analytics.demandList.length === 0 ? (
                                    <div className="wf-card-empty">No capability requirements mapped yet.</div>
                                ) : (
                                    <div className="wf-cap-list">
                                        {analytics.demandList.slice(0, 8).map(demand => {
                                            const supply = analytics.candidateSupplyMap[demand.normalized] || 0;
                                            const coveragePct = Math.min(100, Math.round((supply / (demand.demandCount || 1)) * 100));
                                            const isExpanded = expandedDemand === demand.normalized;
                                            return (
                                                <div key={demand.normalized} className="wf-cap-item-card">
                                                    <div className="wf-cap-item-header" onClick={() => setExpandedDemand(isExpanded ? null : demand.normalized)}>
                                                        <div className="wf-cap-item-info">
                                                            <h4>{demand.displayName}</h4>
                                                            <div className="wf-cap-item-metrics">
                                                                <span className="wf-badge-demand">{demand.demandCount} Demand</span>
                                                                <span className="wf-badge-supply">{supply} Supply</span>
                                                            </div>
                                                        </div>
                                                        <div className="wf-cap-item-coverage">
                                                            <div className="wf-coverage-label">{coveragePct}% Coverage</div>
                                                            <div className="wf-coverage-bar"><div className="wf-coverage-fill" style={{ width: `${coveragePct}%`, background: coveragePct >= 100 ? '#10b981' : coveragePct >= 50 ? '#3b82f6' : '#f59e0b' }}/></div>
                                                        </div>
                                                        <button className="wf-expand-btn">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                                                    </div>
                                                    
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="wf-cap-item-details">
                                                                <div className="wf-cap-detail-row">
                                                                    <p className="wf-cap-detail-label">Required by active opportunities:</p>
                                                                    <ul className="wf-cap-detail-roles">
                                                                        {demand.roles.map(r => <li key={r.id}>{r.title}</li>)}
                                                                    </ul>
                                                                </div>
                                                                <div className="wf-cap-detail-actions">
                                                                    <Link to="/employer/roles" className="wf-btn wf-btn--outline">View Opportunities</Link>
                                                                    <Link to="/employer/talent" className="wf-btn wf-btn--primary">Search Talent</Link>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>


                            {/* ─── Capability Gaps & Opportunity Health ─── */}
                            <div className="wf-mobility">
                                <p className="wf-section-label">CAPABILITY GAPS</p>
                                
                                {analytics.gapList.length === 0 ? (
                                    <div className="wf-card-empty">No capability gaps detected in your active pipeline.</div>
                                ) : (
                                    <div className="wf-gap-list">
                                        {analytics.gapList.slice(0, 5).map(gap => {
                                            const isExpanded = expandedGap === gap.normalized;
                                            return (
                                                <div key={gap.normalized} className="wf-gap-card">
                                                    <div className="wf-gap-card-header" onClick={() => setExpandedGap(isExpanded ? null : gap.normalized)}>
                                                        <div className="wf-gap-card-info">
                                                            <h4>{gap.displayName}</h4>
                                                            <div className="wf-gap-numbers">
                                                                <span>Demand: <strong>{gap.demand}</strong></span>
                                                                <span>Supply: <strong>{gap.supply}</strong></span>
                                                                <span className="wf-gap-alert">Gap: <strong>{gap.gap}</strong></span>
                                                            </div>
                                                        </div>
                                                        <button className="wf-expand-btn">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="wf-cap-item-details">
                                                                <div className="wf-cap-detail-row">
                                                                    <p className="wf-cap-detail-label">Largest affected opportunities:</p>
                                                                    <ul className="wf-cap-detail-roles">
                                                                        {gap.roles.map(r => <li key={r.id}>{r.title}</li>)}
                                                                    </ul>
                                                                </div>
                                                                <div className="wf-cap-detail-actions">
                                                                    <Link to="/employer/talent" className="wf-btn wf-btn--primary">Explore Talent</Link>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <p className="wf-section-label" style={{ marginTop: "32px" }}>OPPORTUNITY CAPABILITY HEALTH</p>
                                <div className="wf-health-list">
                                    {analytics.roleHealth.map(rh => (
                                        <div key={rh.role.id} className="wf-health-card">
                                            <h4>{rh.role.title}</h4>
                                            <div className="wf-health-stats">
                                                <div className="wf-health-stat">
                                                    <span className="wf-hs-val">{rh.requiredSkillCount}</span>
                                                    <span className="wf-hs-label">Req. Capabilities</span>
                                                </div>
                                                <div className="wf-health-stat">
                                                    <span className="wf-hs-val">{rh.applicants}</span>
                                                    <span className="wf-hs-label">Applicants</span>
                                                </div>
                                                <div className="wf-health-stat">
                                                    <span className="wf-hs-val" style={{ color: '#10b981' }}>{rh.role.type}</span>
                                                    <span className="wf-hs-label">Type</span>
                                                </div>
                                            </div>
                                            <Link to="/employer/talent" className="wf-btn wf-btn--text">View Applicants <ArrowRight size={14}/></Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

