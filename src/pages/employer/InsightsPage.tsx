import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { insightsData } from '../../data/employer';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import './InsightsPage.css';

export default function InsightsPage() {
    return (
        <div className="insights-page">
            <FloatingNavbar variant="employer" />

            <main className="insights-main">
                <motion.div className="insights-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="insights-eyebrow">CAPABILITY INSIGHTS</p>
                    <h1 className="insights-title">Intelligence that drives<br /><em>workforce decisions.</em></h1>
                    <p className="insights-sub">Evidence-based analytics — not guesses about your talent landscape.</p>
                </motion.div>

                <div className="insights-grid">
                    {/* Role demand chart */}
                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="insights-card-header">
                            <h3 className="insights-card-title">Open Role Demand</h3>
                            <span className="insights-card-badge insights-card-badge--up">↑ 33% vs Q1</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={insightsData.rolesDemand}>
                                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Capability gap chart */}
                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="insights-card-header">
                            <h3 className="insights-card-title">Top Capability Gaps</h3>
                            <span className="insights-card-badge insights-card-badge--warn">8 critical</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={insightsData.capabilityGaps} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="capability" type="category" tick={{ fontSize: 11, fill: '#4e5462' }} axisLine={false} tickLine={false} width={120} />
                                <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="gap" fill="#f4845f" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Internal mobility chart */}
                    <motion.div className="insights-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="insights-card-header">
                            <h3 className="insights-card-title">Internal Mobility Progress</h3>
                            <span className="insights-card-badge insights-card-badge--up">17 potential</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={insightsData.internalMobilityMonths}>
                                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9aa0b0' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="potential" fill="#e2e5ec" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="insights-legend">
                            <span className="insights-legend-item insights-legend-item--green">Completed transitions</span>
                            <span className="insights-legend-item insights-legend-item--gray">Total potential</span>
                        </div>
                    </motion.div>

                    {/* Key insight cards */}
                    <motion.div className="insights-card insights-card--highlight" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <p className="insights-highlight-label">KEY INSIGHT</p>
                        <p className="insights-highlight-text">
                            11 current software engineers have the capability foundation required to transition
                            to ML Engineer roles within 6–8 weeks with targeted learning programs.
                        </p>
                        <p className="insights-highlight-sub">
                            Estimated hiring cost saving: <strong>₹48L</strong> vs external recruitment.
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
