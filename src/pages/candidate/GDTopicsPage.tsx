import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Search, Target, CheckCircle2, AlertCircle, Sparkles, Loader2, Copy, Check, X, BookOpen, ThumbsUp, ShieldAlert, Award } from 'lucide-react';
import { geminiGenerate } from '../../services/geminiProxyService';
import './GDTopicsPage.css';

const CATEGORIES = ['Abstract', 'Current Affairs', 'Business & Economy', 'Social Issues', 'Technology'];

interface Topic {
    id: string;
    title: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    frameworkHint?: string;
}

const MOCK_TOPICS: Topic[] = [
    { id: '1', title: 'Is Artificial Intelligence a threat to humanity?', category: 'Technology', difficulty: 'Medium', frameworkHint: 'PESTLE: Tech & Ethics' },
    { id: '2', title: 'Impact of 5G on Global Economy', category: 'Technology', difficulty: 'Hard', frameworkHint: 'Infrastructure & Industry 4.0' },
    { id: '3', title: 'Should Cryptocurrencies be banned?', category: 'Business & Economy', difficulty: 'Hard', frameworkHint: 'Pros/Cons & Financial Regulation' },
    { id: '4', title: 'Four-day work week: Pros and Cons', category: 'Business & Economy', difficulty: 'Medium', frameworkHint: 'Productivity vs Operations' },
    { id: '5', title: 'Climate Change: Are we doing enough?', category: 'Social Issues', difficulty: 'Easy', frameworkHint: 'Global Policy vs Individual Action' },
    { id: '6', title: 'Red or Blue?', category: 'Abstract', difficulty: 'Hard', frameworkHint: 'Symbolism & Lateral Thinking' },
    { id: '7', title: 'Zero', category: 'Abstract', difficulty: 'Hard', frameworkHint: 'Invention, Reset & Philosophy' },
    { id: '8', title: 'Role of Social Media in Modern Democracy', category: 'Current Affairs', difficulty: 'Medium', frameworkHint: 'Free Speech vs Misinformation' },
];

// Fallback talking points in case of network timeouts
const FALLBACK_POINTS: Record<string, string> = {
    'Should Cryptocurrencies be banned?': `1. Best Opening Hook:
"Rather than a blanket ban or uninhibited laissez-faire, cryptocurrencies represent an architectural tension between sovereign monetary policy and decentralized innovation. The question is whether prohibition works, or if targeted institutional regulation is the wiser economic strategy."

2. Key Facts & Statistical Anchors:
- Over 110 countries (representing 95% of global GDP) are actively exploring Central Bank Digital Currencies (CBDCs).
- Banning decentralized networks introduces jurisdictional arbitrage — capital and developer talent migrate to crypto-friendly jurisdictions like Dubai, Singapore, and Switzerland.
- Illicit volume in crypto represents less than 0.35% of total transactions according to Chainalysis, while cash remains the primary vehicle for off-book financial crimes.

3. Common Pitfalls to Avoid:
- Don't equate Bitcoin directly with fiat money failure.
- Avoid dogmatic black-and-white arguments; evaluate investor protection, taxation, and systemic financial stability.`,

    'default': `1. Best Opening Hook:
"To dissect this topic effectively, let us establish both the macro context and the key stakeholders impacted. A balanced viewpoint should evaluate economic, societal, and long-term implications before drawing conclusions."

2. Key Facts & Discussion Drivers:
- Frame the problem using the 360-degree approach: evaluate short-term trade-offs versus sustainable long-term outcomes.
- Quantify points with real-world examples, regulatory policies, and industrial milestones.
- Build consensus: Synthesize contrasting perspectives from peers rather than aggressively opposing them.

3. Common Pitfalls to Avoid:
- Monopolizing conversational airspace without adding concrete data.
- Reacting emotionally instead of deploying structured frameworks (e.g. Pros vs Cons, PESTLE analysis).`
};

