import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { MetricStrip } from '../../components/ui/MetricStrip';
import { employerProfile, workforceCapabilities } from '../../data/employer';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './EmployerDashboard.css';

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
}

// Organization capability map node positions (conceptual SVG layout)
const mapNodes = [
    { id: 'python', label: 'Python', x: 340, y: 120, score: 78, color: '#2563eb' },
    { id: 'ml', label: 'ML', x: 520, y: 80, score: 42, color: '#f59e0b' },
    { id: 'cloud', label: 'Cloud', x: 640, y: 200, score: 55, color: '#f4845f' },
    { id: 'data', label: 'Data Analysis', x: 180, y: 200, score: 71, color: '#0ea5e9' },
    { id: 'research', label: 'Research', x: 340, y: 300, score: 62, color: '#7c3aed' },
    { id: 'leadership', label: 'Leadership', x: 520, y: 280, score: 58, color: '#10b981' },
    { id: 'comms', label: 'Communication', x: 680, y: 360, score: 74, color: '#6366f1' },
];

const edges = [
    ['python', 'ml'], ['python', 'data'], ['ml', 'cloud'],
    ['data', 'research'], ['research', 'leadership'], ['ml', 'leadership'],
    ['leadership', 'comms'], ['cloud', 'comms'],
];

export default function EmployerDashboard() {
    const { user } = useAuth();
    const greeting = useMemo(() => getGreeting(), []);

    // Resolve company name: Firebase displayName > localStorage profile > static mock
    const storedProfile = (() => {
        try { return JSON.parse(localStorage.getItem('employerProfile') || '{}'); } catch { return {}; }
    })();
    const companyName = user?.displayName || storedProfile.companyName || employerProfile.name;

    return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />

            <main className="emp-dash-main">
                {/* Greeting */}
                <motion.div className="emp-dash-greeting" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="emp-dash-time">{greeting}</p>
                    <h1 className="emp-dash-org">{companyName}.</h1>
                    <p className="emp-dash-sub">Your capability landscape is changing.</p>
                </motion.div>

                {/* Metric Strip */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <MetricStrip metrics={[
                        { label: 'Open Roles', value: employerProfile.openRoles, accent: '#fff' },
                        { label: 'Capability Gaps', value: employerProfile.capabilityGaps, accent: '#f4845f' },
                        { label: 'Potential Internal Moves', value: employerProfile.internalMoves, accent: '#10b981' },
                        { label: 'Verified Talent', value: employerProfile.verifiedTalent, accent: '#2563eb' },
                    ]} />
                </motion.div>

                {/* Layout */}
                <div className="emp-dash-layout">
                    {/* Organization Capability Map */}
                    <motion.div className="emp-dash-map-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <div className="emp-dash-map-header">
                            <h2 className="emp-dash-map-title">Organization Capability Map</h2>
                            <Link to="/employer/workforce" className="emp-dash-map-link">
                                Full Workforce View <ArrowRight size={13} />
                            </Link>
                        </div>

                        {/* SVG map */}
                        <div className="emp-map-svg-wrap">
                            <svg viewBox="0 0 820 440" className="emp-map-svg">
                                {/* Edges */}
                                {edges.map(([a, b]) => {
                                    const na = mapNodes.find(n => n.id === a)!;
                                    const nb = mapNodes.find(n => n.id === b)!;
                                    return (
                                        <line key={`${a}-${b}`}
                                            x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                                            stroke="rgba(255,255,255,0.07)" strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}
                                {/* Nodes */}
                                {mapNodes.map((node) => {
                                    const r = 36;
                                    const circumference = 2 * Math.PI * (r - 5);
                                    const offset = circumference - (node.score / 100) * circumference;
                                    return (
                                        <g key={node.id}>
                                            <circle cx={node.x} cy={node.y} r={r} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                                            <circle
                                                cx={node.x} cy={node.y} r={r - 5}
                                                fill="none" stroke={node.color} strokeWidth={3}
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                transform={`rotate(-90 ${node.x} ${node.y})`}
                                                style={{ filter: `drop-shadow(0 0 4px ${node.color}80)` }}
                                            />
                                            <text x={node.x} y={node.y - 4} textAnchor="middle" dominantBaseline="middle"
                                                fontSize="13" fontWeight="700" fill="white" fontFamily="Inter,sans-serif">
                                                {node.score}%
                                            </text>
                                            <text x={node.x} y={node.y + 12} textAnchor="middle" dominantBaseline="middle"
                                                fontSize="9" fill="rgba(255,255,255,0.45)" fontFamily="Inter,sans-serif">
                                                {node.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Capability bars below map */}
                        <div className="emp-dash-bars">
                            {workforceCapabilities.slice(0, 4).map((wc) => {
                                const gap = wc.required - wc.current;
                                return (
                                    <div key={wc.label} className="emp-dash-bar-row">
                                        <span className="emp-dash-bar-label">{wc.label}</span>
                                        <div className="emp-dash-bar-track">
                                            <div className="emp-dash-bar-fill" style={{ width: `${(wc.current / wc.required) * 100}%` }} />
                                        </div>
                                        <span className="emp-dash-bar-val">{wc.current}%</span>
                                        {gap > 0 && <span className="emp-dash-bar-gap">–{gap}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Right Panel */}
                    <motion.div className="emp-dash-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                        {/* Capability flow */}
                        <div className="emp-dash-flow-card">
                            <p className="emp-dash-flow-label">Capability Intelligence Flow</p>
                            {[
                                { step: 'CURRENT CAPABILITY', color: '#2563eb' },
                                { step: 'ROLE DEMAND', color: '#7c3aed' },
                                { step: 'CAPABILITY GAP', color: '#f4845f' },
                                { step: 'AVAILABLE TALENT', color: '#0ea5e9' },
                                { step: 'INTERNAL MOBILITY', color: '#10b981' },
                            ].map((item, i, arr) => (
                                <div key={item.step} className="emp-flow-item">
                                    <div className="emp-flow-dot" style={{ background: item.color }} />
                                    <span className="emp-flow-step">{item.step}</span>
                                    {i < arr.length - 1 && <div className="emp-flow-line" />}
                                </div>
                            ))}
                        </div>

                        {/* Quick links */}
                        <div className="emp-dash-quick">
                            {[
                                { label: 'Find talent for AI Engineer', to: '/employer/talent', icon: '◎' },
                                { label: 'View workforce gaps', to: '/employer/workforce', icon: '△' },
                                { label: 'Internal mobility opportunities', to: '/employer/workforce', icon: '→' },
                                { label: 'Capability insights', to: '/employer/insights', icon: '~' },
                            ].map(link => (
                                <Link key={link.label} to={link.to} className="emp-quick-link">
                                    <span className="emp-quick-icon">{link.icon}</span>
                                    <span className="emp-quick-label">{link.label}</span>
                                    <TrendingUp size={13} className="emp-quick-arrow" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
