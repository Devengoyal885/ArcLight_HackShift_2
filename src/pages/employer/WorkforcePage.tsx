import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { workforceGaps, workforceCapabilities } from '../../data/employer';
import { ArrowRight } from 'lucide-react';
import './WorkforcePage.css';

export default function WorkforcePage() {
    return (
        <div className="wf-page">
            <FloatingNavbar variant="employer" />

            <main className="wf-main">
                <motion.div className="wf-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="wf-eyebrow">WORKFORCE INTELLIGENCE</p>
                    <h1 className="wf-title">Your next hire<br /><em>may already be here.</em></h1>
                    <p className="wf-sub">Identify capability gaps, surface internal talent, and plan verified transitions.</p>
                </motion.div>

                <div className="wf-layout">
                    {/* Capability heat map */}
                    <motion.div className="wf-capability-map" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <p className="wf-section-label">WORKFORCE CAPABILITY OVERVIEW</p>
                        <div className="wf-cap-grid">
                            {workforceCapabilities.map((wc, i) => {
                                const gapPct = 100 - Math.round((wc.current / wc.required) * 100);
                                const isGap = wc.current < wc.required;
                                return (
                                    <motion.div
                                        key={wc.label}
                                        className={`wf-cap-tile ${isGap ? 'wf-cap-tile--gap' : 'wf-cap-tile--ok'}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.06 }}
                                    >
                                        <div className="wf-tile-header">
                                            <span className="wf-tile-label">{wc.label}</span>
                                            {isGap && <span className="wf-tile-gap-badge">–{gapPct}%</span>}
                                        </div>
                                        <div className="wf-tile-track">
                                            <div className="wf-tile-fill" style={{ width: `${(wc.current / wc.required) * 100}%` }} />
                                            <div className="wf-tile-required" />
                                        </div>
                                        <div className="wf-tile-numbers">
                                            <span className="wf-tile-current">{wc.current}%</span>
                                            <span className="wf-tile-target">Req: {wc.required}%</span>
                                        </div>
                                        <span className="wf-tile-employees">{wc.employees} employees</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Internal mobility pathways */}
                    <motion.div className="wf-mobility" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <p className="wf-section-label">INTERNAL MOBILITY PATHWAYS</p>
                        <div className="wf-gaps">
                            {workforceGaps.map((gap, i) => (
                                <motion.div
                                    key={gap.role}
                                    className="wf-gap-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.12 }}
                                >
                                    <div className="wf-gap-header">
                                        <h3 className="wf-gap-role">{gap.role}</h3>
                                        <span className="wf-gap-count">Gap: {gap.gap}</span>
                                    </div>

                                    <div className="wf-gap-metrics">
                                        <div className="wf-gap-metric">
                                            <span className="wf-gm-val">{gap.current}</span>
                                            <span className="wf-gm-label">Current</span>
                                        </div>
                                        <div className="wf-gap-metric wf-gap-metric--target">
                                            <span className="wf-gm-val">{gap.required}</span>
                                            <span className="wf-gm-label">Required</span>
                                        </div>
                                        <div className="wf-gap-metric wf-gap-metric--mobility">
                                            <span className="wf-gm-val" style={{ color: '#10b981' }}>{gap.internalTransitions}</span>
                                            <span className="wf-gm-label">Internal Candidates</span>
                                        </div>
                                    </div>

                                    <div className="wf-pathway">
                                        {gap.pathway.map((step, si) => (
                                            <span key={si} className="wf-pathway-item">
                                                <span className={`wf-pathway-step ${si === 0 ? 'wf-pathway-step--start' : si === gap.pathway.length - 1 ? 'wf-pathway-step--end' : ''}`}>
                                                    {step}
                                                </span>
                                                {si < gap.pathway.length - 1 && <ArrowRight size={12} className="wf-pathway-arrow" />}
                                            </span>
                                        ))}
                                    </div>

                                    <button className="wf-mobility-btn">Explore Internal Mobility <ArrowRight size={13} /></button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
