import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import ProfileNudgeBanner from '../../components/ui/ProfileNudgeBanner';
import { IdentityCard3D } from '../../components/3d/IdentityCard3D';
import { JobSkeleton } from '../../components/ui/JobSkeleton';
import { Tooltip } from '../../components/ui/Tooltip';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight, Map, Briefcase, GraduationCap, Building2, MapPin,
    DollarSign, Target, CheckCircle2, Loader2, ExternalLink,
    AlertCircle, GitBranch, Zap, RefreshCw, Sparkles, Globe, TrendingUp, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities } from '../../services/profileService';
import { getAllOpportunities, matchOpportunityToSkills } from '../../services/opportunityService';
import { syncGitHub } from '../../services/githubService';
import { updateProfile } from '../../services/profileService';
import type { OpportunityCard } from '../../services/opportunityService';
import type { UserCapability } from '../../services/profileService';
import './CandidateDashboard.css';

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
}

const stateColors: Record<string, { text: string, bg: string }> = {
    'READY NOW': { text: '#059669', bg: '#ECFDF5' },
    'NEAR MATCH': { text: '#1D4ED8', bg: '#EFF6FF' },
    'SKILL-BUILDING': { text: '#D97706', bg: '#FFFBEB' }
};

export default function CandidateDashboard() {
    const { user, dbUid, profile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'placements' | 'internships'>('placements');

    // Real data state
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [capsLoaded, setCapsLoaded] = useState(false);
    const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [jobError, setJobError] = useState(false);
    const [syncingGithub, setSyncingGithub] = useState(false);

    const displayName = profile?.name || user?.displayName || 'There';
    const firstName = displayName.split(' ')[0];
    const initials = displayName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
    const photoURL = profile?.avatar || user?.photoURL || null;
    const greeting = useMemo(() => getGreeting(), []);

    // Capability confidence from real Firestore capabilities
    const capabilityConfidence = useMemo(() => {
        if (!capabilities.length) return 0;
        return Math.round(capabilities.reduce((s, c) => s + c.score, 0) / capabilities.length);
    }, [capabilities]);

    const careerReadinessScore = useMemo(() => {
        let score = 0;
        if (capabilities.length >= 5) score += 40;
        else if (capabilities.length > 0) score += capabilities.length * 8;
        
        if (capabilityConfidence > 80) score += 30;
        else if (capabilityConfidence > 50) score += 15;
        
        if (profile?.githubUsername) score += 15;
        if (profile?.headline) score += 15;
        return score > 100 ? 100 : score;
    }, [capabilities, capabilityConfidence, profile]);

    // Load capabilities from Firestore
    useEffect(() => {
        if (!user) return;
        getCapabilities(dbUid!).then(caps => {
            setCapabilities(caps);
            setCapsLoaded(true);
        }).catch(err => {
            console.error(err);
            setCapsLoaded(true);
        });
    }, [user]);

    const globalScore = (profile as any)?.totalScore || 0;

    // Fetch full cron pool, filter by tab type client-side, score against user skills
    useEffect(() => {
        if (!capsLoaded || !user) return;
        
        const userSkills = capabilities.map(c => c.skill);
        const jobType = activeTab === 'placements' ? 'placement' : 'internship';

        const loadDashboardJobs = async () => {
            setLoadingJobs(true);
            setJobError(false);
            
            try {
                const CACHE_KEY = `dashboard_jobs_v6_${dbUid!}_${activeTab}`;
                const currentCapsHash = capabilities.map(c => `${c.skill}:${c.score}`).sort().join('|');

                const cachedDataStr = localStorage.getItem(CACHE_KEY);
                if (cachedDataStr) {
                    try {
                        const cachedData = JSON.parse(cachedDataStr);
                        const now = Date.now();
                        const isExpired = now - cachedData.timestamp > 24 * 60 * 60 * 1000;
                        const isCapsChanged = cachedData.capsHash !== currentCapsHash;

                        if (!isExpired && !isCapsChanged && cachedData.opportunities) {
                            setOpportunities(cachedData.opportunities);
                            setLoadingJobs(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse cache", e);
                    }
                }

                const jobs = await getAllOpportunities();
                const typed = jobs.filter(j =>
                    jobType === 'internship'
                        ? j.type === 'internship' || j.title.toLowerCase().includes('intern')
                        : j.type !== 'internship' && !j.title.toLowerCase().includes('intern')
                );
                
                const scored = typed.map(j => matchOpportunityToSkills(j, userSkills));
                // Pin internal CapAble platform postings to the top, rest sorted by match %
                const internalJobs = scored.filter(j => j.isInternalPosting);
                const externalJobs = scored.filter(j => !j.isInternalPosting).sort((a, b) => (b.match || 0) - (a.match || 0));
                const finalSorted = [...internalJobs, ...externalJobs];
                setOpportunities(finalSorted);

                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    opportunities: scored,
                    timestamp: Date.now(),
                    capsHash: currentCapsHash
                }));

            } catch(e) {
                setJobError(true);
            } finally {
                setLoadingJobs(false);
            }
        };
        
        loadDashboardJobs();
    }, [user, capabilities, activeTab, capsLoaded]);

    // GitHub sync
    const handleGithubSync = async () => {
        if (!user || !profile?.githubUsername) return;
        setSyncingGithub(true);
        try {
            await syncGitHub(profile.githubUsername);
            await updateProfile(dbUid!, { githubUsername: profile.githubUsername });
        } catch (err) {
            console.error('GitHub sync failed:', err);
        } finally {
            setSyncingGithub(false);
        }
    };

    const renderJobCard = (job: OpportunityCard, i: number) => (
        <motion.div
            key={job.id}
            className="c-job-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: i * 0.05 }}
        >
            <div className="c-job-header-premium">
                <div className="c-job-logo-wrapper">
                    {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.company} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <Building2 size={20} color="#64748b" />
                    )}
                </div>
                <div className="c-job-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="c-job-title-premium">{job.title}</h3>
                        {job.isInternalPosting && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                ✨ CapAble Exclusive
                            </span>
                        )}
                    </div>
                    <p className="c-job-company-premium">{job.company}</p>
                </div>
            </div>

            <div className="c-job-details-premium">
                <span><MapPin size={14} /> {job.location}</span>
                {job.salary && <span><DollarSign size={14} /> {job.salary}</span>}
                <span><Briefcase size={14} /> {job.type || 'Full Time'}</span>
                {job.source && job.source !== 'serper' && job.source !== 'manual' && (
                    <span style={{ fontWeight: 600, color: '#4f46e5' }}>
                        <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {job.source === 'remotive' ? 'Remotive' : job.source}
                    </span>
                )}
            </div>
            {/* Skills */}
            <div className="c-job-skills-premium">
                {job.tags.slice(0, 6).map(t => {
                    const isVerified = job.matchingSkills?.some(ms => ms.toLowerCase() === t.toLowerCase());
                    return (
                        <span key={t} className={`c-job-signal-chip ${isVerified ? 'verified' : ''}`}>
                            {t} {isVerified && <span className="c-job-signal-check">✓</span>}
                        </span>
                    );
                })}
            </div>
            
            <div className="c-job-footer-premium">
                <div className="c-job-match-badge-premium">
                    {job.match !== undefined && (
                        <span style={{ 
                            color: stateColors[job.matchState || 'SKILL-BUILDING'].text,
                            background: stateColors[job.matchState || 'SKILL-BUILDING'].bg
                        }}>
                            <Target size={14} className="inline mr-1" />{job.match}% MATCH
                        </span>
                    )}
                </div>
                <div className="c-job-actions-premium">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="c-job-btn-text">
                        View <ExternalLink size={14} />
                    </a>
                    <button
                        onClick={() => {
                            const jd = `Job Title: ${job.title}\nCompany: ${job.company}\nDetails: ${job.description || job.tags.join(', ')}`;
                            navigate('/candidate/resume', { state: { jdText: jd } });
                        }}
                        className="c-job-btn-primary"
                    >
                        <Sparkles size={14} /> Tailor Resume
                    </button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="c-dash">
            <FloatingNavbar variant="candidate" />

            <div className="c-dash-bg">
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <linearGradient id="match-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>
                </svg>
                {/* Ethereal Noise Overlay */}
                <div className="c-dash-noise-overlay" />
                {/* No neon orbs. */}
            </div>

            <main className="c-dash-main">
                <div style={{ padding: '0 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    <ProfileNudgeBanner />
                </div>
                <div className="c-dash-grid-layout">
                    {/* ─── LEFT: Identity & Overview ─── */}
                    <motion.div
                        className="c-dash-sidebar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="c-dash-greeting">
                            <h1 className="c-dash-name">
                                {greeting.split(' ')[0]} 
                                <span className="c-dash-inline-pill">
                                    <span className="c-dash-pulse-dot" /> {globalScore} IQ
                                </span> 
                                {greeting.split(' ')[1] ? greeting.split(' ')[1] : ''} <br/> 
                                <span style={{ color: '#64748B' }}>{firstName}.</span>
                            </h1>
                            <p className="c-dash-time-label" style={{ marginTop: '16px' }}>
                                Your career intelligence is active.
                            </p>
                        </div>

                        <Tooltip content="Your 3D Identity Card. Share it via Codolio profile!" position="right" delay={1}>
                            <IdentityCard3D
                                name={displayName}
                                role={profile?.headline || 'Software Engineer'}
                                initials={photoURL ? '' : initials}
                                capabilityConfidence={capabilityConfidence}
                                verifiedEvidence={capabilities.length}
                                projectCount={0}
                                photoURL={photoURL}
                                globalScore={globalScore}
                            />
                        </Tooltip>

                        {/* Identity Actions & Capabilities */}
                        <div className="c-dash-identity-actions">
                            {/* GitHub sync button */}
                            {profile?.githubUsername ? (
                                <Tooltip content="Sync your latest repos to boost your profile score" position="right" delay={0.5}>
                                    <button className="id-capsule-btn" onClick={handleGithubSync} disabled={syncingGithub}>
                                        <span className="id-capsule-icon"><GitBranch size={14} /></span>
                                        <span className="id-capsule-text">
                                            {syncingGithub ? 'Syncing...' : `Sync GitHub (@${profile.githubUsername})`}
                                        </span>
                                        <span className="id-capsule-action">
                                            {syncingGithub ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} className="id-capsule-refresh" />}
                                        </span>
                                    </button>
                                </Tooltip>
                            ) : (
                                <Tooltip content="Connect GitHub to automatically showcase your repos" position="right" delay={0.5}>
                                    <Link to="/candidate/portfolio" className="id-capsule-btn">
                                        <span className="id-capsule-icon"><GitBranch size={14} /></span>
                                        <span className="id-capsule-text">Connect GitHub</span>
                                        <span className="id-capsule-action"><ChevronRight size={14} className="id-capsule-arrow" /></span>
                                    </Link>
                                </Tooltip>
                            )}

                            {/* Resume Builder button */}
                            <a href="https://access-hire.netlify.app/resume" className="id-capsule-btn" target="_blank" rel="noopener noreferrer">
                                <span className="id-capsule-icon">◎</span>
                                <span className="id-capsule-text">Resume Builder</span>
                                <span className="id-capsule-action"><ChevronRight size={14} className="id-capsule-arrow" /></span>
                            </a>
                        </div>

                        {/* Capability summary */}
                        {capabilities.length > 0 && (
                            <div className="agency-outer">
                                <div className="agency-inner id-capsule-matrix">
                                    <div className="id-matrix-header">TOP CAPABILITIES</div>
                                    <div className="id-matrix-list">
                                        {capabilities.slice(0, 4).map((cap, idx) => (
                                            <div key={cap.skill} className={`id-matrix-row ${idx === 0 ? 'top-highlight' : ''}`}>
                                                <div className="id-matrix-row-header">
                                                    <span className="id-matrix-skill-name">
                                                        {idx === 0 ? '◈ ' : ''}{cap.skill}
                                                    </span>
                                                    {idx === 0 && <span className="id-matrix-top-badge">TOP CAPABILITY</span>}
                                                </div>
                                                <div className="id-matrix-progress-container">
                                                    <div className="id-matrix-progress-rail">
                                                        <motion.div 
                                                            className="id-matrix-progress-fill" 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${cap.score}%` }}
                                                            transition={{ delay: 0.3 + idx * 0.1, type: 'spring', bounce: 0, duration: 0.8 }}
                                                        />
                                                    </div>
                                                    <span className="id-matrix-score">{cap.score}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Career Readiness Score */}
                        <motion.div 
                            className="agency-outer" 
                            style={{ marginTop: '16px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="agency-inner id-capsule-matrix">
                                <div className="id-matrix-header">CAREER READINESS</div>
                                <div className="id-matrix-row">
                                    <div className="id-matrix-row-header">
                                        <span className="id-matrix-skill-name">Overall Score</span>
                                    </div>
                                    <div className="id-matrix-progress-container">
                                        <div className="id-matrix-progress-rail">
                                            <motion.div 
                                                className="id-matrix-progress-fill" 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${careerReadinessScore}%` }}
                                                style={{ background: careerReadinessScore > 75 ? '#10b981' : careerReadinessScore > 50 ? '#f59e0b' : '#ef4444' }}
                                                transition={{ delay: 0.5, type: 'spring', bounce: 0, duration: 1 }}
                                            />
                                        </div>
                                        <span className="id-matrix-score">{careerReadinessScore}%</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                                    Based on your capabilities, verified skills, and profile completeness.
                                </p>
                            </div>
                        </motion.div>

                        {/* Peer Benchmarking */}
                        <motion.div 
                            className="agency-outer" 
                            style={{ marginTop: '16px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="agency-inner id-capsule-matrix">
                                <div className="id-matrix-header">PEER BENCHMARKING</div>
                                <div className="id-matrix-row">
                                    <div className="id-matrix-row-header">
                                        <span className="id-matrix-skill-name">Overall College Rank</span>
                                    </div>
                                    <div className="id-matrix-progress-container">
                                        <div className="id-matrix-progress-rail">
                                            <motion.div 
                                                className="id-matrix-progress-fill" 
                                                initial={{ width: 0 }}
                                                animate={{ width: `85%` }}
                                                style={{ background: '#3b82f6' }}
                                                transition={{ delay: 0.6, type: 'spring', bounce: 0, duration: 1 }}
                                            />
                                        </div>
                                        <span className="id-matrix-score">Top 15%</span>
                                    </div>
                                </div>
                                <div className="id-matrix-row" style={{ marginTop: '12px' }}>
                                    <div className="id-matrix-row-header">
                                        <span className="id-matrix-skill-name">Branch Rank</span>
                                    </div>
                                    <div className="id-matrix-progress-container">
                                        <div className="id-matrix-progress-rail">
                                            <motion.div 
                                                className="id-matrix-progress-fill" 
                                                initial={{ width: 0 }}
                                                animate={{ width: `92%` }}
                                                style={{ background: '#8b5cf6' }}
                                                transition={{ delay: 0.7, type: 'spring', bounce: 0, duration: 1 }}
                                            />
                                        </div>
                                        <span className="id-matrix-score">Top 8%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {capabilities.length === 0 && !loadingJobs && (
                            <div className="c-dash-empty-caps">
                                <GitBranch size={14} />
                                <p>No capabilities yet.<br />
                                    <Link to="/candidate/assessments">Take an assessment</Link> or <Link to="/candidate/portfolio">connect GitHub</Link> to build your profile.
                                </p>
                            </div>
                        )}

                        {/* ─── SKILL GAP → LEARNING → OPPORTUNITY LOOP ─── */}
                        {capabilities.length > 0 && (() => {
                            const weakSkills = [...capabilities]
                                .sort((a, b) => a.score - b.score)
                                .slice(0, 2);
                            return (
                                <div className="c-dash-gap-loop">
                                    <div className="c-dash-gap-loop-header">
                                        <TrendingUp size={14} />
                                        <span>Build Your Gaps</span>
                                    </div>
                                    <p className="c-dash-gap-subtitle">Improve these skills to unlock more opportunities:</p>
                                    {weakSkills.map(skill => (
                                        <div key={skill.skill} className="c-dash-gap-item">
                                            <div className="c-dash-gap-item-header">
                                                <span className="c-dash-gap-skill">{skill.skill}</span>
                                                <span className="c-dash-gap-score" style={{ color: skill.score < 50 ? '#ef4444' : '#f59e0b' }}>{skill.score}%</span>
                                            </div>
                                            <div className="c-dash-gap-actions">
                                                <Link
                                                    to={`/candidate/learning`}
                                                    className="c-dash-gap-link"
                                                    style={{ background: '#eff6ff', color: '#2563eb' }}
                                                >
                                                    <BookOpen size={11} /> Learn
                                                </Link>
                                                <Link
                                                    to={`/candidate/assessments`}
                                                    className="c-dash-gap-link"
                                                    style={{ background: '#f0fdf4', color: '#16a34a' }}
                                                >
                                                    <Zap size={11} /> Assess
                                                </Link>
                                                <Link
                                                    to={`/candidate/opportunities`}
                                                    className="c-dash-gap-link"
                                                    style={{ background: '#faf5ff', color: '#7c3aed' }}
                                                >
                                                    <Briefcase size={11} /> Roles
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </motion.div>

                    {/* ─── RIGHT: Opportunities & Feed ─── */}
                    <div className="c-dash-content">
                        {/* Tabs */}
                        <div className="c-dash-tabs">
                            <button
                                className={`c-dash-tab ${activeTab === 'placements' ? 'active' : ''}`}
                                onClick={() => setActiveTab('placements')}
                            >
                                {activeTab === 'placements' && (
                                    <motion.div 
                                        layoutId="active-tab-indicator" 
                                        className="c-dash-tab-pill" 
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} 
                                    />
                                )}
                                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={16} /> Placements
                                </span>
                            </button>
                            <button
                                className={`c-dash-tab ${activeTab === 'internships' ? 'active' : ''}`}
                                onClick={() => setActiveTab('internships')}
                            >
                                {activeTab === 'internships' && (
                                    <motion.div 
                                        layoutId="active-tab-indicator" 
                                        className="c-dash-tab-pill" 
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} 
                                    />
                                )}
                                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GraduationCap size={16} /> Internships
                                </span>
                            </button>
                        </div>

                        {/* Job Feed */}
                        <div className="c-dash-feed-section">
                            {/* Replaced Marquee with empty space to follow Asymmetric Bento/Restraint */}

                            <h2 className="c-dash-section-title">
                                {loadingJobs ? 'Finding opportunities...' : `${opportunities.length} Opportunities for you`}
                            </h2>

                            {loadingJobs && (
                                <div className="c-job-grid">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <JobSkeleton key={i} />
                                    ))}
                                </div>
                            )}

                            {jobError && (
                                <div className="c-dash-empty">
                                    <AlertCircle size={24} />
                                    <p>Could not load opportunities. Please check your connection and try again.</p>
                                </div>
                            )}

                            {!loadingJobs && !jobError && opportunities.length === 0 && (
                                <div className="c-dash-empty">
                                    <Briefcase size={24} />
                                    <p>No {activeTab} found for your current skills.<br />
                                        <Link to="/candidate/opportunities">Browse all opportunities →</Link>
                                    </p>
                                </div>
                            )}

                            {!loadingJobs && !jobError && opportunities.length > 0 && (
                                <div className="c-job-grid">
                                    {opportunities.slice(0, 6).map(renderJobCard)}
                                </div>
                            )}

                            {!loadingJobs && opportunities.length > 0 && (
                                <Link to="/candidate/opportunities" className="c-dash-view-all">
                                    View all {opportunities.length} opportunities <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
