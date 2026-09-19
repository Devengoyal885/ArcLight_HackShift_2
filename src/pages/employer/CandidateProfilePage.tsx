import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { CapabilityFingerprint } from '../../components/capability/CapabilityFingerprint';
import { ConfidenceIndicator } from '../../components/capability/ConfidenceIndicator';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { candidates } from '../../data/employer';
import { evidenceItems } from '../../data/candidate';
import { Code, FolderOpen, ClipboardCheck, FlaskConical, ArrowLeft, GitCompareArrows } from 'lucide-react';
import './CandidateProfilePage.css';

const iconMap = { github: Code, project: FolderOpen, assessment: ClipboardCheck, trial: FlaskConical, publication: FolderOpen };

export default function CandidateProfilePage() {
    const { id } = useParams<{ id: string }>();
    const cand = candidates.find(c => c.id === id) ?? candidates[0];

    // Pull evidence from candidate data (reuse from candidate twin)
    const allEvidence = Object.values(evidenceItems).flat().slice(0, 6);

    return (
        <div className="cprof-page">
            <FloatingNavbar variant="employer" />

            <main className="cprof-main">
                {/* Back */}
                <Link to="/employer/talent" className="cprof-back">
                    <ArrowLeft size={14} /> Back to Talent Discovery
                </Link>

                <div className="cprof-layout">
                    {/* Left: Identity + Fingerprint */}
                    <motion.div className="cprof-left" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="cprof-identity-card">
                            <div className="cprof-avatar">{cand.name.split(' ').map(n => n[0]).join('')}</div>
                            <div>
                                <h1 className="cprof-name">{cand.name}</h1>
                                <p className="cprof-headline">{cand.headline}</p>
                                <p className="cprof-available">Available: {cand.available}</p>
                            </div>
                        </div>

                        <div className="cprof-section">
                            <p className="cprof-section-label">CAPABILITY FINGERPRINT</p>
                            <CapabilityFingerprint capabilities={cand.capabilities} size={240} accentColor="#2563eb" />
                        </div>

                        <div className="cprof-section">
                            <p className="cprof-section-label">CAPABILITY SCORES</p>
                            {Object.entries(cand.capabilities).map(([skill, score]) => (
                                <div key={skill} className="cprof-cap-row">
                                    <span className="cprof-cap-name">{skill}</span>
                                    <div className="cprof-cap-track">
                                        <div className="cprof-cap-fill" style={{ width: `${score}%` }} />
                                    </div>
                                    <span className="cprof-cap-pct">{score}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Match + Evidence */}
                    <motion.div className="cprof-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        {/* Match summary */}
                        <div className="cprof-match-card">
                            <div className="cprof-match-hero">
                                <span className="cprof-match-score">{cand.capabilityAlignment}%</span>
                                <div>
                                    <p className="cprof-match-label">Capability Alignment</p>
                                    <p className="cprof-match-role">AI Engineer</p>
                                </div>
                            </div>
                            <div className="cprof-match-indicators">
                                <div className="cprof-indicator">
                                    <span>Evidence Confidence</span>
                                    <ConfidenceIndicator level={cand.evidenceConfidence} />
                                </div>
                                <div className="cprof-indicator">
                                    <span>Transition Distance</span>
                                    <ConfidenceIndicator level={cand.transitionDistance as 'LOW' | 'MEDIUM' | 'HIGH'} />
                                </div>
                            </div>
                            <div className="cprof-ai-warning">
                                <span>◈ DECISION SUPPORT</span>
                                <p>AI analysis assists — human review required for hiring decisions. Evidence below supports this match assessment.</p>
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="cprof-section">
                            <p className="cprof-section-label">VERIFIED EVIDENCE ({cand.evidence} items)</p>
                            <div className="cprof-evidence-list">
                                {allEvidence.map((item, i) => {
                                    const Icon = iconMap[item.type] ?? FolderOpen;
                                    return (
                                        <motion.div key={i} className="cprof-evidence-item" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <div className={`cprof-ev-icon cprof-ev-icon--${item.type}`}><Icon size={13} /></div>
                                            <div className="cprof-ev-body">
                                                <p className="cprof-ev-label">{item.label}</p>
                                                <p className="cprof-ev-date">{item.date}</p>
                                            </div>
                                            <VerificationBadge state={item.verified ? 'VERIFIED' : 'PREDICTED'} size="sm" />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="cprof-actions">
                            <Link to="/employer/talent" className="cprof-action-primary">
                                <GitCompareArrows size={14} /> Compare with Others
                            </Link>
                            <button className="cprof-action-secondary">Human Review Required</button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
