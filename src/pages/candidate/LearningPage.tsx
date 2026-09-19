import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { learningPath, candidateCapabilities } from '../../data/candidate';
import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';
import './LearningPage.css';

export default function LearningPage() {
    const mlCap = candidateCapabilities.find(c => c.id === 'ml')!;
    const cloudCap = candidateCapabilities.find(c => c.id === 'cloud')!;

    return (
        <div className="learn-page">
            <FloatingNavbar variant="candidate" />
            <div className="learn-bg" />

            <main className="learn-main">
                <motion.div className="learn-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="learn-eyebrow">PERSONALIZED LEARNING</p>
                    <h1 className="learn-title">Close the gap.<br />Don't restart<br /><em>your journey.</em></h1>
                    <p className="learn-sub">
                        Every learning step connects directly to a measurable capability gain.
                        No generic courses. No restarting from zero.
                    </p>
                </motion.div>

                {/* Goal bar */}
                <motion.div className="learn-goal-strip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    {[
                        { cap: mlCap, from: 64, to: 78, label: 'Machine Learning' },
                        { cap: cloudCap, from: 45, to: 65, label: 'Cloud' },
                    ].map((g) => (
                        <div key={g.label} className="learn-goal-item">
                            <div className="learn-goal-labels">
                                <span className="learn-goal-name">{g.label}</span>
                                <span className="learn-goal-delta" style={{ color: g.cap.color }}>
                                    {g.from}% → {g.to}%
                                </span>
                            </div>
                            <div className="learn-goal-track">
                                <div className="learn-goal-current" style={{ width: `${g.from}%`, background: 'rgba(255,255,255,0.1)' }} />
                                <div className="learn-goal-target" style={{ width: `${g.to}%`, background: g.cap.color, opacity: 0.3 }} />
                                <div className="learn-goal-now" style={{ width: `${g.from}%`, background: g.cap.color }} />
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Weekly pathway */}
                <div className="learn-weeks">
                    {learningPath.map((week, i) => {
                        const cap = candidateCapabilities.find(c => c.id === week.capability)!;
                        return (
                            <motion.div
                                key={week.week}
                                className="learn-week-card"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                            >
                                <div className="learn-week-num" style={{ background: cap.color + '22', color: cap.color }}>
                                    WEEK {String(week.week).padStart(2, '0')}
                                </div>

                                <div className="learn-week-body">
                                    <h3 className="learn-week-title">{week.label}</h3>
                                    <div className="learn-week-exercise">
                                        <FlaskConical size={13} />
                                        {week.exercise}
                                    </div>
                                </div>

                                <div className="learn-week-gain">
                                    <div className="learn-gain-arrow" style={{ color: cap.color }}>↑</div>
                                    <span className="learn-gain-value" style={{ color: cap.color }}>
                                        +{week.toScore - week.fromScore}%
                                    </span>
                                    <span className="learn-gain-cap">{cap.label}</span>
                                </div>

                                <div className="learn-week-connector">→</div>
                                <div className="learn-week-verified">
                                    <div className="learn-verified-pill">CAPABILITY GROWTH</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="learn-cta-row">
                    <Link to="/candidate/career" className="learn-cta-btn">
                        View Career Transition Path <ArrowRight size={16} />
                    </Link>
                    <Link to="/candidate/opportunities" className="learn-cta-secondary">
                        Check Opportunity Radar <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="learn-product-loop">
                    {['LEARNING', 'CAPABILITY GROWTH', 'EVIDENCE', 'OPPORTUNITY'].map((s, i, arr) => (
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
