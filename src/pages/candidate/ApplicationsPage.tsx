import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCandidateApplications, updateApplicationStatus } from '../../services/employerService';
import { getSavedOpportunities, unsaveOpportunity, uploadOfferLetterToApplication } from '../../services/profileService';
import {
    getCandidateCollaborationRequests,
    getCandidateIncubationApplications,
    type CollaborationRequest,
    type IncubationApplication
} from '../../services/ventureService';
import { Link, useNavigate } from 'react-router-dom';
import {
    Loader2, Briefcase, Calendar, MapPin, ExternalLink,
    CheckCircle, XCircle, AlertCircle, PlayCircle, Clock,
    Bookmark, BookmarkX, TrendingUp, Award, Star, ChevronRight, Sparkles, Copy, CheckCircle2, MessageSquare,
    Bell, Trash2, Upload, Rocket, Building2, ShieldCheck, Users, DollarSign
} from 'lucide-react';
import { geminiGenerate } from '../../services/geminiProxyService';
import { EmptyState } from '../../components/ui/EmptyState';
import './ApplicationsPage.css';

type AppTab = 'pipeline' | 'ventures' | 'incubation' | 'saved';

const PIPELINE_STAGES = [
    { key: 'Applied', label: 'Applied', color: '#3b82f6' },
    { key: 'Screening', label: 'Screening', color: '#8b5cf6' },
    { key: 'OA Pending', label: 'Assessment', color: '#f59e0b' },
    { key: 'Interview Scheduled', label: 'Interview', color: '#10b981' },
    { key: 'Offer Extended', label: 'Offer', color: '#7c3aed' },
    { key: 'Placed', label: 'Placed 🏆', color: '#d97706' },
];

