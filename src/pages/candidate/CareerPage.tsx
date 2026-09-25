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

export default function CareerPage() {
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
                const docRef = doc(db, 'users', dbUid, 'careerTarget');
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
                const docRef = doc(db, 'users', dbUid, 'careerTarget');
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
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)',
                position: 'relative',
            }}>
                <FloatingNavbar variant="candidate" />
                <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '480px' }}>
                    {/* Animated ring */}
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '3px solid #e0e7ff',
                        }} />
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: '#6366f1',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <div style={{
                            position: 'absolute', inset: '12px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={22} color="white" />
                        </div>
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b',
                        marginBottom: '0.75rem', lineHeight: 1.3,
                    }}>
                        {generating ? 'Plotting your career path…' : 'Loading your profile…'}
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        {generating
                            ? 'Our AI is analyzing your verified capabilities and identifying your best-fit career trajectories.'
                            : 'Fetching your verified capability data…'
                        }
                    </p>

                    {/* Animated progress dots */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#6366f1',
                                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                opacity: 0.3,
                            }} />
                        ))}
                    </div>


                </div>

                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
                `}</style>
            </div>
        );
    }

    if (targetRoles.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)',
            }}>
                <FloatingNavbar variant="candidate" />
                <div style={{
                    textAlign: 'center', maxWidth: '440px', background: 'white',
                    padding: '2.5rem 2rem', borderRadius: '20px',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.08)', border: '1px solid #e0e7ff',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                    }}>
                        <Sparkles size={28} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.5rem' }}>
                        Ready to chart your career?
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.75rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        We'll use AI to analyze your verified capabilities and map out your best-fit career trajectories.
                    </p>
                    <button
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                            fontWeight: 700, padding: '0.75rem 1.75rem', borderRadius: '12px',
                            border: 'none', cursor: 'pointer', fontSize: '0.95rem',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        }}
                        onClick={() => handleGenerateRoles(true)}
                    >
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
            <FloatingNavbar variant="candidate" />
            <div className="career-page-bg" />

            <main className="career-main">
                {/* Header */}
                <motion.div className="career-header-section" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="career-header-content">
                        <span className="career-badge"><Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }}/> AI Career Roadmap</span>
                        <h1 className="career-title">Chart your path to<br /><em>Professional Mastery.</em></h1>
                        <p className="career-sub">Discover curated career paths mapped exactly to your verified capabilities. Identify real gaps and follow a concrete timeline.</p>
                    </div>
                </motion.div>

                {/* Top Roles Carousel */}
                <motion.section className="career-carousel-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="career-carousel-header">
                        <h2>Personalized Trajectories for You</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                                onClick={() => handleGenerateRoles(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    padding: '7px 14px', fontSize: '13px', fontWeight: 700,
                                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                                }}
                            >
                                <Sparkles size={14} /> Regenerate
                            </button>
                            <div className="carousel-nav">
                                <button onClick={prevRole} className="carousel-btn"><ChevronLeft size={20} /></button>
                                <button onClick={nextRole} className="carousel-btn"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="career-carousel-container" style={{ overflow: 'hidden', padding: '8px 0' }}>
                        <div
                            className="career-carousel-track"
                            style={{
                                display: 'flex',
                                gap: '24px',
                                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: `translateX(calc(-${activeRoleIndex} * (300px + 24px)))`,
                                width: 'max-content',
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
                                const iconGradients = [
                                    'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    'linear-gradient(135deg,#0ea5e9,#6366f1)',
                                    'linear-gradient(135deg,#10b981,#0ea5e9)',
                                    'linear-gradient(135deg,#f59e0b,#ef4444)',
                                ];
                                const matchColor = dynamicMatch >= 70 ? '#10b981' : dynamicMatch >= 40 ? '#f59e0b' : '#ef4444';
                                const matchBg = dynamicMatch >= 70 ? 'rgba(16,185,129,0.1)' : dynamicMatch >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

                                return (
                                    <motion.div
                                        key={role.id || idx}
                                        onClick={() => setActiveRoleIndex(idx)}
                                        whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(0,0,0,0.1)' }}
                                        style={{
                                            width: '300px', flexShrink: 0,
                                            background: isActive ? 'linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)' : 'white',
                                            border: isActive ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            cursor: 'pointer',
                                            boxShadow: isActive
                                                ? '0 8px 24px rgba(99,102,241,0.15)'
                                                : '0 4px 6px rgba(0,0,0,0.02)',
                                            transition: 'all 0.3s ease',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {isActive && (
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                            }} />
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '14px',
                                                background: iconGradients[idx % iconGradients.length],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            }}>
                                                {[<Map size={22} color="white" />, <Target size={22} color="white" />, <TrendingUp size={22} color="white" />, <Compass size={22} color="white" />][idx % 4]}
                                            </div>
                                            <span style={{
                                                background: matchBg, color: matchColor,
                                                padding: '4px 10px', borderRadius: '20px',
                                                fontSize: '12px', fontWeight: 700,
                                            }}>
                                                {dynamicMatch}% Match
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', lineHeight: 1.3 }}>
                                            {role.role}
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {role.tags.map(tag => (
                                                <span key={tag} style={{
                                                    fontSize: '11px', padding: '3px 10px',
                                                    background: isActive ? '#e0e7ff' : '#f1f5f9',
                                                    color: isActive ? '#4338ca' : '#475569',
                                                    borderRadius: '20px', fontWeight: 600,
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dots indicator */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                        {targetRoles.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setActiveRoleIndex(idx)}
                                style={{
                                    width: idx === activeRoleIndex ? '24px' : '8px',
                                    height: '8px', borderRadius: '4px',
                                    background: idx === activeRoleIndex ? '#6366f1' : '#e2e8f0',
                                    cursor: 'pointer', transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                </motion.section>

                <div className="career-dashboard-layout">
                    {/* Left Column: Skill Gaps Dashboard */}
                    <AnimatePresence mode="wait">
                        <motion.div key={activeRole.id} className="career-dashboard-col" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <div>
                                        <h3>Capability Assessment</h3>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                            For: <strong style={{ color: '#6366f1' }}>{activeRole.role}</strong>
                                        </p>
                                    </div>
                                    <span className="gap-badge">{numGaps} Gap{numGaps !== 1 ? 's' : ''} Identified</span>
                                </div>

                                <div className="caps-grid">
                                    {calculatedGaps.map((cap, i) => (
                                        <motion.div
                                            key={cap.id}
                                            className="cap-grid-item"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + i * 0.05 }}
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

                {/* Bottom Action Center / Launchpad */}
                <motion.section 
                    className="career-action-center" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }}
                    style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}
                >
                    <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <FileText size={20} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Tailor Resume</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                            Automatically generate a resume perfectly aligned with the {activeRole.role} requirements.
                        </p>
                        <button 
                            onClick={() => {
                                const jd = `Target Role: ${activeRole.role}\nKey Requirements: ${activeRole.requirements.map(r => r.skill).join(', ')}`;
                                navigate('/candidate/resume', { state: { jdText: jd } });
                            }}
                            style={{ marginTop: 'auto', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseOut={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                            Start Tailoring
                        </button>
                    </div>

                    <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Video size={20} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Mock Interview</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                            Practice a realistic AI interview specifically designed for the {activeRole.role} position.
                        </p>
                        <button 
                            onClick={() => {
                                navigate('/candidate/interview', { state: { role: activeRole.role } });
                            }}
                            style={{ marginTop: 'auto', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseOut={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                            Start Practice
                        </button>
                    </div>
                    
                    <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Briefcase size={20} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Find Jobs</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                            Browse live job openings on CapAble that match this exact role profile.
                        </p>
                        <button 
                            onClick={() => {
                                navigate('/candidate/opportunities', { state: { search: activeRole.role } });
                            }}
                            style={{ marginTop: 'auto', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseOut={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                            Search Jobs
                        </button>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
