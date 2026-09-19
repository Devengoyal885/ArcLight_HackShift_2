import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { roleCapabilityModel } from '../../data/employer';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RolesPage.css';

export default function RolesPage() {
    const [roleQuery, setRoleQuery] = useState('AI Engineer');
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(true);

    const handleAnalyze = () => {
        setAnalyzing(true);
        setAnalyzed(false);
        setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1400);
    };

    return (
        <div className="roles-page">
            <FloatingNavbar variant="employer" />
            <main className="roles-main">
                <motion.div className="roles-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="roles-eyebrow">ROLE INTELLIGENCE</p>
                    <h1 className="roles-title">From job description<br /><em>to capability model.</em></h1>
                    <p className="roles-sub">Enter a role title and CapAble? extracts the required capability model instantly.</p>
                </motion.div>

                {/* Search input */}
                <div className="roles-search-row">
                    <div className="roles-search-wrap">
                        <Search size={16} className="roles-search-icon" />
                        <input
                            className="roles-search-input"
                            value={roleQuery}
                            onChange={e => setRoleQuery(e.target.value)}
                            placeholder="e.g. AI Engineer, Data Scientist, Cloud Architect"
                        />
                    </div>
                    <button className="roles-analyze-btn" onClick={handleAnalyze} disabled={analyzing}>
                        {analyzing ? 'Analyzing...' : 'Generate Capability Model'} <ArrowRight size={15} />
                    </button>
                </div>

                {analyzing && (
                    <div className="roles-analyzing">
                        <div className="roles-analyzing-spinner" />
                        <p>Extracting capability model from role intelligence…</p>
                    </div>
                )}

                {analyzed && !analyzing && (
                    <motion.div className="roles-result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Pipeline steps */}
                        <div className="roles-pipeline">
                            {['JOB DESCRIPTION', 'SKILL EXTRACTION', 'CAPABILITY MODEL', 'CANDIDATE DISCOVERY'].map((step, i) => (
                                <span key={step} className="roles-pipeline-step">
                                    <motion.span
                                        className="roles-pipeline-label"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.15 }}
                                    >{step}</motion.span>
                                    {i < 3 && <ArrowRight size={13} className="roles-pipeline-arrow" />}
                                </span>
                            ))}
                        </div>

                        <div className="roles-result-layout">
                            {/* Capability model */}
                            <div className="roles-capability-model">
                                <p className="roles-result-label">REQUIRED CAPABILITIES — {roleCapabilityModel.role}</p>
                                <div className="roles-caps">
                                    {roleCapabilityModel.capabilities.map((cap, i) => (
                                        <motion.div
                                            key={cap.label}
                                            className="roles-cap-item"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <div className="roles-cap-header">
                                                <span className="roles-cap-name">{cap.label}</span>
                                                <span className="roles-cap-weight">{Math.round(cap.weight * 100)}% weight</span>
                                            </div>
                                            <div className="roles-cap-track">
                                                <div className="roles-cap-fill" style={{ width: `${cap.required}%` }} />
                                            </div>
                                            <span className="roles-cap-req">Required: {cap.required}%</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="roles-cta-panel">
                                <div className="roles-cta-stat">
                                    <span className="roles-cta-num">4</span>
                                    <span className="roles-cta-label">Candidates above 90% match</span>
                                </div>
                                <div className="roles-cta-stat">
                                    <span className="roles-cta-num">11</span>
                                    <span className="roles-cta-label">Internal transition candidates</span>
                                </div>
                                <Link to="/employer/talent" className="roles-discover-btn">
                                    Discover Talent <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
