import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { geminiGenerate } from '../../services/geminiProxyService';
import { BarChart2, Brain, Calculator, Lightbulb, Loader2, RefreshCw, ChevronDown, ChevronUp, Sparkles, Target, Clock } from 'lucide-react';
import './CaseStudyPage.css';

type PracticeType = 'case_study' | 'guesstimate' | 'product' | 'strategy';

const PRACTICE_TYPES: { type: PracticeType; label: string; emoji: string; description: string; examples: string[] }[] = [
    {
        type: 'case_study',
        label: 'Case Study',
        emoji: '📋',
        description: 'Business problem-solving scenarios used in consulting and product interviews',
        examples: ['Profitability analysis', 'Market entry', 'Merger & Acquisition', 'Turnaround strategy'],
    },
    {
        type: 'guesstimate',
        label: 'Guesstimate',
        emoji: '🔢',
        description: 'Estimation problems that test quantitative reasoning and structured thinking',
        examples: ['No. of petrol pumps in India', 'WhatsApp messages sent daily', 'Piano tuners in NYC'],
    },
    {
        type: 'product',
        label: 'Product Design',
        emoji: '🎨',
        description: 'Design a product, improve a feature, or analyze metrics for product roles',
        examples: ['Design a feature for Instagram', 'Improve YouTube Watch Time', 'Product metrics for Swiggy'],
    },
    {
        type: 'strategy',
        label: 'Strategy',
        emoji: '♟️',
        description: 'Business strategy questions around growth, competition, and market positioning',
        examples: ['How would Paytm regain market share?', 'Uber enters a new market', 'Netflix pricing strategy'],
    },
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const DOMAIN_OPTIONS = ['Consulting', 'Tech/Product', 'E-commerce', 'FinTech', 'Healthcare', 'Ed-Tech', 'General'];

interface CaseQuestion {
    title: string;
    context: string;
    question: string;
    hints: string[];
    sampleFramework: string;
    sampleAnswer: string;
    timeAllotted: number; // minutes
}

export default function CaseStudyPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [selectedType, setSelectedType] = useState<PracticeType>('guesstimate');
    const [difficulty, setDifficulty] = useState('Medium');
    const [domain, setDomain] = useState('General');
    const [currentQuestion, setCurrentQuestion] = useState<CaseQuestion | null>(null);
    const [generating, setGenerating] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [timerActive, setTimerActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const typeConf = PRACTICE_TYPES.find(t => t.type === selectedType)!;

    const generateQuestion = async () => {
        setGenerating(true);
        setCurrentQuestion(null);
        setShowHints(false);
        setShowAnswer(false);
        setUserAnswer('');
        setTimerActive(false);
        setTimeLeft(null);
        setError(null);

        const prompt = `Generate a ${difficulty.toLowerCase()} ${typeConf.label} question for a ${domain} company interview.

Return ONLY a valid JSON object with these exact fields:
{
  "title": "Short title of the problem",
  "context": "2-3 sentences of business context/background",
  "question": "The actual question to solve",
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "sampleFramework": "Step-by-step framework to approach this (2-4 steps)",
  "sampleAnswer": "A sample structured answer with numbers/reasoning (150-200 words)",
  "timeAllotted": 15
}

Make it realistic, interview-appropriate, and specific. For guesstimates, include real Indian market context. For case studies, include financial data. No markdown, pure JSON.`;

        try {
            const raw = await geminiGenerate(prompt, { temperature: 0.8 });
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid response');
            const parsed = JSON.parse(jsonMatch[0]) as CaseQuestion;
            setCurrentQuestion(parsed);
            setTimeLeft(parsed.timeAllotted * 60);
        } catch (e) {
            setError('Failed to generate question. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // Countdown timer
    const startTimer = () => {
        if (!currentQuestion || timerActive) return;
        setTimerActive(true);
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    setTimerActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

    const content = (
        <div className="casestudy-container">
            {/* Header */}
                <motion.div className="casestudy-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="casestudy-title"><Brain size={26} /> Case Study & Guesstimate Practice</h1>
                    <p className="casestudy-subtitle">AI-powered scenarios for consulting, product, and strategy interviews</p>
                </motion.div>

                {/* Practice Type Selector */}
                <div className="casestudy-type-grid">
                    {PRACTICE_TYPES.map(t => (
                        <button key={t.type}
                            className={`casestudy-type-card ${selectedType === t.type ? 'active' : ''}`}
                            onClick={() => setSelectedType(t.type)}>
                            <span className="casestudy-type-emoji">{t.emoji}</span>
                            <span className="casestudy-type-label">{t.label}</span>
                            <span className="casestudy-type-desc">{t.description}</span>
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="casestudy-controls">
                    <div className="casestudy-control-group">
                        <label>Difficulty</label>
                        <div className="casestudy-difficulty-btns">
                            {DIFFICULTY_LEVELS.map(d => (
                                <button key={d}
                                    className={`casestudy-diff-btn ${difficulty === d ? 'active' : ''}`}
                                    onClick={() => setDifficulty(d)}>{d}</button>
                            ))}
                        </div>
                    </div>
                    <div className="casestudy-control-group">
                        <label>Domain</label>
                        <select className="casestudy-select" value={domain} onChange={e => setDomain(e.target.value)}>
                            {DOMAIN_OPTIONS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <button className="casestudy-generate-btn" onClick={generateQuestion} disabled={generating}>
                        {generating ? <Loader2 size={18} className="casestudy-spinner" /> : <Sparkles size={18} />}
                        {generating ? 'Generating...' : 'Generate Question'}
                    </button>
                </div>

                {/* Examples */}
                {!currentQuestion && !generating && (
                    <motion.div className="casestudy-examples" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3>Example {typeConf.label}s</h3>
                        <div className="casestudy-example-pills">
                            {typeConf.examples.map(ex => (
                                <span key={ex} className="casestudy-example-pill">{ex}</span>
                            ))}
                        </div>
                        <div className="casestudy-tips">
                            <Lightbulb size={14} />
                            <span>
                                {selectedType === 'guesstimate'
                                    ? 'Structure your answer: Clarify → Estimate → Calculate → Sanity Check'
                                    : 'Use frameworks like MECE, Porter\'s 5 Forces, or 4P\'s to structure your answer'}
                            </span>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <div className="casestudy-error">{error}</div>
                )}

                {/* Question Card */}
                <AnimatePresence>
                    {currentQuestion && (
                        <motion.div className="casestudy-question-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}>
                            {/* Timer */}
                            <div className="casestudy-question-meta">
                                <div className="casestudy-question-badges">
                                    <span className="casestudy-badge casestudy-badge--type">{typeConf.emoji} {typeConf.label}</span>
                                    <span className="casestudy-badge casestudy-badge--diff">{difficulty}</span>
                                    <span className="casestudy-badge casestudy-badge--domain">{domain}</span>
                                </div>
                                <div className="casestudy-timer-section">
                                    {timeLeft !== null && (
                                        <span className={`casestudy-timer ${timeLeft < 120 ? 'danger' : ''}`}>
                                            <Clock size={14} />
                                            {formatTime(timeLeft)}
                                        </span>
                                    )}
                                    {!timerActive && timeLeft !== 0 && (
                                        <button className="casestudy-start-timer" onClick={startTimer}>
                                            Start Timer
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h2 className="casestudy-question-title">{currentQuestion.title}</h2>
                            <div className="casestudy-context">{currentQuestion.context}</div>
                            <div className="casestudy-question-text">
                                <Target size={16} />
                                <p>{currentQuestion.question}</p>
                            </div>

                            {/* Answer Box */}
                            <div className="casestudy-answer-section">
                                <label className="casestudy-answer-label">Your Answer / Working</label>
                                <textarea
                                    className="casestudy-answer-textarea"
                                    placeholder="Write your structured approach here. Think out loud. Use frameworks, estimates, and reasoning..."
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    rows={8}
                                />
                            </div>

                            {/* Hints */}
                            <div className="casestudy-collapsible">
                                <button className="casestudy-collapsible-btn" onClick={() => setShowHints(p => !p)}>
                                    <Lightbulb size={15} /> Hints ({currentQuestion.hints.length})
                                    {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <AnimatePresence>
                                    {showHints && (
                                        <motion.div className="casestudy-collapsible-body"
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}>
                                            <ol className="casestudy-hints-list">
                                                {currentQuestion.hints.map((h, i) => (
                                                    <li key={i}>{h}</li>
                                                ))}
                                            </ol>
                                            <div className="casestudy-framework">
                                                <strong>Framework:</strong> {currentQuestion.sampleFramework}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Sample Answer */}
                            <div className="casestudy-collapsible">
                                <button className="casestudy-collapsible-btn casestudy-collapsible-btn--answer"
                                    onClick={() => setShowAnswer(p => !p)}>
                                    <BarChart2 size={15} /> View Sample Answer
                                    {showAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <AnimatePresence>
                                    {showAnswer && (
                                        <motion.div className="casestudy-collapsible-body casestudy-answer-reveal"
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}>
                                            <p>{currentQuestion.sampleAnswer}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Next Question */}
                            <button className="casestudy-next-btn" onClick={generateQuestion} disabled={generating}>
                                <RefreshCw size={15} />
                                {generating ? 'Generating...' : 'New Question'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <div className="casestudy-page">
            <FloatingNavbar variant="candidate" />
            {content}
        </div>
    );
}
