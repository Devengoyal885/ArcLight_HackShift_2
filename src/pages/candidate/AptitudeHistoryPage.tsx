import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GraduationCap, Trophy, Target, History, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AptitudeTestPage.css'; // Reuse styles

interface AptitudeResult {
    id: string;
    categories: string[];
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    rawScore: number;
    percentage: number;
    totalQuestions: number;
    takenAt: any;
    elapsedSeconds: number;
    negativeMarking: boolean;
}

export default function AptitudeHistoryPage() {
    const { dbUid } = useAuth();
    const [history, setHistory] = useState<AptitudeResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dbUid) return;
        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, 'users', dbUid, 'aptitudeResults'),
                    orderBy('takenAt', 'desc')
                );
                const snap = await getDocs(q);
                setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as AptitudeResult)));
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [dbUid]);

    return (
        <div className="apt-page" style={{ overflowY: 'auto' }}>
            <FloatingNavbar variant="candidate" />
            <div className="apt-content" style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
                <Link to="/candidate/aptitude" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', textDecoration: 'none', marginBottom: 24, fontWeight: 500 }}>
                    <ArrowLeft size={16} /> Back to Practice
                </Link>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="apt-config-hero" style={{ textAlign: 'left', marginBottom: 32 }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <History size={32} color="#2563eb" /> Test History
                        </h1>
                        <p>Review your past aptitude test performance.</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spin" size={32} color="#2563eb" /></div>
                    ) : history.length === 0 ? (
                        <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <Target size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ color: '#334155' }}>No tests taken yet</h3>
                            <p style={{ color: '#64748b', marginTop: 8 }}>Take your first practice test to see your history here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {history.map(res => (
                                <div key={res.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', gap: 24, alignItems: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 40, border: `4px solid ${res.percentage >= 70 ? '#10b981' : res.percentage >= 50 ? '#f59e0b' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{res.percentage}%</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', textTransform: 'capitalize' }}>
                                            {res.categories.join(', ').replace(/_/g, ' ')}
                                        </h4>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', gap: 16 }}>
                                            <span>Score: {res.rawScore} / {res.totalQuestions}</span>
                                            <span>Time: {Math.floor(res.elapsedSeconds / 60)}m {res.elapsedSeconds % 60}s</span>
                                            <span>{res.takenAt?.seconds ? new Date(res.takenAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                        </p>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: '0.85rem' }}>
                                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981' }}/> {res.correctCount} Correct</span>
                                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }}/> {res.wrongCount} Wrong</span>
                                            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#94a3b8' }}/> {res.skippedCount} Skipped</span>
                                            {res.negativeMarking && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>(Negative Marking On)</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
