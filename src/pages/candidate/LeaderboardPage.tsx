import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Target, Zap, User, Medal, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboard, type LeaderboardUser } from '../../services/scoreService';
import './LeaderboardPage.css';

export default function LeaderboardPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { profile } = useAuth();
    const [topStudents, setTopStudents] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard(5).then(users => {
            // Fill with empty slots if not enough users
            const filled = [...users];
            while (filled.length < 5) {
                filled.push({
                    id: `empty-${filled.length}`,
                    name: 'Pending Qualification',
                    score: 0,
                    branch: 'N/A',
                    trend: 'flat',
                    change: '0'
                });
            }
            setTopStudents(filled);
            setLoading(false);
        });
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Real-Time Standings...</div>;

    return (
        <div className={`lb-page ${isEmbedded ? 'embedded' : ''}`}>
            <div className="lb-header">
                <div className="lb-header-text">
                    <h1>College Leaderboard</h1>
                    <p>Competitive benchmarking against your peers based on CapAble Score.</p>
                </div>
                <div className="lb-user-stat">
                    <div className="lb-stat-label">Global Percentile</div>
                    <div className="lb-stat-value">94th <TrendingUp size={16} color="#10b981" /></div>
                </div>
            </div>

            <div className="lb-podium-container">
                <div className="lb-podium place-2">
                    <div className="lb-podium-avatar"><User size={24} /></div>
                    <div className="lb-podium-name">{topStudents[1].name}</div>
                    <div className="lb-podium-score">{topStudents[1].score}</div>
                    <div className="lb-podium-bar place-2-bar">
                        <span className="lb-podium-rank">2</span>
                    </div>
                </div>
                <div className="lb-podium place-1">
                    <div className="lb-podium-avatar gold-ring"><Medal size={24} color="#fbbf24" /></div>
                    <div className="lb-podium-name">{topStudents[0].name}</div>
                    <div className="lb-podium-score">{topStudents[0].score}</div>
                    <div className="lb-podium-bar place-1-bar">
                        <span className="lb-podium-rank">1</span>
                    </div>
                </div>
                <div className="lb-podium place-3">
                    <div className="lb-podium-avatar"><User size={24} /></div>
                    <div className="lb-podium-name">{topStudents[2].name}</div>
                    <div className="lb-podium-score">{topStudents[2].score}</div>
                    <div className="lb-podium-bar place-3-bar">
                        <span className="lb-podium-rank">3</span>
                    </div>
                </div>
            </div>

            <div className="lb-list-container">
                <div className="lb-list-header">
                    <div>Rank</div>
                    <div>Student</div>
                    <div>Branch</div>
                    <div style={{ textAlign: 'right' }}>Score</div>
                    <div style={{ textAlign: 'right' }}>Trend</div>
                </div>
                {topStudents.map((student, idx) => {
                    const rank = idx + 1;
                    const isYou = profile?.name ? student.name === profile.name : false;
                    return (
                    <motion.div 
                        key={student.id}
                        className={`lb-list-row ${isYou ? 'lb-list-row-active' : ''}`}
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="lb-list-rank">
                            {rank <= 3 ? <Trophy size={16} className={`trophy-${rank}`} /> : rank}
                        </div>
                        <div className="lb-list-student">
                            <div className="lb-list-avatar"><User size={14} /></div>
                            <span style={{ fontWeight: isYou ? 600 : 400 }}>{student.name}</span>
                            {isYou && <span className="lb-you-badge">You</span>}
                        </div>
                        <div className="lb-list-branch">{student.branch}</div>
                        <div className="lb-list-score">{student.score}</div>
                        <div className={`lb-list-trend ${student.trend === 'up' ? 'text-green-500' : student.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                            {student.trend === 'up' ? <TrendingUp size={14} /> : student.trend === 'down' ? <TrendingDown size={14} /> : <span style={{ opacity: 0.5 }}>-</span>}
                            <span>{student.change}</span>
                        </div>
                    </motion.div>
                )})}
            </div>

            <div className="lb-promo-card">
                <div className="lb-promo-icon"><Zap size={24} color="#a855f7" /></div>
                <div className="lb-promo-text">
                    <h3>Boost your CapAble Score</h3>
                    <p>Complete your AI Mock Interview to gain up to +50 points and overtake the 2nd rank.</p>
                </div>
                <button className="lb-promo-btn">Start Interview <ArrowRight size={14} /></button>
            </div>
        </div>
    );
}
