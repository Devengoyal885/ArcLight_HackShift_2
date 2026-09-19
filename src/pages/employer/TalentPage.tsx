import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { CapabilityFingerprint } from '../../components/capability/CapabilityFingerprint';
import { ConfidenceIndicator } from '../../components/capability/ConfidenceIndicator';
import { candidates } from '../../data/employer';
import { Link } from 'react-router-dom';
import { Eye, GitCompareArrows, Star } from 'lucide-react';
import './TalentPage.css';

export default function TalentPage() {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 2 ? [...prev, id] : prev
        );
    };

    return (
        <div className="talent-page">
            <FloatingNavbar variant="employer" />

            <main className="talent-main">
                <motion.div className="talent-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="talent-eyebrow">TALENT DISCOVERY</p>
                    <h1 className="talent-title">See the capability<br /><em>behind the résumé.</em></h1>
                    <p className="talent-sub">
                        Every candidate tile shows verified capability, not just listed skills.
                        Select up to 2 candidates to compare.
                    </p>
                </motion.div>

                {selected.length === 2 && (
                    <motion.div className="talent-compare-bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <span>Compare: <strong>{candidates.find(c => c.id === selected[0])?.name}</strong> vs <strong>{candidates.find(c => c.id === selected[1])?.name}</strong></span>
                        <Link to="/employer/talent" className="talent-compare-btn">Compare Now <GitCompareArrows size={14} /></Link>
                        <button className="talent-compare-clear" onClick={() => setSelected([])}>Clear</button>
                    </motion.div>
                )}

                <div className="talent-grid">
                    {candidates.map((cand, i) => {
                        const isSelected = selected.includes(cand.id);
                        return (
                            <motion.div
                                key={cand.id}
                                className={`talent-card ${isSelected ? 'talent-card--selected' : ''}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                {/* Header */}
                                <div className="talent-card-top">
                                    <div className="talent-card-avatar">
                                        {cand.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="talent-card-identity">
                                        <h3 className="talent-card-name">{cand.name}</h3>
                                        <p className="talent-card-headline">{cand.headline}</p>
                                    </div>
                                    <button
                                        className={`talent-select-btn ${isSelected ? 'talent-select-btn--on' : ''}`}
                                        onClick={() => toggleSelect(cand.id)}
                                        title="Select for comparison"
                                    >
                                        <Star size={13} fill={isSelected ? 'currentColor' : 'none'} />
                                    </button>
                                </div>

                                {/* Fingerprint */}
                                <div className="talent-card-fp">
                                    <CapabilityFingerprint capabilities={cand.capabilities} size={180} accentColor="#2563eb" />
                                </div>

                                {/* Score row */}
                                <div className="talent-card-score-row">
                                    <div className="talent-align-score">
                                        <span className="talent-align-number">{cand.capabilityAlignment}%</span>
                                        <span className="talent-align-label">Capability Alignment</span>
                                    </div>
                                    <div className="talent-indicators">
                                        <div className="talent-indicator-row">
                                            <span className="talent-indicator-label">Evidence</span>
                                            <ConfidenceIndicator level={cand.evidenceConfidence} />
                                        </div>
                                        <div className="talent-indicator-row">
                                            <span className="talent-indicator-label">Transition</span>
                                            <ConfidenceIndicator level={cand.transitionDistance === 'LOW' ? 'HIGH' : cand.transitionDistance === 'MEDIUM' ? 'MEDIUM' : 'LOW'} />
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="talent-card-stats">
                                    <span>{cand.evidence} evidence</span>
                                    <span>·</span>
                                    <span>{cand.projects} projects</span>
                                    <span>·</span>
                                    <span>{cand.verifiedTrials} trials</span>
                                </div>

                                {/* Actions */}
                                <div className="talent-card-actions">
                                    <Link to={`/employer/candidate/${cand.id}`} className="talent-action-btn talent-action-btn--primary">
                                        <Eye size={13} /> View Evidence
                                    </Link>
                                    <button className="talent-action-btn" onClick={() => toggleSelect(cand.id)}>
                                        <GitCompareArrows size={13} /> Compare
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
