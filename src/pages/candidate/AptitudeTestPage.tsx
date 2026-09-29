import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    APTITUDE_QUESTIONS, APTITUDE_CATEGORIES, getAptitudeQuizQuestions,
    type AptitudeCategory, type AptitudeQuestion,
} from '../../data/aptitudeData';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { addPoints } from '../../services/scoreService';
import {
    Brain, Timer, CheckCircle2, XCircle, Trophy, RotateCcw,
    ChevronRight, ChevronLeft, Loader2, BarChart3, Target,
    Zap, BookOpen, FlaskConical, GraduationCap, TrendingUp,
    Flag, AlertTriangle, Settings2, Shuffle, History,
} from 'lucide-react';
import { motion as m } from 'framer-motion';
import './AptitudeTestPage.css';

type Phase = 'config' | 'quiz' | 'result';

const CAT_ICONS: Record<AptitudeCategory, React.ReactNode> = {
    quantitative:        <Brain size={20} />,
    logical:             <Target size={20} />,
    verbal:              <BookOpen size={20} />,
    data_interpretation: <BarChart3 size={20} />,
};

function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function AptitudeTestPage() {
    const { dbUid } = useAuth();

    // ── Config phase ─────────────────────────────────────────────────────────
    const [phase, setPhase] = useState<Phase>('config');
    const [selectedCats, setSelectedCats] = useState<AptitudeCategory[]>(['quantitative', 'logical']);
    const [perCategory, setPerCategory] = useState(5);
    const [randomize, setRandomize] = useState(true);
    const [negativeMarking, setNegativeMarking] = useState(false);
    const [negativePenalty, setNegativePenalty] = useState(0.25); // marks deducted per wrong

    // ── Quiz phase ───────────────────────────────────────────────────────────
    const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [flagged, setFlagged] = useState<Set<number>>(new Set());   // NEW: flagged questions
    const [chosen, setChosen] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [showNavigator, setShowNavigator] = useState(false);        // NEW: question navigator

    // ── Result phase ─────────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);

    const currentQ = questions[currentIdx];
    const totalQ = questions.length;

    // Timer per question
    useEffect(() => {
        if (phase !== 'quiz' || !currentQ) return;
        setTimeLeft(currentQ.timeSeconds);
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    handleNext(null);
                    return 0;
                }
                return prev - 1;
            });
            setElapsed(e => e + 1);
        }, 1000);
        return () => clearInterval(intervalRef.current!);
    }, [phase, currentIdx]);

    const handleStart = () => {
        if (selectedCats.length === 0) return;
        let qs = getAptitudeQuizQuestions(selectedCats, perCategory);
        if (randomize) qs = shuffle(qs);
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
        setFlagged(new Set());
        setCurrentIdx(0);
        setElapsed(0);
        setChosen(null);
        setRevealed(false);
        setPhase('quiz');
    };

    const handleChoose = (idx: number) => {
        if (revealed) return;
        setChosen(idx);
        setRevealed(true);
        clearInterval(intervalRef.current!);
        setAnswers(prev => {
            const next = [...prev];
            next[currentIdx] = idx;
            return next;
        });
    };

    // NEW: Flag/unflag current question
    const handleFlag = () => {
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(currentIdx)) next.delete(currentIdx);
            else next.add(currentIdx);
            return next;
        });
    };

    // NEW: Jump to question from navigator
    const handleJumpTo = (idx: number) => {
        clearInterval(intervalRef.current!);
        // Save current answer state
        setCurrentIdx(idx);
        setChosen(answers[idx]);
        setRevealed(answers[idx] !== null);
        setShowNavigator(false);
    };

    const handleNext = useCallback((forcedAnswer: number | null = chosen) => {
        clearInterval(intervalRef.current!);
        setAnswers(prev => {
            const next = [...prev];
            if (next[currentIdx] === null) next[currentIdx] = forcedAnswer;
            return next;
        });

        if (currentIdx < totalQ - 1) {
            setCurrentIdx(i => i + 1);
            const nextAns = answers[currentIdx + 1];
            setChosen(nextAns ?? null);
            setRevealed(nextAns !== null);
        } else {
            finishQuiz();
        }
    }, [currentIdx, totalQ, chosen, answers]);

    const handlePrev = () => {
        if (currentIdx === 0) return;
        clearInterval(intervalRef.current!);
        const prevAns = answers[currentIdx - 1];
        setCurrentIdx(i => i - 1);
        setChosen(prevAns ?? null);
        setRevealed(prevAns !== null);
    };

    const finishQuiz = useCallback(async () => {
        setPhase('result');
        if (!dbUid) return;
        setSaving(true);
        try {
            const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
            const wrongCount = answers.filter((a, i) => a !== null && a !== questions[i]?.correctIndex).length;
            const rawScore = correctCount - (negativeMarking ? wrongCount * negativePenalty : 0);

            await setDoc(doc(db, 'users', dbUid, 'aptitudeResults', Date.now().toString()), {
                categories: selectedCats,
                totalQuestions: totalQ,
                correctCount,
                wrongCount,
                skippedCount: answers.filter(a => a === null).length,
                rawScore: Math.max(0, rawScore),
                percentage: Math.round((Math.max(0, rawScore) / totalQ) * 100),
                negativeMarking,
                flaggedQuestions: Array.from(flagged),
                elapsedSeconds: elapsed,
                takenAt: serverTimestamp(),
            });

            // Add real leaderboard points!
            if (Math.max(0, rawScore) > 0) {
                await addPoints(dbUid, Math.max(0, rawScore), `Completed Aptitude Test (${selectedCats.join(', ')})`);
            }
        } catch (err) {
            console.warn('[AptitudeTest] Save failed:', err);
        } finally {
            setSaving(false);
        }
    }, [answers, questions, dbUid, selectedCats, totalQ, elapsed, negativeMarking, negativePenalty]);

    const correctCount = answers.filter((a, i) => a !== null && a === questions[i]?.correctIndex).length;
    const wrongCount = answers.filter((a, i) => a !== null && a !== questions[i]?.correctIndex).length;
    const skippedCount = answers.filter(a => a === null).length;
    const rawScore = Math.max(0, correctCount - (negativeMarking ? wrongCount * negativePenalty : 0));
    const pct = totalQ > 0 ? Math.round((rawScore / totalQ) * 100) : 0;

    const grade = pct >= 85 ? { label: 'Excellent', color: '#10b981', emoji: '🏆' }
        : pct >= 70 ? { label: 'Good', color: '#2563eb', emoji: '👍' }
        : pct >= 50 ? { label: 'Average', color: '#f59e0b', emoji: '📈' }
        : { label: 'Needs Work', color: '#ef4444', emoji: '📚' };

    const toggleCat = (cat: AptitudeCategory) => {
        setSelectedCats(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    // Navigator question status
    const getQStatus = (idx: number): 'answered' | 'flagged' | 'current' | 'skipped' => {
        if (idx === currentIdx) return 'current';
        if (flagged.has(idx)) return 'flagged';
        if (answers[idx] !== null) return 'answered';
        return 'skipped';
    };

    return (
        <div className="apt-page">
            <FloatingNavbar variant="candidate" />

            <div className="apt-content">

                {/* ── Config ── */}
                {phase === 'config' && (
                    <motion.div className="apt-config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="apt-config-hero" style={{ position: 'relative' }}>
                            <GraduationCap size={40} color="#2563eb" />
                            <h1>Aptitude Practice Test</h1>
                            <p>Practice campus-style questions used in TCS NQT, Infosys, Wipro, Cognizant &amp; more.</p>
                            <Link to="/candidate/aptitude/history" className="apt-start-btn" style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', fontSize: '0.9rem', width: 'auto', display: 'flex', gap: 8, textDecoration: 'none' }}>
                                <History size={16} /> History
                            </Link>
                        </div>

                        <div className="apt-config-card">
                            <h2>Select Categories</h2>
                            <div className="apt-cat-grid">
                                {(Object.entries(APTITUDE_CATEGORIES) as [AptitudeCategory, typeof APTITUDE_CATEGORIES[AptitudeCategory]][]).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        className={`apt-cat-btn ${selectedCats.includes(key) ? 'selected' : ''}`}
                                        onClick={() => toggleCat(key)}
                                        style={{ '--cat-color': cfg.color } as React.CSSProperties}
                                    >
                                        <span className="apt-cat-emoji">{cfg.emoji}</span>
                                        <span>{cfg.label}</span>
                                        {selectedCats.includes(key) && <CheckCircle2 size={16} className="apt-cat-check" />}
                                    </button>
                                ))}
                            </div>

                            <div className="apt-config-row">
                                <label>Questions per category: <strong>{perCategory}</strong></label>
                                <input
                                    type="range" min={3} max={15} step={1}
                                    value={perCategory}
                                    onChange={e => setPerCategory(+e.target.value)}
                                    className="apt-slider"
                                />
                                <span className="apt-config-total">
                                    Total: {selectedCats.length * perCategory} questions
                                    · ~{Math.round(selectedCats.length * perCategory * 45 / 60)} min
                                </span>
                            </div>

                            {/* NEW: Test settings */}
                            <div className="apt-settings">
                                <h3 className="apt-settings-title"><Settings2 size={16} /> Test Settings</h3>
                                <div className="apt-settings-grid">
                                    <label className="apt-toggle-row">
                                        <span>
                                            <Shuffle size={15} />
                                            Randomise question order
                                        </span>
                                        <div
                                            className={`apt-toggle ${randomize ? 'on' : ''}`}
                                            onClick={() => setRandomize(r => !r)}
                                        >
                                            <div className="apt-toggle-knob" />
                                        </div>
                                    </label>
                                    <label className="apt-toggle-row">
                                        <span>
                                            <AlertTriangle size={15} />
                                            Negative marking
                                        </span>
                                        <div
                                            className={`apt-toggle ${negativeMarking ? 'on' : ''}`}
                                            onClick={() => setNegativeMarking(m => !m)}
                                        >
                                            <div className="apt-toggle-knob" />
                                        </div>
                                    </label>
                                    {negativeMarking && (
                                        <div className="apt-penalty-row">
                                            <label>Penalty per wrong answer: <strong>−{negativePenalty}</strong></label>
                                            <input
                                                type="range" min={0.25} max={1} step={0.25}
                                                value={negativePenalty}
                                                onChange={e => setNegativePenalty(parseFloat(e.target.value))}
                                                className="apt-slider"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                className="apt-start-btn"
                                onClick={handleStart}
                                disabled={selectedCats.length === 0}
                            >
                                <Zap size={18} /> Start Test
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Quiz ── */}
                {phase === 'quiz' && currentQ && (
                    <motion.div className="apt-quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Header */}
                        <div className="apt-quiz-header">
                            <div className="apt-quiz-progress-info">
                                <span className="apt-quiz-qcount">Q{currentIdx + 1} / {totalQ}</span>
                                <span className="apt-cat-pill" style={{ background: `${APTITUDE_CATEGORIES[currentQ.category].color}18`, color: APTITUDE_CATEGORIES[currentQ.category].color }}>
                                    {APTITUDE_CATEGORIES[currentQ.category].emoji} {APTITUDE_CATEGORIES[currentQ.category].label}
                                </span>
                                <span className={`apt-diff-pill apt-diff-${currentQ.difficulty}`}>{currentQ.difficulty}</span>
                                {flagged.has(currentIdx) && <span className="apt-flagged-badge"><Flag size={12} /> Flagged</span>}
                            </div>
                            <div className="apt-quiz-header-right">
                                {/* NEW: Flag button */}
                                <button
                                    className={`apt-flag-btn ${flagged.has(currentIdx) ? 'flagged' : ''}`}
                                    onClick={handleFlag}
                                    title={flagged.has(currentIdx) ? 'Unflag question' : 'Flag for review'}
                                >
                                    <Flag size={15} />
                                    {flagged.has(currentIdx) ? 'Unflag' : 'Flag'}
                                </button>
                                {/* NEW: Navigator button */}
                                <button className="apt-nav-btn" onClick={() => setShowNavigator(s => !s)}>
                                    ≡ Questions
                                </button>
                                <div className="apt-timer" style={{ color: timeLeft <= 10 ? '#ef4444' : undefined }}>
                                    <Timer size={16} />
                                    <span>{formatTime(timeLeft)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="apt-progress-bar">
                            <motion.div
                                className="apt-progress-fill"
                                animate={{ width: `${((currentIdx) / totalQ) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Stats bar — shows answered / flagged / remaining */}
                        <div className="apt-stats-bar">
                            <span className="apt-stats-item answered">{answers.filter(a => a !== null).length} Answered</span>
                            <span className="apt-stats-item flagged-count">{flagged.size} Flagged</span>
                            <span className="apt-stats-item remaining">{answers.filter(a => a === null).length} Remaining</span>
                        </div>

                        <div className="apt-quiz-body">
                            {/* Question Navigator panel */}
                            <AnimatePresence>
                                {showNavigator && (
                                    <motion.div
                                        className="apt-navigator"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <h4>Question Navigator</h4>
                                        <div className="apt-nav-legend">
                                            <span className="nav-dot answered" /> Answered
                                            <span className="nav-dot flagged" /> Flagged
                                            <span className="nav-dot current" /> Current
                                            <span className="nav-dot unanswered" /> Remaining
                                        </div>
                                        <div className="apt-nav-grid">
                                            {questions.map((_, idx) => {
                                                const st = getQStatus(idx);
                                                return (
                                                    <button
                                                        key={idx}
                                                        className={`apt-nav-item ${st}`}
                                                        onClick={() => handleJumpTo(idx)}
                                                    >
                                                        {idx + 1}
                                                        {st === 'flagged' && <Flag size={9} className="nav-flag-icon" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Question */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIdx}
                                    className="apt-question-card"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <p className="apt-question-text">{currentQ.question}</p>

                                    <div className="apt-options">
                                        {currentQ.options.map((opt, i) => {
                                            let cls = 'apt-option';
                                            if (revealed) {
                                                if (i === currentQ.correctIndex) cls += ' apt-option--correct';
                                                else if (i === chosen) cls += ' apt-option--wrong';
                                            } else if (i === chosen) {
                                                cls += ' apt-option--chosen';
                                            }
                                            return (
                                                <button key={i} className={cls} onClick={() => handleChoose(i)}>
                                                    <span className="apt-option-label">{String.fromCharCode(65 + i)}</span>
                                                    <span>{opt}</span>
                                                    {revealed && i === currentQ.correctIndex && <CheckCircle2 size={16} className="apt-option-icon" />}
                                                    {revealed && i === chosen && i !== currentQ.correctIndex && <XCircle size={16} className="apt-option-icon" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Negative marking hint */}
                                    {negativeMarking && !revealed && (
                                        <div className="apt-neg-hint">
                                            <AlertTriangle size={13} /> Negative marking active — −{negativePenalty} for wrong answer
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    <AnimatePresence>
                                        {revealed && (
                                            <motion.div
                                                className="apt-explanation"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <strong>Explanation:</strong> {currentQ.explanation}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="apt-quiz-nav">
                                        <button
                                            className="apt-prev-btn"
                                            onClick={handlePrev}
                                            disabled={currentIdx === 0}
                                        >
                                            <ChevronLeft size={16} /> Prev
                                        </button>
                                        <button
                                            className="apt-skip-btn"
                                            onClick={() => handleNext(null)}
                                        >
                                            Skip
                                        </button>
                                        <button
                                            className="apt-next-btn"
                                            onClick={() => handleNext()}
                                        >
                                            {currentIdx === totalQ - 1 ? 'Finish' : 'Next'}
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* ── Result ── */}
                {phase === 'result' && (
                    <motion.div className="apt-result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="apt-result-hero" style={{ borderColor: grade.color }}>
                            <div className="apt-result-emoji">{grade.emoji}</div>
                            <div className="apt-result-score" style={{ color: grade.color }}>{pct}%</div>
                            <div className="apt-result-grade" style={{ color: grade.color }}>{grade.label}</div>
                            <p className="apt-result-sub">{correctCount} of {totalQ} questions correct</p>
                            {negativeMarking && (
                                <p className="apt-result-raw-score">
                                    Raw Score (with −{negativePenalty}/wrong): <strong>{rawScore.toFixed(2)}</strong> / {totalQ}
                                </p>
                            )}
                            {saving && <Loader2 size={16} className="spin" style={{ color: '#94a3b8' }} />}
                        </div>

                        {/* Stats */}
                        <div className="apt-result-stats">
                            {[
                                { label: 'Correct', val: correctCount, color: '#10b981' },
                                { label: 'Wrong', val: wrongCount, color: '#ef4444' },
                                { label: 'Skipped', val: skippedCount, color: '#f59e0b' },
                                { label: 'Flagged', val: flagged.size, color: '#7c3aed' },
                                { label: 'Time', val: formatTime(elapsed), color: '#6366f1' },
                            ].map(s => (
                                <div key={s.label} className="apt-result-stat">
                                    <div className="apt-result-stat-val" style={{ color: s.color }}>{s.val}</div>
                                    <div className="apt-result-stat-lbl">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-question breakdown */}
                        <div className="apt-result-breakdown">
                            <h3>Question Breakdown</h3>
                            {questions.map((q, i) => {
                                const userAns = answers[i];
                                const correct = userAns === q.correctIndex;
                                const skipped = userAns === null;
                                const wasFlagged = flagged.has(i);
                                return (
                                    <div key={q.id} className={`apt-breakdown-row ${correct ? 'correct' : skipped ? 'skipped' : 'wrong'}`}>
                                        <span className="apt-breakdown-num">Q{i + 1}</span>
                                        <span className="apt-breakdown-q">{q.question.slice(0, 60)}…</span>
                                        {wasFlagged && <Flag size={13} color="#7c3aed" />}
                                        <span className="apt-breakdown-status">
                                            {correct ? <CheckCircle2 size={16} color="#10b981" /> : skipped ? '—' : <XCircle size={16} color="#ef4444" />}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                            <button className="apt-retry-btn" onClick={() => { setPhase('config'); setQuestions([]); setAnswers([]); setFlagged(new Set()); }}>
                                <RotateCcw size={16} /> Try Again
                            </button>
                            <Link to="/candidate/aptitude/history" className="apt-retry-btn" style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <History size={16} /> View History
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
