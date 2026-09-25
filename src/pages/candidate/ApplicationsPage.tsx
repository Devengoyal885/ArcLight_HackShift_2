import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCandidateApplications } from '../../services/employerService';
import { getSavedOpportunities, unsaveOpportunity } from '../../services/profileService';
import { Link, useNavigate } from 'react-router-dom';
import {
    Loader2, Briefcase, Calendar, MapPin, ExternalLink,
    CheckCircle, XCircle, AlertCircle, PlayCircle, Clock,
    Bookmark, BookmarkX, TrendingUp, Award, Star, ChevronRight,
} from 'lucide-react';
import './ApplicationsPage.css';

type AppTab = 'pipeline' | 'saved';

const PIPELINE_STAGES = [
    { key: 'Applied', label: 'Applied', color: '#3b82f6' },
    { key: 'Screening', label: 'Screening', color: '#8b5cf6' },
    { key: 'OA Pending', label: 'Assessment', color: '#f59e0b' },
    { key: 'Interview Scheduled', label: 'Interview', color: '#10b981' },
    { key: 'Offer Extended', label: 'Offer', color: '#7c3aed' },
    { key: 'Placed', label: 'Placed 🏆', color: '#d97706' },
];

export default function ApplicationsPage() {
    const { user, dbUid } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<AppTab>('pipeline');
    const [applications, setApplications] = useState<any[]>([]);
    const [savedOpps, setSavedOpps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [savedLoading, setSavedLoading] = useState(true);
    const [unsaving, setUnsaving] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        getCandidateApplications(dbUid!).then(apps => {
            setApplications(apps);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    useEffect(() => {
        if (!user) return;
        getSavedOpportunities(dbUid!).then(saved => {
            setSavedOpps(saved);
            setSavedLoading(false);
        }).catch(() => setSavedLoading(false));
    }, [user]);

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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Applied': return { color: '#3b82f6', bg: '#eff6ff', icon: Clock, text: 'Under Review' };
            case 'OA Pending': return { color: '#f59e0b', bg: '#fef3c7', icon: PlayCircle, text: 'Action Required: Assessment' };
            case 'Interview Scheduled': return { color: '#10b981', bg: '#dcfce7', icon: CheckCircle, text: 'Interview Scheduled' };
            case 'Offer Extended': return { color: '#7c3aed', bg: '#f3e8ff', icon: CheckCircle, text: '🚀 Offer Extended!' };
            case 'Placed': return { color: '#d97706', bg: '#fef3c7', icon: CheckCircle, text: '🏆 Placed!' };
            case 'Rejected':
            case 'OA Rejected': return { color: '#ef4444', bg: '#fee2e2', icon: XCircle, text: 'Not Selected' };
            default: return { color: '#64748b', bg: '#f1f5f9', icon: AlertCircle, text: status };
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

    const stats = {
        total: applications.length,
        active: applications.filter(a => !['Rejected', 'OA Rejected'].includes(a.status)).length,
        interviews: applications.filter(a => a.status === 'Interview Scheduled').length,
        offers: applications.filter(a => ['Offer Extended', 'Placed'].includes(a.status)).length,
    };

    return (
        <div className="app-track-page">
            <FloatingNavbar variant="candidate" />

            <main className="app-track-main">
                <motion.div className="app-track-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="app-track-title">Applications & Saved Jobs</h1>
                    <p className="app-track-sub">Track your pipeline, manage saved opportunities, and complete pending actions.</p>
                </motion.div>

                {/* Stats strip */}
                <motion.div className="app-stats-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    {[
                        { label: 'Total Applied', value: stats.total, color: '#2563eb', icon: <Briefcase size={18} /> },
                        { label: 'Active', value: stats.active, color: '#10b981', icon: <TrendingUp size={18} /> },
                        { label: 'Interviews', value: stats.interviews, color: '#7c3aed', icon: <Calendar size={18} /> },
                        { label: 'Offers / Placed', value: stats.offers, color: '#d97706', icon: <Award size={18} /> },
                        { label: 'Saved Jobs', value: savedOpps.length, color: '#f59e0b', icon: <Bookmark size={18} /> },
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
                        <TrendingUp size={16} /> Application Pipeline
                        {applications.length > 0 && <span className="app-tab-count">{applications.length}</span>}
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

                        {loading ? (
                            <div className="app-track-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading your applications...</p>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="app-track-empty">
                                <Briefcase size={48} color="#94a3b8" />
                                <h2>No Applications Yet</h2>
                                <p>You haven't applied to any roles on the platform.</p>
                                <Link to="/candidate/opportunities" className="app-track-btn-primary">Find Opportunities</Link>
                            </div>
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
                                                </div>

                                                {/* Messages or details */}
                                                {app.message && (
                                                    <div className="app-track-message">
                                                        <strong>Note from Employer:</strong> {app.message}
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
