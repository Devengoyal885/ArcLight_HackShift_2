/**
 * AssessmentPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Four-state assessment experience:
 *   overview   → Pre-config → Active quiz → Results
 *
 * All data flows through assessmentService.ts (Promise-based, backend-ready).
 * Completing an assessment updates assessmentStore, which propagates to every
 * other dashboard tab automatically.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCandidateApplications, submitScheduledAssessment, type RoleApplication } from '../../services/employerService';
import {
    generateQuestions,
    createSession,
    evaluateSession,
    submitAssessmentResult,
    buildDomainProfiles,
    getSkillGapAnalysis,
    AVAILABLE_ROLES,
    type SkillGapAnalysis,
} from '../../services/assessmentService';
import type {
    DomainProfile,
    AssessmentSession,
    AssessmentResult,
    QuestionAnswer,
    AssessmentDomain,
    CodingProblem,
    TestResult,
    SupportedLanguage,
} from '../../types/domain';
import { generateProblems } from '../../services/problemService';
import CodingIDE from './CodingIDE';


import {
    BrainCircuit, Code2, Lightbulb, Container, Network,
    LayoutDashboard, Database, ChevronRight, ChevronLeft,
    Timer, CheckCircle, XCircle, AlertCircle, Trophy,
    Target, TrendingUp, BookOpen, Play, SkipForward, ArrowRight,
    RefreshCcw, BarChart3, Clock, Zap, MessageSquare,
} from 'lucide-react';
import './AssessmentPage.css';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
    BrainCircuit:    <BrainCircuit  size={22} />,
    Code2:           <Code2         size={22} />,
    Lightbulb:       <Lightbulb     size={22} />,
    Container:       <Container     size={22} />,
    Network:         <Network       size={22} />,
    LayoutDashboard: <LayoutDashboard size={22} />,
    Database:        <Database      size={22} />,
    MessageSquare:   <MessageSquare size={22} />,
};

type PageState = 'overview' | 'config' | 'quiz' | 'coding' | 'results';

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface DomainCardProps {
    profile: DomainProfile;
    onClick: (domain: AssessmentDomain) => void;
    gapStatus?: 'met' | 'gap' | 'critical' | 'unassessed';
}

function DomainCard({ profile, onClick, gapStatus }: DomainCardProps) {
    const statusLabel: Record<DomainProfile['status'], string> = {
        unassessed: 'Not taken',
        assessed:   'Assessed',
        gap:        'Needs work',
        proficient: 'Proficient',
    };

    return (
        <motion.button
            className={`asmt-domain-card asmt-domain-card--${profile.status}`}
            onClick={() => onClick(profile.domain)}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ '--accent': profile.color } as React.CSSProperties}
        >
            <div className="asmt-domain-icon" style={{ color: profile.color }}>
                {DOMAIN_ICONS[profile.icon]}
            </div>

            <div className="asmt-domain-body">
                <p className="asmt-domain-label">{profile.label}</p>
                <p className="asmt-domain-desc">{profile.description.slice(0, 80)}…</p>

                <div className="asmt-domain-meta">
                    <span className={`asmt-domain-status asmt-domain-status--${profile.status}`}>
                        {statusLabel[profile.status]}
                    </span>
                    {profile.assessmentCount > 0 && (
                        <span className="asmt-domain-count">{profile.assessmentCount}× taken</span>
                    )}
                    {gapStatus === 'critical' && (
                        <span className="asmt-gap-badge asmt-gap-badge--critical">
                            <AlertCircle size={11} /> Gap
                        </span>
                    )}
                    {gapStatus === 'gap' && (
                        <span className="asmt-gap-badge asmt-gap-badge--gap">
                            <TrendingUp size={11} /> Improve
                        </span>
                    )}
                </div>
            </div>

            {profile.currentScore > 0 && (
                <div className="asmt-domain-score">
                    <svg viewBox="0 0 52 52" className="asmt-score-ring">
                        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(226, 232, 240, 0.6)" strokeWidth="4" />
                        <circle
                            cx="26" cy="26" r="22" fill="none"
                            stroke={profile.color} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - profile.currentScore / 100)}`}
                            transform="rotate(-90 26 26)"
                        />
                    </svg>
                    <span className="asmt-score-pct" style={{ color: profile.color }}>
                        {profile.currentScore}%
                    </span>
                </div>
            )}

            <div className="asmt-domain-arrow"><ChevronRight size={18} /></div>
        </motion.button>
    );
}

// ─── Overview Page ────────────────────────────────────────────────────────────

interface OverviewProps {
    profiles: DomainProfile[];
    gapAnalysis: SkillGapAnalysis | null;
    selectedRole: string;
    onRoleChange: (role: string) => void;
    onSelectDomain: (domain: AssessmentDomain) => void;
    pendingOAs: RoleApplication[];
    onStartOA: (oa: RoleApplication) => void;
}

function OverviewView({ profiles, gapAnalysis, selectedRole, onRoleChange, onSelectDomain, pendingOAs, onStartOA }: OverviewProps) {
    const assessed = profiles.filter(p => p.status !== 'unassessed');
    const totalScore = assessed.length > 0
        ? Math.round(assessed.reduce((s, p) => s + p.currentScore, 0) / assessed.length)
        : 0;

    return (
        <div className="asmt-overview">
            {/* Header */}
            <motion.div className="asmt-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="asmt-eyebrow">SKILL ASSESSMENTS</p>
                <h1 className="asmt-title">Know exactly where you stand.</h1>
                <p className="asmt-subtitle">
                    7 domains. 15 questions each. Scores feed your Capability Twin, Career Gaps, and Learning Path in real-time.
                </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
                className="asmt-stats-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="asmt-stat-card">
                    <BarChart3 size={18} className="asmt-stat-icon" />
                    <div>
                        <p className="asmt-stat-value">{assessed.length}<span>/7</span></p>
                        <p className="asmt-stat-label">Domains assessed</p>
                    </div>
                </div>
                <div className="asmt-stat-card">
                    <Trophy size={18} className="asmt-stat-icon asmt-stat-icon--gold" />
                    <div>
                        <p className="asmt-stat-value">{totalScore || '—'}{totalScore ? '%' : ''}</p>
                        <p className="asmt-stat-label">Average score</p>
                    </div>
                </div>
                <div className="asmt-stat-card">
                    <Target size={18} className="asmt-stat-icon asmt-stat-icon--red" />
                    <div>
                        <p className="asmt-stat-value">{gapAnalysis?.gaps.filter(g => g.status !== 'met').length ?? '—'}</p>
                        <p className="asmt-stat-label">Active gaps</p>
                    </div>
                </div>
                <div className="asmt-stat-card">
                    <Zap size={18} className="asmt-stat-icon asmt-stat-icon--green" />
                    <div>
                        <p className="asmt-stat-value">{gapAnalysis?.overallReadiness ?? '—'}{gapAnalysis ? '%' : ''}</p>
                        <p className="asmt-stat-label">Role readiness</p>
                    </div>
                </div>
            </motion.div>

            {/* Role selector */}
            <motion.div
                className="asmt-role-selector"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                <span className="asmt-role-label">Optimise for role:</span>
                <div className="asmt-role-tabs">
                    {AVAILABLE_ROLES.map(r => (
                        <button
                            key={r.slug}
                            className={`asmt-role-tab ${selectedRole === r.slug ? 'asmt-role-tab--active' : ''}`}
                            onClick={() => onRoleChange(r.slug)}
                            style={{ position: 'relative' }}
                        >
                            <span style={{ position: 'relative', zIndex: 1 }}>{r.label}</span>
                            {selectedRole === r.slug && (
                                <motion.div
                                    layoutId="role-tab-indicator"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: '#ffffff',
                                        borderRadius: '99px',
                                        zIndex: 0,
                                        boxShadow: '0 2px 8px -2px rgba(37, 99, 235, 0.15)'
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Pending Employer OAs */}
            {pendingOAs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="asmt-pending-oa-strip"
                    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Timer size={20} color="#38bdf8" />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Action Required: Employer Assessments</h3>
                    </div>
                    {pendingOAs.map(oa => (
                        <div key={oa.id} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{oa.companyName}</h4>
                                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Requested a <strong>{oa.scheduledAssessment?.type === 'ai_interview' ? 'AI Interview' : 'Coding Assessment'}</strong> for the <strong>{oa.roleTitle}</strong> role.</p>
                            </div>
                            <button 
                                onClick={() => onStartOA(oa)}
                                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Play size={14} /> Start Assessment
                            </button>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Skill Gap Analysis Strip */}
            {gapAnalysis && gapAnalysis.gaps.length > 0 && (
                <motion.div
                    className="asmt-gap-strip"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="asmt-gap-strip-header">
                        <AlertCircle size={15} />
                        <span>Skill Gap Analysis — {AVAILABLE_ROLES.find(r => r.slug === selectedRole)?.label}</span>
                        <span className="asmt-gap-readiness">{gapAnalysis.overallReadiness}% ready</span>
                    </div>
                    <div className="asmt-gap-bars">
                        {gapAnalysis.gaps.map(g => (
                            <div key={g.domain} className="asmt-gap-bar-row">
                                <span className="asmt-gap-bar-label">{g.label}</span>
                                <div className="asmt-gap-bar-track">
                                    <div
                                        className={`asmt-gap-bar-fill asmt-gap-bar-fill--${g.status}`}
                                        style={{ width: `${g.currentScore || 5}%` }}
                                    />
                                    <div
                                        className="asmt-gap-bar-target"
                                        style={{ left: `${g.requiredScore}%` }}
                                        title={`Required: ${g.requiredScore}%`}
                                    />
                                </div>
                                <span className={`asmt-gap-bar-pct asmt-gap-bar-pct--${g.status}`}>
                                    {g.currentScore > 0 ? `${g.currentScore}%` : 'Untested'}
                                    {g.gap > 0 && <span className="asmt-gap-diff"> −{g.gap}%</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Domain Cards Grid */}
            <div className="asmt-domain-grid">
                {profiles.map((profile, i) => {
                    const gap = gapAnalysis?.gaps.find(g => g.domain === profile.domain);
                    return (
                        <motion.div
                            key={profile.domain}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.06 }}
                        >
                            <DomainCard
                                profile={profile}
                                onClick={onSelectDomain}
                                gapStatus={gap?.status}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Config / Pre-Assessment ──────────────────────────────────────────────────

export type AssessmentMode = 'quiz' | 'coding' | 'both';

interface ConfigProps {
    profile: DomainProfile;
    selectedRole: string;
    onRoleChange: (role: string) => void;
    onStart: (mode: AssessmentMode) => void;
    onBack: () => void;
    loading: boolean;
}

function ConfigView({ profile, selectedRole, onRoleChange, onStart, onBack, loading }: ConfigProps) {
    const isSoftSkills = profile.domain === 'soft_skills';
    const [mode, setMode] = useState<AssessmentMode>(isSoftSkills ? 'quiz' : 'both');

    const ALL_MODES: { id: AssessmentMode; icon: string; label: string; sub: string; time: string; badge?: string }[] = [
        {
            id: 'quiz',
            icon: '📋',
            label: 'MCQ Quiz',
            sub: '15 multiple-choice questions covering theory and concepts',
            time: '~15 min',
        },
        {
            id: 'coding',
            icon: '💻',
            label: 'Coding Challenge',
            sub: '2 original coding problems with live IDE & test execution',
            time: '~30 min',
            badge: 'LeetCode-style',
        },
        {
            id: 'both',
            icon: '🏆',
            label: 'Full Assessment',
            sub: 'Quiz first, then coding — blended score for best accuracy',
            time: '~45 min',
            badge: 'Recommended',
        },
    ];

    const MODES = isSoftSkills ? ALL_MODES.filter(m => m.id === 'quiz') : ALL_MODES;

    return (
        <motion.div
            className="asmt-config"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
        >
            <button className="asmt-back-btn" onClick={onBack}>
                <ChevronLeft size={16} /> All Domains
            </button>

            <div className="asmt-config-card">
                <div className="asmt-config-icon" style={{ color: profile.color }}>
                    {DOMAIN_ICONS[profile.icon]}
                </div>
                <h2 className="asmt-config-title">{profile.label}</h2>
                <p className="asmt-config-desc">{profile.description}</p>

                {/* Topics */}
                <div className="asmt-config-section">
                    <p className="asmt-config-section-label">Topics covered</p>
                    <div className="asmt-config-topics">
                        {profile.topics.map(t => (
                            <span key={t} className="asmt-config-topic">{t}</span>
                        ))}
                    </div>
                </div>

                {/* ── Assessment Mode Selector ── */}
                <div className="asmt-config-section">
                    <p className="asmt-config-section-label">Choose assessment type</p>
                    <div className="asmt-mode-grid">
                        {MODES.map(m => (
                            <button
                                key={m.id}
                                className={`asmt-mode-card ${mode === m.id ? 'asmt-mode-card--active' : ''}`}
                                onClick={() => setMode(m.id)}
                                style={mode === m.id ? { borderColor: profile.color, boxShadow: `0 0 0 3px ${profile.color}18` } : {}}
                            >
                                <div className="asmt-mode-card-top">
                                    <span className="asmt-mode-icon">{m.icon}</span>
                                    <div className="asmt-mode-radio">
                                        <div className={`asmt-mode-dot ${mode === m.id ? 'asmt-mode-dot--active' : ''}`}
                                            style={mode === m.id ? { background: profile.color } : {}}
                                        />
                                    </div>
                                </div>
                                <p className="asmt-mode-label">{m.label}</p>
                                <p className="asmt-mode-sub">{m.sub}</p>
                                <div className="asmt-mode-footer">
                                    <span className="asmt-mode-time"><Clock size={11} /> {m.time}</span>
                                    {m.badge && (
                                        <span className="asmt-mode-badge"
                                            style={m.id === 'both' ? { background: profile.color + '18', color: profile.color } : {}}
                                        >{m.badge}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Previous score */}
                {profile.currentScore > 0 && (
                    <div className="asmt-config-prev">
                        <span>Previous best:</span>
                        <strong style={{ color: profile.color }}>{profile.currentScore}%</strong>
                        <span>({profile.assessmentCount}× taken)</span>
                    </div>
                )}

                {/* Role selector */}
                <div className="asmt-config-section">
                    <p className="asmt-config-section-label">Optimising for role</p>
                    <div className="asmt-role-tabs asmt-role-tabs--sm">
                        {AVAILABLE_ROLES.map(r => (
                            <button
                                key={r.slug}
                                className={`asmt-role-tab ${selectedRole === r.slug ? 'asmt-role-tab--active' : ''}`}
                                onClick={() => onRoleChange(r.slug)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="asmt-start-btn"
                    style={{ background: profile.color }}
                    onClick={() => onStart(mode)}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="asmt-loading-dots"><span /><span /><span /></span>
                    ) : (
                        <>
                            {mode === 'quiz' && <><BookOpen size={16} /> Start Quiz</>}
                            {mode === 'coding' && <><Code2 size={16} /> Start Coding</>}
                            {mode === 'both' && <><Play size={16} /> Start Full Assessment</>}
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

// ─── Quiz View ────────────────────────────────────────────────────────────────

interface QuizProps {
    session: AssessmentSession;
    onSubmit: (answers: QuestionAnswer[], elapsed: number) => void;
    hasCodingRound?: boolean;
}

function QuizView({ session, onSubmit, hasCodingRound = false }: QuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const [questionTime, setQuestionTime] = useState(0);
    const [tabViolations, setTabViolations] = useState(0);
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const answersRef = useRef<QuestionAnswer[]>([]);
    const elapsedRef = useRef<number>(0);

    const question = session.questions[currentIndex];
    const total = session.questions.length;
    const progress = ((currentIndex) / total) * 100;

    // Keep refs in sync for use inside event handlers
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

    // ── Tab-switch / visibility detection ───────────────────────────────────────
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabViolations(prev => {
                    const next = prev + 1;
                    setShowViolationWarning(true);
                    // Auto-submit after 3 violations
                    if (next >= 3) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setTimeout(() => onSubmit(answersRef.current, elapsedRef.current), 1500);
                    }
                    return next;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [onSubmit]);

    // ── Webcam proctoring (snapshot every 60 seconds) ────────────────────────────
    const webcamRef = useRef<HTMLVideoElement | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        // Request camera access
        navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
            .then(stream => {
                webcamStreamRef.current = stream;
                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                    webcamRef.current.play().catch(() => {});
                }
            })
            .catch(() => {
                // Camera denied — silently continue (no hard block)
                console.warn('[Proctoring] Camera permission denied. Continuing without webcam.');
            });

        // Take snapshot every 60 seconds
        const snapshotInterval = setInterval(async () => {
            if (!webcamRef.current || !snapshotCanvasRef.current || !webcamStreamRef.current) return;
            const video = webcamRef.current;
            const canvas = snapshotCanvasRef.current;
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Convert to blob and upload to Firebase Storage
            canvas.toBlob(async blob => {
                if (!blob) return;
                try {
                    const { getStorage, ref: storageRef, uploadBytes } = await import('firebase/storage');
                    const storage = getStorage();
                    const path = `proctoring/${session.uid ?? 'unknown'}/${session.id ?? Date.now()}/snap_${Date.now()}.jpg`;
                    await uploadBytes(storageRef(storage, path), blob, { contentType: 'image/jpeg' });
                } catch (err) {
                    // Storage upload failure should not interrupt the assessment
                    console.warn('[Proctoring] Snapshot upload failed:', err);
                }
            }, 'image/jpeg', 0.7);
        }, 60000);

        return () => {
            clearInterval(snapshotInterval);
            // Stop all camera tracks when quiz ends
            webcamStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [session.id, session.uid]);

    // Total timer
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setElapsed(e => e + 1);
            setQuestionTime(q => q + 1);
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }

    function handleSelect(idx: number) {
        if (answered) return;
        setSelectedIndex(idx);
        setAnswered(true);
    }

    function handleNext() {
        const answer: QuestionAnswer = {
            questionId: question.id,
            selectedIndex: selectedIndex,
            timeTakenSeconds: questionTime,
        };
        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);

        if (currentIndex + 1 >= total) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onSubmit(newAnswers, elapsed);
        } else {
            setCurrentIndex(i => i + 1);
            setSelectedIndex(null);
            setAnswered(false);
            setQuestionTime(0);
        }
    }

    function handleSkip() {
        const answer: QuestionAnswer = {
            questionId: question.id,
            selectedIndex: null,
            timeTakenSeconds: questionTime,
        };
        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);

        if (currentIndex + 1 >= total) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onSubmit(newAnswers, elapsed);
        } else {
            setCurrentIndex(i => i + 1);
            setSelectedIndex(null);
            setAnswered(false);
            setQuestionTime(0);
        }
    }

    const difficultyColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

    return (
        <motion.div
            className="asmt-quiz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Hidden proctoring elements — invisible to student */}
            <video
                ref={webcamRef}
                style={{ display: 'none' }}
                muted
                playsInline
                autoPlay
            />
            <canvas ref={snapshotCanvasRef} style={{ display: 'none' }} />

            {/* Quiz header */}
            <div className="asmt-quiz-header">
                <div className="asmt-quiz-progress-row">
                    <span className="asmt-quiz-progress-text">Question {currentIndex + 1} of {total}</span>
                    <div className="asmt-quiz-timer">
                        <Timer size={13} />
                        <span>{formatTime(elapsed)}</span>
                    </div>
                </div>
                <div className="asmt-quiz-progress-bar">
                    <motion.div
                        className="asmt-quiz-progress-fill"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Tab-switch Violation Warning */}
            <AnimatePresence>
                {showViolationWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        style={{
                            background: tabViolations >= 3 ? '#7f1d1d' : '#431407',
                            border: `1px solid ${tabViolations >= 3 ? '#ef4444' : '#f97316'}`,
                            borderRadius: '10px',
                            padding: '10px 16px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tabViolations >= 3 ? '#fca5a5' : '#fdba74', fontWeight: 600, fontSize: '14px' }}>
                            <AlertCircle size={16} />
                            {tabViolations >= 3
                                ? '⚠ Maximum violations reached — submitting assessment now...'
                                : `⚠ Tab-switch detected (${tabViolations}/3 warnings). Further violations will auto-submit this assessment.`
                            }
                        </div>
                        {tabViolations < 3 && (
                            <button
                                onClick={() => setShowViolationWarning(false)}
                                style={{ background: 'none', border: 'none', color: '#fdba74', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                            >×</button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={question.id}
                    className="asmt-question-card"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="asmt-question-meta">
                        <span className="asmt-question-topic">{question.topic}</span>
                        <span
                            className="asmt-question-diff"
                            style={{ color: difficultyColor[question.difficulty] }}
                        >
                            {question.difficulty.toUpperCase()}
                        </span>
                    </div>

                    <p className="asmt-question-text">{question.question}</p>

                    <div className="asmt-options">
                        {question.options.map((opt, idx) => {
                            let cls = 'asmt-option';
                            if (answered) {
                                if (idx === question.correctIndex) cls += ' asmt-option--correct';
                                else if (idx === selectedIndex) cls += ' asmt-option--wrong';
                                else cls += ' asmt-option--dim';
                            } else if (idx === selectedIndex) {
                                cls += ' asmt-option--selected';
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    className={cls}
                                    onClick={() => handleSelect(idx)}
                                    whileHover={!answered ? { x: 4 } : {}}
                                    whileTap={!answered ? { scale: 0.98 } : {}}
                                >
                                    <span className="asmt-option-letter">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="asmt-option-text">{opt}</span>
                                    {answered && idx === question.correctIndex && (
                                        <CheckCircle size={16} className="asmt-option-icon asmt-option-icon--correct" />
                                    )}
                                    {answered && idx === selectedIndex && idx !== question.correctIndex && (
                                        <XCircle size={16} className="asmt-option-icon asmt-option-icon--wrong" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Explanation shown after answering */}
                    <AnimatePresence>
                        {answered && (
                            <motion.div
                                className="asmt-explanation"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <p className="asmt-explanation-label">Explanation</p>
                                <p className="asmt-explanation-text">{question.explanation}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="asmt-quiz-actions">
                        {!answered && (
                            <button className="asmt-skip-btn" onClick={handleSkip}>
                                <SkipForward size={14} /> Skip
                            </button>
                        )}
                        {answered && (
                            <motion.button
                                className="asmt-next-btn"
                                onClick={handleNext}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {currentIndex + 1 >= total
                                    ? (hasCodingRound ? '🖥️ Coding Round' : 'View Results')
                                    : 'Next'}

                                <ChevronRight size={16} />
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Mini progress dots */}
            <div className="asmt-dots">
                {session.questions.map((_, i) => (
                    <div
                        key={i}
                        className={`asmt-dot ${
                            i < currentIndex ? 'asmt-dot--done' :
                            i === currentIndex ? 'asmt-dot--active' : ''
                        }`}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ─── Results View ─────────────────────────────────────────────────────────────

interface ResultsProps {
    result: AssessmentResult;
    profileColor: string;
    profileLabel: string;
    onRetake: () => void;
    onDone: () => void;
}

function ResultsView({ result, profileColor, profileLabel, onRetake, onDone }: ResultsProps) {
    const passed = result.score >= 70;
    const priorityColor: Record<string, string> = {
        critical: '#ef4444', high: '#f59e0b', medium: '#2563eb', low: '#64748b',
    };

    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    }

    return (
        <motion.div
            className="asmt-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Score hero */}
            <div className={`asmt-result-hero asmt-result-hero--${passed ? 'pass' : 'fail'}`}>
                <div className="asmt-result-ring-wrap">
                    <svg viewBox="0 0 120 120" className="asmt-result-ring">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle
                            cx="60" cy="60" r="50" fill="none"
                            stroke={profileColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - result.score / 100)}`}
                            transform="rotate(-90 60 60)"
                            style={{ filter: `drop-shadow(0 0 8px ${profileColor}80)` }}
                        />
                    </svg>
                    <div className="asmt-result-score-inner">
                        <span className="asmt-result-score" style={{ color: profileColor }}>
                            {result.score}%
                        </span>
                        <span className="asmt-result-score-label">{profileLabel}</span>
                    </div>
                </div>

                <div className="asmt-result-summary">
                    <h2 className="asmt-result-verdict">{passed ? 'Great work!' : 'Keep practising'}</h2>
                    <div className="asmt-result-meta-row">
                        <span><CheckCircle size={13} /> {result.correctCount}/{result.totalCount} correct</span>
                        <span><Timer size={13} /> {formatTime(result.timeTakenSeconds)}</span>
                        <span><Trophy size={13} /> Top {100 - result.percentile}%</span>
                    </div>
                    {result.capabilityDelta !== 0 && (
                        <div className={`asmt-result-delta ${result.capabilityDelta > 0 ? 'asmt-result-delta--up' : 'asmt-result-delta--down'}`}>
                            <TrendingUp size={14} />
                            Capability score {result.capabilityDelta > 0 ? `+${result.capabilityDelta}%` : `${result.capabilityDelta}%`} — updated across your dashboard
                        </div>
                    )}
                </div>
            </div>

            {/* Topic breakdown */}
            <div className="asmt-result-section">
                <h3 className="asmt-result-section-title">
                    <BarChart3 size={16} /> Topic Breakdown
                </h3>
                <div className="asmt-topic-list">
                    {result.topicBreakdown.map(t => (
                        <div key={t.topic} className="asmt-topic-row">
                            <span className="asmt-topic-name">{t.topic}</span>
                            <div className="asmt-topic-bar-wrap">
                                <div className="asmt-topic-bar-track">
                                    <motion.div
                                        className={`asmt-topic-bar-fill ${t.percentage >= 70 ? 'asmt-topic-bar-fill--good' : 'asmt-topic-bar-fill--weak'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${t.percentage}%` }}
                                        transition={{ delay: 0.2, duration: 0.5 }}
                                    />
                                </div>
                                <span className={`asmt-topic-pct ${t.percentage >= 70 ? 'text-green' : 'text-amber'}`}>
                                    {t.percentage}%
                                </span>
                            </div>
                            <span className="asmt-topic-count">{t.correct}/{t.total}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Practice recommendations */}
            {result.practiceRecommendations.length > 0 && (
                <div className="asmt-result-section">
                    <h3 className="asmt-result-section-title">
                        <BookOpen size={16} /> Recommended Practice
                    </h3>
                    <div className="asmt-recs-list">
                        {result.practiceRecommendations.map((rec, i) => (
                            <motion.div
                                key={i}
                                className="asmt-rec-card"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.07 }}
                            >
                                <div
                                    className="asmt-rec-priority"
                                    style={{ background: priorityColor[rec.priority] + '22', color: priorityColor[rec.priority] }}
                                >
                                    {rec.priority.toUpperCase()}
                                </div>
                                <div className="asmt-rec-body">
                                    <p className="asmt-rec-title">{rec.resourceTitle}</p>
                                    <p className="asmt-rec-reason">{rec.reason}</p>
                                    <div className="asmt-rec-meta">
                                        <span>{rec.topic}</span>
                                        <span>·</span>
                                        <span>{rec.estimatedMinutes} min</span>
                                        <span>·</span>
                                        <span className="asmt-rec-type">{rec.resourceType.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="asmt-rec-arrow" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="asmt-result-actions">
                <button className="asmt-retake-btn" onClick={onRetake}>
                    <RefreshCcw size={15} /> Retake
                </button>
                <button className="asmt-done-btn" onClick={onDone}>
                    View All Assessments <ArrowRight size={15} />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Root Component ───────────────────────────────────────────────────────────

interface AssessmentPageProps {
    onIdeStateChange?: (isOpen: boolean) => void;
    isEmbedded?: boolean;
}

export default function AssessmentPage({ onIdeStateChange, isEmbedded = false }: AssessmentPageProps = {}) {
    const [pageState, setPageState] = useState<PageState>('overview');
    const [profiles, setProfiles] = useState<DomainProfile[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<AssessmentDomain | null>(null);
    const [selectedRole, setSelectedRole] = useState('ai-engineer');
    const [gapAnalysis, setGapAnalysis] = useState<SkillGapAnalysis | null>(null);
    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    const { user, dbUid } = useAuth();
    const [pendingOAs, setPendingOAs] = useState<RoleApplication[]>([]);
    const [selectedOA, setSelectedOA] = useState<RoleApplication | null>(null);

    // Coding IDE state — use ref so handleQuizSubmit closure always reads latest value
    const codingProblemsRef = useRef<CodingProblem[]>([]);
    const [codingProblems, setCodingProblemsState] = useState<CodingProblem[]>([]);
    const [problemsLoading, setProblemsLoading] = useState(false);
    const setCodingProblems = (p: CodingProblem[]) => {
        codingProblemsRef.current = p;
        setCodingProblemsState(p);
    };
    const [codingIndex, setCodingIndex] = useState(0);
    const codingIndexRef = useRef(0);
    const codeSubmissionsRef = useRef<Array<{ results: TestResult[]; score: number; code: string; language: SupportedLanguage }>>([]);
    const mcqAnswersRef = useRef<QuestionAnswer[]>([]);
    const mcqElapsedRef = useRef(0);


    const loadOverview = useCallback(async (role: string) => {
        const [p, g] = await Promise.all([
            buildDomainProfiles(),
            getSkillGapAnalysis(role),
        ]);
        if (dbUid) {
            try {
                const apps = await getCandidateApplications(dbUid);
                setPendingOAs(apps.filter(a => a.status === 'OA Pending' && a.scheduledAssessment));
            } catch(e) { console.error(e); }
        }
        setProfiles(p);
        setGapAnalysis(g);
        setInitialLoading(false);
    }, [dbUid]);

    useEffect(() => {
        loadOverview(selectedRole);
    }, [selectedRole, loadOverview]);

    function handleRoleChange(role: string) {
        setSelectedRole(role);
    }

    function handleSelectDomain(domain: AssessmentDomain) {
        setSelectedDomain(domain);
        setPageState('config');
    }

    async function handleStartOA(oa: RoleApplication) {
        if (!oa.scheduledAssessment) return;
        setLoading(true);
        setSelectedOA(oa);
        
        try {
            const mode = oa.scheduledAssessment.type === 'ai_interview' ? 'quiz' : 'coding';
            const domainStr = oa.scheduledAssessment.domain.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const validDomains = ['system_design', 'backend_api', 'react_frontend', 'machine_learning', 'cloud_devops', 'data_science', 'cybersecurity'];
            const domain = (validDomains.includes(domainStr) ? domainStr : 'system_design') as AssessmentDomain;
            setSelectedDomain(domain);
            selectedModeRef.current = mode;

            codeSubmissionsRef.current = [];
            mcqAnswersRef.current = [];
            mcqElapsedRef.current = 0;
            codingIndexRef.current = 0;
            setCodingIndex(0);

            if (mode === 'coding') {
                const session = await createSession(domain, selectedRole, []);
                setProblemsLoading(true);
                const problems = await generateProblems(domain, 2, 'mixed');
                setProblemsLoading(false);
                codingProblemsRef.current = problems;
                setCodingProblems(problems);
                setSession(session);
                setPageState('coding');
            } else {
                const questions = await generateQuestions({
                    domain,
                    role: selectedRole,
                    count: 15,
                    difficulty: 'mixed',
                });
                const session = await createSession(domain, selectedRole, questions);
                codingProblemsRef.current = [];
                setCodingProblems([]);
                setSession(session);
                setPageState('quiz');
            }
        } finally {
            setLoading(false);
        }
    }

    const selectedModeRef = useRef<AssessmentMode>('both');

    async function handleStartAssessment(mode: AssessmentMode) {
        if (!selectedDomain) return;
        selectedModeRef.current = mode;
        setLoading(true);
        try {
            codeSubmissionsRef.current = [];
            mcqAnswersRef.current = [];
            mcqElapsedRef.current = 0;
            codingIndexRef.current = 0;
            setCodingIndex(0);

            if (mode === 'coding') {
                // Skip MCQ — go straight to coding IDE
                const session = await createSession(selectedDomain, selectedRole, []);
                setProblemsLoading(true);
                const problems = await generateProblems(selectedDomain, 2, 'mixed');
                setProblemsLoading(false);
                codingProblemsRef.current = problems;
                setCodingProblems(problems);
                setSession(session);
                setPageState('coding');
            } else {
                // quiz or both
                const questions = await generateQuestions({
                    domain: selectedDomain,
                    role: selectedRole,
                    count: 15,
                    difficulty: 'mixed',
                });
                const newSession = await createSession(selectedDomain, selectedRole, questions);

                if (mode === 'both') {
                    // Load AI-generated coding problems — store in ref IMMEDIATELY
                    setProblemsLoading(true);
                    const problems = await generateProblems(selectedDomain, 2, 'mixed');
                    setProblemsLoading(false);
                    codingProblemsRef.current = problems;
                    setCodingProblems(problems);
                } else {
                    // quiz-only: clear coding problems
                    codingProblemsRef.current = [];
                    setCodingProblems([]);
                }

                setSession(newSession);
                setPageState('quiz');
            }
        } finally {
            setLoading(false);
        }
    }

    // This is called by QuizView — reads refs so closure is NEVER stale
    async function handleQuizSubmit(answers: QuestionAnswer[], elapsed: number) {
        if (!session) return;
        // Write to refs immediately
        mcqAnswersRef.current = answers;
        mcqElapsedRef.current = elapsed;

        // Read from REF — always current even in stale closure
        if (codingProblemsRef.current.length > 0) {
            codingIndexRef.current = 0;
            setCodingIndex(0);
            setPageState('coding');
        } else {
            await finishAndScore(answers, elapsed, []);
        }
    }

    async function handleCodingSubmit(
        results: TestResult[],
        score: number,
        code: string,
        language: SupportedLanguage
    ) {
        const newSub = { results, score, code, language };
        const updated = [...codeSubmissionsRef.current, newSub];
        codeSubmissionsRef.current = updated;

        const nextIdx = codingIndexRef.current + 1;
        if (nextIdx < codingProblemsRef.current.length) {
            codingIndexRef.current = nextIdx;
            setCodingIndex(nextIdx);
        } else {
            await finishAndScore(mcqAnswersRef.current, mcqElapsedRef.current, updated);
        }
    }

    function handleCodingSkip() {
        const newSub = { results: [], score: 0, code: '', language: 'python' as SupportedLanguage };
        const updated = [...codeSubmissionsRef.current, newSub];
        codeSubmissionsRef.current = updated;

        const nextIdx = codingIndexRef.current + 1;
        if (nextIdx < codingProblemsRef.current.length) {
            codingIndexRef.current = nextIdx;
            setCodingIndex(nextIdx);
        } else {
            finishAndScore(mcqAnswersRef.current, mcqElapsedRef.current, updated);
        }
    }

    async function finishAndScore(
        answers: QuestionAnswer[],
        elapsed: number,
        subs: Array<{ results: TestResult[]; score: number; code: string; language: SupportedLanguage }>
    ) {
        if (!session) return;
        setLoading(true);
        try {
            const evalResult = await evaluateSession(session, answers, elapsed);

            // Blend coding score based on mode
            const hasMcq = answers.length > 0;
            const hasCoding = subs.length > 0;

            if (hasCoding) {
                const codingAvg = subs.reduce((s, sub) => s + sub.score, 0) / subs.length;
                if (hasMcq) {
                    evalResult.score = Math.round(evalResult.score * 0.7 + codingAvg * 0.3);
                } else {
                    evalResult.score = Math.round(codingAvg);
                }
            }


            await submitAssessmentResult(evalResult);
            if (selectedOA && dbUid && selectedOA.id) {
                await submitScheduledAssessment(dbUid, selectedOA.roleId, selectedOA.id, evalResult.score);
                setSelectedOA(null);
            }
            
            setResult(evalResult);
            setPageState('results');
            loadOverview(selectedRole);
        } finally {
            setLoading(false);
        }
    }

    function handleRetake() {
        setResult(null);
        setSession(null);
        setPageState('config');
    }

    function handleDone() {
        setResult(null);
        setSession(null);
        setSelectedDomain(null);
        setPageState('overview');
    }

    const selectedProfile = profiles.find(p => p.domain === selectedDomain);

    const content = (
        <div className="asmt-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            <main className="asmt-main" style={isEmbedded ? { paddingTop: 0 } : {}}>
                {initialLoading ? (
                    <div className="asmt-loading">
                        <div className="asmt-loading-spinner" />
                        <p>Loading assessment hub…</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {pageState === 'overview' && (
                            <motion.div key="overview" exit={{ opacity: 0, y: -10 }}>
                                <OverviewView
                                    profiles={profiles}
                                    gapAnalysis={gapAnalysis}
                                    selectedRole={selectedRole}
                                    onRoleChange={handleRoleChange}
                                    onSelectDomain={handleSelectDomain}
                                    pendingOAs={pendingOAs}
                                    onStartOA={handleStartOA}
                                />
                            </motion.div>
                        )}

                        {pageState === 'config' && selectedProfile && (
                            <motion.div key="config" exit={{ opacity: 0, x: -20 }}>
                                <ConfigView
                                    profile={selectedProfile}
                                    selectedRole={selectedRole}
                                    onRoleChange={handleRoleChange}
                                    onStart={handleStartAssessment}
                                    onBack={() => setPageState('overview')}
                                    loading={loading}
                                />
                            </motion.div>
                        )}

                        {pageState === 'quiz' && session && (
                            <motion.div key="quiz" exit={{ opacity: 0 }}>
                                <QuizView
                                    session={session}
                                    onSubmit={handleQuizSubmit}
                                    hasCodingRound={codingProblemsRef.current.length > 0}
                                />
                            </motion.div>
                        )}

                        {pageState === 'coding' && (codingProblems[codingIndex] ?? codingProblemsRef.current[codingIndexRef.current]) && (
                            <motion.div
                                key={`coding-${codingIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ position: 'fixed', inset: 0, top: 'var(--navbar-height)', zIndex: 10, background: '#f8fafc' }}
                            >
                                <CodingIDE
                                    problem={codingProblems[codingIndex] ?? codingProblemsRef.current[codingIndexRef.current]}
                                    problemIndex={codingIndex ?? codingIndexRef.current}
                                    totalProblems={codingProblems.length || codingProblemsRef.current.length}
                                    onSubmit={handleCodingSubmit}
                                    onSkip={handleCodingSkip}
                                    practiceMode={false}
                                />
                            </motion.div>
                        )}

                        {pageState === 'coding' && problemsLoading && (
                            <motion.div
                                key="problems-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ position: 'fixed', inset: 0, top: 'var(--navbar-height)', zIndex: 10, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                            >
                                <div className="asmt-loading-spinner" />
                                <p style={{ fontSize: 16, color: '#334155', fontWeight: 600 }}>Generating your problems with AI…</p>
                                <p style={{ fontSize: 13, color: '#64748b' }}>Creating unique problems tailored to your domain</p>
                            </motion.div>
                        )}


                        {pageState === 'results' && result && selectedProfile && (
                            <motion.div key="results" exit={{ opacity: 0 }}>
                                <ResultsView
                                    result={result}
                                    profileColor={selectedProfile.color}
                                    profileLabel={selectedProfile.label}
                                    onRetake={handleRetake}
                                    onDone={handleDone}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <>
            <FloatingNavbar variant="candidate" />
            {content}
        </>
    );
}
