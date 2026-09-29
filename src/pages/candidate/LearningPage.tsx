import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink, Loader2, Sparkles, AlertCircle, CheckCircle2, MessageSquare, Target, Bookmark, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, type LearningResource } from '../../services/profileService';
import { generateLearningPath } from '../../services/learningService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserCapability } from '../../services/profileService';
import './LearningPage.css';

export default function LearningPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [careerTargetRole, setCareerTargetRole] = useState<string>('');
    const [careerMissingSkills, setCareerMissingSkills] = useState<string[]>([]);
    const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
    const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !dbUid) return;
        getCapabilities(dbUid).then(caps => {
            setCapabilities(caps);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    // Load career target from Firestore to get real missing skills
    useEffect(() => {
        if (!user || !dbUid) return;
        const CACHE_KEY = `career_roles_${dbUid}`;
        
        // Try local storage first for speed
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const roles = data.roles;
                if (roles?.length > 0) {
                    setCareerTargetRole(roles[0].role);
                    // Missing skills = skills required by target role that user doesn't have at 60+
                    const missing = roles[0].requirements
                        ?.filter((req: any) => {
                            const userCap = (data.caps || []).find((c: any) => 
                                c.skill?.toLowerCase().includes(req.skill?.toLowerCase())
                            );
                            return !userCap || userCap.score < 60;
                        })
                        .map((r: any) => r.skill) || [];
                    setCareerMissingSkills(missing);
                    return;
                }
            } catch { /* noop */ }
        }
        
        // Fallback: Firestore
        getDoc(doc(db, 'users', dbUid, 'meta', 'careerTarget'))
            .then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    const roles = data.roles;
                    if (roles?.length > 0) {
                        setCareerTargetRole(roles[0].role);
                        setCareerMissingSkills(roles[0].requirements?.map((r: any) => r.skill) || []);
                    }
                }
            })
            .catch(console.error);
    }, [user, dbUid]);

    const handleGenerate = async (forceRegenerate: boolean = false) => {
        if (!user) return;
        setGenerating(true);
        setError(null);
        try {
            const CACHE_KEY = `learning_path_${dbUid!}`;
            const currentCapsHash = capabilities.map(c => `${c.skill}:${c.score}`).sort().join('|');

            if (!forceRegenerate) {
                const cachedDataStr = localStorage.getItem(CACHE_KEY);
                if (cachedDataStr) {
                    try {
                        const cachedData = JSON.parse(cachedDataStr);
                        const isCapsChanged = cachedData.capsHash !== currentCapsHash;
                        if (!isCapsChanged && cachedData.resources && cachedData.resources.length > 0) {
                            setResources(cachedData.resources);
                            setGenerating(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse cache", e);
                    }
                }
            }

            // Use career target role and real missing skills if available
            const targetRole = careerTargetRole || profile?.headline || 'Software Engineer';
            const path = await generateLearningPath(targetRole, capabilities, careerMissingSkills);
            setResources(path);
            
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                resources: path,
                timestamp: Date.now(),
                capsHash: currentCapsHash
            }));
        } catch (err: any) {
            console.error('Failed to generate learning path', err);
            setError(err.message || 'Failed to generate path. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // If capabilities just loaded and no resources exist, auto-generate
    useEffect(() => {
        if (!loading && resources.length === 0 && !generating) {
            handleGenerate();
        }
    }, [loading]);

    const formatMinutes = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'beginner': return '#10b981'; // Green
            case 'advanced': return '#ef4444'; // Red
            case 'intermediate':
            default: return '#f59e0b'; // Amber
        }
    };

    return (
        <div className="learn-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="learn-bg" />}

            <main className="learn-main">
                {/* ── Gamified Soft Skills Arena Banner ── */}
                <motion.div 
                    className="learn-softskills-arena"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="lsa-icon-bg">
                        <MessageSquare size={48} color="#f43f5e" strokeWidth={1.5} />
                    </div>
                    <div className="lsa-content">
                        <div className="lsa-badge">NEW MODULE</div>
                        <h2>Soft Skills & Communication</h2>
                        <p>Master conflict resolution, empathy, and client communication through interactive, scenario-based challenges.</p>
                        <div className="lsa-stats">
                            <div className="lsa-stat"><Target size={14} color="#f43f5e" /> 15 Scenarios</div>
                            <div className="lsa-stat"><Sparkles size={14} color="#f59e0b" /> AI Graded</div>
                        </div>
                    </div>
                    <div className="lsa-action">
                        <Link to="/candidate/preparation?tab=assessments" className="lsa-btn">
                            Enter the Arena
                        </Link>
                    </div>
                </motion.div>

                <motion.div className="learn-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="learn-eyebrow">
                        <Sparkles size={14} className="inline-icon" /> AI-GENERATED LEARNING
                    </p>
                    <h1 className="learn-title">Close the gap.<br />Don't restart<br /><em>your journey.</em></h1>
                    <p className="learn-sub">
                        Real courses tailored exactly to your verified skill gaps. No generic content. Focus on what gets you hired.
                    </p>
                    {careerTargetRole && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: '100px', padding: '6px 14px', marginTop: '12px',
                            fontSize: '13px', color: '#6366f1', fontWeight: 600,
                        }}>
                            <Target size={13} /> Targeting: {careerTargetRole}
                            {careerMissingSkills.length > 0 && (
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                    · {careerMissingSkills.length} skill gap{careerMissingSkills.length !== 1 ? 's' : ''} to close
                                </span>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Loading / Empty States */}
                {loading || generating ? (
                    <div className="learn-state-container">
                        <Loader2 size={32} className="spin text-blue" />
                        <h3>{generating ? 'Analyzing profile & finding resources...' : 'Loading capabilities...'}</h3>
                    </div>
                ) : error ? (
                    <div className="learn-state-container">
                        <AlertCircle size={32} className="text-red-500" />
                        <h3 className="text-red-600">Generation Failed</h3>
                        <p className="text-red-500">Network Error. Please try again later.</p>
                        <button className="learn-generate-btn mt-4" onClick={() => handleGenerate(true)}>
                            Try Again <Sparkles size={14} />
                        </button>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="learn-state-container">
                        <AlertCircle size={32} className="text-gray" />
                        <h3>Ready to map your path</h3>
                        <p>We'll analyze your current capability scores and generate a tailored list of real resources.</p>
                        <button className="learn-generate-btn" onClick={() => handleGenerate(true)}>
                            Generate Path <Sparkles size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end mb-4 pr-4">
                             <button onClick={() => handleGenerate(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                <Sparkles size={14} /> Regenerate Path
                            </button>
                        </div>
                        <div className="learn-list">
                            {resources.map((res, i) => (
                                <motion.div
                                    key={res.resourceTitle + i}
                                    className="learn-card"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <div className="learn-card-top">
                                        <div className="learn-provider">{res.provider}</div>
                                        <div className="learn-meta-pills">
                                            <span className="learn-pill difficulty" style={{ color: getDifficultyColor(res.difficulty), borderColor: getDifficultyColor(res.difficulty) + '40', background: getDifficultyColor(res.difficulty) + '10' }}>
                                                {res.difficulty}
                                            </span>
                                            <span className="learn-pill time">⏱ {formatMinutes(res.estimatedMinutes)}</span>
                                        </div>
                                    </div>

                                    <h3 className="learn-card-title">{res.resourceTitle}</h3>
                                    
                                    <div className="learn-card-skill">
                                        <BookOpen size={14} /> Focus: <strong>{res.skill}</strong>
                                    </div>

                                    {completedCourses.has(res.resourceTitle) ? (
                                        <div style={{ marginTop: '16px', background: '#ecfdf5', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '14px', fontWeight: 600 }}>
                                                <CheckCircle2 size={16} /> Completed
                                            </div>
                                            <div style={{ background: '#d1fae5', height: '6px', borderRadius: '3px', marginTop: '8px' }}>
                                                <div style={{ width: '100%', background: '#059669', height: '100%', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '16px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>
                                                <span>Progress</span>
                                                <span>0%</span>
                                            </div>
                                            <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                                                <div style={{ width: '0%', background: '#3b82f6', height: '100%', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="learn-card-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="learn-action-btn primary" style={{ flex: 1, minWidth: '120px' }}>
                                            Start Learning <ExternalLink size={14} />
                                        </a>
                                        <button
                                            className="learn-action-btn"
                                            style={{ background: completedCourses.has(res.resourceTitle) ? '#10b981' : '#f1f5f9', color: completedCourses.has(res.resourceTitle) ? '#fff' : '#64748b', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => {
                                                const newCompleted = new Set(completedCourses);
                                                if (newCompleted.has(res.resourceTitle)) newCompleted.delete(res.resourceTitle);
                                                else newCompleted.add(res.resourceTitle);
                                                setCompletedCourses(newCompleted);
                                            }}
                                        >
                                            <CheckCircle2 size={14} /> {completedCourses.has(res.resourceTitle) ? 'Done' : 'Mark'}
                                        </button>
                                        <button
                                            className="learn-action-btn"
                                            style={{ background: savedCourses.has(res.resourceTitle) ? '#f59e0b' : '#f1f5f9', color: savedCourses.has(res.resourceTitle) ? '#fff' : '#64748b', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => {
                                                const newSaved = new Set(savedCourses);
                                                if (newSaved.has(res.resourceTitle)) newSaved.delete(res.resourceTitle);
                                                else newSaved.add(res.resourceTitle);
                                                setSavedCourses(newSaved);
                                            }}
                                        >
                                            <Bookmark size={14} /> {savedCourses.has(res.resourceTitle) ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        <div className="learn-cta-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button className="learn-cta-secondary" onClick={() => handleGenerate(true)}>
                                <Sparkles size={14} /> Regenerate Path
                            </button>
                            <button className="learn-cta-secondary" style={{ background: '#f8fafc', color: '#0f172a' }}>
                                <Upload size={14} /> Import Certificates
                            </button>
                            <Link to="/candidate/opportunities" className="learn-cta-btn">
                                Check Opportunity Radar <ArrowRight size={14} />
                            </Link>
                        </div>
                    </>
                )}

                <div className="learn-product-loop">
                    {['ASSESSMENTS', 'AI ANALYSIS', 'VERIFIED GAP', 'REAL RESOURCES'].map((s, i, arr) => (
                        <span key={s} className="learn-loop-item">
                            <span>{s}</span>
                            {i < arr.length - 1 && <span className="learn-loop-arr">→</span>}
                        </span>
                    ))}
                </div>
            </main>
        </div>
    );
}