export default function GDTopicsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Business & Economy');
    const [aiTipsLoading, setAiTipsLoading] = useState<string | null>(null);
    const [aiTipsResult, setAiTipsResult] = useState<{ topic: string, tips: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const filtered = MOCK_TOPICS.filter(t => 
        (selectedCategory === 'All' || t.category === selectedCategory) &&
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleGetAiTips = async (topic: string) => {
        setAiTipsLoading(topic);
        setAiTipsResult(null);
        setErrorMsg(null);
        setCopied(false);

        try {
            const prompt = `You are an elite corporate group discussion coach. Provide 3 highly structured, actionable tips for a Group Discussion on the topic: "${topic}".
Format with clear numbered sections:
1. Best Opening Statement Hook (a compelling 30-second perspective that commands attention without being aggressive).
2. Key Statistics, Facts & Arguments (2-3 concrete facts, real-world examples, or frameworks to drop).
3. Common Pitfalls to Avoid (what 90% of candidates do wrong on this specific topic).
Keep it crisp, professional, and ready to use in a live GD round.`;

            const res = await geminiGenerate(prompt, { temperature: 0.7 });
            if (res && res.trim().length > 30) {
                setAiTipsResult({ topic, tips: res.trim() });
            } else {
                // Use curated talking points
                const fallback = FALLBACK_POINTS[topic] || FALLBACK_POINTS['default'];
                setAiTipsResult({ topic, tips: fallback });
            }
        } catch (e: any) {
            console.error('[GDTopics] AI generation failed:', e);
            // Seamlessly provide high quality curated points so user experience is never blocked
            const fallback = FALLBACK_POINTS[topic] || FALLBACK_POINTS['default'];
            setAiTipsResult({ topic, tips: fallback });
        } finally {
            setAiTipsLoading(null);
        }
    };

    const handleCopy = () => {
        if (!aiTipsResult) return;
        navigator.clipboard.writeText(`GD Talking Points: ${aiTipsResult.topic}\n\n${aiTipsResult.tips}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const content = (
        <>
            {!isEmbedded && <div className="gd-bg"></div>}

            <main className="gd-main">
                <motion.div 
                    className="gd-hero"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="gd-hero-content">
                        <span className="gd-eyebrow">
                            <Sparkles size={14} /> COMMUNICATION PREP & ROUND MASTERY
                        </span>
                        <h1 className="gd-title">Group Discussion <em>Hub</em></h1>
                        <p className="gd-subtitle">
                            Master high-impact GD rounds with curated corporate topics, AI-generated opening hooks, and structured debate frameworks.
                        </p>
                    </div>
                </motion.div>

                <div className="gd-filters">
                    <div className="gd-search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search topics (e.g. Cryptocurrency, AI, 5G, Economy)..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                        {search && (
                            <button className="gd-search-clear" onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="gd-category-chips">
                        <button 
                            className={`gd-chip ${selectedCategory === 'All' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('All')}
                        >
                            All Topics
                        </button>
                        {CATEGORIES.map(c => (
                            <button 
                                key={c}
                                className={`gd-chip ${selectedCategory === c ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="gd-layout">
                    {/* Left Column: Topics List */}
                    <div className="gd-topic-list">
                        {filtered.length === 0 ? (
                            <div className="gd-empty">
                                <AlertCircle size={28} />
                                <p>No discussion topics match "{search}".</p>
                                <button className="gd-chip" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            filtered.map(topic => {
                                const isLoadingThis = aiTipsLoading === topic.title;
                                const isSelected = aiTipsResult?.topic === topic.title;

                                return (
                                    <div key={topic.id} className={`gd-card ${isSelected ? 'selected' : ''}`}>
                                        <div className="gd-card-header">
                                            <span className="gd-card-category">{topic.category}</span>
                                            <div className="gd-card-badges">
                                                {topic.frameworkHint && (
                                                    <span className="gd-card-framework">
                                                        <BookOpen size={11} /> {topic.frameworkHint}
                                                    </span>
                                                )}
                                                <span className={`gd-card-diff ${topic.difficulty.toLowerCase()}`}>
                                                    {topic.difficulty}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="gd-card-title">{topic.title}</h3>

                                        <div className="gd-card-actions">
                                            <button 
                                                className={`gd-action-btn primary ${isLoadingThis ? 'loading' : ''}`}
                                                onClick={() => handleGetAiTips(topic.title)}
                                                disabled={isLoadingThis}
                                            >
                                                {isLoadingThis ? (
                                                    <>
                                                        <Loader2 size={16} className="gd-spin" />
                                                        <span>Analyzing Angles...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} />
                                                        <span>{isSelected ? 'Regenerate Talking Points' : 'Get AI Talking Points'}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right Column: AI Analysis Panel & Rules */}
                    <div className="gd-sidebar">
                        <AnimatePresence mode="wait">
                            {/* Loading state in sidebar */}
                            {aiTipsLoading && (
                                <motion.div 
                                    key="loading"
                                    className="gd-ai-panel loading-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="gd-ai-loading-header">
                                        <div className="gd-ai-pulsing-icon">
                                            <Sparkles size={20} className="gd-pulse" />
                                        </div>
                                        <div>
                                            <h4>Formulating Talking Points</h4>
                                            <p className="gd-ai-loading-sub">Consulting AI Knowledge Base...</p>
                                        </div>
                                    </div>
                                    <div className="gd-shimmer-box">
                                        <div className="gd-shimmer-line line-1"></div>
                                        <div className="gd-shimmer-line line-2"></div>
                                        <div className="gd-shimmer-line line-3"></div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Result State */}
                            {aiTipsResult && !aiTipsLoading && (
                                <motion.div 
                                    key="result"
                                    className="gd-ai-panel"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="gd-ai-panel-header">
                                        <div className="gd-ai-badge">
                                            <Sparkles size={14} /> AI Talking Points
                                        </div>
                                        <div className="gd-ai-header-actions">
                                            <button 
                                                className={`gd-icon-btn ${copied ? 'copied' : ''}`}
                                                onClick={handleCopy}
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                                                <span>{copied ? 'Copied' : 'Copy'}</span>
                                            </button>
                                            <button 
                                                className="gd-icon-btn close"
                                                onClick={() => setAiTipsResult(null)}
                                                title="Dismiss"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="gd-ai-topic">"{aiTipsResult.topic}"</h3>

                                    <div className="gd-ai-content">
                                        {aiTipsResult.tips}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Golden Rules Widget */}
                        <div className="gd-tips-widget">
                            <div className="gd-widget-header">
                                <div className="gd-widget-icon">
                                    <Target size={18} color="#6366f1" />
                                </div>
                                <div>
                                    <h3>Golden GD Rules</h3>
                                    <span className="gd-widget-subtitle">Evaluator Scoring Criteria</span>
                                </div>
                            </div>

                            <ul className="gd-rules-list">
                                <li>
                                    <CheckCircle2 size={16} className="rule-icon success" />
                                    <div>
                                        <strong>Enter Early (First 60s):</strong>
                                        <p>Establish composure and demonstrate proactive initiative.</p>
                                    </div>
                                </li>
                                <li>
                                    <CheckCircle2 size={16} className="rule-icon success" />
                                    <div>
                                        <strong>Active Synthesis:</strong>
                                        <p>Acknowledge previous speaker points before adding your dimension.</p>
                                    </div>
                                </li>
                                <li>
                                    <CheckCircle2 size={16} className="rule-icon success" />
                                    <div>
                                        <strong>Deploy Frameworks:</strong>
                                        <p>Use structured lenses (PESTLE, Short vs Long term, 360° impact).</p>
                                    </div>
                                </li>
                                <li>
                                    <ShieldAlert size={16} className="rule-icon danger" />
                                    <div>
                                        <strong>Never Monopolize:</strong>
                                        <p>Evaluators penalize dominant speaking time. Quality &gt; Volume.</p>
                                    </div>
                                </li>
                                <li>
                                    <ShieldAlert size={16} className="rule-icon danger" />
                                    <div>
                                        <strong>No Confrontational Attacks:</strong>
                                        <p>Disagree politely with "I see that angle, yet let us also weigh..."</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );

    if (isEmbedded) return content;

    return (
        <div className="gd-page">
            <FloatingNavbar variant="candidate" />
            {content}
        </div>
    );
}
