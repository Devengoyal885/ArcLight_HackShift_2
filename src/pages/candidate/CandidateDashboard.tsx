import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { IdentityCard3D } from '../../components/3d/IdentityCard3D';
import { CapabilityScore } from '../../components/capability/CapabilityScore';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { candidateCapabilities, opportunities } from '../../data/candidate';
import { candidateProfile } from '../../data/candidate';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CandidateDashboard.css';

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
}

const stateColors = { 'READY NOW': '#10b981', 'NEAR MATCH': '#2563eb', 'SKILL-BUILDING': '#f59e0b' };

export default function CandidateDashboard() {
    const { user } = useAuth();
    const [activeCapability, setActiveCapability] = useState<string | null>(null);
    const strongest = candidateCapabilities[0];

    // Dynamic user data — fall back to static mock if not set
    const displayName = user?.displayName || candidateProfile.name;
    const firstName = displayName.split(' ')[0];
    const initials = displayName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
    const photoURL = user?.photoURL || null;
    const greeting = useMemo(() => getGreeting(), []);

    useEffect(() => {
        setTimeout(() => {
            const el = document.elementFromPoint(1200, 400);
            if (el) {
                console.log("ROGUE_ELEMENT>>> tagName:", el.tagName, " className:", el.className, " id:", el.id, " html:", el.outerHTML.substring(0, 100));
            }
        }, 1500);
    }, []);

    return (
        <div className="c-dash">
            <FloatingNavbar variant="candidate" />

            {/* Atmospheric background */}
            <div className="c-dash-bg">
                <div className="c-dash-orb c-dash-orb--1" />
                <div className="c-dash-orb c-dash-orb--2" />
                <div className="c-dash-grid" />
            </div>

            {/* Page content */}
            <main className="c-dash-main">
                {/* Top greeting */}
                <motion.div
                    className="c-dash-greeting"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="c-dash-time-label">{greeting}</p>
                    <h1 className="c-dash-name">{firstName}.</h1>
                    <p className="c-dash-subheading">Here's what your capability is becoming.</p>
                </motion.div>

                {/* Asymmetric 3-column layout */}
                <div className="c-dash-grid-layout">

                    {/* ─── LEFT: Strongest Capability ─── */}
                    <motion.div
                        className="c-dash-left"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="c-dash-cap-card">
                            <p className="c-dash-section-label">Your strongest capability right now</p>
                            <div className="c-dash-cap-hero">
                                <div className="c-dash-cap-name">{strongest.label}</div>
                                <div className="c-dash-cap-score">
                                    <CapabilityScore score={strongest.score} size="lg" color={strongest.color} />
                                </div>
                            </div>
                            <VerificationBadge state="VERIFIED" />
                            <div className="c-dash-evidence-tags">
                                <span className="c-dash-evidence-tag">4 projects</span>
                                <span className="c-dash-evidence-tag">2 assessments</span>
                                <span className="c-dash-evidence-tag">1 publication</span>
                            </div>
                            <Link to="/candidate/capability" className="c-dash-see-all">
                                View full Capability Twin <ChevronRight size={14} />
                            </Link>
                        </div>

                        {/* Growth velocity */}
                        <div className="c-dash-velocity">
                            <TrendingUp size={16} style={{ color: '#10b981' }} />
                            <span>{candidateProfile.growthVelocity}</span>
                        </div>
                    </motion.div>

                    {/* ─── CENTER: 3D Identity Card ─── */}
                    <motion.div
                        className="c-dash-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <IdentityCard3D
                            name={displayName}
                            role={candidateProfile.role}
                            initials={photoURL ? '' : initials}
                            capabilityConfidence={candidateProfile.capabilityConfidence}
                            verifiedEvidence={candidateProfile.verifiedEvidence}
                            projectCount={candidateProfile.projectCount}
                        />

                        {/* Capability bars below card */}
                        <div className="c-dash-cap-bars">
                            {candidateCapabilities.map((cap) => (
                                <button
                                    key={cap.id}
                                    className={`c-dash-cap-bar ${activeCapability === cap.id ? 'active' : ''}`}
                                    onClick={() => setActiveCapability(activeCapability === cap.id ? null : cap.id)}
                                >
                                    <div className="c-dash-cap-bar-header">
                                        <span className="c-dash-cap-bar-label">{cap.label}</span>
                                        <span className="c-dash-cap-bar-pct" style={{ color: cap.color }}>{cap.score}%</span>
                                    </div>
                                    <div className="c-dash-cap-bar-track">
                                        <div
                                            className="c-dash-cap-bar-fill"
                                            style={{ width: `${cap.score}%`, background: cap.color }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* IDENTITY → CAPABILITY → EVIDENCE micro-flow */}
                        <div className="c-dash-flow">
                            {['IDENTITY', 'CAPABILITY', 'EVIDENCE'].map((step, i, arr) => (
                                <span key={step} className="c-dash-flow-item">
                                    <span>{step}</span>
                                    {i < arr.length - 1 && <span className="c-dash-flow-arrow">↓</span>}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* ─── RIGHT: Opportunity Stack ─── */}
                    <motion.div
                        className="c-dash-right"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <p className="c-dash-section-label">Opportunities waiting for you</p>
                        <div className="c-dash-opp-stack">
                            {opportunities.slice(0, 3).map((opp, i) => (
                                <motion.div
                                    key={opp.id}
                                    className="c-dash-opp-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.08 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="c-dash-opp-match" style={{ color: stateColors[opp.state] }}>
                                        {opp.match}%
                                    </div>
                                    <div className="c-dash-opp-body">
                                        <p className="c-dash-opp-title">{opp.title}</p>
                                        <p className="c-dash-opp-company">{opp.company}</p>
                                    </div>
                                    <span
                                        className="c-dash-opp-state"
                                        style={{ color: stateColors[opp.state], borderColor: stateColors[opp.state] }}
                                    >
                                        {opp.state}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <Link to="/candidate/opportunities" className="c-dash-see-all">
                            View Opportunity Radar <ChevronRight size={14} />
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
