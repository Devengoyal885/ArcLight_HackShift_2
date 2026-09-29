import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { SkillGapIndicator } from '../../components/capability/SkillGapIndicator';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Map, Compass, TrendingUp, BookOpen, Sparkles, Loader2, Target, FileText, Video, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities } from '../../services/profileService';
import { generateTargetRoles } from '../../services/careerService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserCapability } from '../../services/profileService';
import type { TargetRole } from '../../services/careerService';
import './CareerPage.css';

const ICON_MAP = [
    <Map size={24} />,
    <Target size={24} />,
    <TrendingUp size={24} />,
    <Compass size={24} />
];

export default function CareerPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const navigate = useNavigate();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [started, setStarted] = useState(false);
    const [activeRoleIndex, setActiveRoleIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        getCapabilities(dbUid!).then(caps => {
            setCapabilities(caps);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    const handleGenerateRoles = async (forceRegenerate: boolean = false) => {
        if (!user || !dbUid) return;
        setGenerating(true);
        try {
            const CACHE_KEY = `career_roles_${dbUid}`;
            const currentCapsHash = capabilities.map(c => `${c.skill}:${c.score}`).sort().join('|');

            if (!forceRegenerate) {
                // 1. Check ultra-fast local storage first
                const cachedDataStr = localStorage.getItem(CACHE_KEY);
                if (cachedDataStr) {
                    try {
                        const cachedData = JSON.parse(cachedDataStr);
                        const isCapsChanged = cachedData.capsHash !== currentCapsHash;
                        if (!isCapsChanged && cachedData.roles && cachedData.roles.length > 0) {
                            setTargetRoles(cachedData.roles);
                            setActiveRoleIndex(0);
                            setGenerating(false);
                            return; // Use local cache
                        }
                    } catch (e) {
                        console.error("Failed to parse local cache", e);
                    }
                }

                // 2. Check persistent Firestore database if local storage is cleared
                const docRef = doc(db, 'users', dbUid, 'meta', 'careerTarget');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.capsHash === currentCapsHash && data.roles && data.roles.length > 0) {
                        setTargetRoles(data.roles);
                        setActiveRoleIndex(0);
                        setGenerating(false);
                        
                        // Hydrate local cache
                        localStorage.setItem(CACHE_KEY, JSON.stringify({
                            roles: data.roles,
                            timestamp: Date.now(),
                            capsHash: currentCapsHash
                        }));
                        return; // Use Firestore cache
                    }
                }
            }

            const headline = profile?.headline || 'Software Engineer';
            const roles = await generateTargetRoles(headline, capabilities);
            
            if (roles.length > 0) {
                setTargetRoles(roles);
                setActiveRoleIndex(0);
                
                // Save to ultra-fast local cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    roles,
                    timestamp: Date.now(),
                    capsHash: currentCapsHash
                }));

                // Save permanently to Firestore
                const docRef = doc(db, 'users', dbUid, 'meta', 'careerTarget');
                await setDoc(docRef, {
                    roles,
                    capsHash: currentCapsHash,
                    updatedAt: serverTimestamp()
                });
            } else {
                setTargetRoles([]);
            }
        } catch (err) {
            console.error('Failed to generate career paths', err);
        } finally {
            setGenerating(false);
        }
    };

    // Auto-generate roles once capabilities are loaded
    useEffect(() => {
        if (!loading && targetRoles.length === 0 && !generating) {
            handleGenerateRoles();
        }
    }, [loading]);

    const nextRole = () => setActiveRoleIndex(prev => (prev + 1) % targetRoles.length);
    const prevRole = () => setActiveRoleIndex(prev => (prev - 1 + targetRoles.length) % targetRoles.length);

    if (loading || generating) {
        return (
            <div className="career-loading-root">
                {!isEmbedded && <FloatingNavbar variant="candidate" />}
                <div className="career-loading-card">
                    <div className="career-loading-ring" />
                    <h2>{generating ? 'Plotting your career path…' : 'Loading your profile…'}</h2>
                    <p>
                        {generating
                            ? 'Analyzing your verified capabilities and identifying best-fit career trajectories.'
                            : 'Fetching your verified capability data…'
                        }
                    </p>
                    <div className="career-loading-dots">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="career-loading-dot" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (targetRoles.length === 0) {
        return (
            <div className="career-loading-root">
                {!isEmbedded && <FloatingNavbar variant="candidate" />}
                <div className="career-empty-card">
                    <div className="career-empty-icon">
                        <Sparkles size={24} />
                    </div>
                    <h2>Chart your career</h2>
                    <p>We'll use AI to analyze your verified capabilities and map out your best-fit career trajectories.</p>
                    <button className="career-empty-btn" onClick={() => handleGenerateRoles(true)}>
                        <Sparkles size={16} /> Generate Career Map
                    </button>
                </div>
            </div>
        );
    }

    const activeRole = targetRoles[activeRoleIndex];
    
    const calculatedGaps = activeRole.requirements.map(req => {
        // Find matching capability loosely
        const userCap = capabilities.find(c => c.skill.toLowerCase().includes(req.skill.toLowerCase()) || req.skill.toLowerCase().includes(c.skill.toLowerCase()));
        const current = userCap ? userCap.score : 0;
        let status: 'met' | 'gap' | 'missing' = 'missing';
        if (current >= req.required) status = 'met';
        else if (current > 0) status = 'gap';
        
        return {
            id: req.skill,
            label: req.skill,
            current,
            required: req.required,
            status
        };
    });

    const numGaps = calculatedGaps.filter(g => g.status !== 'met').length;

    return (
        <div className="career-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="career-page-bg" />}

            <main className="career-main">
                {/* Header — asymmetric split layout */}
                <motion.div
                    className="career-header-section"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="career-header-content">
                        <span className="career-badge">
                            <Sparkles size={12} /> AI Career Roadmap
                        </span>
                        <h1 className="career-title">Chart your path to<br /><em>Professional Mastery.</em></h1>
                        <p className="career-sub">Curated career paths mapped to your verified capabilities. Identify real gaps and follow a concrete timeline.</p>
                    </div>

                    {/* Header stat strip — apple glass material */}
                    <div className="career-header-stat-strip">
                        <div className="career-stat-item">
                            <div className="career-stat-icon" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                                <Target size={18} />
                            </div>
                            <div className="career-stat-text">
                                <span className="career-stat-label">Role Matches</span>
                                <span className="career-stat-value">{targetRoles.length} Paths</span>
                            </div>
                        </div>
                        <div className="career-stat-item">
                            <div className="career-stat-icon" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                                <TrendingUp size={18} />
                            </div>
                            <div className="career-stat-text">
                                <span className="career-stat-label">Skill Gaps</span>
                                <span className="career-stat-value">{numGaps} to close</span>
                            </div>
                        </div>
                        <div className="career-stat-item">
                            <div className="career-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                <Compass size={18} />
                            </div>
                            <div className="career-stat-text">
                                <span className="career-stat-label">Capabilities</span>
                                <span className="career-stat-value">{capabilities.length} verified</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Top Roles Carousel */}
                <motion.section className="career-carousel-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
                    <div className="career-carousel-header">
                        <div>
                            <p className="career-section-eyebrow">Personalized for you</p>
                            <h2>Career Trajectories</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                className="career-regen-btn"
                                onClick={() => handleGenerateRoles(true)}
                            >
                                <Sparkles size={14} /> Regenerate
                            </button>
                            <div className="carousel-nav">
                                <button onClick={prevRole} className="carousel-btn"><ChevronLeft size={18} /></button>
                                <button onClick={nextRole} className="carousel-btn"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="career-carousel-container">
                        <div
                            className="career-carousel-track"
                            style={{
                                transform: `translateX(calc(-${activeRoleIndex} * (280px + 16px)))`,
                            }}
                        >
                            {targetRoles.map((role, idx) => {
                                const matchNum = role.requirements.filter(req => {
                                    const uCap = capabilities.find(c =>
                                        c.skill.toLowerCase().includes(req.skill.toLowerCase()) ||
                                        req.skill.toLowerCase().includes(c.skill.toLowerCase())
                                    );
                                    return uCap && uCap.score >= req.required;
                                }).length;
                                const dynamicMatch = role.requirements.length > 0
                                    ? Math.round((matchNum / role.requirements.length) * 100)
                                    : 0;

                                const isActive = idx === activeRoleIndex;
                                const iconBgs = [
                                    { bg: '#18181B', color: 'white' },
                                    { bg: '#1d4ed8', color: 'white' },
                                    { bg: '#047857', color: 'white' },
                                    { bg: '#b45309', color: 'white' },
                                ];
                                const matchColor = dynamicMatch >= 70 ? '#10b981' : dynamicMatch >= 40 ? '#f59e0b' : '#ef4444';
                                const matchBg = dynamicMatch >= 70 ? 'rgba(16,185,129,0.08)' : dynamicMatch >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
                                const matchBorder = dynamicMatch >= 70 ? 'rgba(16,185,129,0.2)' : dynamicMatch >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';

                                return (
                                    <motion.div
                                        key={role.id || idx}
                                        onClick={() => setActiveRoleIndex(idx)}
                                        className={`career-role-card${isActive ? ' active' : ''}`}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                                    >
                                        <div className="role-card-header">
                                            <div
                                                className="role-card-icon"
                                                style={{ background: iconBgs[idx % iconBgs.length].bg }}
                                            >
                                                {[<Map size={20} color="white" />, <Target size={20} color="white" />, <TrendingUp size={20} color="white" />, <Compass size={20} color="white" />][idx % 4]}
                                            </div>
                                            <span
                                                className="role-match-badge"
                                                style={{ background: matchBg, color: matchColor, border: `1px solid ${matchBorder}` }}
                                            >
                                                {dynamicMatch}% Match
                                            </span>
                                        </div>
                                        <h3 className="role-card-title">{role.role}</h3>
                                        <div className="role-tags">
                                            {role.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="role-tag"
                                                    style={{
                                                        background: isActive ? 'rgba(37,99,235,0.08)' : '#F4F4F5',
                                                        color: isActive ? '#2563eb' : '#52525b',
                                                        border: isActive ? '1px solid rgba(37,99,235,0.14)' : '1px solid transparent',
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="career-carousel-dots">
                        {targetRoles.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setActiveRoleIndex(idx)}
                                className={`career-carousel-dot${idx === activeRoleIndex ? ' active' : ''}`}
                                style={{ width: idx === activeRoleIndex ? '24px' : '8px', cursor: 'pointer' }}
                            />
                        ))}
                    </div>
                </motion.section>

                <div className="career-dashboard-layout">
                    {/* Left Column: Skill Gaps Dashboard */}
                    <AnimatePresence mode="wait">
                        <motion.div key={activeRole.id} className="career-dashboard-col" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <div>
                                        <h3>Capability Assessment</h3>
                                        <p className="panel-sub">For: <strong style={{ color: '#2563eb' }}>{activeRole.role}</strong></p>
                                    </div>
                                    <span className="gap-badge">{numGaps} Gap{numGaps !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="caps-grid">
                                    {calculatedGaps.map((cap, i) => (
                                        <motion.div
                                            key={cap.id}
                                            className="cap-grid-item"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.08 + i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                                        >
                                            <SkillGapIndicator
                                                label={cap.label}
                                                current={cap.current}
                                                required={cap.required}
                                                status={cap.status}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Right Column: Interactive Timeline */}
                    <AnimatePresence mode="wait">
                        <motion.div key={activeRole.id + '-timeline'} className="career-timeline-col" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                            <div className="dashboard-panel timeline-panel">
                                <div className="panel-header">
                                    <div>
                                        <h3>Transition Roadmap</h3>
                                        <p className="panel-sub">Path to {activeRole.role}</p>
                                    </div>
                                    <div style={{
                                        background: '#f0f4ff', borderRadius: '8px', padding: '6px 10px',
                                        fontSize: '12px', color: '#6366f1', fontWeight: 700,
                                    }}>
                                        {calculatedGaps.filter(g => g.status !== 'met').length} Steps
                                    </div>
                                </div>

                                <div className="interactive-timeline">
                                    {calculatedGaps.filter(g => g.status !== 'met').map((gap, i, arr) => (
                                        <motion.div
                                            key={gap.label}
                                            className="timeline-item"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                            whileHover={{ x: -4 }}
                                        >
                                            <div className="timeline-connector">
                                                <div className={`timeline-dot type-${gap.status === 'gap' ? 'project' : 'learn'}`} />
                                                {i !== arr.length - 1 && <div className="timeline-line" />}
                                            </div>

                                            <div className="timeline-content">
                                                <div className="timeline-step-header">
                                                    <span className={`timeline-type-badge type-${gap.status === 'gap' ? 'project' : 'learn'}`}>
                                                        <BookOpen size={12} />
                                                        {gap.status === 'gap' ? 'IMPROVE' : 'LEARN'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        {gap.current}% → {gap.required}%
                                                    </span>
                                                </div>
                                                <h4 className="timeline-step-title">Master {gap.label}</h4>
                                                <p className="timeline-step-desc">
                                                    {gap.status === 'gap'
                                                        ? `Boost from ${gap.current}% to ${gap.required}% to meet the requirement.`
                                                        : `Start from scratch — this role needs ${gap.required}% proficiency.`}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {calculatedGaps.filter(g => g.status !== 'met').length === 0 && (
                                        <div className="timeline-empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                margin: '0 auto 12px',
                                            }}>
                                                <Sparkles size={26} color="white" />
                                            </div>
                                            <h4 style={{ fontWeight: 700, color: '#0f172a' }}>You are fully qualified!</h4>
                                            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Your capabilities meet all requirements. Start applying now.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="timeline-actions">
                                    {numGaps > 0 ? (
                                        <Link to="/candidate/learning" className="btn-primary-launch" style={{ textDecoration: 'none' }}>
                                            <BookOpen size={16} /> Generate AI Learning Path <ArrowRight size={16} />
                                        </Link>
                                    ) : (
                                        <Link to="/candidate/opportunities" className="btn-primary-launch" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)', textDecoration: 'none' }}>
                                            View Matching Opportunities <ArrowRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom Action Center — Bento 2x2 grid */}
                <motion.section
                    className="career-action-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="career-action-tile">
                        <div className="career-action-icon" style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                            <FileText size={20} />
                        </div>
                        <h4 className="career-action-title">Tailor Resume</h4>
                        <p className="career-action-desc">
                            Generate a resume perfectly aligned with the {activeRole.role} requirements.
                        </p>
                        <button
                            className="career-action-btn"
                            onClick={() => {
                                const jd = `Target Role: ${activeRole.role}\nKey Requirements: ${activeRole.requirements.map(r => r.skill).join(', ')}`;
                                navigate('/candidate/resume', { state: { jdText: jd } });
                            }}
                        >
                            Start tailoring
                        </button>
                    </div>

                    <div className="career-action-tile">
                        <div className="career-action-icon" style={{ background: 'rgba(2,132,199,0.08)', color: '#0284c7' }}>
                            <Video size={20} />
                        </div>
                        <h4 className="career-action-title">Mock Interview</h4>
                        <p className="career-action-desc">
                            Practice a realistic AI interview designed for the {activeRole.role} position.
                        </p>
                        <button
                            className="career-action-btn"
                            onClick={() => navigate('/candidate/interview', { state: { role: activeRole.role } })}
                        >
                            Start practice
                        </button>
                    </div>

                    <div className="career-action-tile">
                        <div className="career-action-icon" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                            <Briefcase size={20} />
                        </div>
                        <h4 className="career-action-title">Find Jobs</h4>
                        <p className="career-action-desc">
                            Browse live openings that match this exact role profile.
                        </p>
                        <button
                            className="career-action-btn"
                            onClick={() => navigate('/candidate/opportunities', { state: { search: activeRole.role } })}
                        >
                            Search jobs
                        </button>
                    </div>

                    <div className="career-action-tile">
                        <div className="career-action-icon" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <h4 className="career-action-title">Find a Mentor</h4>
                        <p className="career-action-desc">
                            Connect with professionals working as a {activeRole.role}.
                        </p>
                        <button
                            className="career-action-btn"
                            onClick={() => alert(`Matchmaking initialized for ${activeRole.role} mentors.`)}
                        >
                            Match with mentor
                        </button>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
