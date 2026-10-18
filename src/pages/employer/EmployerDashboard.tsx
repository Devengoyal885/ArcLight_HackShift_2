import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavbar } from "../../components/navigation/FloatingNavbar";
import { Link } from "react-router-dom";
import {
    PlusCircle, Search, Users, Activity, Eye, Briefcase,
    MapPin, Loader2, ChevronRight, CheckCircle2, TrendingUp,
    AlertTriangle, RotateCcw, Bell, CalendarCheck, Gift,
    ClipboardList, ArrowRight, Sparkles, Target, Building2, XCircle, DollarSign,
    PieChart, BarChart2, Rocket, Edit3, Check
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
    getPostedRoles, getEmployerProfile, saveEmployerProfile, getApplicationsForRole,
    type PostedRole, type EmployerProfile, type RoleApplication
} from "../../services/employerService";
import { getEmployerLinkRequests, updateLinkRequestStatus } from "../../services/institutionService";
import "./EmployerDashboard.css";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

type AppWithRole = RoleApplication & { roleTitle: string; roleId: string };
type LoadPhase = "loading" | "success" | "error";

const PIPELINE_STAGES: { key: RoleApplication["status"]; label: string; color: string }[] = [
    { key: "Applied",             label: "Applied",   color: "#2563eb" },
    { key: "Screening",           label: "Screening", color: "#f59e0b" },
    { key: "OA Pending",          label: "Assessment",color: "#7c3aed" },
    { key: "Interview Scheduled", label: "Interview", color: "#0891b2" },
    { key: "Offer Extended",      label: "Offer",     color: "#16a34a" },
    { key: "Placed",              label: "Placed",    color: "#059669" },
];

const STATUS_COLORS: Record<string, string> = {
    Applied: "#2563eb", Screening: "#f59e0b", "OA Pending": "#7c3aed",
    "Interview Scheduled": "#0891b2", "Offer Extended": "#16a34a",
    Placed: "#059669", Rejected: "#ef4444", "OA Rejected": "#dc2626",
};

function getDynamicSummary(apps: AppWithRole[], activeRoles: PostedRole[], isNew: boolean): string {
    if (isNew) return "Your hiring workspace is ready. Create your first opportunity to begin discovering verified talent.";
    const reviewCount = apps.filter(a => a.status === "Applied").length;
    const intCount    = apps.filter(a => a.status === "Interview Scheduled").length;
    const oaCount     = apps.filter(a => a.status === "OA Pending").length;
    if (reviewCount > 0) return `You have ${reviewCount} application${reviewCount > 1 ? "s" : ""} waiting for review.`;
    if (intCount > 0)    return `You have ${intCount} interview${intCount > 1 ? "s" : ""} scheduled.`;
    if (oaCount > 0)     return `${oaCount} candidate${oaCount > 1 ? "s are" : " is"} completing an online assessment.`;
    if (activeRoles.length > 0 && apps.length === 0) return "Your opportunities are live. Start discovering verified talent to build your pipeline.";
    if (apps.length > 0) return `Your hiring pipeline has ${apps.length} candidate${apps.length > 1 ? "s" : ""} across ${activeRoles.length} active role${activeRoles.length !== 1 ? "s" : ""}.`;
    return "Here is your daily recruitment overview.";
}