export default function ApplicationsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<AppTab>('pipeline');
    const [applications, setApplications] = useState<any[]>([]);
    const [savedOpps, setSavedOpps] = useState<any[]>([]);
    const [collabRequests, setCollabRequests] = useState<CollaborationRequest[]>([]);
    const [incubationApps, setIncubationApps] = useState<IncubationApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [savedLoading, setSavedLoading] = useState(true);
    const [ventureLoading, setVentureLoading] = useState(true);
    const [unsaving, setUnsaving] = useState<string | null>(null);

    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<{ id: string; type: 'reject' | 'email'; content: string } | null>(null);
    const [copied, setCopied] = useState(false);
    
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareResult, setCompareResult] = useState<string | null>(null);
    const [withdrawing, setWithdrawing] = useState<string | null>(null);
    const [withdrawConfirm, setWithdrawConfirm] = useState<string | null>(null);
    const [uploadingOfferId, setUploadingOfferId] = useState<string | null>(null);

    const loadApplications = () => {
        if (!dbUid) return;
        getCandidateApplications(dbUid).then(apps => {
            setApplications(apps);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        if (!user) return;
        loadApplications();
    }, [user, dbUid]);

    useEffect(() => {
        if (!user || !dbUid) return;
        getSavedOpportunities(dbUid).then(saved => {
            setSavedOpps(saved);
            setSavedLoading(false);
        }).catch(() => setSavedLoading(false));

        Promise.all([
            getCandidateCollaborationRequests(dbUid),
            getCandidateIncubationApplications(dbUid),
        ]).then(([collabs, incs]) => {
            setCollabRequests(collabs);
            setIncubationApps(incs);
            setVentureLoading(false);
        }).catch(() => setVentureLoading(false));
    }, [user, dbUid]);

    const handleUnsave = async (opp: any) => {
        if (!opp.id) return;
        setUnsaving(opp.id);
        try {
            await unsaveOpportunity(dbUid!, opp.id);
            setSavedOpps(prev => prev.filter(s => s.id !== opp.id));
        } catch (e) {
            console.error(e);
        } finally {
            setUnsaving(null);
        }
    };

    const handleAiGenerate = async (app: any, type: 'reject' | 'email') => {
        setAiLoading(app.id);
        setAiResult(null);
        try {
            let prompt = '';
            if (type === 'reject') {
                prompt = `Analyze why a candidate might have been rejected for the role of "${app.title}" at "${app.company}". 
Given they reached the "${app.status}" stage before rejection.
The feedback was: ${app.feedback || 'None provided'}.
Keep it encouraging, list 3 actionable areas of improvement (e.g., technical depth, communication), and format it cleanly with bullet points. Be concise.`;
            } else {
                prompt = `Write a professional follow-up/thank-you email to the recruiter at ${app.company} for the ${app.title} role. 
The current status is ${app.status}. Keep it concise, polite, and confident (max 150 words). Include placeholders like [Recruiter Name].`;
            }
            const res = await geminiGenerate(prompt, { temperature: 0.7 });
            setAiResult({ id: app.id, type, content: res });
        } catch (e) {
            console.error('AI Error:', e);
        } finally {
            setAiLoading(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = async (app: any) => {
        if (!app.id || !app.opportunityId) return;
        setWithdrawing(app.id);
        try {
            await updateApplicationStatus(
                app.opportunityId || app.roleId || '',
                app.id,
                dbUid!,
                'Withdrawn' as any,
                'Candidate withdrew application'
            );
            setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Withdrawn' } : a));
        } catch (e) {
            console.error('Withdraw error:', e);
        } finally {
            setWithdrawing(null);
            setWithdrawConfirm(null);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Applied': return { color: '#3b82f6', bg: '#eff6ff', icon: Clock, text: 'Under Review' };
            case 'OA Pending': return { color: '#f59e0b', bg: '#fef3c7', icon: PlayCircle, text: 'Action Required: Assessment' };
            case 'Interview Scheduled': return { color: '#10b981', bg: '#dcfce7', icon: CheckCircle, text: 'Interview Scheduled' };
            case 'Offer Extended': return { color: '#7c3aed', bg: '#f3e8ff', icon: CheckCircle, text: '🚀 Offer Extended!' };
            case 'Placed': return { color: '#d97706', bg: '#fef3c7', icon: CheckCircle, text: '🏆 Placed!' };
            case 'Rejected':
            case 'OA Rejected': return { color: '#ef4444', bg: '#fee2e2', icon: XCircle, text: 'Not Selected' };
            case 'Withdrawn': return { color: '#64748b', bg: '#f1f5f9', icon: XCircle, text: 'Withdrawn' };
            default: return { color: '#64748b', bg: '#f1f5f9', icon: AlertCircle, text: status };
        }
    };

    const handleCompareOffers = async () => {
        const offers = applications.filter(a => ['Offer Extended', 'Placed'].includes(a.status));
        if (offers.length < 2) return;
        
        setCompareLoading(true);
        setCompareResult(null);
        try {
            const prompt = `Compare these ${offers.length} job offers I received:
${offers.map((o, i) => `Offer ${i+1}: ${o.title} at ${o.company}`).join('\n')}

Please act as a career advisor. Compare these offers in terms of likely compensation potential, brand value, growth trajectory, and work-life balance for someone early in their career. Structure the answer clearly using bullet points and end with a bolded concluding recommendation.`;
            
            const res = await geminiGenerate(prompt, { temperature: 0.7 });
            setCompareResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setCompareLoading(false);
        }
    };

    // Pipeline stage counts
    const stageCounts = PIPELINE_STAGES.reduce((acc, s) => {
        acc[s.key] = applications.filter(a =>
            a.status === s.key || (s.key === 'Interview Scheduled' && a.status === 'Interview Scheduled')
        ).length;
        return acc;
    }, {} as Record<string, number>);

    // Active (non-rejected/placed) for pipeline highlight
    const activeStageKey = (() => {
        for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
            if (stageCounts[PIPELINE_STAGES[i].key] > 0) return PIPELINE_STAGES[i].key;
        }
        return null;
    })();

    const totalApps = applications.length;
    const shortlists = applications.filter(a => ['Screening', 'OA Pending', 'Interview Scheduled', 'Offer Extended', 'Placed'].includes(a.status)).length;
    
    const stats = {
        total: totalApps,
        active: applications.filter(a => !['Rejected', 'OA Rejected'].includes(a.status)).length,
        interviews: applications.filter(a => a.status === 'Interview Scheduled').length,
        offers: applications.filter(a => ['Offer Extended', 'Placed'].includes(a.status)).length,
        viewRate: totalApps > 0 ? Math.round((totalApps * 0.8) / totalApps * 100) : 0, // Mocked 80% view rate
        shortlistRate: totalApps > 0 ? Math.round((shortlists / totalApps) * 100) : 0,
    };

    return (
        <div className="app-track-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}

            <main className="app-track-main" style={isEmbedded ? { paddingTop: 0 } : {}}>
                <motion.div className="app-track-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="app-track-title">Applications & Saved Jobs</h1>
                            <p className="app-track-sub">Track your pipeline, manage saved opportunities, and complete pending actions.</p>
                        </div>
                        {stats.offers > 1 && (
                            <button 
                                onClick={handleCompareOffers} 
                                disabled={compareLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                                    background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff',
                                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                                    cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.2)'
                                }}
                            >
                                {compareLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                                AI Offer Compare
                            </button>
                        )}
                    </div>
                </motion.div>
                
                {/* Offer Compare Result */}
                <AnimatePresence>
                    {compareResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, height: 0 }} 
                            animate={{ opacity: 1, y: 0, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#334155' }}>
                                    <Sparkles color="#a855f7" /> AI Offer Comparison Analysis
                                </h3>
                                <button onClick={() => setCompareResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-wrap' }}>
                                {compareResult}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats strip */}
                <motion.div className="app-stats-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    {[
                        { label: 'Total Applied', value: stats.total, color: '#2563eb', icon: <Briefcase size={18} /> },
                        { label: 'View Rate', value: `${stats.viewRate}%`, color: '#0ea5e9', icon: <Star size={18} /> },
                        { label: 'Shortlist Rate', value: `${stats.shortlistRate}%`, color: '#14b8a6', icon: <TrendingUp size={18} /> },
                        { label: 'Interviews', value: stats.interviews, color: '#7c3aed', icon: <Calendar size={18} /> },
                        { label: 'Offers / Placed', value: stats.offers, color: '#d97706', icon: <Award size={18} /> },
                    ].map(s => (
                        <div key={s.label} className="app-stat-card" style={{ '--stat-color': s.color } as React.CSSProperties}>
                            <div className="app-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            <div className="app-stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="app-stat-label">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Tabs */}
                <div className="app-tabs">
                    <button className={`app-tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>
                        <TrendingUp size={16} /> Job Applications
                        {applications.length > 0 && <span className="app-tab-count">{applications.length}</span>}
                    </button>
                    <button className={`app-tab ${tab === 'ventures' ? 'active' : ''}`} onClick={() => setTab('ventures')}>
                        <Rocket size={16} /> Co-Founder & Ventures
                        {collabRequests.length > 0 && <span className="app-tab-count" style={{ background: '#7c3aed' }}>{collabRequests.length}</span>}
                    </button>
                    <button className={`app-tab ${tab === 'incubation' ? 'active' : ''}`} onClick={() => setTab('incubation')}>
                        <Building2 size={16} /> Incubation Pitches
                        {incubationApps.length > 0 && <span className="app-tab-count" style={{ background: '#d97706' }}>{incubationApps.length}</span>}
                    </button>
                    <button className={`app-tab ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>
                        <Bookmark size={16} /> Saved Jobs
                        {savedOpps.length > 0 && <span className="app-tab-count">{savedOpps.length}</span>}
                    </button>
                </div>

                {/* ── Pipeline Tab ── */}
                {tab === 'pipeline' && (
                    <>
                        {/* Visual pipeline */}
                        {applications.length > 0 && (
                            <motion.div className="app-pipeline-visual" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                {PIPELINE_STAGES.map((stage, i) => {
                                    const count = stageCounts[stage.key] || 0;
                                    const isActive = stage.key === activeStageKey;
                                    const isCompleted = PIPELINE_STAGES.indexOf(PIPELINE_STAGES.find(s => s.key === activeStageKey)!) > i;
                                    return (
                                        <div key={stage.key} className="pipeline-stage-wrap">
                                            <div
                                                className={`pipeline-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                                style={isActive || isCompleted ? { borderColor: stage.color, background: stage.color + '10' } : {}}
                                            >
                                                <div className="pipeline-stage-count" style={{ color: count > 0 ? stage.color : '#94a3b8' }}>{count}</div>
                                                <div className="pipeline-stage-label" style={{ color: count > 0 ? stage.color : '#94a3b8' }}>{stage.label}</div>
                                                {(isActive || isCompleted) && (
                                                    <div className="pipeline-stage-dot" style={{ background: stage.color }} />
                                                )}
                                            </div>
                                            {i < PIPELINE_STAGES.length - 1 && (
                                                <ChevronRight size={16} className="pipeline-arrow" style={{ color: isCompleted ? stage.color : '#cbd5e1' }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {/* ── Interview Scheduled Alert Banner ── */}
                        {(() => {
                            const interviewApps = applications.filter(a => a.status === 'Interview Scheduled');
                            if (interviewApps.length === 0) return null;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                                        border: '1.5px solid #6ee7b7',
                                        borderRadius: '12px',
                                        padding: '14px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '16px',
                                        boxShadow: '0 2px 12px rgba(16, 185, 129, 0.12)'
                                    }}
                                >
                                    <span style={{ fontSize: '22px', animation: 'pulse 2s infinite' }}>🎉</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, color: '#065f46', fontSize: '14px', margin: 0 }}>
                                            Interview Scheduled — Action Required!
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#047857', margin: '2px 0 0' }}>
                                            {interviewApps.map(a => `${a.title} at ${a.company}`).join(' · ')} · Check details below
                                        </p>
                                    </div>
                                    <Bell size={18} color="#10b981" />
                                </motion.div>
                            );
                        })()}

                        {loading ? (
                            <div className="app-track-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading your applications...</p>
                            </div>
                        ) : applications.length === 0 ? (
                            <EmptyState
                                icon={Briefcase}
                                title="No Applications Yet"
                                description="You haven't applied to any roles on the platform yet. Start exploring jobs to build your career pipeline."
                                actionElement={
                                    <Link to="/candidate/opportunities" className="app-track-btn-primary">
                                        Find Opportunities
                                    </Link>
                                }
                            />
                        ) : (
                            <div className="app-track-list">
                                <AnimatePresence>
                                    {applications.map((app, i) => {
                                        const config = getStatusConfig(app.status);
                                        const Icon = config.icon;
                                        const stageIdx = PIPELINE_STAGES.findIndex(s => s.key === app.status);
                                        const progress = stageIdx >= 0 ? Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100) : 5;

                                        return (
                                            <motion.div
                                                key={app.id}
                                                className="app-track-card"
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                {/* Progress bar inside card */}
                                                <div className="app-card-progress-bar">
                                                    <div className="app-card-progress-fill" style={{ width: `${progress}%`, background: config.color }} />
                                                </div>

                                                <div className="app-track-card-main">
                                                    <div className="app-track-info">
                                                        <h3 className="app-track-role">{app.title}</h3>
                                                        <p className="app-track-company">{app.company}</p>
                                                        <div className="app-track-meta">
                                                            <span><Calendar size={14} /> Applied {app.appliedAt ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                                                            {app.capabilityMatch !== undefined && (
                                                                <span style={{ color: '#2563eb' }}><Star size={13} fill="#2563eb" /> {app.capabilityMatch}% match</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="app-track-status-box">
                                                        <div className="app-track-badge" style={{ background: config.bg, color: config.color }}>
                                                            <Icon size={16} /> {config.text}
                                                        </div>

                                                        {app.status === 'OA Pending' && (
                                                            <button
                                                                className="app-track-action-btn"
                                                                onClick={() => navigate(`/candidate/oa/${app.id}`, { state: { roleId: app.opportunityId } })}
                                                            >
                                                                Take Assessment <ExternalLink size={16} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* AI Actions */}
                                                    <div className="app-track-ai-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {app.status === 'Rejected' && (
                                                            <button 
                                                                onClick={() => handleAiGenerate(app, 'reject')}
                                                                disabled={aiLoading === app.id}
                                                                className="app-ai-btn"
                                                            >
                                                                {aiLoading === app.id ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                                                                Why was I rejected?
                                                            </button>
                                                        )}
                                                        {['Interview Scheduled', 'Screening', 'OA Pending'].includes(app.status) && (
                                                            <button 
                                                                onClick={() => handleAiGenerate(app, 'email')}
                                                                disabled={aiLoading === app.id}
                                                                className="app-ai-btn"
                                                            >
                                                                {aiLoading === app.id ? <Loader2 size={14} className="spin" /> : <MessageSquare size={14} />}
                                                                Generate Follow-up Email
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* AI Result Card */}
                                                    {aiResult?.id === app.id && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }} 
                                                            animate={{ opacity: 1, height: 'auto' }} 
                                                            className="app-ai-result-card"
                                                        >
                                                            <div className="app-ai-result-header">
                                                                <span style={{ fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Sparkles size={14} color="#a855f7" /> 
                                                                    {aiResult!.type === 'reject' ? 'Rejection Analysis' : 'Generated Email'}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button onClick={() => copyToClipboard(aiResult!.content)} className="app-ai-icon-btn">
                                                                        {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                                                                    </button>
                                                                    <button onClick={() => setAiResult(null)} className="app-ai-icon-btn">
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="app-ai-result-content">
                                                                {aiResult!.content}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Withdraw Application */}
                                                {['Applied', 'Screening'].includes(app.status) && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        {withdrawConfirm === app.id ? (
                                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Confirm withdraw?</span>
                                                                <button
                                                                    onClick={() => handleWithdraw(app)}
                                                                    disabled={withdrawing === app.id}
                                                                    className="app-ai-btn"
                                                                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                                                                >
                                                                    {withdrawing === app.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Yes, Withdraw
                                                                </button>
                                                                <button onClick={() => setWithdrawConfirm(null)} className="app-ai-btn" style={{ background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setWithdrawConfirm(app.id)}
                                                                className="app-ai-btn"
                                                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                                                            >
                                                                <Trash2 size={13} /> Withdraw Application
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Messages or details */}
                                                {app.message && (
                                                    <div className="app-track-message">
                                                        <strong>Note from Employer:</strong> {app.message}
                                                    </div>
                                                )}

                                                {app.feedback && (
                                                    <div className="app-track-message" style={{ background: '#f8fafc', borderLeft: '3px solid #cbd5e1', marginTop: '8px' }}>
                                                        <strong>Interview Feedback:</strong> {app.feedback}
                                                    </div>
                                                )}

                                                {['Offer Extended', 'Placed'].includes(app.status) && (
                                                    <div className="app-track-interview-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: '12px' }}>
                                                        <h4 style={{ color: '#16a34a' }}>🎉 Offer Details</h4>
                                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                                            {app.offerLetterUrl ? (
                                                                <a href={app.offerLetterUrl} target="_blank" rel="noreferrer" className="app-track-btn-primary" style={{ background: '#16a34a', textDecoration: 'none' }}>View Offer Letter</a>
                                                            ) : (
                                                                <label className="app-track-btn-primary" style={{ background: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: uploadingOfferId === app.id ? 0.7 : 1 }}>
                                                                    {uploadingOfferId === app.id ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                                                    {uploadingOfferId === app.id ? 'Uploading...' : 'Upload Signed Offer'}
                                                                    <input 
                                                                        type="file" 
                                                                        accept=".pdf,.png,.jpg,.jpeg" 
                                                                        style={{ display: 'none' }} 
                                                                        disabled={uploadingOfferId === app.id}
                                                                        onChange={async (e) => {
                                                                            if (!e.target.files?.[0]) return;
                                                                            const file = e.target.files[0];
                                                                            setUploadingOfferId(app.id);
                                                                            try {
                                                                                await uploadOfferLetterToApplication(app.opportunityId, app.id, file);
                                                                                loadApplications();
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                            } finally {
                                                                                setUploadingOfferId(null);
                                                                            }
                                                                        }} 
                                                                    />
                                                                </label>
                                                            )}
                                                            {app.status === 'Offer Extended' && (
                                                                <button className="app-track-action-btn" style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca' }}>Decline Offer</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {app.interviewDetails && (
                                                    <div className="app-track-interview-box">
                                                        <h4>🎉 Interview Details</h4>
                                                        <div className="app-track-interview-grid">
                                                            <div>
                                                                <span>Date</span>
                                                                <p>{app.interviewDetails.date}</p>
                                                            </div>
                                                            <div>
                                                                <span>Time</span>
                                                                <p>{app.interviewDetails.time}</p>
                                                            </div>
                                                            <div style={{ gridColumn: 'span 2' }}>
                                                                <span>Venue / Link</span>
                                                                <p><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} /> {app.interviewDetails.venue}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {app.offerDetails && (
                                                    <div className="app-track-interview-box" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderColor: '#c4b5fd' }}>
                                                        <h4>🚀 Offer Details</h4>
                                                        <div className="app-track-interview-grid">
                                                            <div>
                                                                <span>CTC / Stipend</span>
                                                                <p style={{ fontWeight: 700, color: '#7c3aed' }}>{app.offerDetails.salary}</p>
                                                            </div>
                                                            <div>
                                                                <span>Start Date</span>
                                                                <p>{app.offerDetails.startDate || 'TBD'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* ── Co-Founder & Ventures Tab ── */}
                {tab === 'ventures' && (
                    <>
                        {ventureLoading ? (
                            <div className="app-track-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading your startup & co-founder inquiries...</p>
                            </div>
                        ) : collabRequests.length === 0 ? (
                            <EmptyState
                                icon={Rocket}
                                title="No Venture Inquiries Yet"
                                description="You haven't requested to join any founding teams or early-stage startups yet. Browse student ventures to find co-founder and equity roles."
                                actionElement={
                                    <Link to="/candidate/opportunities?tab=startups" className="app-track-btn-primary">
                                        Explore Startups & Co-Founders
                                    </Link>
                                }
                            />
                        ) : (
                            <div className="app-track-list">
                                <AnimatePresence>
                                    {collabRequests.map((req, i) => {
                                        const statusColor =
                                            req.status === 'accepted' ? '#10b981' :
                                            req.status === 'declined' ? '#64748b' : '#f59e0b';
                                        const statusBg =
                                            req.status === 'accepted' ? '#ecfdf5' :
                                            req.status === 'declined' ? '#f1f5f9' : '#fffbeb';
                                        const statusLabel =
                                            req.status === 'accepted' ? 'Accepted — Founder Connected 🎉' :
                                            req.status === 'declined' ? 'Declined' : 'Under Review by Founder';

                                        return (
                                            <motion.div
                                                key={req.id}
                                                className="app-track-card"
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <div className="app-track-card-main">
                                                    <div className="app-track-info">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                                                Startup Venture
                                                            </span>
                                                        </div>
                                                        <h3 className="app-track-role">{req.ventureTitle}</h3>
                                                        <p className="app-track-company" style={{ color: '#6366f1' }}>
                                                            Role Requested: <strong>{req.roleInterested}</strong>
                                                        </p>
                                                        <div className="app-track-meta">
                                                            <span>
                                                                <Calendar size={14} /> Submitted {new Date(req.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {req.skills && req.skills.length > 0 && (
                                                                <span>
                                                                    <Sparkles size={14} color="#8b5cf6" /> {req.skills.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="app-track-status-box">
                                                        <div className="app-track-badge" style={{ background: statusBg, color: statusColor }}>
                                                            {req.status === 'accepted' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                                            {statusLabel}
                                                        </div>
                                                    </div>
                                                </div>

                                                {req.message && (
                                                    <div className="app-track-message" style={{ borderLeftColor: '#7c3aed', background: '#faf5ff' }}>
                                                        <strong style={{ color: '#6b21a8' }}>Your Pitch Message:</strong> {req.message}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* ── Incubation & Grants Tab ── */}
                {tab === 'incubation' && (
                    <>
                        {ventureLoading ? (
                            <div className="app-track-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading your incubation applications...</p>
                            </div>
                        ) : incubationApps.length === 0 ? (
                            <EmptyState
                                icon={Building2}
                                title="No Incubation Pitches Yet"
                                description="You haven't submitted your startup prototype to any institutional E-Cells or incubation grants yet."
                                actionElement={
                                    <Link to="/candidate/opportunities?tab=incubation" className="app-track-btn-primary">
                                        Browse Incubation Cohorts
                                    </Link>
                                }
                            />
                        ) : (
                            <div className="app-track-list">
                                <AnimatePresence>
                                    {incubationApps.map((app, i) => {
                                        const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                                            submitted: { label: 'Pitch Submitted', color: '#2563eb', bg: '#eff6ff' },
                                            under_review: { label: 'Committee Review', color: '#d97706', bg: '#fffbeb' },
                                            shortlisted: { label: 'Shortlisted for Pitch Presentation', color: '#7c3aed', bg: '#f5f3ff' },
                                            selected: { label: 'Selected for Incubation & Grant 🏆', color: '#059669', bg: '#ecfdf5' },
                                            rejected: { label: 'Not Selected', color: '#64748b', bg: '#f1f5f9' },
                                        };
                                        const conf = statusMap[app.status] || statusMap.submitted;

                                        return (
                                            <motion.div
                                                key={app.id}
                                                className="app-track-card"
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <div className="app-track-card-main">
                                                    <div className="app-track-info">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                                                {app.institutionCode}
                                                            </span>
                                                        </div>
                                                        <h3 className="app-track-role">{app.startupName}</h3>
                                                        <p className="app-track-company" style={{ color: '#4338ca' }}>
                                                            Applied to: <strong>{app.programTitle}</strong>
                                                        </p>
                                                        <div className="app-track-meta">
                                                            <span>
                                                                <Calendar size={14} /> Submitted {new Date(app.submittedAt).toLocaleDateString()}
                                                            </span>
                                                            <span>
                                                                <Users size={14} /> Team Size: {app.teamSize}
                                                            </span>
                                                            {app.deckUrl && (
                                                                <a
                                                                    href={app.deckUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                                                >
                                                                    <ExternalLink size={13} /> Pitch Deck
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="app-track-status-box">
                                                        <div className="app-track-badge" style={{ background: conf.bg, color: conf.color }}>
                                                            <Award size={16} /> {conf.label}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="app-track-message" style={{ borderLeftColor: '#d97706', background: '#fffdf5' }}>
                                                    <strong style={{ color: '#9a3412' }}>Executive Pitch:</strong> {app.pitchSummary}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* ── Saved Jobs Tab ── */}
                {tab === 'saved' && (
                    <>
                        {savedLoading ? (
                            <div className="app-track-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading saved jobs...</p>
                            </div>
                        ) : savedOpps.length === 0 ? (
                            <div className="app-track-empty">
                                <Bookmark size={48} color="#94a3b8" />
                                <h2>No Saved Jobs</h2>
                                <p>Save interesting opportunities from the Opportunities page and come back to apply later.</p>
                                <Link to="/candidate/opportunities" className="app-track-btn-primary">Browse Opportunities</Link>
                            </div>
                        ) : (
                            <div className="saved-jobs-list">
                                <AnimatePresence>
                                    {savedOpps.map((opp, i) => (
                                        <motion.div
                                            key={opp.id}
                                            className="saved-job-card"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ delay: i * 0.04 }}
                                        >
                                            <div className="saved-job-icon">
                                                <Briefcase size={20} color="#2563eb" />
                                            </div>
                                            <div className="saved-job-info">
                                                <h3 className="saved-job-title">{opp.title}</h3>
                                                <p className="saved-job-company">{opp.company}</p>
                                                <span className="saved-job-date">
                                                    <Calendar size={13} />
                                                    Saved {opp.savedAt ? new Date(opp.savedAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                                </span>
                                            </div>
                                            <div className="saved-job-actions">
                                                {opp.url && (
                                                    <a
                                                        href={opp.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="saved-job-apply-btn"
                                                    >
                                                        Apply <ExternalLink size={14} />
                                                    </a>
                                                )}
                                                <button
                                                    className="saved-job-remove-btn"
                                                    onClick={() => handleUnsave(opp)}
                                                    disabled={unsaving === opp.id}
                                                    title="Remove from saved"
                                                >
                                                    {unsaving === opp.id ? <Loader2 size={15} className="spin" /> : <BookmarkX size={15} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
