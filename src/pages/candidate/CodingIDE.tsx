/**
 * CodingIDE.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium coding IDE — light theme matching the CapAble design system.
 * Supports 12 languages, live execution, AI Debug Mentor, hints, confetti,
 * submission history, and Firestore persistence.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Send, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, Cpu, Terminal,
    BookOpen, FlaskConical, Loader2, ChevronDown,
    AlertTriangle, Eye, EyeOff, RotateCcw, Info,
    Bot, Maximize, AlertCircle, Lightbulb, History,
    Zap, Trophy, X, Sparkles, Code2,
} from 'lucide-react';
import type { CodingProblem, SupportedLanguage, TestResult } from '../../types/domain';
import {
    runVisibleTests,
    submitSolution,
    calculateCodingScore,
    LANGUAGE_CONFIG,
    ALL_LANGUAGES,
} from '../../services/codeExecutionService';
import { callGeminiJSON } from '../../lib/gemini';
import { useAuth } from '../../context/AuthContext';
import { saveCodingSubmission } from '../../services/profileService';
import './CodingIDE.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    problem: CodingProblem;
    problemIndex: number;
    totalProblems: number;
    onSubmit: (results: TestResult[], score: number, code: string, language: SupportedLanguage) => void;
    onSkip: () => void;
    practiceMode?: boolean; // If true, no proctoring, no time limit pressure
}

type RunStatus = 'idle' | 'running' | 'ran' | 'submitting' | 'submitted';
type PanelTab = 'description' | 'examples' | 'testcases' | 'history';
type OutputTab = 'results' | 'console';

interface HintState {
    used: number;
    hints: string[];
    loading: boolean;
}

const MAX_HINTS = 3;
const HINT_SCORE_PENALTY = [0, 5, 10]; // score deducted per hint used

// ── Confetti Component ────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
    if (!active) return null;
    const pieces = Array.from({ length: 60 });
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return (
        <div className="ide-confetti-overlay" aria-hidden>
            {pieces.map((_, i) => (
                <div
                    key={i}
                    className="ide-confetti-piece"
                    style={{
                        left: `${Math.random() * 100}%`,
                        background: colors[i % colors.length],
                        width: `${6 + Math.random() * 8}px`,
                        height: `${6 + Math.random() * 8}px`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        animationDelay: `${Math.random() * 0.8}s`,
                        animationDuration: `${1.2 + Math.random() * 1}s`,
                    }}
                />
            ))}
        </div>
    );
}

// ── DiffView Component ────────────────────────────────────────────────────────

function DiffView({ expected, actual }: { expected: string; actual: string }) {
    const expLines = expected.split('\n');
    const actLines = actual.split('\n');
    const maxLen = Math.max(expLines.length, actLines.length);

    return (
        <div className="ide-diff-view">
            <div className="ide-diff-col">
                <div className="ide-diff-header ide-diff-header--expected">Expected</div>
                {Array.from({ length: maxLen }).map((_, i) => {
                    const line = expLines[i] ?? '';
                    const match = line === (actLines[i] ?? '');
                    return (
                        <div key={i} className={`ide-diff-line ${!match ? 'ide-diff-line--expected' : ''}`}>
                            <span className="ide-diff-num">{i + 1}</span>
                            <span className="ide-diff-text">{line || ' '}</span>
                        </div>
                    );
                })}
            </div>
            <div className="ide-diff-col">
                <div className="ide-diff-header ide-diff-header--got">Got</div>
                {Array.from({ length: maxLen }).map((_, i) => {
                    const line = actLines[i] ?? '';
                    const match = line === (expLines[i] ?? '');
                    return (
                        <div key={i} className={`ide-diff-line ${!match ? 'ide-diff-line--got' : ''}`}>
                            <span className="ide-diff-num">{i + 1}</span>
                            <span className="ide-diff-text">{line || ' '}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Language Pill ─────────────────────────────────────────────────────────────

function LangPill({ lang }: { lang: SupportedLanguage }) {
    const cfg = LANGUAGE_CONFIG[lang];
    return (
        <span
            className="ide-lang-pill"
            style={{ background: cfg.color + '15', color: cfg.color, borderColor: cfg.color + '30' }}
        >
            <Code2 size={10} />
            {cfg.label}
        </span>
    );
}

// ── Timer Component ───────────────────────────────────────────────────────────
function Timer({ startTimeRef, isStopped }: { startTimeRef: React.MutableRefObject<number>, isStopped: boolean }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (isStopped) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isStopped, startTimeRef]);

    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }

    return <span>{formatTime(elapsed)}</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CodingIDE({ problem, problemIndex, totalProblems, onSubmit, onSkip, practiceMode = false }: Props) {
    const { dbUid } = useAuth();

    const [lang, setLang] = useState<SupportedLanguage>('python');
    const [code, setCode] = useState<string>(problem.starterCode['python'] || '');
    const [panelTab, setPanelTab] = useState<PanelTab>('description');
    const [outputTab, setOutputTab] = useState<OutputTab>('results');
    const [runStatus, setRunStatus] = useState<RunStatus>('idle');
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [consoleOutput, setConsoleOutput] = useState<string>('');
    const [outputOpen, setOutputOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const [leftWidth, setLeftWidth] = useState(42);
    const [isFullscreen, setIsFullscreen] = useState(practiceMode); // practice = no fullscreen required
    const [proctorWarnings, setProctorWarnings] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hints, setHints] = useState<HintState>({ used: 0, hints: [], loading: false });
    const [showHintsPanel, setShowHintsPanel] = useState(false);
    const [showAIDrawer, setShowAIDrawer] = useState(false);
    const [aiHint, setAiHint] = useState<Record<string, string>>({});
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [submissionTime, setSubmissionTime] = useState(0);
    const startTimeRef = useRef<number>(Date.now());

    // Track code per language
    const codeMap = useRef<Record<SupportedLanguage, string>>(
        Object.fromEntries(
            ALL_LANGUAGES.map(l => [l, problem.starterCode[l] || `# Write your ${l} solution here\n`])
        ) as Record<SupportedLanguage, string>
    );

    // Proctoring (only in assessment mode)
    useEffect(() => {
        if (practiceMode) return;

        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setProctorWarnings(w => w + 1);
                alert('WARNING: Tab switch detected and recorded.');
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) || (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                alert('Developer tools are disabled during the proctored assessment.');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [practiceMode]);

    const enterFullscreen = () => document.documentElement.requestFullscreen().catch(console.error);

    // Resizer
    const handleDrag = useCallback((e: MouseEvent) => {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 75) setLeftWidth(newWidth);
    }, []);

    const handleDragEnd = useCallback(() => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, [handleDrag]);

    const startDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [handleDrag, handleDragEnd]);

    // Language change
    const handleLangChange = useCallback((newLang: SupportedLanguage) => {
        codeMap.current[lang] = code;
        setLang(newLang);
        setCode(codeMap.current[newLang] || problem.starterCode[newLang] || '');
        setLangMenuOpen(false);
        setTestResults([]);
        setRunStatus('idle');
    }, [lang, code, problem]);

    const handleCodeChange = useCallback((val: string | undefined) => {
        const v = val ?? '';
        
        // AI Authorship Detection (Cadence Monitoring)
        if (!practiceMode && Math.abs(v.length - code.length) > 15) {
            setProctorWarnings(w => w + 1);
            alert('AI Authorship Warning: Suspicious rapid code insertion detected. Typing cadence logged.');
        }

        setCode(v);
        codeMap.current[lang] = v;
    }, [lang, code, practiceMode]);

    // Request AI hint for a specific test case
    const handleAskAI = async (testCase: any, result: any) => {
        if (aiLoading === testCase.id) return;
        setAiLoading(testCase.id);
        setShowAIDrawer(true);
        try {
            const prompt = `Candidate is solving "${problem.title}" in ${LANGUAGE_CONFIG[lang].label}.
Code:\n${code}\n\nFailed test case.\nInput: ${testCase.stdin}\nExpected: ${testCase.expectedOutput}\nGot: ${result.actualOutput || result.stderr || 'No output'}\n\nGive a BRIEF hint (2-3 sentences max). Point out the logical flaw. DO NOT give the full solution or complete code.`;
            const data = await callGeminiJSON<{ hint: string }>(prompt, 'You are a concise coding mentor. Give hints, never full solutions.');
            const hint = (data as any)?.hint || (data as any)?.response || 'Check your edge cases and input parsing carefully.';
            setAiHint(prev => ({ ...prev, [testCase.id]: hint }));
        } catch {
            setAiHint(prev => ({ ...prev, [testCase.id]: 'Network error. Try again.' }));
        } finally {
            setAiLoading(null);
        }
    };

    // Request a general hint for the problem
    const handleGetHint = async () => {
        if (hints.used >= MAX_HINTS || hints.loading) return;
        setHints(h => ({ ...h, loading: true }));
        try {
            const hintNum = hints.used + 1;
            const specificity = hintNum === 1 ? 'very vague, just the approach' : hintNum === 2 ? 'more specific, mention the key algorithm' : 'specific, mention the data structure to use';
            const prompt = `Problem: "${problem.title}"\n\nDescription: ${problem.description.slice(0, 400)}\n\nProvide hint #${hintNum} of 3. Be ${specificity}. Max 2 sentences. No code.`;
            const data = await callGeminiJSON<{ hint: string }>(prompt, 'You are a coding mentor giving progressive hints.');
            const hint = (data as any)?.hint || 'Think carefully about the time complexity and edge cases.';
            setHints(h => ({ ...h, used: h.used + 1, hints: [...h.hints, hint], loading: false }));
        } catch {
            setHints(h => ({ ...h, hints: [...h.hints, 'Could not load hint. Check your connection.'], loading: false }));
        }
    };

    // Save submission to Firestore
    const saveToFirestore = async (results: TestResult[], score: number, finalCode: string, finalLang: SupportedLanguage, elapsed: number) => {
        if (!dbUid) return;
        const passed = results.filter(r => r.passed).length;
        const status = score === 100 ? 'accepted' : score > 0 ? 'partial' : 'failed';
        try {
            await saveCodingSubmission(dbUid, {
                problemId: problem.id,
                problemTitle: problem.title,
                domain: problem.domain,
                topic: problem.topic,
                difficulty: problem.difficulty,
                language: finalLang,
                code: finalCode,
                passedCount: passed,
                totalCount: results.length,
                score,
                timeTakenSeconds: elapsed,
                status,
            });
        } catch (e) {
            console.error('[CodingIDE] Firestore save failed:', e);
        }
    };

    // Run code
    const handleRun = useCallback(async () => {
        if (runStatus === 'running' || runStatus === 'submitting') return;
        setRunStatus('running');
        setOutputOpen(true);
        setOutputTab('results');
        setTestResults([]);

        try {
            const results = await runVisibleTests(problem, lang, code);
            setTestResults(results);
            setRunStatus('ran');
            const allOutput = results.map(r =>
                `[Case ${r.testCaseId.split('-').pop()}] ${r.passed ? '✓ PASS' : '✗ FAIL'}${r.error ? `\n  Error: ${r.error}` : ''}`
            ).join('\n');
            setConsoleOutput(allOutput);
        } catch {
            setRunStatus('idle');
        }
    }, [problem, lang, code, runStatus]);

    // Submit solution
    const handleSubmit = useCallback(async () => {
        if (runStatus === 'running' || runStatus === 'submitting') return;
        setRunStatus('submitting');
        setOutputOpen(true);
        setOutputTab('results');

        try {
            const results = await submitSolution(problem, lang, code);
            const hintPenalty = HINT_SCORE_PENALTY[Math.min(hints.used, 2)];
            const rawScore = calculateCodingScore(results);
            const finalScore = Math.max(0, rawScore - hintPenalty);
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

            setTestResults(results);
            setRunStatus('submitted');
            setSubmissionTime(elapsed);

            // Confetti on perfect score
            if (rawScore === 100) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }

            // Save to Firestore (non-blocking)
            saveToFirestore(results, finalScore, code, lang, elapsed);

            onSubmit(results, finalScore, code, lang);
        } catch {
            setRunStatus('idle');
        }
    }, [problem, lang, code, runStatus, hints.used, onSubmit]);

    const handleReset = useCallback(() => {
        const starter = problem.starterCode[lang] || '';
        setCode(starter);
        codeMap.current[lang] = starter;
        setTestResults([]);
        setRunStatus('idle');
    }, [problem, lang]);

    const visibleCases = problem.testCases.filter(tc => !tc.isHidden);
    const hiddenCases = problem.testCases.filter(tc => tc.isHidden);
    const passedCount = testResults.filter(r => r.passed).length;
    const allPassed = runStatus === 'submitted' && passedCount === testResults.length && testResults.length > 0;

    const difficultyColor = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };

    // Fullscreen gate (assessment mode only)
    if (!isFullscreen && !practiceMode) {
        return (
            <div className="ide-fullscreen-gate">
                <motion.div
                    className="ide-fullscreen-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="ide-fullscreen-icon">
                        <Maximize size={32} />
                    </div>
                    <h2>Full Screen Required</h2>
                    <p>This assessment is proctored. Enter full screen mode to continue.<br />
                        Switching tabs or minimising will be recorded.</p>
                    {proctorWarnings > 0 && (
                        <div className="ide-proctor-warning">
                            <AlertCircle size={14} />
                            {proctorWarnings} violation{proctorWarnings > 1 ? 's' : ''} recorded
                        </div>
                    )}
                    <button className="ide-enter-fs-btn" onClick={enterFullscreen}>
                        <Maximize size={16} /> Enter Full Screen
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="ide-root">
            <Confetti active={showConfetti} />

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="ide-topbar">
                <div className="ide-topbar-left">
                    <span className="ide-problem-counter">
                        {problemIndex + 1} / {totalProblems}
                    </span>
                    <span
                        className="ide-difficulty-badge"
                        style={{ color: difficultyColor[problem.difficulty], background: difficultyColor[problem.difficulty] + '12', borderColor: difficultyColor[problem.difficulty] + '30' }}
                    >
                        {problem.difficulty.toUpperCase()}
                    </span>
                    <span className="ide-topic-tag">{problem.topic}</span>
                </div>

                <div className="ide-topbar-center">
                    <span className="ide-prob-title-top">{problem.title}</span>
                </div>

                <div className="ide-topbar-right">
                    <div className="ide-timer">
                        <Clock size={13} />
                        <Timer startTimeRef={startTimeRef} isStopped={runStatus === 'submitted'} />
                    </div>

                    {!practiceMode && proctorWarnings > 0 && (
                        <div className="ide-proctor-pill">
                            <AlertCircle size={11} />
                            {proctorWarnings} violation{proctorWarnings > 1 ? 's' : ''}
                        </div>
                    )}

                    <button className="ide-hints-btn" onClick={() => setShowHintsPanel(h => !h)} title={`Hints (${hints.used}/${MAX_HINTS} used)`}>
                        <Lightbulb size={14} />
                        Hints {hints.used > 0 && <span className="ide-hint-count">{hints.used}/{MAX_HINTS}</span>}
                    </button>

                    <button className="ide-skip-btn" onClick={onSkip}>
                        Skip <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* ── Hints Panel (Dropdown) ────────────────────────────────── */}
            <AnimatePresence>
                {showHintsPanel && (
                    <motion.div
                        className="ide-hints-panel"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <div className="ide-hints-panel-header">
                            <span><Lightbulb size={14} /> Hints</span>
                            <button onClick={() => setShowHintsPanel(false)}><X size={14} /></button>
                        </div>
                        <p className="ide-hints-warning">Using hints reduces your score by up to 10 points each.</p>
                        <div className="ide-hints-list">
                            {hints.hints.map((hint, i) => (
                                <div key={i} className="ide-hint-item">
                                    <span className="ide-hint-num">💡 Hint {i + 1}</span>
                                    <p>{hint}</p>
                                </div>
                            ))}
                            {hints.used < MAX_HINTS && (
                                <button
                                    className="ide-get-hint-btn"
                                    onClick={handleGetHint}
                                    disabled={hints.loading}
                                >
                                    {hints.loading
                                        ? <><Loader2 size={13} className="spin" /> Generating hint…</>
                                        : <><Sparkles size={13} /> Get Hint {hints.used + 1} of {MAX_HINTS}</>
                                    }
                                </button>
                            )}
                            {hints.used >= MAX_HINTS && <p className="ide-hints-exhausted">No more hints available.</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Split Pane ───────────────────────────────────────── */}
            <div className="ide-body">

                {/* LEFT: Problem Panel */}
                <div className="ide-problem-panel" style={{ width: `${leftWidth}%` }}>
                    <div className="ide-panel-tabs">
                        {([
                            { id: 'description', icon: <BookOpen size={12} />, label: 'Problem' },
                            { id: 'examples', icon: <Info size={12} />, label: 'Examples' },
                            { id: 'testcases', icon: <FlaskConical size={12} />, label: 'Test Cases' },
                        ] as { id: PanelTab; icon: React.ReactNode; label: string }[]).map(tab => (
                            <button
                                key={tab.id}
                                className={`ide-panel-tab ${panelTab === tab.id ? 'ide-panel-tab--active' : ''}`}
                                onClick={() => setPanelTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="ide-panel-content">
                        <AnimatePresence mode="wait">
                            {panelTab === 'description' && (
                                <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                    <h2 className="ide-prob-title">{problem.title}</h2>
                                    <div className="ide-prob-meta">
                                        <span className="ide-diff-badge-sm" style={{ color: difficultyColor[problem.difficulty], background: difficultyColor[problem.difficulty] + '12', borderColor: difficultyColor[problem.difficulty] + '30' }}>
                                            {problem.difficulty.toUpperCase()}
                                        </span>
                                        <span className="ide-topic-badge">{problem.topic}</span>
                                        <span className="ide-time-badge"><Clock size={11} /> ~{Math.round(problem.timeSeconds / 60)}m</span>
                                    </div>
                                    <div className="ide-prob-description">
                                        {problem.description.startsWith('<html-content>') ? (
                                            <div dangerouslySetInnerHTML={{ __html: problem.description.replace('<html-content>', '') }} />
                                        ) : (
                                            problem.description.split('\n').map((line, i) => {
                                                if (!line.trim()) return <br key={i} />;
                                                const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                                                return (
                                                    <p key={i}>
                                                        {parts.map((p, j) =>
                                                            p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong>
                                                                : p.startsWith('`') && p.endsWith('`') ? <code key={j}>{p.slice(1, -1)}</code>
                                                                    : p
                                                        )}
                                                    </p>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="ide-constraints">
                                        <p className="ide-section-label">Constraints</p>
                                        <ul>
                                            {problem.constraints.map((c, i) => (
                                                <li key={i}><code>{c}</code></li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}

                            {panelTab === 'examples' && (
                                <motion.div key="examples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                    <p className="ide-section-label" style={{ marginBottom: 16 }}>Examples</p>
                                    {problem.examples.map((ex, i) => (
                                        <div key={i} className="ide-example">
                                            <div className="ide-example-num">Example {i + 1}</div>
                                            <div className="ide-io-block">
                                                <span className="ide-io-label">Input</span>
                                                <pre className="ide-io-pre">{ex.input}</pre>
                                            </div>
                                            <div className="ide-io-block">
                                                <span className="ide-io-label">Output</span>
                                                <pre className="ide-io-pre">{ex.output}</pre>
                                            </div>
                                            {ex.explanation && (
                                                <p className="ide-example-explain"><strong>Explanation:</strong> {ex.explanation}</p>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {panelTab === 'testcases' && (
                                <motion.div key="testcases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                    <div className="ide-tc-header">
                                        <p className="ide-section-label">Visible Cases ({visibleCases.length})</p>
                                        {hiddenCases.length > 0 && (
                                            <button className="ide-toggle-hidden" onClick={() => setShowHidden(h => !h)}>
                                                {showHidden ? <EyeOff size={11} /> : <Eye size={11} />} {hiddenCases.length} hidden
                                            </button>
                                        )}
                                    </div>
                                    {visibleCases.map((tc, i) => {
                                        const result = testResults.find(r => r.testCaseId === tc.id);
                                        return (
                                            <div key={tc.id} className={`ide-tc-card ${result ? (result.passed ? 'ide-tc-card--pass' : 'ide-tc-card--fail') : ''}`}>
                                                <div className="ide-tc-head">
                                                    <span className="ide-tc-num">Case {i + 1}</span>
                                                    {result && (
                                                        <span className={`ide-tc-status ${result.passed ? 'ide-tc-status--pass' : 'ide-tc-status--fail'}`}>
                                                            {result.passed ? <><CheckCircle2 size={11} /> Passed</> : <><XCircle size={11} /> Failed</>}
                                                            {result.executionTimeMs && ` · ${result.executionTimeMs < 1000 ? Math.round(result.executionTimeMs) + 'ms' : (result.executionTimeMs / 1000).toFixed(2) + 's'}`}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ide-io-block">
                                                    <span className="ide-io-label">Input</span>
                                                    <pre className="ide-io-pre">{tc.stdin || '(empty)'}</pre>
                                                </div>
                                                <div className="ide-io-block">
                                                    <span className="ide-io-label">Expected</span>
                                                    <pre className="ide-io-pre">{tc.expectedOutput}</pre>
                                                </div>
                                                {result && !result.passed && (
                                                    <div className="ide-io-block">
                                                        <span className="ide-io-label ide-io-label--err">Got</span>
                                                        <pre className="ide-io-pre ide-io-pre--err">{result.actualOutput || '(empty)'}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {showHidden && hiddenCases.map((tc, i) => (
                                        <div key={tc.id} className="ide-tc-card ide-tc-card--hidden">
                                            <div className="ide-tc-head">
                                                <span className="ide-tc-num">Hidden {i + 1}</span>
                                                <span className="ide-tc-hidden-label"><EyeOff size={11} /> Hidden</span>
                                            </div>
                                            <p className="ide-tc-hidden-msg">Input hidden. Run to see if it passes.</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Resizer */}
                <div className="ide-resizer" onMouseDown={startDrag} title="Drag to resize" />

                {/* RIGHT: Editor Panel */}
                <div className="ide-editor-panel">

                    {/* Editor Toolbar */}
                    <div className="ide-editor-toolbar">
                        <div className="ide-lang-selector">
                            <button className="ide-lang-btn" onClick={() => setLangMenuOpen(o => !o)}>
                                <Cpu size={13} />
                                <LangPill lang={lang} />
                                <ChevronDown size={11} className={langMenuOpen ? 'rotated' : ''} />
                            </button>
                            <AnimatePresence>
                                {langMenuOpen && (
                                    <motion.div
                                        className="ide-lang-menu"
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.12 }}
                                    >
                                        <p className="ide-lang-menu-label">Select Language</p>
                                        <div className="ide-lang-grid">
                                            {ALL_LANGUAGES.map(l => {
                                                const cfg = LANGUAGE_CONFIG[l];
                                                return (
                                                    <button
                                                        key={l}
                                                        className={`ide-lang-option ${lang === l ? 'ide-lang-option--active' : ''}`}
                                                        onClick={() => handleLangChange(l)}
                                                        style={lang === l ? { background: cfg.color + '12', borderColor: cfg.color + '40' } : {}}
                                                    >
                                                        {lang === l && <CheckCircle2 size={11} style={{ color: cfg.color }} />}
                                                        <span style={{ color: lang === l ? cfg.color : undefined }}>{cfg.label}</span>
                                                        <span className="ide-lang-ext">{cfg.extension}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="ide-editor-actions">
                            <button className="ide-action-btn ide-action-btn--ghost" onClick={handleReset} title="Reset to starter code">
                                <RotateCcw size={13} /> Reset
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div
                        className="ide-monaco-wrap"
                        onContextMenu={!practiceMode ? e => e.preventDefault() : undefined}
                    >
                        <Editor
                            height="100%"
                            language={LANGUAGE_CONFIG[lang].monacoId}
                            value={code}
                            onChange={handleCodeChange}
                            onMount={(editor, monaco) => {
                                if (!practiceMode) {
                                    // Disable copy/paste in assessment mode
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
                                        alert('Copying is disabled during the assessment.');
                                    });
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
                                        alert('Pasting is disabled during the assessment.');
                                    });
                                }
                            }}
                            theme="vs"
                            options={{
                                fontSize: 13.5,
                                fontFamily: "'Fira Code', 'SF Mono', Menlo, Consolas, monospace",
                                fontLigatures: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                renderLineHighlight: 'gutter',
                                bracketPairColorization: { enabled: true },
                                padding: { top: 16, bottom: 16 },
                                suggestOnTriggerCharacters: true,
                                quickSuggestions: true,
                                tabSize: 4,
                                wordWrap: 'on',
                                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                                overviewRulerLanes: 0,
                                contextmenu: practiceMode,
                            }}
                        />
                    </div>

                    {/* ── Output Panel ──────────────────────────────────── */}
                    <div className={`ide-output-panel ${outputOpen ? 'ide-output-panel--open' : ''}`}>
                        <div className="ide-output-header" onClick={() => setOutputOpen(o => !o)}>
                            <div className="ide-output-header-left">
                                <Terminal size={13} />
                                <span>Output</span>
                                {runStatus !== 'idle' && testResults.length > 0 && (
                                    <span className={`ide-output-summary ${allPassed ? 'ide-output-summary--all-pass' : passedCount > 0 ? 'ide-output-summary--partial' : 'ide-output-summary--fail'}`}>
                                        {passedCount}/{testResults.length} passed
                                    </span>
                                )}
                                {(runStatus === 'running' || runStatus === 'submitting') && (
                                    <span className="ide-output-running">
                                        <Loader2 size={12} className="spin" />
                                        {runStatus === 'submitting' ? 'Judging all cases…' : 'Running…'}
                                    </span>
                                )}
                                {allPassed && (
                                    <span className="ide-output-all-pass">
                                        <Trophy size={12} /> All Passed!
                                    </span>
                                )}
                            </div>
                            <div className="ide-output-header-right">
                                <div className="ide-output-tabs">
                                    <button className={`ide-output-tab ${outputTab === 'results' ? 'active' : ''}`} onClick={e => { e.stopPropagation(); setOutputTab('results'); }}>Results</button>
                                    <button className={`ide-output-tab ${outputTab === 'console' ? 'active' : ''}`} onClick={e => { e.stopPropagation(); setOutputTab('console'); }}>Console</button>
                                </div>
                                <ChevronDown size={14} className={`ide-output-chevron ${outputOpen ? 'rotated' : ''}`} />
                            </div>
                        </div>

                        <AnimatePresence>
                            {outputOpen && (
                                <motion.div
                                    className="ide-output-body"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 240, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                >
                                    {outputTab === 'results' && (
                                        <div className="ide-results-content">
                                            {runStatus === 'idle' && (
                                                <div className="ide-output-empty">
                                                    <Play size={20} strokeWidth={1.5} />
                                                    <span>Click <strong>Run Code</strong> to test against visible cases</span>
                                                </div>
                                            )}
                                            {(runStatus === 'running' || runStatus === 'submitting') && (
                                                <div className="ide-output-empty">
                                                    <Loader2 size={20} className="spin" />
                                                    <span>{runStatus === 'submitting' ? 'Judging all test cases…' : 'Running visible test cases…'}</span>
                                                </div>
                                            )}
                                            {testResults.length > 0 && runStatus !== 'running' && runStatus !== 'submitting' && (
                                                <div className="ide-tc-results-grid">
                                                    {testResults.map((r, i) => (
                                                        <div key={r.testCaseId} className={`ide-result-row ${r.passed ? 'ide-result-row--pass' : 'ide-result-row--fail'}`}>
                                                            <div className="ide-result-row-head">
                                                                {r.passed
                                                                    ? <CheckCircle2 size={14} className="ide-result-icon--pass" />
                                                                    : <XCircle size={14} className="ide-result-icon--fail" />
                                                                }
                                                                <span className="ide-result-case-label">{r.isHidden ? `Hidden ${i + 1}` : `Case ${i + 1}`}</span>
                                                                {r.executionTimeMs !== undefined && (
                                                                    <span className="ide-result-time">
                                                                        {r.executionTimeMs < 1000 ? `${Math.round(r.executionTimeMs)}ms` : `${(r.executionTimeMs / 1000).toFixed(2)}s`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!r.passed && (
                                                                <div className="ide-result-diff">
                                                                    {!r.isHidden && (
                                                                        <>
                                                                            <DiffView expected={r.expectedOutput} actual={r.actualOutput || ''} />
                                                                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                                                <button
                                                                                    className="ide-ai-mentor-btn"
                                                                                    onClick={() => {
                                                                                        const tc = problem.testCases.find(t => t.id === r.testCaseId);
                                                                                        if (tc) handleAskAI(tc, r);
                                                                                    }}
                                                                                    disabled={aiLoading === r.testCaseId}
                                                                                >
                                                                                    {aiLoading === r.testCaseId ? <Loader2 size={13} className="spin" /> : <Bot size={13} />}
                                                                                    Ask AI Mentor
                                                                                </button>
                                                                                {aiHint[r.testCaseId] && (
                                                                                    <div className="ide-ai-hint-box">
                                                                                        <Zap size={13} />
                                                                                        <span><strong>AI Hint: </strong>{aiHint[r.testCaseId]}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {r.error && (
                                                                        <div className="ide-result-error">
                                                                            <AlertTriangle size={12} /> {r.error}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {outputTab === 'console' && (
                                        <div className="ide-console-content">
                                            <pre className="ide-console-pre">{consoleOutput || '> No output yet. Run your code to see results.'}</pre>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Bar */}
                    <div className="ide-action-bar">
                        <div className="ide-action-bar-left">
                            <button className="ide-action-btn ide-action-btn--ghost" onClick={onSkip}>
                                <ChevronLeft size={14} /> Skip
                            </button>
                        </div>
                        <div className="ide-action-bar-right">
                            <button
                                className={`ide-action-btn ide-action-btn--run ${runStatus === 'running' ? 'ide-action-btn--loading' : ''}`}
                                onClick={handleRun}
                                disabled={runStatus === 'running' || runStatus === 'submitting'}
                            >
                                {runStatus === 'running'
                                    ? <><Loader2 size={14} className="spin" /> Running…</>
                                    : <><Play size={14} /> Run Code</>
                                }
                            </button>
                            <button
                                className={`ide-action-btn ide-action-btn--submit ${runStatus === 'submitting' ? 'ide-action-btn--loading' : ''} ${runStatus === 'submitted' ? 'ide-action-btn--done' : ''}`}
                                onClick={handleSubmit}
                                disabled={runStatus === 'running' || runStatus === 'submitting' || runStatus === 'submitted'}
                            >
                                {runStatus === 'submitting'
                                    ? <><Loader2 size={14} className="spin" /> Judging…</>
                                    : runStatus === 'submitted'
                                        ? <><CheckCircle2 size={14} /> Submitted</>
                                        : <><Send size={14} /> Submit</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Mentor Drawer ──────────────────────────────────────── */}
            <AnimatePresence>
                {showAIDrawer && (
                    <>
                        <motion.div
                            className="ide-drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAIDrawer(false)}
                        />
                        <motion.div
                            className="ide-ai-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <div className="ide-ai-drawer-header">
                                <div className="ide-ai-drawer-title">
                                    <Bot size={18} />
                                    <span>AI Debug Mentor</span>
                                </div>
                                <button className="ide-ai-drawer-close" onClick={() => setShowAIDrawer(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="ide-ai-drawer-body">
                                {Object.entries(aiHint).length === 0 && !aiLoading && (
                                    <div className="ide-ai-empty">
                                        <Bot size={32} strokeWidth={1.2} />
                                        <p>Click "Ask AI Mentor" next to a failed test case to get a debug hint.</p>
                                    </div>
                                )}
                                {aiLoading && (
                                    <div className="ide-ai-loading">
                                        <Loader2 size={20} className="spin" />
                                        <p>Analysing your code…</p>
                                    </div>
                                )}
                                {Object.entries(aiHint).map(([tcId, hint]) => (
                                    <div key={tcId} className="ide-ai-message">
                                        <div className="ide-ai-message-header">
                                            <Zap size={13} />
                                            <span>Case {tcId.split('-').pop()}</span>
                                        </div>
                                        <p>{hint}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