export default function EmployerDashboard() {
    const { user, dbUid } = useAuth();
    const greeting = useMemo(() => getGreeting(), []);

    const [profile,     setProfile]     = useState<EmployerProfile | null>(null);
    const [postedRoles, setPostedRoles] = useState<PostedRole[]>([]);
    const [allApps,     setAllApps]     = useState<AppWithRole[]>([]);
    const [linkRequests, setLinkRequests] = useState<{ id: string; institutionCode: string; companyName: string; status: string }[]>([]);
    const [phase,       setPhase]       = useState<LoadPhase>("loading");

    // Company Name Inline Editing State
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [editCompanyName, setEditCompanyName] = useState("");
    const [savingCompany, setSavingCompany] = useState(false);

    const resolvedCompanyName = profile?.companyName 
        || localStorage.getItem('employer_companyName') 
        || (user?.displayName && user.displayName !== 'User' ? user.displayName : null)
        || "Your Company";

    const loadData = useCallback(async () => {
        if (!user) return;
        setPhase("loading");
        try {
            const targetUid = dbUid || `${user.uid}_employer`;
            const [prof, roles, requests] = await Promise.all([
                getEmployerProfile(targetUid),
                getPostedRoles(targetUid),
                getEmployerLinkRequests(targetUid)
            ]);
            setProfile(prof);
            if (prof?.companyName) {
                setEditCompanyName(prof.companyName);
            } else {
                setEditCompanyName(localStorage.getItem('employer_companyName') || '');
            }
            setPostedRoles(roles);
            setLinkRequests(requests);

            const results = await Promise.allSettled(
                roles.filter(r => r.id).map(async r => {
                    const apps = await getApplicationsForRole(r.id!);
                    return apps.map(a => ({ ...a, roleTitle: r.title, roleId: r.id! }));
                })
            );
            const merged: AppWithRole[] = [];
            results.forEach(res => { if (res.status === "fulfilled") merged.push(...res.value); });
            merged.sort((a: any, b: any) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
            setAllApps(merged);
            setPhase("success");
        } catch (err) {
            console.error("[EmployerDashboard] load failed:", err);
            setPhase("error");
        }
    }, [user, dbUid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveCompanyName = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = editCompanyName.trim();
        if (!trimmed || !user) return;
        setSavingCompany(true);
        try {
            const targetUid = dbUid || `${user.uid}_employer`;
            await saveEmployerProfile(targetUid, { companyName: trimmed });
            setProfile(prev => prev ? { ...prev, companyName: trimmed } : { uid: targetUid, companyName: trimmed, industry: 'Technology' });
            localStorage.setItem('employer_companyName', trimmed);
            setIsEditingCompany(false);
        } catch (err) {
            console.error("Failed to save company name:", err);
        } finally {
            setSavingCompany(false);
        }
    };

    const handleUpdateLinkRequest = async (reqId: string, instCode: string, newStatus: 'approved' | 'rejected') => {
        try {
            await updateLinkRequestStatus(instCode, reqId, newStatus);
            setLinkRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
        } catch (e) {
            console.error("Failed to update link request status", e);
        }
    };

    const activeRoles         = postedRoles.filter(r => r.status === "active");
    const startupRoles        = postedRoles.filter(r => r.isStartupRole);
    const isStartup           = profile?.orgType === 'startup' || startupRoles.length > 0 || true;
    const needsReview         = allApps.filter(a => a.status === "Applied").length;
    const scheduledInterviews = allApps.filter(a => a.status === "Interview Scheduled").length;
    const offersCount         = allApps.filter(a => a.status === "Offer Extended").length;
    const oaCount             = allApps.filter(a => a.status === "OA Pending").length;
    const uniqueSkills        = new Set(postedRoles.flatMap(r => r.requiredSkills || [])).size;

    const pipelineCounts = PIPELINE_STAGES.map(s => ({
        ...s, count: allApps.filter(a => a.status === s.key).length,
    }));
    const maxCount = Math.max(...pipelineCounts.map(s => s.count), 1);
    const hasPipeline = pipelineCounts.some(s => s.count > 0);

    const isNewEmployer = postedRoles.length === 0;
    const summary = phase === "success"
        ? getDynamicSummary(allApps, activeRoles, isNewEmployer)
        : "Loading your recruitment overview...";

    const recentApps = allApps.slice(0, 8);

    const attentionItems: { icon: React.ReactNode; title: string; desc: string; to: string; cta: string }[] = [];
    if (needsReview > 0)         attentionItems.push({ icon: <Bell size={16} />,         title: `${needsReview} new application${needsReview > 1 ? "s" : ""} need review`,      desc: "Candidates are waiting for your response.",              to: "/employer/talent", cta: "Review" });
    if (scheduledInterviews > 0) attentionItems.push({ icon: <CalendarCheck size={16} />, title: `${scheduledInterviews} interview${scheduledInterviews > 1 ? "s" : ""} scheduled`, desc: "Check interview details in the Talent section.",          to: "/employer/talent", cta: "View" });
    if (offersCount > 0)         attentionItems.push({ icon: <Gift size={16} />,          title: `${offersCount} offer${offersCount > 1 ? "s" : ""} extended`,                   desc: "Candidates are reviewing your offer.",                  to: "/employer/talent", cta: "Track" });
    if (oaCount > 0)             attentionItems.push({ icon: <ClipboardList size={16} />, title: `${oaCount} candidate${oaCount > 1 ? "s" : ""} completing an assessment`,       desc: "Results will appear once they submit.",                 to: "/employer/talent", cta: "Monitor" });

    if (phase === "loading") return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />
            <main className="emp-dash-main">
                <div className="emp-dash-header">
                    <p className="emp-dash-greeting">{greeting},</p>
                    <div className="emp-skeleton emp-skeleton--h1" />
                    <div className="emp-skeleton emp-skeleton--sub" />
                </div>
                <div className="emp-metric-wrapper emp-metric-wrapper--6">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="emp-metric-card">
                            <div className="emp-skeleton emp-skeleton--icon" />
                            <div className="emp-metric-data">
                                <div className="emp-skeleton emp-skeleton--val" />
                                <div className="emp-skeleton emp-skeleton--lbl" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="emp-card" style={{ padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: "#94a3b8" }}>
                    <Loader2 size={22} className="spin" /> <span>Loading your hiring data...</span>
                </div>
            </main>
        </div>
    );

    if (phase === "error") return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />
            <main className="emp-dash-main">
                <div className="emp-error-state">
                    <AlertTriangle size={36} color="#f59e0b" />
                    <h2>We couldn't load your recruitment data</h2>
                    <p>Your data is safe. Please check your connection and try again.</p>
                    <button className="emp-retry-btn" onClick={loadData}>
                        <RotateCcw size={15} /> Try Again
                    </button>
                </div>
            </main>
        </div>
    );

    return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />
            <main className="emp-dash-main">

                {/* Header */}
                <motion.div className="emp-dash-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <p className="emp-dash-greeting">{greeting},</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {isEditingCompany ? (
                                    <form onSubmit={handleSaveCompanyName} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={editCompanyName}
                                            onChange={(e) => setEditCompanyName(e.target.value)}
                                            placeholder="Enter company name..."
                                            autoFocus
                                            style={{
                                                fontSize: '22px',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                border: '2px solid #6366f1',
                                                outline: 'none',
                                                background: '#ffffff'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={savingCompany}
                                            style={{
                                                background: '#6366f1',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {savingCompany ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingCompany(false)}
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#64748b',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 10px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <h1 className="emp-dash-org" style={{ margin: 0 }}>{resolvedCompanyName}</h1>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditCompanyName(resolvedCompanyName === 'Your Company' ? '' : resolvedCompanyName);
                                                setIsEditingCompany(true);
                                            }}
                                            title="Edit Company Name"
                                            style={{
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                padding: '4px 6px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: '#64748b'
                                            }}
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                    </div>
                                )}
                                {profile?.orgType && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '3px 10px',
                                            borderRadius: '6px',
                                            background: profile.orgType === 'startup' ? '#f5f3ff' : '#eff6ff',
                                            color: profile.orgType === 'startup' ? '#7c3aed' : '#2563eb',
                                            border: `1px solid ${profile.orgType === 'startup' ? '#ddd6fe' : '#bfdbfe'}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {profile.orgType === 'startup' ? '🚀 Startup Venture' : profile.orgType === 'enterprise' ? '🌐 Enterprise / MNC' : profile.orgType === 'smb' ? '🏢 SMB' : '💚 Non-profit'}
                                        </span>
                                        {profile.orgType === 'startup' && profile.startupStage && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                padding: '3px 10px',
                                                borderRadius: '6px',
                                                background: '#fef3c7',
                                                color: '#92400e',
                                                border: '1px solid #fde68a'
                                            }}>
                                                Stage: {profile.startupStage}
                                            </span>
                                        )}
                                        {profile.foundingYear && (
                                            <span style={{
                                                fontSize: '11px',
                                                color: '#64748b',
                                                background: '#f1f5f9',
                                                padding: '3px 8px',
                                                borderRadius: '6px'
                                            }}>
                                                Est. {profile.foundingYear}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="emp-dash-sub" style={{ marginTop: '6px' }}>{summary}</p>
                        </div>

                        {isStartup && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                border: '1px solid #c4b5fd',
                                padding: '8px 14px',
                                borderRadius: '10px'
                            }}>
                                <Rocket size={18} color="#7c3aed" />
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#5b21b6' }}>
                                        FOUNDER & VENTURE MODE ACTIVE
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6d28d9' }}>
                                        {startupRoles.length} Equity & Startup Postings Live
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* New Employer Onboarding */}
                <AnimatePresence>
                    {isNewEmployer && (
                        <motion.div className="emp-onboarding-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="emp-onboarding-icon">
                                {isStartup ? <Rocket size={28} color="#7c3aed" /> : <Sparkles size={28} />}
                            </div>
                            <div>
                                <h2 className="emp-onboarding-title">
                                    {isStartup ? "🚀 Your Startup & Founder Workspace is Ready" : "Your Hiring Workspace is Ready"}
                                </h2>
                                <p className="emp-onboarding-desc">
                                    {isStartup
                                        ? `Publish equity roles, recruit student co-founders, and connect with academic incubators for your ${profile?.startupStage || 'Early-Stage'} venture.`
                                        : "Create your first opportunity to start discovering verified talent through CapAble's capability intelligence."
                                    }
                                </p>
                                <div className="emp-onboarding-steps">
                                    <div className="emp-onboarding-step"><span>1</span> {isStartup ? "Post Equity Role" : "Create Opportunity"}</div>
                                    <ArrowRight size={14} color="#94a3b8" />
                                    <div className="emp-onboarding-step"><span>2</span> {isStartup ? "Scout Builders" : "Discover Talent"}</div>
                                    <ArrowRight size={14} color="#94a3b8" />
                                    <div className="emp-onboarding-step"><span>3</span> {isStartup ? "Incubator Match" : "Build Pipeline"}</div>
                                </div>
                                <div className="emp-onboarding-actions">
                                    <Link 
                                        to="/employer/roles" 
                                        className="emp-btn"
                                        style={isStartup ? { background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' } : {}}
                                    >
                                        {isStartup ? "🚀 Post Startup / Equity Role" : "Create Opportunity"}
                                    </Link>
                                    <Link to="/employer/talent" className="emp-btn emp-btn-outline">Explore Talent</Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* KPI Strip */}
                <motion.div className="emp-metric-wrapper emp-metric-wrapper--6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                    <Link to="/employer/roles"     className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: "#eff6ff", color: "#2563eb" }}><Briefcase size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">{activeRoles.length}</span><span className="emp-metric-label">Active Opportunities</span></div>
                    </Link>
                    <Link to="/employer/talent"    className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><Users size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">{allApps.length}</span><span className="emp-metric-label">Total Applicants</span></div>
                    </Link>
                    <Link to="/employer/talent"    className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: needsReview > 0 ? "#fef3c7" : "#f1f5f9", color: needsReview > 0 ? "#d97706" : "#64748b" }}><Bell size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value" style={{ color: needsReview > 0 ? "#d97706" : undefined }}>{needsReview}</span><span className="emp-metric-label">Needs Review</span></div>
                    </Link>
                    <Link to="/employer/talent"    className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: "#f0f9ff", color: "#0891b2" }}><CalendarCheck size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">{scheduledInterviews}</span><span className="emp-metric-label">Interviews</span></div>
                    </Link>
                    <Link to="/employer/talent"    className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: "#f0fdf4", color: "#059669" }}><Gift size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">{offersCount}</span><span className="emp-metric-label">Offers Extended</span></div>
                    </Link>
                    <Link to="/employer/workforce" className="emp-metric-card emp-metric-card--link">
                        <div className="emp-metric-icon" style={{ background: "#faf5ff", color: "#9333ea" }}><Target size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">{uniqueSkills}</span><span className="emp-metric-label">Skills Tracked</span></div>
                    </Link>
                    <div className="emp-metric-card">
                        <div className="emp-metric-icon" style={{ background: "#fff1f2", color: "#e11d48" }}><Activity size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">14d</span><span className="emp-metric-label">Avg Time-to-Hire</span></div>
                    </div>
                    <div className="emp-metric-card">
                        <div className="emp-metric-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><TrendingUp size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">85%</span><span className="emp-metric-label">Offer Acceptance</span></div>
                    </div>
                    <div className="emp-metric-card">
                        <div className="emp-metric-icon" style={{ background: "#fef3c7", color: "#d97706" }}><DollarSign size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">₹12.5k</span><span className="emp-metric-label">Avg Cost-per-Hire</span></div>
                    </div>
                    <div className="emp-metric-card">
                        <div className="emp-metric-icon" style={{ background: "#eff6ff", color: "#2563eb" }}><Users size={20} /></div>
                        <div className="emp-metric-data"><span className="emp-metric-value">3</span><span className="emp-metric-label">Hiring Team</span></div>
                    </div>
                </motion.div>

                {/* Startup & Venture Track Hub (When Startup profile or posting startup roles) */}
                {isStartup && (
                    <motion.div
                        className="emp-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                            border: '1.5px solid #d8b4fe',
                            marginBottom: '24px',
                            padding: '20px 24px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: '#7c3aed', color: '#fff', padding: '8px', borderRadius: '10px' }}>
                                    <Rocket size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#4c1d95' }}>
                                        Startup Founder & Venture Workspace
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6d28d9' }}>
                                        Optimized for early-stage founders: co-founder equity roles, student builder matchmaking, and academic incubator partnerships.
                                    </p>
                                </div>
                            </div>
                            <span style={{ fontSize: '11px', background: '#ffffff', color: '#7c3aed', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid #c4b5fd' }}>
                                Stage: {profile?.startupStage || 'Early-Stage'}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                            <Link
                                to="/employer/founders"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                    color: '#ffffff',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                                        Open Founder Hub (Connect, Plan & Design)
                                    </span>
                                    <ArrowRight size={15} color="#ffffff" />
                                </div>
                                <span style={{ fontSize: '11px', color: '#ede9fe' }}>
                                    Connect with co-founders, track sprint roadmaps, and co-design system architecture.
                                </span>
                            </Link>

                            <Link
                                to="/employer/roles"
                                style={{
                                    background: '#ffffff',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e9d5ff',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                        Post Equity / Co-Founder Role
                                    </span>
                                    <PlusCircle size={15} color="#7c3aed" />
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    Publish opportunities offering 1%–10% equity, sweat-equity, or co-founder stakes.
                                </span>
                            </Link>

                            <Link
                                to="/candidate/opportunities?tab=startups"
                                style={{
                                    background: '#ffffff',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e9d5ff',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                        Browse Campus Ventures & Co-Founders
                                    </span>
                                    <ArrowRight size={15} color="#7c3aed" />
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    Scout student-led startups and technical builders across universities.
                                </span>
                            </Link>

                            <Link
                                to="/institution/incubation"
                                style={{
                                    background: '#ffffff',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e9d5ff',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                        Partner with Academic E-Cell Incubators
                                    </span>
                                    <Building2 size={15} color="#7c3aed" />
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    Access university incubation programs, R&D labs, and state innovation grants.
                                </span>
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Recruitment Pipeline */}
                {allApps.length > 0 && (
                    <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="emp-card-header">
                            <h2 className="emp-card-title">Recruitment Pipeline</h2>
                            <Link to="/employer/talent" className="emp-card-action">View All <ChevronRight size={14} /></Link>
                        </div>
                        <div className="emp-pipeline-body">
                            {hasPipeline ? (
                                <>
                                    <div className="emp-pipeline-row">
                                        {pipelineCounts.map((stage, i) => (
                                            <div key={stage.key} className="emp-pipeline-stage">
                                                <div className="emp-pipeline-bar" style={{ background: stage.count > 0 ? stage.color : "#e2e8f0", height: `${Math.max(16, Math.min(72, (stage.count / maxCount) * 72))}px` }} />
                                                <span className="emp-pipeline-count" style={{ color: stage.count > 0 ? stage.color : "#94a3b8" }}>{stage.count}</span>
                                                <span className="emp-pipeline-label">{stage.label}</span>
                                                {i < pipelineCounts.length - 1 && <div className="emp-pipeline-arrow" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="emp-pipeline-rejected-row">
                                        {(["Rejected","OA Rejected"] as const).map(s => {
                                            const c = allApps.filter(a => a.status === s).length;
                                            return c > 0 ? <span key={s} className="emp-pipeline-rejected-badge">{c} {s}</span> : null;
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="emp-empty-state"><p>No candidates in your pipeline yet.</p></div>
                            )}
                        </div>
                    </motion.div>
                )}
                {/* Advanced Analytics Strip */}
                {allApps.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <div className="emp-card-header">
                                <h2 className="emp-card-title"><PieChart size={16} style={{marginRight:8}}/> Source Attribution</h2>
                            </div>
                            <div className="emp-card-body" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { source: 'CapAble Talent Pool', pct: 65, color: '#3b82f6' },
                                        { source: 'LinkedIn', pct: 20, color: '#0ea5e9' },
                                        { source: 'Careers Page', pct: 10, color: '#10b981' },
                                        { source: 'Referrals', pct: 5, color: '#8b5cf6' }
                                    ].map(item => (
                                        <div key={item.source}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#475569', fontWeight: 500 }}>
                                                <span>{item.source}</span>
                                                <span>{item.pct}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                        <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <div className="emp-card-header">
                                <h2 className="emp-card-title"><BarChart2 size={16} style={{marginRight:8}}/> Diversity & Inclusion</h2>
                            </div>
                            <div className="emp-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1' }} />
                                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>Female Applicants</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>42%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ec4899' }} />
                                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>Underrepresented Groups</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>28%</span>
                                </div>
                                <div style={{ marginTop: 'auto', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
                                    <strong>Insight:</strong> Female applicant ratio is up 15% this quarter for Engineering roles, driven by your recent targeted campaign.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Two-column: Recent Applications + Right Column */}
                <div className="emp-dash-layout">
                    <motion.div className="emp-dash-col" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                        <div className="emp-card">
                            <div className="emp-card-header">
                                <h2 className="emp-card-title">Recent Applications</h2>
                                <Link to="/employer/talent" className="emp-card-action">View all <ChevronRight size={14} /></Link>
                            </div>
                            <div className="emp-card-body">
                                {recentApps.length === 0 ? (
                                    <div className="emp-empty-state">
                                        <Users size={32} color="#94a3b8" />
                                        <p>No applications received yet.</p>
                                        <Link to="/employer/roles" className="emp-btn emp-btn-outline" style={{ marginTop: 8 }}>Post an Opportunity</Link>
                                    </div>
                                ) : (
                                    <div className="emp-feed-list">
                                        {recentApps.map(app => (
                                            <div key={app.id} className="emp-feed-item">
                                                <div className="emp-feed-avatar">{(app.candidateName || "?").charAt(0).toUpperCase()}</div>
                                                <div className="emp-feed-content">
                                                    <div className="emp-feed-top">
                                                        <h4 className="emp-feed-name">{app.candidateName}</h4>
                                                        <span className="emp-status-badge" style={{ background: `${STATUS_COLORS[app.status] || "#94a3b8"}18`, color: STATUS_COLORS[app.status] || "#64748b" }}>{app.status}</span>
                                                    </div>
                                                    <p className="emp-feed-headline">{app.candidateHeadline || app.candidateEmail}</p>
                                                    <p className="emp-feed-role">Applied for <strong>{app.roleTitle}</strong></p>
                                                </div>
                                                <Link to={`/profile/${app.candidateUid}`} state={{ applicationId: app.id, roleId: app.roleId, status: app.status }} className="emp-icon-btn" title="View Profile"><Eye size={16} /></Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="emp-dash-col" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        {/* Needs Attention */}
                        <div className="emp-card">
                            <div className="emp-card-header"><h2 className="emp-card-title">Needs Your Attention</h2></div>
                            <div className="emp-card-body">
                                {attentionItems.length === 0 ? (
                                    <div className="emp-all-clear">
                                        <CheckCircle2 size={22} color="#10b981" />
                                        <div><p className="emp-all-clear-title">You're all caught up</p><p className="emp-all-clear-sub">No pending recruitment actions.</p></div>
                                    </div>
                                ) : (
                                    <div className="emp-attention-list">
                                        {attentionItems.map((item, i) => (
                                            <div key={i} className="emp-attention-item">
                                                <div className="emp-attention-icon">{item.icon}</div>
                                                <div className="emp-attention-content">
                                                    <p className="emp-attention-title">{item.title}</p>
                                                    <p className="emp-attention-desc">{item.desc}</p>
                                                </div>
                                                <Link to={item.to} className="emp-attention-action">{item.cta} <ChevronRight size={13} /></Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="emp-card">
                            <div className="emp-card-header"><h2 className="emp-card-title">Quick Actions</h2></div>
                            <div className="emp-card-body emp-quick-actions">
                                <Link to="/employer/roles"     className="emp-action-block"><div className="emp-action-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}><PlusCircle size={20} /></div><div className="emp-action-text"><h4>Post an Opportunity</h4><p>Create an AI-optimized job posting</p></div></Link>
                                <Link to="/employer/talent"    className="emp-action-block"><div className="emp-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Search size={20} /></div><div className="emp-action-text"><h4>Search Talent</h4><p>Discover candidates across the platform</p></div></Link>
                                <Link to="/employer/workforce" className="emp-action-block"><div className="emp-action-icon" style={{ background: "#fae8ff", color: "#a21caf" }}><TrendingUp size={20} /></div><div className="emp-action-text"><h4>Workforce Intelligence</h4><p>View skill demands and pipeline health</p></div></Link>
                                <Link to="/employer/insights"  className="emp-action-block"><div className="emp-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Activity size={20} /></div><div className="emp-action-text"><h4>View Insights</h4><p>Analytics from your postings and applicants</p></div></Link>
                            </div>
                        </div>

                        {/* Institution Requests */}
                        {linkRequests.length > 0 && (
                            <div className="emp-card">
                                <div className="emp-card-header"><h2 className="emp-card-title">Institution Requests</h2></div>
                                <div className="emp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {linkRequests.filter(r => r.status === 'pending').length === 0 ? (
                                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No pending requests.</p>
                                    ) : (
                                        linkRequests.filter(r => r.status === 'pending').map(req => (
                                            <div key={req.id} style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Building2 size={16} color="#64748b" />
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Institution: {req.institutionCode}</span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>Wants to add <strong>{req.companyName}</strong> as a Partner Company.</p>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => handleUpdateLinkRequest(req.id, req.institutionCode, 'approved')}
                                                        style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s' }}
                                                    >
                                                        <CheckCircle2 size={14} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateLinkRequest(req.id, req.institutionCode, 'rejected')}
                                                        style={{ flex: 1, padding: '0.5rem', background: '#ffffff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s' }}
                                                    >
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Your Opportunities */}
                {postedRoles.length > 0 && (
                    <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <div className="emp-card-header">
                            <h2 className="emp-card-title">Your Opportunities</h2>
                            <Link to="/employer/roles" className="emp-card-action">Manage <ChevronRight size={14} /></Link>
                        </div>
                        <div className="emp-card-body">
                            <div className="emp-opportunities-grid">
                                {postedRoles.slice(0, 6).map(role => {
                                    const roleApps    = allApps.filter(a => a.roleId === role.id);
                                    const pending     = roleApps.filter(a => a.status === "Applied").length;
                                    return (
                                        <div key={role.id} className="emp-opp-card">
                                            <div className="emp-opp-top">
                                                <div>
                                                    <h4 className="emp-opp-title">{role.title}</h4>
                                                    <div className="emp-opp-meta">
                                                        <span className="emp-opp-type">{role.type}</span>
                                                        {role.location && <span className="emp-opp-loc"><MapPin size={11} /> {role.location}</span>}
                                                    </div>
                                                </div>
                                                <span className={`emp-opp-status emp-opp-status--${role.status}`}>{role.status}</span>
                                            </div>
                                            <div className="emp-opp-stats">
                                                <span><Users size={12} /> {role.applicantCount || 0} applicants</span>
                                                {(role.requiredSkills || []).length > 0 && <span><Target size={12} /> {(role.requiredSkills || []).length} skills</span>}
                                                {role.deadline && <span>Deadline: {new Date(role.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                                            </div>
                                            {pending > 0 && (
                                                <div className="emp-opp-alert"><Bell size={12} /> {pending} new application{pending > 1 ? "s" : ""} need review</div>
                                            )}
                                            <div className="emp-opp-actions">
                                                <Link to="/employer/talent" className="emp-opp-btn emp-opp-btn--primary">View Applicants</Link>
                                                <Link to="/employer/roles"  className="emp-opp-btn emp-opp-btn--outline">Manage</Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Capability Intelligence */}
                {uniqueSkills > 0 && (
                    <motion.div className="emp-card emp-capability-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className="emp-card-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Sparkles size={18} color="#7c3aed" />
                                <h2 className="emp-card-title">Capability Intelligence</h2>
                            </div>
                            <Link to="/employer/workforce" className="emp-card-action">View Workforce <ChevronRight size={14} /></Link>
                        </div>
                        <div className="emp-card-body">
                            <p className="emp-capability-intro">Your active opportunities currently require <strong>{uniqueSkills} unique capabilities</strong>.</p>
                            <div className="emp-capability-tags">
                                {Array.from(new Set(postedRoles.flatMap(r => r.requiredSkills || []))).slice(0, 12).map(skill => (
                                    <span key={skill} className="emp-capability-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
