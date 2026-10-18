import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import ProfileNudgeBanner from '../../components/ui/ProfileNudgeBanner';
import { IdentityCard3D } from '../../components/3d/IdentityCard3D';
import { JobSkeleton } from '../../components/ui/JobSkeleton';
import { LottieBackground } from '../../components/ui/LottieBackground';
import { Tooltip } from '../../components/ui/Tooltip';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight, Map, Briefcase, GraduationCap, Building2, MapPin,
    DollarSign, Target, CheckCircle2, Loader2, ExternalLink,
    AlertCircle, GitBranch, Zap, RefreshCw, Sparkles, Globe, TrendingUp, BookOpen, Rocket,
    Video, Calendar, Users, Award, FolderGit2, Plus, X, Trash2, ArrowRight, User
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities } from '../../services/profileService';
import { getAllOpportunities, matchOpportunityToSkills } from '../../services/opportunityService';
import { getStartupVentures, convertVenturesToOpportunityCards } from '../../services/ventureService';
import {
    subscribeToAcademicProjects,
    subscribeToCandidateMentorSessions,
    createAcademicProject,
    updateAcademicProject,
    deleteAcademicProject,
    type AcademicProject,
    type MentorSessionItem
} from '../../services/academicianService';
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
    const [activeTab, setActiveTab] = useState<'placements' | 'internships' | 'ventures' | 'projects'>('placements');
    const [academicProjects, setAcademicProjects] = useState<AcademicProject[]>([]);
    const [mentorSessions, setMentorSessions] = useState<MentorSessionItem[]>([]);
    const [founderMode, setFounderMode] = useState<boolean>(() => {
        return localStorage.getItem('candidate_founder_mode') === 'true';
    });

    const toggleFounderMode = () => {
        setFounderMode(prev => {
            const next = !prev;
            localStorage.setItem('candidate_founder_mode', String(next));
            if (next) {
                setActiveTab('ventures');
            } else {
                setActiveTab('placements');
            }
            return next;
        });
    };

    // Real Mentors Registry
    const realMentorsList = [
        { name: 'Deven Goyal', role: 'Faculty Mentor & Systems Architect', uid: '4EPCpAJLm1WP78bYes2GwoNC5UV2' },
        { name: 'Divya Verma', role: 'Senior AI Researcher', uid: 'uo76sSdEjleC579b5hFtlYq74eQ2' },
        { name: 'ALEX', role: 'Senior Full Stack Engineer', uid: '4zRgCwNASJSVEbvbPmtPQn2NBcH3' },
        { name: 'Ritika Verma', role: 'Product Designer', uid: '7WQxvsGB6SMOc9XxFCn32FsmPqU2' },
        { name: 'Aditya Singh', role: 'Backend Architect', uid: 'fsDWVXIx2Qdy5Awwt4yS7q0whvC2' },
        { name: 'Ansh Kumar', role: 'DevOps Engineer', uid: 'GmRlLOMDfjMeMN6hrigwOol8bL12' },
        { name: 'Naveen', role: 'Data Engineer', uid: '5pnkOLELUqPhjhjc2cFaaGqCquJ3' },
        { name: 'Rishabh Verma', role: 'Software Engineer', uid: '5X746UIPFcTvJqThg0aUseDBN5U2' },
    ];

    // Upload / Propose Real Project State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectType, setNewProjectType] = useState<AcademicProject['type']>('Capstone Project');
    const [newProjectMentor, setNewProjectMentor] = useState('Deven Goyal');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectGithub, setNewProjectGithub] = useState('');
    const [newProjectDeadline, setNewProjectDeadline] = useState('2026-12-31');
    const [uploadingProject, setUploadingProject] = useState(false);

    // Selected Project Details & Progress State
    const [selectedProject, setSelectedProject] = useState<AcademicProject | null>(null);
    const [milestoneGithubUrl, setMilestoneGithubUrl] = useState('');
    const [milestoneDemoUrl, setMilestoneDemoUrl] = useState('');
    const [milestoneNotes, setMilestoneNotes] = useState('');
    const [milestoneStatus, setMilestoneStatus] = useState<AcademicProject['status']>('In Progress');
    const [submittingMilestone, setSubmittingMilestone] = useState(false);
    const [milestoneSaved, setMilestoneSaved] = useState(false);

    const handleUploadProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectTitle.trim() || uploadingProject) return;
        setUploadingProject(true);
        try {
            const studentName = profile?.name || user?.displayName || 'Student Candidate';
            await createAcademicProject({
                title: newProjectTitle.trim(),
                type: newProjectType,
                description: newProjectDesc.trim() || 'Student uploaded capstone & technical implementation project.',
                facultyName: newProjectMentor,
                facultyDepartment: (profile as any)?.department || 'Computer Science & Engineering',
                mentees: [studentName],
                assignedTo: studentName,
                menteeUids: [dbUid || user?.uid || ''],
                status: 'In Progress',
                deadline: newProjectDeadline || '2026-12-31',
                deliverables: [
                    'Project Architecture & System Specification',
                    newProjectGithub ? `GitHub Codebase: ${newProjectGithub.trim()}` : 'Source Code Repository',
                    'Demonstration & Performance Evaluation'
                ]
            });
            if (dbUid) {
                await addDoc(collection(db, 'users', dbUid, 'projects'), {
                    name: newProjectTitle.trim(),
                    description: newProjectDesc.trim() || 'Capstone project',
                    technologies: ['Full-Stack', 'Engineering', 'Capstone'],
                    source: 'manual',
                    repositoryUrl: newProjectGithub.trim() || undefined,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }).catch(() => null);
            }
            setIsUploadModalOpen(false);
            setNewProjectTitle('');
            setNewProjectDesc('');
            setNewProjectGithub('');
        } catch (err) {
            console.error('Failed to upload project:', err);
        } finally {
            setUploadingProject(false);
        }
    };

    const handleSubmitMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject?.id || submittingMilestone) return;
        setSubmittingMilestone(true);
        try {
            const currentDeliverables = selectedProject.deliverables || [];
            const newDeliverables = [...currentDeliverables];
            if (milestoneGithubUrl.trim() && !newDeliverables.some(d => d.includes(milestoneGithubUrl.trim()))) {
                newDeliverables.push(`GitHub Codebase: ${milestoneGithubUrl.trim()}`);
            }
            if (milestoneDemoUrl.trim() && !newDeliverables.some(d => d.includes(milestoneDemoUrl.trim()))) {
                newDeliverables.push(`Live Demo: ${milestoneDemoUrl.trim()}`);
            }
            if (milestoneNotes.trim() && !newDeliverables.some(d => d.includes(milestoneNotes.trim()))) {
                newDeliverables.push(`Milestone Progress: ${milestoneNotes.trim()}`);
            }

            await updateAcademicProject(selectedProject.id, {
                status: milestoneStatus,
                deliverables: newDeliverables,
            });
            setMilestoneSaved(true);
            setTimeout(() => {
                setMilestoneSaved(false);
                setSelectedProject(null);
                setMilestoneGithubUrl('');
                setMilestoneDemoUrl('');
                setMilestoneNotes('');
            }, 1200);
        } catch (err) {
            console.error('Failed to submit milestone:', err);
        } finally {
            setSubmittingMilestone(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Are you sure you want to remove this project?')) return;
        try {
            await deleteAcademicProject(id);
            if (selectedProject?.id === id) setSelectedProject(null);
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

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
                if (activeTab === 'ventures') {
                    const ventures = await getStartupVentures();
                    const ventureCards = convertVenturesToOpportunityCards(ventures);
                    const scored = ventureCards.map(j => matchOpportunityToSkills(j, userSkills, capabilities));
                    const sorted = scored.sort((a, b) => (b.match || 0) - (a.match || 0));
                    setOpportunities(sorted);
                    setLoadingJobs(false);
                    return;
                }

                const CACHE_KEY = `dashboard_jobs_v8_${dbUid!}_${activeTab}`;
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

                const userLocation = profile?.location || 'india';
                const jobs = await getAllOpportunities(userSkills, userLocation);
                
                // Restore job type filtering so the activeTab (Placements vs Internships) matters
                const typed = jobs.filter(j =>
                    jobType === 'internship'
                        ? j.type === 'internship' || j.title.toLowerCase().includes('intern')
                        : j.type !== 'internship' && !j.title.toLowerCase().includes('intern')
                );
                
                const scored = typed.map(j => matchOpportunityToSkills(j, userSkills, capabilities));
                
                // Sort all jobs strictly by match %
                const sortedAll = scored.sort((a, b) => (b.match || 0) - (a.match || 0));
                
                // Pin internal CapAble platform postings to the top, maintaining match% sort within each group
                const internalJobs = sortedAll.filter(j => j.isInternalPosting);
                const externalJobs = sortedAll.filter(j => !j.isInternalPosting);
                const finalSorted = [...internalJobs, ...externalJobs];
                
                setOpportunities(finalSorted);

                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    opportunities: finalSorted,
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

    // Real-time Firestore subscriptions for Academic Projects & 1-on-1 Mentor Sessions
    useEffect(() => {
        const unsubProjects = subscribeToAcademicProjects((projects) => {
            setAcademicProjects(projects);
        });
        const unsubSessions = subscribeToCandidateMentorSessions(
            dbUid || user?.uid || '',
            profile?.email || user?.email || '',
            (sessions) => {
                setMentorSessions(sessions);
            }
        );
        return () => {
            unsubProjects();
            unsubSessions();
        };
    }, [user, dbUid, profile]);

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
                        <span 
                            style={{ 
                                color: stateColors[job.matchState || 'SKILL-BUILDING'].text,
                                background: stateColors[job.matchState || 'SKILL-BUILDING'].bg,
                                cursor: 'help',
                                whiteSpace: 'pre-line'
                            }}
                            title={job.matchReason || `${job.match}% of required skills match your profile`}
                        >
                            <Target size={14} className="inline mr-1" />{job.match}% MATCH
                        </span>
                    )}
                </div>
                <div className="c-job-actions-premium">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="c-job-btn-text">
                        View <ExternalLink size={14} />
                    </a>
                    {activeTab === 'ventures' ? (
                        <button
                            onClick={() => navigate('/candidate/opportunities?tab=startups')}
                            className="c-job-btn-primary"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
                        >
                            <Rocket size={14} /> Connect / Pitch
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                const jd = `Job Title: ${job.title}\nCompany: ${job.company}\nDetails: ${job.description || job.tags.join(', ')}`;
                                navigate('/candidate/resume', { state: { jdText: jd } });
                            }}
                            className="c-job-btn-primary"
                        >
                            <Sparkles size={14} /> Tailor Resume
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="c-dash">
            <FloatingNavbar variant="candidate" />
            <LottieBackground animationPath="/employee-content.json" />

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
                                {greeting} <br/> 
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
                                projectCount={academicProjects.length}
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

                            {/* Startups & Ventures quick launcher */}
                            <Tooltip content="Discover early-stage campus ventures or pitch for co-founder roles" position="right" delay={0.5}>
                                <Link to="/candidate/opportunities?tab=startups" className="id-capsule-btn" style={{ borderColor: 'rgba(124, 58, 237, 0.25)', background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.8), rgba(237, 233, 254, 0.5))' }}>
                                    <span className="id-capsule-icon" style={{ color: '#7c3aed' }}><Rocket size={14} /></span>
                                    <span className="id-capsule-text" style={{ color: '#5b21b6', fontWeight: 600 }}>Startups & Ventures</span>
                                    <span className="id-capsule-action"><ChevronRight size={14} className="id-capsule-arrow" style={{ color: '#7c3aed' }} /></span>
                                </Link>
                            </Tooltip>
                        </div>

                        {/* ─── Founder Track / Entrepreneur Mode (Section 6) ─── */}
                        <div style={{ marginTop: '16px' }}>
                            <div
                                style={{
                                    background: founderMode
                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(99, 102, 241, 0.12))'
                                        : '#f8fafc',
                                    border: founderMode ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    transition: 'all 0.25s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Rocket size={18} color={founderMode ? '#7c3aed' : '#64748b'} />
                                        <div>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: founderMode ? '#5b21b6' : '#0f172a' }}>
                                                Founder & Venture Track
                                            </span>
                                            <span style={{
                                                marginLeft: '6px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                background: founderMode ? '#7c3aed' : '#cbd5e1',
                                                color: '#ffffff'
                                            }}>
                                                {founderMode ? 'ACTIVE' : 'OFF'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleFounderMode}
                                        style={{
                                            background: founderMode ? '#7c3aed' : '#ffffff',
                                            color: founderMode ? '#ffffff' : '#334155',
                                            border: '1px solid',
                                            borderColor: founderMode ? '#6d28d9' : '#cbd5e1',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {founderMode ? 'Switch to Jobs' : 'Enable Track'}
                                    </button>
                                </div>

                                {founderMode && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(124, 58, 237, 0.15)', paddingTop: '10px' }}>
                                        <div style={{ fontSize: '12px', color: '#6d28d9' }}>
                                            💡 <strong>Active Focus:</strong> Exploring campus ventures, finding co-founders, and pitching to E-Cell incubators.
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <Link
                                                to="/candidate/opportunities?tab=startups"
                                                style={{
                                                    padding: '8px',
                                                    background: '#ffffff',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                                    fontSize: '11.5px',
                                                    fontWeight: 600,
                                                    color: '#7c3aed',
                                                    textAlign: 'center',
                                                    textDecoration: 'none'
                                                }}
                                            >
                                                🚀 Venture Hub
                                            </Link>
                                            <Link
                                                to="/candidate/opportunities?tab=incubation"
                                                style={{
                                                    padding: '8px',
                                                    background: '#ffffff',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                                    fontSize: '11.5px',
                                                    fontWeight: 600,
                                                    color: '#7c3aed',
                                                    textAlign: 'center',
                                                    textDecoration: 'none'
                                                }}
                                            >
                                                🏛️ E-Cell Grants
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
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

                        {/* ─── Real 1-on-1 Mentorship Sessions ─── */}
                        <motion.div 
                            className="agency-outer" 
                            style={{ marginTop: '16px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="agency-inner id-capsule-matrix">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div className="id-matrix-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                        <Users size={12} color="#4f46e5" />
                                        <span>1-ON-1 MENTORSHIP SESSIONS</span>
                                    </div>
                                    <Link 
                                        to="/candidate/community?tab=mentors" 
                                        style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                        + Book New
                                    </Link>
                                </div>

                                {mentorSessions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {mentorSessions.slice(0, 3).map((session) => {
                                            const anySession = session as any;
                                            const mentorName = anySession.mentorName || 'Faculty / Alumni Mentor';
                                            const sessionTopic = anySession.topic || 'Career & Technical Mentorship';
                                            const meetLink = anySession.googleMeetUrl || anySession.meetUrl || anySession.meetLink;
                                            const sessionDate = anySession.date || anySession.sessionDate || 'Scheduled';
                                            const sessionTime = anySession.time || '';

                                            return (
                                                <div 
                                                    key={session.id} 
                                                    style={{ 
                                                        background: '#F8FAFC', 
                                                        border: '1px solid #E2E8F0', 
                                                        borderRadius: '10px', 
                                                        padding: '10px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                                                            {mentorName}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '10px', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '12px', 
                                                            fontWeight: 600,
                                                            background: '#ECFDF5', 
                                                            color: '#059669' 
                                                        }}>
                                                            Confirmed
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {sessionTopic}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#94A3B8' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={11} /> {sessionDate} {sessionTime}
                                                        </span>
                                                        {meetLink ? (
                                                            <a 
                                                                href={meetLink} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{ 
                                                                    display: 'inline-flex', 
                                                                    alignItems: 'center', 
                                                                    gap: '3px', 
                                                                    color: '#059669', 
                                                                    fontWeight: 700, 
                                                                    textDecoration: 'none' 
                                                                }}
                                                            >
                                                                <Video size={11} /> Join Google Meet
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#64748B' }}>Link confirmed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: '#F8FAFC', 
                                        border: '1px dashed #CBD5E1', 
                                        borderRadius: '10px', 
                                        padding: '12px', 
                                        textAlign: 'center' 
                                    }}>
                                        <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 8px 0' }}>
                                            No 1-on-1 sessions scheduled yet. Connect with verified alumni & faculty mentors.
                                        </p>
                                        <Link 
                                            to="/candidate/community?tab=mentors"
                                            style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '4px', 
                                                fontSize: '11px', 
                                                fontWeight: 600, 
                                                color: '#4F46E5', 
                                                textDecoration: 'none',
                                                background: '#EEF2FF',
                                                padding: '4px 10px',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            Book 1-on-1 Session →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* ─── Real Platform Mentors ─── */}
                        <motion.div 
                            className="agency-outer" 
                            style={{ marginTop: '16px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32 }}
                        >
                            <div className="agency-inner id-capsule-matrix">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div className="id-matrix-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                        <Users size={12} color="#4F46E5" />
                                        <span>REAL PLATFORM MENTORS</span>
                                    </div>
                                    <Link 
                                        to="/candidate/community?tab=mentors"
                                        style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                        All ({realMentorsList.length}) →
                                    </Link>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {realMentorsList.slice(0, 3).map((mentor) => (
                                        <Link
                                            key={mentor.uid}
                                            to={`/candidate/coding-profile/${mentor.uid}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: '#F8FAFC',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                padding: '8px 10px',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C7D2FE')}
                                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ 
                                                    width: '28px', 
                                                    height: '28px', 
                                                    borderRadius: '50%', 
                                                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
                                                    color: '#FFF', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: '11px', 
                                                    fontWeight: 700 
                                                }}>
                                                    {mentor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {mentor.name}
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                                                        {mentor.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight size={13} color="#94A3B8" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ─── Faculty Project Allocation Summary ─── */}
                        <motion.div 
                            className="agency-outer" 
                            style={{ marginTop: '16px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <div className="agency-inner id-capsule-matrix">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div className="id-matrix-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                        <FolderGit2 size={12} color="#059669" />
                                        <span>FACULTY PROJECT ALLOCATION</span>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('projects')}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '11px', color: '#059669', fontWeight: 600 }}
                                    >
                                        View ({academicProjects.length})
                                    </button>
                                </div>

                                {academicProjects.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {academicProjects.slice(0, 2).map((proj) => (
                                            <div 
                                                key={proj.id}
                                                style={{
                                                    background: '#F8FAFC',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '8px',
                                                    padding: '8px 10px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E293B', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {proj.title}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '9px', 
                                                        padding: '1px 5px', 
                                                        borderRadius: '8px', 
                                                        fontWeight: 600,
                                                        background: proj.status === 'In Progress' ? '#FEF3C7' : '#EFF6FF',
                                                        color: proj.status === 'In Progress' ? '#92400E' : '#1D4ED8'
                                                    }}>
                                                        {proj.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                                                    {proj.type} • Assigned: <strong style={{ color: '#334155' }}>{proj.assignedTo}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                                        No faculty projects allocated yet.
                                    </p>
                                )}
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
                            <button
                                className={`c-dash-tab ${activeTab === 'ventures' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ventures')}
                            >
                                {activeTab === 'ventures' && (
                                    <motion.div 
                                        layoutId="active-tab-indicator" 
                                        className="c-dash-tab-pill" 
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} 
                                    />
                                )}
                                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Rocket size={16} /> Startups & Ventures
                                </span>
                            </button>
                            <button
                                className={`c-dash-tab ${activeTab === 'projects' ? 'active' : ''}`}
                                onClick={() => setActiveTab('projects')}
                            >
                                {activeTab === 'projects' && (
                                    <motion.div 
                                        layoutId="active-tab-indicator" 
                                        className="c-dash-tab-pill" 
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} 
                                    />
                                )}
                                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FolderGit2 size={16} /> Faculty Projects ({academicProjects.length})
                                </span>
                            </button>
                        </div>

                        {/* Feed / Projects Content */}
                        {activeTab === 'projects' ? (
                            <div className="c-dash-feed-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <h2 className="c-dash-section-title" style={{ margin: 0 }}>
                                            {academicProjects.length} Faculty & Capstone Projects
                                        </h2>
                                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                                            Institutional capstone, semester, and research projects synchronized in real-time from the Faculty Dashboard.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '12px',
                                                color: '#FFFFFF',
                                                fontWeight: 600,
                                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                                padding: '7px 14px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                                            }}
                                        >
                                            <Plus size={15} /> Upload Real Project
                                        </button>
                                        <Link
                                            to="/candidate/community?tab=mentors"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '12px',
                                                color: '#4F46E5',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                background: '#EEF2FF',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #C7D2FE'
                                            }}
                                        >
                                            <Users size={14} /> Find Real Mentors →
                                        </Link>
                                    </div>
                                </div>

                                {academicProjects.length === 0 ? (
                                    <div className="c-dash-empty">
                                        <FolderGit2 size={24} />
                                        <p>No projects allocated by faculty yet.<br />
                                            Faculty members can create and allocate projects via the <Link to="/academician/mentorship">Faculty Mentorship Portal</Link>.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="c-job-grid">
                                        {academicProjects.map((project, i) => (
                                            <motion.div
                                                key={project.id}
                                                className="c-job-card-premium"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: i * 0.05 }}
                                            >
                                                <div className="c-job-header-premium">
                                                    <div className="c-job-logo-wrapper" style={{ background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FolderGit2 size={20} />
                                                    </div>
                                                    <div className="c-job-header-info">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <h3 className="c-job-title-premium">{project.title}</h3>
                                                            <span style={{ 
                                                                background: project.status === 'In Progress' ? '#FEF3C7' : project.status === 'Completed' ? '#DCFCE7' : '#DBEAFE', 
                                                                color: project.status === 'In Progress' ? '#92400E' : project.status === 'Completed' ? '#166534' : '#1E40AF', 
                                                                fontSize: '10px', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '10px', 
                                                                fontWeight: 600, 
                                                                whiteSpace: 'nowrap' 
                                                            }}>
                                                                {project.status}
                                                            </span>
                                                        </div>
                                                        <p className="c-job-company-premium" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                                                                {project.type}
                                                            </span>
                                                            <span>• Allocated by {project.allocatedBy || 'Faculty Mentor'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {project.description && (
                                                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '10px 0 12px 0' }}>
                                                        {project.description}
                                                    </p>
                                                )}

                                                <div className="c-job-details-premium" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                                                        <Users size={14} color="#64748B" />
                                                        <span>Assigned to: <strong>{project.assignedTo}</strong></span>
                                                    </div>
                                                    {project.deadline && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                                            <Calendar size={14} />
                                                            <span>Target Deadline: {project.deadline}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                                    <span style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                        <CheckCircle2 size={13} color="#16A34A" /> Live Synced with Faculty
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedProject(project);
                                                                setMilestoneStatus(project.status || 'In Progress');
                                                            }}
                                                            style={{
                                                                background: '#EEF2FF',
                                                                color: '#4F46E5',
                                                                border: '1px solid #C7D2FE',
                                                                borderRadius: '6px',
                                                                padding: '6px 14px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            View Details & Submit Progress →
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Job Feed */
                            <div className="c-dash-feed-section">
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
                        )}
                    </div>
                </div>
            </main>

            {/* ─── Upload Real Project Modal ─── */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            style={{
                                background: '#FFFFFF',
                                width: '100%',
                                maxWidth: '540px',
                                borderRadius: '16px',
                                padding: '28px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                border: '1px solid #E2E8F0',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: '#F1F5F9',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748B'
                                }}
                            >
                                <X size={16} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '10px', borderRadius: '10px' }}>
                                    <FolderGit2 size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                                        Upload Real Project
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                                        Publish your capstone, research, or engineering project to CapAble.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUploadProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                        Project Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Distributed Consensus Engine"
                                        value={newProjectTitle}
                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Project Type
                                        </label>
                                        <select
                                            value={newProjectType}
                                            onChange={(e) => setNewProjectType(e.target.value as any)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '13px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                background: '#FFF'
                                            }}
                                        >
                                            <option value="Capstone Project">Capstone Project</option>
                                            <option value="Semester Project">Semester Project</option>
                                            <option value="Research Project">Research Project</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Real Mentor / Faculty
                                        </label>
                                        <select
                                            value={newProjectMentor}
                                            onChange={(e) => setNewProjectMentor(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '13px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                background: '#FFF'
                                            }}
                                        >
                                            {realMentorsList.map((m) => (
                                                <option key={m.uid} value={m.name}>
                                                    {m.name} ({m.role.split('&')[0].trim()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                        GitHub Repository URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/username/project-repo"
                                        value={newProjectGithub}
                                        onChange={(e) => setNewProjectGithub(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                        Target Deadline
                                    </label>
                                    <input
                                        type="date"
                                        value={newProjectDeadline}
                                        onChange={(e) => setNewProjectDeadline(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                        Project Description & Objectives
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Describe the system architecture, real-world problem solved, key deliverables, and technologies used..."
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadModalOpen(false)}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#F1F5F9',
                                            color: '#475569',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploadingProject}
                                        style={{
                                            padding: '8px 18px',
                                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {uploadingProject ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                        {uploadingProject ? 'Uploading...' : 'Save & Allocate Project'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Project Details & Milestone Progress Submission Modal ─── */}
            <AnimatePresence>
                {selectedProject && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            style={{
                                background: '#FFFFFF',
                                width: '100%',
                                maxWidth: '580px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                borderRadius: '16px',
                                padding: '28px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                border: '1px solid #E2E8F0',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setSelectedProject(null)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: '#F1F5F9',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748B'
                                }}
                            >
                                <X size={16} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{
                                    background: selectedProject.status === 'In Progress' ? '#FEF3C7' : selectedProject.status === 'Completed' ? '#DCFCE7' : '#DBEAFE',
                                    color: selectedProject.status === 'In Progress' ? '#92400E' : selectedProject.status === 'Completed' ? '#166534' : '#1E40AF',
                                    fontSize: '11px',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontWeight: 700
                                }}>
                                    {selectedProject.status}
                                </span>
                                <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                                    {selectedProject.type}
                                </span>
                            </div>

                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '6px 0 10px 0' }}>
                                {selectedProject.title}
                            </h2>

                            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                                {selectedProject.description}
                            </p>

                            {/* Real Faculty Mentor Profile Link */}
                            <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                padding: '12px 14px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>FACULTY MENTOR</div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                        {selectedProject.allocatedBy || selectedProject.facultyName || 'Faculty Mentor'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#475569' }}>
                                        Assigned To: <strong>{selectedProject.assignedTo}</strong>
                                    </div>
                                </div>
                                {(() => {
                                    const mentorObj = realMentorsList.find(m => 
                                        m.name.toLowerCase() === (selectedProject.allocatedBy || selectedProject.facultyName || '').toLowerCase()
                                    ) || realMentorsList[0];
                                    return (
                                        <Link
                                            to={`/candidate/coding-profile/${mentorObj.uid}`}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                color: '#4F46E5',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                background: '#EEF2FF',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #C7D2FE'
                                            }}
                                        >
                                            <User size={13} /> View Mentor Profile →
                                        </Link>
                                    );
                                })()}
                            </div>

                            {/* Deliverables */}
                            {selectedProject.deliverables && selectedProject.deliverables.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                        Project Deliverables & Artifacts
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {selectedProject.deliverables.map((deliv, idx) => (
                                            <div key={idx} style={{
                                                fontSize: '12px',
                                                color: '#334155',
                                                background: '#F8FAFC',
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CheckCircle2 size={14} color="#16A34A" />
                                                <span>{deliv}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Milestone Progress Submission Form */}
                            <form onSubmit={handleSubmitMilestone} style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                padding: '16px',
                                marginTop: '16px'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={14} color="#4F46E5" /> Submit Real Milestone Progress
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Update Project Status
                                        </label>
                                        <select
                                            value={milestoneStatus}
                                            onChange={(e) => setMilestoneStatus(e.target.value as any)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '12px',
                                                outline: 'none',
                                                background: '#FFF'
                                            }}
                                        >
                                            <option value="In Progress">In Progress (Active Development)</option>
                                            <option value="Under Review">Under Review (Ready for Faculty Evaluation)</option>
                                            <option value="Completed">Completed (Verified Deliverables)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            GitHub Codebase / PR URL
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://github.com/username/project/pull/1"
                                            value={milestoneGithubUrl}
                                            onChange={(e) => setMilestoneGithubUrl(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '12px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Live Demo / Staging URL
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://your-project.vercel.app"
                                            value={milestoneDemoUrl}
                                            onChange={(e) => setMilestoneDemoUrl(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '12px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Progress Summary & Findings
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Summarize recent sprint deliverables, solved bottlenecks, and faculty recommendations..."
                                            value={milestoneNotes}
                                            onChange={(e) => setMilestoneNotes(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '12px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                        {selectedProject.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProject(selectedProject.id!)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#DC2626',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={13} /> Delete Project
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submittingMilestone}
                                            style={{
                                                padding: '8px 18px',
                                                background: milestoneSaved ? '#16A34A' : '#4F46E5',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {submittingMilestone ? <Loader2 size={13} className="animate-spin" /> : milestoneSaved ? <CheckCircle2 size={13} /> : <CheckCircle2 size={13} />}
                                            {submittingMilestone ? 'Saving...' : milestoneSaved ? 'Milestone Updated!' : 'Submit Milestone'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
