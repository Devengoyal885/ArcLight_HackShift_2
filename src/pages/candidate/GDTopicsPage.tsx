import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Users, Search, Target, CheckCircle2, ChevronRight, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { geminiGenerate } from '../../services/geminiProxyService';
import './GDTopicsPage.css';

const CATEGORIES = ['Abstract', 'Current Affairs', 'Business & Economy', 'Social Issues', 'Technology'];

export default function GDTopicsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Current Affairs');
    const [aiTipsLoading, setAiTipsLoading] = useState<string | null>(null);
    const [aiTipsResult, setAiTipsResult] = useState<{ topic: string, tips: string } | null>(null);

    const MOCK_TOPICS = [
        { id: '1', title: 'Is Artificial Intelligence a threat to humanity?', category: 'Technology', difficulty: 'Medium' },
        { id: '2', title: 'Impact of 5G on Global Economy', category: 'Technology', difficulty: 'Hard' },
        { id: '3', title: 'Should Cryptocurrencies be banned?', category: 'Business & Economy', difficulty: 'Hard' },
        { id: '4', title: 'Four-day work week: Pros and Cons', category: 'Business & Economy', difficulty: 'Medium' },
        { id: '5', title: 'Climate Change: Are we doing enough?', category: 'Social Issues', difficulty: 'Easy' },
        { id: '6', title: 'Red or Blue?', category: 'Abstract', difficulty: 'Hard' },
        { id: '7', title: 'Zero', category: 'Abstract', difficulty: 'Hard' },
        { id: '8', title: 'Role of Social Media in Modern Democracy', category: 'Current Affairs', difficulty: 'Medium' },
    ];

    const filtered = MOCK_TOPICS.filter(t => 
        (selectedCategory === 'All' || t.category === selectedCategory) &&
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleGetAiTips = async (topic: string) => {
        setAiTipsLoading(topic);
        setAiTipsResult(null);
        try {
            const prompt = `Provide 3 actionable tips for a Group Discussion on the topic: "${topic}".
Include:
1. Best opening statement approach.
2. Key statistics or facts to drop.
3. Common pitfalls to avoid.
Be highly structured, concise, and professional.`;
            const res = await geminiGenerate(prompt, { temperature: 0.7 });
            setAiTipsResult({ topic, tips: res });
        } catch (e) {
            console.error(e);
        } finally {
            setAiTipsLoading(null);
        }
    };

    const content = (
        <>
            {!isEmbedded && <div className="gd-bg"></div>}

            <main className="gd-main">
                <motion.div 
                    className="gd-hero"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="gd-hero-content">
                        <span className="gd-eyebrow">COMMUNICATION PREP</span>
                        <h1 className="gd-title">Group Discussion <em>Hub</em></h1>
                        <p className="gd-subtitle">Practice the latest GD topics, get AI-powered talking points, and master your communication round.</p>
                    </div>
                </motion.div>
                <div className="gd-filters">
                    <div className="gd-search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search topics..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <div className="gd-category-chips">
                        <button 
                            className={`gd-chip ${selectedCategory === 'All' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('All')}
                        >
                            All
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
                    <div className="gd-topic-list">
                        {filtered.length === 0 ? (
                            <div className="gd-empty">
                                <AlertCircle size={24} />
                                <p>No topics found matching your criteria.</p>
                            </div>
                        ) : (
                            filtered.map(topic => (
                                <div key={topic.id} className="gd-card">
                                    <div className="gd-card-header">
                                        <span className="gd-card-category">{topic.category}</span>
                                        <span className={`gd-card-diff ${topic.difficulty.toLowerCase()}`}>{topic.difficulty}</span>
                                    </div>
                                    <h3 className="gd-card-title">{topic.title}</h3>
                                    
                                    <div className="gd-card-actions">
                                        <button 
                                            className="gd-action-btn primary"
                                            onClick={() => handleGetAiTips(topic.title)}
                                            disabled={aiTipsLoading === topic.title}
                                        >
                                            {aiTipsLoading === topic.title ? (
                                                <>Loading...</>
                                            ) : (
                                                <><Sparkles size={16} /> Get AI Talking Points</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="gd-sidebar">
                        <AnimatePresence>
                            {aiTipsResult && (
                                <motion.div 
                                    className="gd-ai-panel"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <h3><Sparkles size={18} /> AI Tips for:</h3>
                                    <p className="gd-ai-topic">"{aiTipsResult.topic}"</p>
                                    <div className="gd-ai-content">
                                        {aiTipsResult.tips}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="gd-tips-widget">
                            <h3><Target size={18} /> Golden GD Rules</h3>
                            <ul className="gd-rules-list">
                                <li><CheckCircle2 size={16} color="#10b981" /> <strong>Enter Early:</strong> Try to speak within the first 60 seconds.</li>
                                <li><CheckCircle2 size={16} color="#10b981" /> <strong>Listen Actively:</strong> Nod and build upon others' points.</li>
                                <li><CheckCircle2 size={16} color="#10b981" /> <strong>Structure:</strong> Use frameworks (PESTLE, Pros/Cons).</li>
                                <li><CheckCircle2 size={16} color="#ef4444" /> <strong>Don't Dominate:</strong> Quality &gt; Quantity.</li>
                                <li><CheckCircle2 size={16} color="#ef4444" /> <strong>No Personal Attacks:</strong> Maintain absolute professionalism.</li>
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
