import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Link } from 'react-router-dom';
import {
    ArrowRight, BookOpen, ExternalLink, Loader2, Sparkles, AlertCircle,
    CheckCircle2, MessageSquare, Target, Upload, Brain, Trophy, X,
    ChevronRight, Clock, Zap, BarChart2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, type LearningResource } from '../../services/profileService';
import { generateLearningPath } from '../../services/learningService';
import { callGeminiJSON } from '../../lib/gemini';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserCapability } from '../../services/profileService';
import './LearningPage.css';

/* ── Quiz types ── */
interface QuizQuestion {
    q: string;
    options: string[];
    correct: number;
    explanation: string;
}
interface QuizState {
    resourceTitle: string;
    skill: string;
    questions: QuizQuestion[];
    current: number;
    answers: (number | null)[];
    phase: 'loading' | 'active' | 'results';
    score: number | null;
}

/* ── Progress persisted per resource ── */
interface ResourceProgress {
    quizScore: number;       // 0–100
    quizPassedAt?: number;   // timestamp
    startedAt?: number;
    timeSpentMins: number;   // mins tracked via timer
}

const QUIZ_SYSTEM = `You are a technical knowledge verifier for CapAble, a career platform.
Generate a 5-question multiple-choice quiz to verify understanding of the given skill/topic.
Rules:
- Questions must be PRACTICAL, not definitional. Prefer "what happens when…", "which approach is correct…"
- Each question has 4 options. Only one is correct.
- Provide a concise explanation (1–2 sentences) for the correct answer.
- Difficulty should be slightly challenging — not trivial.
Return ONLY valid JSON array:
[{"q":"question text","options":["A","B","C","D"],"correct":0,"explanation":"why A is correct"}]`;

async function generateQuiz(skill: string, provider: string, resourceTitle: string): Promise<QuizQuestion[]> {
    const cacheKey = `quiz_cache_${skill}_${provider}`.replace(/\s+/g, '_').toLowerCase();
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const prompt = `Skill being tested: ${skill}
Resource just studied: "${resourceTitle}" from ${provider}
Generate 5 practical multiple-choice questions to verify understanding.`;
    const questions = await callGeminiJSON<QuizQuestion[]>(prompt, QUIZ_SYSTEM);
    if (!questions || questions.length === 0) throw new Error('Quiz generation failed');
    sessionStorage.setItem(cacheKey, JSON.stringify(questions));
    return questions;
}

