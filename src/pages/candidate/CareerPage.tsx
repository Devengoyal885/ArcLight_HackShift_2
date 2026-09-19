import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { SkillGapIndicator } from '../../components/capability/SkillGapIndicator';
import { careerTarget } from '../../data/candidate';
import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import './CareerPage.css';

export default function CareerPage() {
    const [started, setStarted] = useState(false);
    const gaps = careerTarget.requiredCapabilities.filter(c => c.status !== 'met');

    return (
        <div className="career-page">
            <FloatingNavbar variant="candidate" />

            <div className="career-bg" />

            <main className="career-main">
                <motion.div className="career-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="career-eyebrow">CAREER PATH</p>
                    <h1 className="career-title">Where do you want your<br /><em>capability</em> to take you?</h1>
                    <p className="career-sub">CapAble? maps your capabilities to a role and shows the exact verified transition path.</p>
                </motion.div>

                <div className="career-layout">
                    {/* Left: Target + Gap Analysis */}
                    <motion.div className="career-analysis" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <div className="career-target-card">
                            <div className="career-target-icon"><Target size={20} /></div>
                            <div>
                                <p className="career-target-label">Target Role</p>
                                <h2 className="career-target-role">{careerTarget.role}</h2>
                            </div>
                            <div className="career-gap-count">{gaps.length} gaps</div>
                        </div>

                        <div className="career-caps">
                            {careerTarget.requiredCapabilities.map((cap, i) => (
                                <motion.div
                                    key={cap.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                >
                                    <SkillGapIndicator
                                        label={cap.label}
                                        current={cap.current}
                                        required={cap.required}
                                        status={cap.status}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Transition Pathway */}
                    <motion.div className="career-pathway" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                        <p className="career-pathway-heading">Your shortest verified transition path</p>

                        <div className="career-steps">
                            {careerTarget.transitionPath.map((step, i) => (
                                <motion.div
                                    key={step.step}
                                    className="career-step"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                >
                                    <div className={`career-step-icon career-step-icon--${step.type}`}>
                                        {step.step}
                                    </div>
                                    <div className="career-step-body">
                                        <p className="career-step-label">{step.label}</p>
                                        <p className="career-step-duration">{step.duration}</p>
                                    </div>
                                    <div className={`career-step-type career-step-type--${step.type}`}>
                                        {step.type.toUpperCase()}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="career-ctas">
                            <button
                                className={`career-start-btn ${started ? 'career-start-btn--started' : ''}`}
                                onClick={() => setStarted(true)}
                            >
                                {started ? '✓ Transition Path Active' : 'Start My Transition'}
                                {!started && <ArrowRight size={16} />}
                            </button>
                            <Link to="/candidate/learning" className="career-learn-link">
                                View personalized learning path <ArrowRight size={14} />
                            </Link>
                        </div>

                        {started && (
                            <motion.div
                                className="career-started-banner"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                CapAble? has updated your learning plan based on this transition target.
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
