import { motion } from 'framer-motion';
import { ChartLineUp, Users, Buildings, CheckCircle, DotsThreeOutlineVertical } from '@phosphor-icons/react';
import './HeroDashboardMock.css';

export function HeroDashboardMock() {
    return (
        <motion.div 
            className="hd-mock"
            initial={{ opacity: 0, rotateX: 10, y: 40 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Top Bar */}
            <div className="hd-topbar">
                <div className="hd-traffic-lights">
                    <div className="hd-dot hd-dot-red" />
                    <div className="hd-dot hd-dot-yellow" />
                    <div className="hd-dot hd-dot-green" />
                </div>
                <div className="hd-title">Placement Pipeline • 2026 Batch</div>
            </div>

            {/* Dashboard Content */}
            <div className="hd-body">
                {/* Sidebar */}
                <div className="hd-sidebar">
                    <div className="hd-nav-item hd-nav-active"><ChartLineUp weight="duotone" size={20} /></div>
                    <div className="hd-nav-item"><Users weight="duotone" size={20} /></div>
                    <div className="hd-nav-item"><Buildings weight="duotone" size={20} /></div>
                </div>

                {/* Main Area */}
                <div className="hd-main">
                    {/* Header */}
                    <div className="hd-header">
                        <div>
                            <div className="hd-eyebrow">Active Drive</div>
                            <div className="hd-h1">Google — SWE Intern</div>
                        </div>
                        <div className="hd-badge">84 Applicants</div>
                    </div>

                    {/* Pipeline Kanban */}
                    <div className="hd-kanban">
                        {/* Column 1 */}
                        <div className="hd-column">
                            <div className="hd-col-title">Shortlisted <span>(3)</span></div>
                            <div className="hd-card-stack">
                                <KanbanCard name="Rahul V." role="Frontend" score="96%" />
                                <KanbanCard name="Priya S." role="Fullstack" score="94%" />
                                <KanbanCard name="Amit K." role="Backend" score="91%" delay={0.1} />
                            </div>
                        </div>
                        
                        {/* Column 2 */}
                        <div className="hd-column">
                            <div className="hd-col-title">Final Round <span>(2)</span></div>
                            <div className="hd-card-stack">
                                <KanbanCard name="Sneha M." role="System Design" score="98%" active delay={0.2} />
                                <KanbanCard name="Karan T." role="DSA" score="95%" delay={0.3} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function KanbanCard({ name, role, score, active = false, delay = 0 }: { name: string, role: string, score: string, active?: boolean, delay?: number }) {
    return (
        <motion.div 
            className={`hd-kcard ${active ? 'hd-kcard-active' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="hd-kcard-top">
                <div className="hd-avatar">{name.charAt(0)}</div>
                <div className="hd-kcard-info">
                    <div className="hd-kcard-name">{name}</div>
                    <div className="hd-kcard-role">{role}</div>
                </div>
                <DotsThreeOutlineVertical size={16} weight="fill" className="hd-dots" />
            </div>
            <div className="hd-kcard-bottom">
                <div className="hd-score-pill">Match: {score}</div>
                {active && <div className="hd-status-dot" />}
            </div>
        </motion.div>
    );
}
