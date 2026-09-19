import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { EvidenceDrawer } from '../../components/capability/EvidenceDrawer';
import { ConfidenceIndicator } from '../../components/capability/ConfidenceIndicator';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { candidateCapabilities, evidenceItems } from '../../data/candidate';
import './CapabilityPage.css';

const AI_EXPLANATIONS: Record<string, string> = {
    research: "CapAble? infers Research capability from your published paper, two graded projects, and a formal methodology assessment. The combination of peer-reviewed evidence and practical output pushes this score to 91%.",
    ml: "Your ML score is based on a deployed project, one practical trial, and four GitHub repositories with ML content. Your confidence sits at 89% because the GitHub evidence is unverified — completing a verification trial would solidify this.",
    python: "47 Python repositories on GitHub, one production automation script, and a REST API trial contribute to an 82% score. 88% confidence because GitHub evidence is self-reported.",
    dsa: "300+ LeetCode problems with solution quality tracking and a formal DSA assessment at the 88th percentile gives CapAble? high confidence in this capability.",
    react: "A verified frontend project (CityPulse AI) and 8 GitHub repos support 73%. Confidence is 80% because no formal assessment exists yet.",
    cloud: "Only one in-progress certification found. Cloud is your lowest capability — the fastest route to improve it is the Cloud Deployment Practical Trial.",
};

export default function CapabilityPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const selectedCap = selected ? candidateCapabilities.find(c => c.id === selected) : null;

    return (
        <div className="cap-page">
            <FloatingNavbar variant="candidate" />

            <div className="cap-page-bg">
                <div className="cap-page-orb cap-page-orb--1" />
                <div className="cap-page-orb cap-page-orb--2" />
            </div>

            <main className="cap-page-main">
                {/* Header */}
                <motion.div className="cap-page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="cap-page-eyebrow">CAPABILITY TWIN</p>
                    <h1 className="cap-page-title">What can you do?</h1>
                    <p className="cap-page-sub">
                        Every score is built from evidence — not self-reporting.
                        Click any capability to see exactly why CapAble? scores it this way.
                    </p>
                    <div className="cap-page-disclaimer">
                        <span className="cap-disclaimer-pill">AI ESTIMATION ≠ PROOF</span>
                        <p>Predictions show potential. Verification adds proof. Your evidence trail is what employers actually see.</p>
                    </div>
                </motion.div>

                {/* Capability graph */}
                <div className="cap-graph">
                    {candidateCapabilities.map((cap, i) => {
                        const isSelected = selected === cap.id;
                        return (
                            <motion.button
                                key={cap.id}
                                className={`cap-node ${isSelected ? 'cap-node--selected' : ''}`}
                                onClick={() => setSelected(isSelected ? null : cap.id)}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    '--accent': cap.color,
                                } as React.CSSProperties}
                            >
                                <div className="cap-node-ring" style={{ borderColor: cap.color }} />

                                {/* Arc progress */}
                                <svg className="cap-node-svg" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke={cap.color}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - cap.score / 100)}`}
                                        transform="rotate(-90 50 50)"
                                        style={{ filter: `drop-shadow(0 0 4px ${cap.color}60)` }}
                                    />
                                </svg>

                                <div className="cap-node-content">
                                    <span className="cap-node-score" style={{ color: cap.color }}>{cap.score}%</span>
                                    <span className="cap-node-label">{cap.label}</span>
                                    <ConfidenceIndicator level={cap.confidence >= 85 ? 'HIGH' : cap.confidence >= 70 ? 'MEDIUM' : 'LOW'} percent={cap.confidence} />
                                    <span className="cap-node-evidence">{cap.evidenceCount} evidence</span>
                                </div>

                                {isSelected && <div className="cap-node-selected-ring" style={{ borderColor: cap.color }} />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Verification info strip */}
                <div className="cap-verification-strip">
                    {(['VERIFIED', 'PRACTISED', 'PREDICTED'] as const).map((s) => (
                        <div key={s} className="cap-strip-item">
                            <VerificationBadge state={s} />
                            <p className="cap-strip-desc">
                                {s === 'VERIFIED' && 'Externally confirmed through assessment or trial'}
                                {s === 'PRACTISED' && 'Demonstrated in projects, not yet formally tested'}
                                {s === 'PREDICTED' && 'Inferred from observed activity — not yet proven'}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Evidence Drawer */}
            <EvidenceDrawer
                open={!!selected}
                onClose={() => setSelected(null)}
                capability={selectedCap?.label ?? ''}
                score={selectedCap?.score ?? 0}
                evidence={selected ? (evidenceItems[selected] ?? []) : []}
                aiExplanation={selected ? AI_EXPLANATIONS[selected] : undefined}
            />
        </div>
    );
}