export default function LearningPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [careerTargetRole, setCareerTargetRole] = useState('');
    const [careerMissingSkills, setCareerMissingSkills] = useState<string[]>([]);
    const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
    const [progress, setProgress] = useState<Record<string, ResourceProgress>>({});
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});   // title → startedAt ms
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── Load capabilities ── */
    useEffect(() => {
        if (!user || !dbUid) return;
        getCapabilities(dbUid).then(caps => {
            setCapabilities(caps);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    /* ── Load career context ── */
    useEffect(() => {
        if (!user || !dbUid) return;
        const cached = localStorage.getItem(`career_roles_${dbUid}`);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data.roles?.length > 0) {
                    setCareerTargetRole(data.roles[0].role);
                    const missing = data.roles[0].requirements
                        ?.filter((req: any) => {
                            const cap = (data.caps || []).find((c: any) =>
                                c.skill?.toLowerCase().includes(req.skill?.toLowerCase()));
                            return !cap || cap.score < 60;
                        }).map((r: any) => r.skill) || [];
                    setCareerMissingSkills(missing);
                    return;
                }
            } catch { /* noop */ }
        }
        getDoc(doc(db, 'users', dbUid, 'meta', 'careerTarget')).then(snap => {
            if (snap.exists()) {
                const d = snap.data();
                if (d.roles?.length > 0) {
                    setCareerTargetRole(d.roles[0].role);
                    setCareerMissingSkills(d.roles[0].requirements?.map((r: any) => r.skill) || []);
                }
            }
        }).catch(console.error);
    }, [user, dbUid]);

    /* ── Load persisted progress ── */
    useEffect(() => {
        if (!dbUid) return;
        getDoc(doc(db, 'users', dbUid, 'meta', 'learningProgress')).then(snap => {
            if (snap.exists()) setProgress(snap.data() as Record<string, ResourceProgress>);
        }).catch(console.error);
    }, [dbUid]);

    /* ── Tick timer for active courses (update every 30s) ── */
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setActiveTimers(prev => {
                if (Object.keys(prev).length === 0) return prev;
                const now = Date.now();
                setProgress(prog => {
                    const updated = { ...prog };
                    Object.entries(prev).forEach(([title, startedAt]) => {
                        const elapsedMins = (now - startedAt) / 60000;
                        const existing = updated[title] || { quizScore: 0, timeSpentMins: 0 };
                        updated[title] = { ...existing, timeSpentMins: (existing.timeSpentMins || 0) + elapsedMins };
                    });
                    return updated;
                });
                // Reset start times to now so next tick measures from now
                const reset: Record<string, number> = {};
                Object.keys(prev).forEach(k => { reset[k] = now; });
                return reset;
            });
        }, 30_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    /* ── Persist progress to Firestore ── */
    const persistProgress = async (updated: Record<string, ResourceProgress>) => {
        if (!dbUid) return;
        try {
            await setDoc(doc(db, 'users', dbUid, 'meta', 'learningProgress'), updated, { merge: true });
        } catch (e) { console.error('Progress save failed', e); }
    };

    /* ── Generate learning path ── */
    const handleGenerate = async (forceRegenerate = false) => {
        if (!user) return;
        setGenerating(true); setError(null);
        try {
            const CACHE_KEY = `learning_path_${dbUid}`;
            const hash = capabilities.map(c => `${c.skill}:${c.score}`).sort().join('|');
            if (!forceRegenerate) {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const d = JSON.parse(cached);
                    if (d.capsHash === hash && d.resources?.length > 0) {
                        setResources(d.resources); setGenerating(false); return;
                    }
                }
            }
            const targetRole = careerTargetRole || profile?.headline || 'Software Engineer';
            const path = await generateLearningPath(targetRole, capabilities, careerMissingSkills);
            setResources(path);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ resources: path, timestamp: Date.now(), capsHash: hash }));
        } catch (err: any) {
            setError(err.message || 'Failed to generate path.');
        } finally { setGenerating(false); }
    };

    useEffect(() => {
        if (!loading && resources.length === 0 && !generating) handleGenerate();
    }, [loading]);

    /* ── Start quiz after user returns from course ── */
    const startQuiz = async (res: LearningResource) => {
        setQuiz({ resourceTitle: res.resourceTitle, skill: res.skill, questions: [], current: 0, answers: [], phase: 'loading', score: null });
        try {
            const questions = await generateQuiz(res.skill, res.provider, res.resourceTitle);
            setQuiz(q => q ? { ...q, questions, answers: Array(questions.length).fill(null), phase: 'active' } : null);
        } catch {
            setQuiz(null);
            setError('Could not load quiz. Please try again.');
        }
    };

    const answerQuestion = (answerIdx: number) => {
        if (!quiz || quiz.phase !== 'active') return;
        const newAnswers = [...quiz.answers];
        newAnswers[quiz.current] = answerIdx;
        if (quiz.current < quiz.questions.length - 1) {
            setQuiz({ ...quiz, answers: newAnswers, current: quiz.current + 1 });
        } else {
            // Score
            const correct = newAnswers.filter((a, i) => a === quiz.questions[i].correct).length;
            const score = Math.round((correct / quiz.questions.length) * 100);
            setQuiz({ ...quiz, answers: newAnswers, phase: 'results', score });
            // Persist
            const updated = {
                ...progress,
                [quiz.resourceTitle]: {
                    quizScore: score,
                    quizPassedAt: Date.now(),
                    timeSpentMins: progress[quiz.resourceTitle]?.timeSpentMins || 0
                }
            };
            setProgress(updated);
            persistProgress(updated);
            // If score >= 60%, update capability in Firestore
            if (score >= 60 && dbUid) {
                const cap = capabilities.find(c => c.skill.toLowerCase().includes(quiz.skill.toLowerCase()) || quiz.skill.toLowerCase().includes(c.skill.toLowerCase()));
                if (cap) {
                    const boost = Math.round(score / 100 * 8); // max 8pt boost per quiz
                    const newScore = Math.min(100, cap.score + boost);
                    updateDoc(doc(db, 'users', dbUid, 'capabilities', cap.id!), { score: newScore }).catch(console.error);
                }
            }
        }
    };

    /* ── Mark course as "opened" for timer tracking ── */
    const trackCourseOpen = (title: string, url: string) => {
        setActiveTimers(prev => ({ ...prev, [title]: Date.now() }));
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    /* ── Compute display progress % ── */
    const getDisplayProgress = (res: LearningResource): number => {
        const p = progress[res.resourceTitle];
        if (!p) return 0;
        const quizContrib = (p.quizScore || 0) * 0.7;  // quiz = 70% weight
        const timeContrib = Math.min((p.timeSpentMins / res.estimatedMinutes) * 30, 30); // time = 30% weight
        return Math.min(Math.round(quizContrib + timeContrib), 100);
    };

    const isLearning = (title: string) => !!activeTimers[title];

    const formatMinutes = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60), m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'beginner': return '#10b981';
            case 'advanced': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    /* ── Overall path progress ── */
    const overallProgress = resources.length > 0
        ? Math.round(resources.reduce((sum, r) => sum + getDisplayProgress(r), 0) / resources.length)
        : 0;

    return (
        <div className="learn-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="learn-bg" />}

            {/* ── Quiz Modal ── */}
            <AnimatePresence>
                {quiz && (
                    <motion.div className="quiz-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="quiz-modal" initial={{ opacity: 0, scale: 0.92, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
                            <button className="quiz-close" onClick={() => setQuiz(null)}><X size={18} /></button>

                            {quiz.phase === 'loading' && (
                                <div className="quiz-loading">
                                    <Brain size={36} className="spin-slow" style={{ color: '#6366f1' }} />
                                    <h3>Generating verification quiz…</h3>
                                    <p>AI is crafting 5 practical questions on <strong>{quiz.skill}</strong></p>
                                </div>
                            )}

                            {quiz.phase === 'active' && quiz.questions.length > 0 && (
                                <div className="quiz-active">
                                    <div className="quiz-header">
                                        <div className="quiz-pill"><Brain size={12} /> Skill Verification</div>
                                        <span className="quiz-counter">{quiz.current + 1} / {quiz.questions.length}</span>
                                    </div>
                                    <div className="quiz-progress-bar">
                                        <div className="quiz-progress-fill" style={{ width: `${((quiz.current) / quiz.questions.length) * 100}%` }} />
                                    </div>
                                    <h3 className="quiz-question">{quiz.questions[quiz.current].q}</h3>
                                    <div className="quiz-options">
                                        {quiz.questions[quiz.current].options.map((opt, i) => (
                                            <button key={i} className="quiz-option" onClick={() => answerQuestion(i)}>
                                                <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="quiz-disclaimer">
                                        <Zap size={12} /> Your score determines how much your capability score increases
                                    </p>
                                </div>
                            )}

                            {quiz.phase === 'results' && (
                                <div className="quiz-results">
                                    <div className={`quiz-score-ring ${quiz.score! >= 60 ? 'pass' : 'fail'}`}>
                                        <span className="quiz-score-num">{quiz.score}%</span>
                                        <span className="quiz-score-label">{quiz.score! >= 60 ? 'Passed!' : 'Try Again'}</span>
                                    </div>
                                    {quiz.score! >= 60 ? (
                                        <>
                                            <h3>Knowledge Verified ✓</h3>
                                            <p>Your <strong>{quiz.skill}</strong> capability score has been boosted by up to {Math.round(quiz.score! / 100 * 8)} points.</p>
                                        </>
                                    ) : (
                                        <>
                                            <h3>Keep Studying</h3>
                                            <p>You need 60%+ to boost your score. Review the material and retry.</p>
                                        </>
                                    )}
                                    <div className="quiz-answer-review">
                                        {quiz.questions.map((q, i) => {
                                            const userAns = quiz.answers[i];
                                            const isCorrect = userAns === q.correct;
                                            return (
                                                <div key={i} className={`qar-item ${isCorrect ? 'correct' : 'wrong'}`}>
                                                    <div className="qar-top">
                                                        {isCorrect ? <CheckCircle2 size={14} /> : <X size={14} />}
                                                        <span className="qar-q">{q.q}</span>
                                                    </div>
                                                    {!isCorrect && (
                                                        <p className="qar-explanation">
                                                            ✓ {q.options[q.correct]} — {q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="quiz-result-actions">
                                        {quiz.score! < 60 && (
                                            <button className="qra-retry" onClick={() => startQuiz({ resourceTitle: quiz.resourceTitle, skill: quiz.skill } as LearningResource)}>
                                                <RefreshCw size={14} /> Retake Quiz
                                            </button>
                                        )}
                                        <button className="qra-close" onClick={() => setQuiz(null)}>Done</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="learn-main">
                {/* ── Gamified Soft Skills Banner ── */}
                <motion.div className="learn-softskills-arena" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="lsa-icon-bg"><MessageSquare size={48} color="#f43f5e" strokeWidth={1.5} /></div>
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
                        <Link to="/candidate/preparation?tab=assessments" className="lsa-btn">Enter the Arena</Link>
                    </div>
                </motion.div>

                {/* ── Header ── */}
                <motion.div className="learn-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="learn-eyebrow"><Sparkles size={14} className="inline-icon" /> AI-GENERATED LEARNING</p>
                    <h1 className="learn-title">Close the gap.<br />Don't restart<br /><em>your journey.</em></h1>
                    <p className="learn-sub">Real courses tailored exactly to your verified skill gaps. Complete them and pass quizzes to prove — and grow — your capability score.</p>
                    {careerTargetRole && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '100px', padding: '6px 14px', marginTop: '12px', fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>
                            <Target size={13} /> Targeting: {careerTargetRole}
                            {careerMissingSkills.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {careerMissingSkills.length} skill gap{careerMissingSkills.length !== 1 ? 's' : ''} to close</span>}
                        </div>
                    )}

                    {/* Overall path progress */}
                    {resources.length > 0 && (
                        <div className="learn-overall-progress">
                            <div className="lop-top">
                                <div className="lop-icon"><BarChart2 size={15} /></div>
                                <span className="lop-label">Path Progress</span>
                                <span className="lop-pct">{overallProgress}%</span>
                                <span className="lop-detail">{resources.filter(r => getDisplayProgress(r) >= 70).length}/{resources.length} verified</span>
                            </div>
                            <div className="lop-bar">
                                <motion.div className="lop-fill" initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── How it works strip ── */}
                {resources.length > 0 && (
                    <motion.div className="learn-how-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        {[
                            { icon: <ExternalLink size={14} />, text: '1. Open the course' },
                            { icon: <Clock size={14} />, text: '2. Study at your pace' },
                            { icon: <Brain size={14} />, text: '3. Take the quiz to verify' },
                            { icon: <Trophy size={14} />, text: '4. Score boosts your capability' },
                        ].map((s, i) => (
                            <div key={i} className="lhs-item">
                                <span className="lhs-icon">{s.icon}</span>
                                <span>{s.text}</span>
                                {i < 3 && <ChevronRight size={13} className="lhs-arrow" />}
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── States ── */}
                {loading || generating ? (
                    <div className="learn-state-container">
                        <Loader2 size={32} className="spin text-blue" />
                        <h3>{generating ? 'Analyzing profile & finding resources…' : 'Loading capabilities…'}</h3>
                    </div>
                ) : error ? (
                    <div className="learn-state-container">
                        <AlertCircle size={32} className="text-red-500" />
                        <h3 className="text-red-600">Generation Failed</h3>
                        <p className="text-red-500">{error}</p>
                        <button className="learn-generate-btn mt-4" onClick={() => handleGenerate(true)}>Try Again <Sparkles size={14} /></button>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="learn-state-container">
                        <AlertCircle size={32} className="text-gray" />
                        <h3>Ready to map your path</h3>
                        <p>We'll analyze your capability scores and generate a tailored list of real resources.</p>
                        <button className="learn-generate-btn" onClick={() => handleGenerate(true)}>Generate Path <Sparkles size={14} /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end mb-4 pr-4">
                            <button onClick={() => handleGenerate(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                <Sparkles size={14} /> Regenerate Path
                            </button>
                        </div>
                        <div className="learn-list">
                            {resources.map((res, i) => {
                                const pct = getDisplayProgress(res);
                                const quizDone = (progress[res.resourceTitle]?.quizScore ?? 0) > 0;
                                const quizScore = progress[res.resourceTitle]?.quizScore ?? 0;
                                const passed = quizScore >= 60;
                                const timeMins = Math.round(progress[res.resourceTitle]?.timeSpentMins ?? 0);
                                const learningNow = isLearning(res.resourceTitle);

                                return (
                                    <motion.div key={res.resourceTitle + i} className={`learn-card${passed ? ' learn-card--passed' : ''}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                                        <div className="learn-card-top">
                                            <div className="learn-provider">{res.provider}</div>
                                            <div className="learn-meta-pills">
                                                <span className="learn-pill difficulty" style={{ color: getDifficultyColor(res.difficulty), borderColor: getDifficultyColor(res.difficulty) + '40', background: getDifficultyColor(res.difficulty) + '10' }}>
                                                    {res.difficulty}
                                                </span>
                                                <span className="learn-pill time">⏱ {formatMinutes(res.estimatedMinutes)}</span>
                                                {timeMins > 0 && <span className="learn-pill time" style={{ background: 'rgba(37,99,235,0.07)', color: '#2563eb', borderColor: 'rgba(37,99,235,0.2)' }}><Clock size={11} /> {timeMins}m studied</span>}
                                            </div>
                                        </div>

                                        <h3 className="learn-card-title">{res.resourceTitle}</h3>
                                        <div className="learn-card-skill"><BookOpen size={14} /> Focus: <strong>{res.skill}</strong></div>

                                        {/* Progress bar — driven by quiz + time, NOT manual mark */}
                                        <div className="learn-progress-block">
                                            <div className="lpb-top">
                                                <span>Progress</span>
                                                <span style={{ fontWeight: 700, color: pct >= 70 ? '#10b981' : pct > 0 ? '#f59e0b' : '#94a3b8' }}>{pct}%</span>
                                            </div>
                                            <div className="lpb-track">
                                                <motion.div className="lpb-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} style={{ background: pct >= 70 ? '#10b981' : '#f59e0b' }} />
                                            </div>
                                            {quizDone && (
                                                <div className={`lpb-quiz-badge ${passed ? 'pass' : 'fail'}`}>
                                                    {passed ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                                                    Quiz: {quizScore}% {passed ? '— Verified ✓' : '— Retry to boost score'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions — NO "Mark as done" button */}
                                        <div className="learn-card-actions">
                                            <button
                                                className={`learn-action-btn primary${learningNow ? ' learning-active' : ''}`}
                                                onClick={() => trackCourseOpen(res.resourceTitle, res.url)}
                                                title={`Open on ${res.provider}`}
                                            >
                                                {learningNow ? 'Continue Learning' : 'Start Learning'} <ExternalLink size={13} />
                                            </button>

                                            <button
                                                className={`learn-action-btn quiz-btn${quizDone && !passed ? ' quiz-btn--retry' : ''}`}
                                                onClick={() => startQuiz(res)}
                                                disabled={quiz?.phase === 'loading'}
                                                title="Take a quiz to verify your understanding"
                                            >
                                                <Brain size={13} />
                                                {quizDone ? (passed ? 'Retake Quiz' : 'Retry Quiz') : 'Take Quiz'}
                                            </button>

                                            <button
                                                className={`learn-action-btn save-btn${savedCourses.has(res.resourceTitle) ? ' saved' : ''}`}
                                                onClick={() => {
                                                    const s = new Set(savedCourses);
                                                    if (s.has(res.resourceTitle)) s.delete(res.resourceTitle); else s.add(res.resourceTitle);
                                                    setSavedCourses(s);
                                                }}
                                            >
                                                {savedCourses.has(res.resourceTitle) ? '★ Saved' : '☆ Save'}
                                            </button>
                                        </div>

                                        {learningNow && (
                                            <motion.div className="learn-timer-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <div className="ltb-dot" /><span>Tracking study time…</span>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="learn-cta-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button className="learn-cta-secondary" onClick={() => handleGenerate(true)}><Sparkles size={14} /> Regenerate Path</button>
                            <button className="learn-cta-secondary" style={{ background: '#f8fafc', color: '#0f172a' }}><Upload size={14} /> Import Certificates</button>
                            <Link to="/candidate/opportunities" className="learn-cta-btn">Check Opportunity Radar <ArrowRight size={14} /></Link>
                        </div>
                    </>
                )}

                <div className="learn-product-loop">
                    {['STUDY COURSES', 'TAKE AI QUIZ', 'VERIFY KNOWLEDGE', 'BOOST SCORE'].map((s, i, arr) => (
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
