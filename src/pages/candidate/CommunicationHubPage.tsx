import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Link, useNavigate } from 'react-router-dom';
import { 
    MessageSquare, Video, Mic, Target, 
    Sparkles, ArrowRight, Play, BookOpen, 
    Award, TrendingUp, ChevronRight, Square, Loader2, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInterviewStats, type InterviewStats } from '../../services/interviewHistoryService';
import './CommunicationHubPage.css';

// Declare Web Speech API types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function CommunicationHubPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const navigate = useNavigate();
    const { user, dbUid } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'voice' | 'inbox' | 'announcements'>('overview');
    const [statsLoading, setStatsLoading] = useState(true);
    const [interviewStats, setInterviewStats] = useState<InterviewStats | null>(null);

    // Load real stats from Firestore
    useEffect(() => {
        if (!user || !dbUid) return;
        getInterviewStats(dbUid)
            .then(s => setInterviewStats(s))
            .catch(console.error)
            .finally(() => setStatsLoading(false));
    }, [user, dbUid]);

    const trendLabel = interviewStats?.trend === 'improving' ? '↑ Improving'
        : interviewStats?.trend === 'declining' ? '↓ Declining'
        : interviewStats?.trend === 'new' ? 'First session'
        : '→ Stable';

    // Real dynamic stats
    const stats = [
        { label: 'Fluency Score', value: statsLoading ? '—' : interviewStats?.totalSessions ? `${interviewStats.avgFluencyScore}/100` : 'N/A', icon: <Target size={18} />, color: '#f43f5e' },
        { label: 'Trend', value: statsLoading ? '—' : interviewStats?.totalSessions ? trendLabel : 'No data', icon: <TrendingUp size={18} />, color: '#10b981' },
        { label: 'Interviews Done', value: statsLoading ? '—' : String(interviewStats?.totalSessions ?? 0), icon: <Video size={18} />, color: '#6366f1' },
        { label: 'Avg WPM', value: statsLoading ? '—' : interviewStats?.totalSessions ? `${interviewStats.avgWpm} wpm` : 'N/A', icon: <BookOpen size={18} />, color: '#f59e0b' },
    ];

    // Massive Curated Structured Curriculum grouped by themes
    const curriculumCollections = [
        {
            category: "Behavioral Foundations (The STAR Method)",
            description: "Master the fundamental frameworks required to structure your answers logically.",
            videos: [
                { title: 'Mastering the STAR Method', embedId: '8PfewNdMGEg', desc: 'Jeff Su breaks down how to answer "Tell me about a time..."', badge: 'Essential' },
                { title: 'Behavioral Interviews for SWE', embedId: 'sv-3crA1img', desc: 'freeCodeCamp\'s 1.5-hour deep dive covering the top 50 questions.', badge: 'Deep Dive' },
                { title: 'The "Yes, And..." Mentality', embedId: 't2z9mdX1j4A', desc: 'How to make your behavioral answers more conversational.', badge: 'Tip' },
            ]
        },
        {
            category: "Senior Engineering & FAANG",
            description: "Advanced mock interviews and expectations for senior-level candidates.",
            videos: [
                { title: 'Senior FAANG Engineer Mock', embedId: '9hH9hP1j1yQ', desc: 'Exponent\'s analysis on seniority signals and framing complex projects.', badge: 'Mock' },
                { title: 'System Design Behavioral Wrap-up', embedId: 'c6BNeGNyIis', desc: 'How to talk about trade-offs and team conflicts on large systems.', badge: 'Advanced' },
                { title: 'Amazon Leadership Principles', embedId: 'B-WdK0g1YUY', desc: 'Deep dive into Amazon\'s LPs and how to map your stories to them.', badge: 'Culture' },
            ]
        },
        {
            category: "Salary Negotiation & Growth",
            description: "Tactics for getting the compensation you deserve.",
            videos: [
                { title: 'Salary Negotiation Tactics', embedId: 'XY5SeCl_gKw', desc: 'Advanced strategies for negotiating your software engineering package.', badge: 'Must Watch' },
                { title: 'Explaining Employment Gaps', embedId: 'sK-5vGgBf8Y', desc: 'Andrew LaCivita\'s scripts for explaining gaps or rapid job changes.', badge: 'Script' },
                { title: 'Why Should We Hire You?', embedId: '4-O0qO8K8gE', desc: 'How to close the interview and leave a lasting impression.', badge: 'Closing' },
            ]
        }
    ];

    // --- Voice Practice Logic ---
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
    const recognitionRef = useRef<any>(null);
    const promptText = "To optimize our distributed systems, we must decouple the monolithic architecture and implement a microservices pattern, ensuring high availability and fault tolerance across all nodes.";

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            
            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setVoiceTranscript(currentTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert("Speech recognition not supported in this browser. Try Chrome.");
        
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            calculateAccuracy(voiceTranscript);
        } else {
            setVoiceTranscript('');
            setAccuracyScore(null);
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const calculateAccuracy = (transcript: string) => {
        if (!transcript) return;
        const normalize = (s: string) => s.toLowerCase().replace(/[.,!?'"]/g, '').trim();
        const promptWords = normalize(promptText).split(' ');
        const transcriptWords = normalize(transcript).split(' ');
        
        let matches = 0;
        transcriptWords.forEach(w => {
            if (promptWords.includes(w)) matches++;
        });
        
        const score = Math.min(100, Math.round((matches / promptWords.length) * 100));
        setAccuracyScore(score);
    };

    const content = (
        <>
            {!isEmbedded && <div className="comm-bg" />}

            <main className="comm-main">
                {/* ── Hero Section ── */}
                <motion.div 
                    className="comm-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="comm-hero-content">
                        <span className="comm-eyebrow"><Sparkles size={16} /> Real-Time AI Training</span>
                        <h1 className="comm-title">Speak with <em>Confidence</em>. <br/>Ace every interview.</h1>
                        <p className="comm-subtitle">
                            Master your soft skills, analyze your actual voice, and practice with our fully integrated Vapi AI mock interviews.
                        </p>
                    </div>
                    
                    <div className="comm-hero-stats">
                        {stats.map((s, i) => (
                            <motion.div 
                                key={s.label}
                                className="comm-stat-card"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="comm-stat-icon" style={{ color: s.color, backgroundColor: `${s.color}15` }}>
                                    {s.icon}
                                </div>
                                <div className="comm-stat-info">
                                    <div className="comm-stat-value">{s.value}</div>
                                    <div className="comm-stat-label">{s.label}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Action Grid ── */}
                <div className="comm-action-grid">
                    <motion.div 
                        className="comm-action-card comm-action-primary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => navigate('/candidate/communication/interview')}
                    >
                        <div className="comm-action-bg-blob"></div>
                        <div className="comm-action-content">
                            <div className="comm-action-icon"><Video size={32} /></div>
                            <h3>Start AI Mock Interview</h3>
                            <p>Powered by Vapi.ai. Speak naturally to a real AI recruiter. Get instant feedback on your pacing and filler words.</p>
                            <span className="comm-btn-inline">Launch Simulator <ArrowRight size={16} /></span>
                        </div>
                    </motion.div>

                    <div className="comm-action-col">
                        <motion.div 
                            className="comm-action-card comm-action-secondary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            onClick={() => navigate('/candidate/preparation?tab=assessments')}
                        >
                            <div className="comm-action-content">
                                <div className="comm-action-header">
                                    <MessageSquare size={24} color="#f43f5e" />
                                    <span className="comm-action-badge">Live Scoring</span>
                                </div>
                                <h3>Workplace Scenarios</h3>
                                <p>Real-world scenario assessments impacting your actual profile score.</p>
                                <span className="comm-link">Take Assessment <ChevronRight size={14} /></span>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="comm-action-card comm-action-secondary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => {
                                setActiveTab('voice');
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
                        >
                            <div className="comm-action-content">
                                <div className="comm-action-header">
                                    <Mic size={24} color="#10b981" />
                                    <span className="comm-action-badge" style={{ background: '#10b98120', color: '#10b981'}}>STT Analysis</span>
                                </div>
                                <h3>Pronunciation Check</h3>
                                <p>Read technical text out loud and let our speech engine rate your accuracy.</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="comm-action-card comm-action-secondary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={() => {
                                alert("Searching for a peer online... (This would connect to a WebRTC signaling server in production)");
                            }}
                        >
                            <div className="comm-action-content">
                                <div className="comm-action-header">
                                    <Users size={24} color="#3b82f6" />
                                    <span className="comm-action-badge" style={{ background: '#3b82f620', color: '#3b82f6'}}>Live Match</span>
                                </div>
                                <h3>Peer Mock Interview</h3>
                                <p>Match with a real peer on Capable to practice case studies or system design.</p>
                                <span className="comm-link" style={{ color: '#3b82f6' }}>Find a Peer <ChevronRight size={14} /></span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ── Tabs Content ── */}
                <div className="comm-tabs">
                    <button className={`comm-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`comm-tab ${activeTab === 'lessons' ? 'active' : ''}`} onClick={() => setActiveTab('lessons')}>Video Lessons</button>
                    <button className={`comm-tab ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>Voice Check</button>
                    <button className={`comm-tab ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>Inbox & Messages</button>
                    <button className={`comm-tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
                </div>

                <div className="comm-tab-content">
                    {(activeTab === 'overview' || activeTab === 'lessons') && (
                        <motion.div 
                            className="comm-library-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {activeTab === 'overview' ? (
                                // Show just a preview in overview
                                <div className="comm-lessons-grid real-videos">
                                    {curriculumCollections[0].videos.slice(0, 2).map(lesson => (
                                        <div key={lesson.title} className="comm-yt-card">
                                            <div className="comm-module-badge">{lesson.badge}</div>
                                            <div className="yt-iframe-container">
                                                <iframe src={`https://www.youtube.com/embed/${lesson.embedId}`} title={lesson.title} allowFullScreen></iframe>
                                            </div>
                                            <div className="comm-lesson-info">
                                                <h4>{lesson.title}</h4>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="comm-more-card" onClick={() => setActiveTab('lessons')}>
                                        <Award size={32} color="#6366f1" />
                                        <h4>Explore Full Library</h4>
                                        <span>3 categories, 9+ premium lessons</span>
                                    </div>
                                </div>
                            ) : (
                                // Full Library View
                                <div className="comm-full-library">
                                    <div className="library-header">
                                        <h2>The Interview Masterclass Library</h2>
                                        <p>Curated from the best of YouTube, structured specifically for Software Engineers.</p>
                                    </div>
                                    
                                    {curriculumCollections.map((collection, idx) => (
                                        <div key={idx} className="library-collection">
                                            <div className="collection-header">
                                                <h3>{collection.category}</h3>
                                                <p>{collection.description}</p>
                                            </div>
                                            <div className="comm-lessons-grid real-videos">
                                                {collection.videos.map(lesson => (
                                                    <div key={lesson.title} className="comm-yt-card">
                                                        <div className="comm-module-badge">{lesson.badge}</div>
                                                        <div className="yt-iframe-container">
                                                            <iframe src={`https://www.youtube.com/embed/${lesson.embedId}`} title={lesson.title} allowFullScreen></iframe>
                                                        </div>
                                                        <div className="comm-lesson-info">
                                                            <h4>{lesson.title}</h4>
                                                            <p className="comm-lesson-desc">{lesson.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'voice' && (
                        <motion.div 
                            className="comm-voice-practice"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="cv-prompt">
                                <h3>Read this text aloud to test your pronunciation accuracy:</h3>
                                <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: '#0f172a', borderLeft: '4px solid #6366f1', paddingLeft: '24px', margin: '24px 0' }}>
                                    "{promptText}"
                                </p>
                            </div>
                            
                            <div className="cv-controls-real">
                                <button 
                                    className={`cv-btn-real ${isRecording ? 'recording' : ''}`} 
                                    onClick={toggleRecording}
                                >
                                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                                    {isRecording ? "Stop & Analyze" : "Start Reading"}
                                </button>
                                
                                {isRecording && (
                                    <div className="cv-listening">
                                        <div className="rec-dot"></div> Listening via Web Speech API...
                                    </div>
                                )}
                            </div>

                            {voiceTranscript && (
                                <div className="cv-transcript-box">
                                    <strong>What we heard:</strong>
                                    <p>{voiceTranscript}</p>
                                </div>
                            )}

                            {accuracyScore !== null && (
                                <div className="cv-score-box" style={{ background: accuracyScore > 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                                    <h2 style={{ color: accuracyScore > 80 ? '#10b981' : '#f59e0b', margin: 0, fontSize: '3rem' }}>
                                        {accuracyScore}%
                                    </h2>
                                    <span style={{ color: '#94a3b8' }}>Pronunciation Accuracy</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'inbox' && (
                        <motion.div 
                            className="comm-inbox"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Direct Messages</h2>
                                    <p style={{ color: '#64748b' }}>Connect directly with recruiters and hiring managers.</p>
                                </div>
                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>2 Unread</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { name: 'Sarah Jenkins', role: 'Technical Recruiter at Google', msg: 'Hi! I saw your recent project on CapAble and would love to chat about an open role...', time: '10:30 AM', unread: true },
                                    { name: 'David Chen', role: 'Engineering Manager at Meta', msg: 'Your system design assessment scores are impressive. Let me know when you are free.', time: 'Yesterday', unread: true },
                                    { name: 'Amanda Smith', role: 'HR at Stripe', msg: 'Thanks for applying. We will get back to you soon.', time: '2 days ago', unread: false }
                                ].map((m, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', background: m.unread ? '#f8fafc' : '#fff', border: m.unread ? '1px solid #e2e8f0' : '1px solid transparent', cursor: 'pointer' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#4f46e5' }}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{m.time}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{m.role}</div>
                                            <div style={{ fontSize: '14px', color: m.unread ? '#1e293b' : '#64748b', fontWeight: m.unread ? 500 : 400 }}>{m.msg}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'announcements' && (
                        <motion.div 
                            className="comm-announcements"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}
                        >
                            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>College Announcements</h2>
                            <p style={{ color: '#64748b', marginBottom: '24px' }}>Important updates from your placement cell and institution.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { title: 'Pre-Placement Talk: Amazon', date: 'Oct 15, 2026', type: 'Event', desc: 'Mandatory session for all eligible students. Amazon will be discussing the SDE-1 role and recruitment process.' },
                                    { title: 'Resume Submission Deadline', date: 'Oct 12, 2026', type: 'Deadline', desc: 'Final date to submit your tailored resumes on the portal for the upcoming Mega Placement Drive.' },
                                    { title: 'New CapAble Feature: AI Mock Interviews', date: 'Oct 10, 2026', type: 'Update', desc: 'The institution has enabled Vapi AI mock interviews for all students. Practice now in the Comm Hub.' }
                                ].map((a, i) => (
                                    <div key={i} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${a.type === 'Deadline' ? '#ef4444' : a.type === 'Event' ? '#3b82f6' : '#10b981'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>{a.title}</h3>
                                            <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>{a.date}</span>
                                        </div>
                                        <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 600, color: a.type === 'Deadline' ? '#ef4444' : a.type === 'Event' ? '#3b82f6' : '#10b981', marginBottom: '8px' }}>{a.type}</span>
                                        <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </>
    );

    if (isEmbedded) return content;

    return (
        <div className="comm-page">
            <FloatingNavbar variant="candidate" />
            {content}
        </div>
    );
}
