import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { opportunities, candidateCapabilities } from '../../data/candidate';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';
import './ResumeAIPage.css';

export default function ResumeAIPage() {
    const [selectedOpp, setSelectedOpp] = useState(opportunities[0]);
    const [generated, setGenerated] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => { setGenerating(false); setGenerated(true); }, 1600);
    };

    return (
        <div className="resume-page">
            <FloatingNavbar variant="candidate" />
            <div className="resume-bg" />

            <main className="resume-main">
                <motion.div className="resume-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="resume-eyebrow">AI RESUME</p>
                    <h1 className="resume-title">Your résumé, built<br /><em>for the role.</em></h1>
                    <p className="resume-sub">Select an opportunity and CapAble? generates a role-specific résumé from your verified capabilities and evidence.</p>
                </motion.div>

                {/* Pipeline */}
                <div className="resume-pipeline">
                    {['OPPORTUNITY', 'REQUIRED CAPABILITIES', 'YOUR EVIDENCE', 'RELEVANT PROJECTS', 'ROLE-SPECIFIC RESUME'].map((s, i, arr) => (
                        <span key={s} className="resume-pipe-step">
                            <span className="resume-pipe-label">{s}</span>
                            {i < arr.length - 1 && <ArrowRight size={12} className="resume-pipe-arrow" />}
                        </span>
                    ))}
                </div>

                <div className="resume-layout">
                    {/* Left: Opportunity selector */}
                    <div className="resume-left">
                        <p className="resume-section-label">SELECT OPPORTUNITY</p>
                        <div className="resume-opps">
                            {opportunities.slice(0, 3).map(opp => (
                                <button
                                    key={opp.id}
                                    className={`resume-opp-item ${selectedOpp.id === opp.id ? 'resume-opp-item--selected' : ''}`}
                                    onClick={() => { setSelectedOpp(opp); setGenerated(false); }}
                                >
                                    <span className="resume-opp-match">{opp.match}%</span>
                                    <div className="resume-opp-body">
                                        <p className="resume-opp-title">{opp.title}</p>
                                        <p className="resume-opp-co">{opp.company}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="resume-evidence-section">
                            <p className="resume-section-label">CAPABILITIES INCLUDED</p>
                            <div className="resume-caps">
                                {candidateCapabilities.slice(0, 4).map(cap => (
                                    <div key={cap.id} className="resume-cap-row">
                                        <span className="resume-cap-name">{cap.label}</span>
                                        <VerificationBadge state={cap.score >= 80 ? 'VERIFIED' : 'PRACTISED'} size="sm" />
                                        <span className="resume-cap-score" style={{ color: cap.color }}>{cap.score}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="resume-generate-btn" onClick={handleGenerate} disabled={generating}>
                            <FileText size={16} />
                            {generating ? 'Generating...' : 'Generate Resume'}
                            {!generating && <ArrowRight size={15} />}
                        </button>
                    </div>

                    {/* Right: Resume preview */}
                    <div className="resume-preview-area">
                        {!generated && !generating && (
                            <div className="resume-placeholder">
                                <FileText size={32} style={{ color: 'var(--color-ink-600)' }} />
                                <p>Select an opportunity and generate your role-specific résumé.</p>
                            </div>
                        )}
                        {generating && (
                            <div className="resume-placeholder">
                                <div className="resume-spinner" />
                                <p>CapAble? is crafting your capability-led résumé…</p>
                            </div>
                        )}
                        {generated && (
                            <motion.div className="resume-doc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="resume-doc-header">
                                    <div>
                                        <h2 className="resume-doc-name">Alex Morgan</h2>
                                        <p className="resume-doc-role">Software Engineer → {selectedOpp.title}</p>
                                        <p className="resume-doc-contact">alex.morgan@capable.ai · github.com/alexmorgan · capable.ai/alex</p>
                                    </div>
                                    <div className="resume-doc-generated-badge">
                                        <CheckCircle size={14} /> Generated for {selectedOpp.company}
                                    </div>
                                </div>

                                <div className="resume-doc-section">
                                    <h3>CAPABILITY SUMMARY</h3>
                                    <p>Research-led software engineer with verified capabilities in Python (82%), Research (91%), and DSA (88%). {selectedOpp.match}% alignment with the {selectedOpp.title} role based on 12 verified evidence items across 4 projects.</p>
                                </div>

                                <div className="resume-doc-section">
                                    <h3>VERIFIED CAPABILITIES</h3>
                                    <div className="resume-doc-caps">
                                        {candidateCapabilities.map(cap => (
                                            <span key={cap.id} className="resume-doc-cap">{cap.label} {cap.score}%</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="resume-doc-section">
                                    <h3>KEY PROJECTS</h3>
                                    <div className="resume-doc-proj">
                                        <strong>CityPulse AI</strong> — Real-time vehicle intelligence platform (SIH 2026). React, Python, ML.
                                    </div>
                                    <div className="resume-doc-proj">
                                        <strong>NLP Bias Detection</strong> — Published research paper + working model. Python, Research, ML.
                                    </div>
                                </div>

                                <div className="resume-doc-footer">
                                    <span>Capability-verified by CapAble? · {new Date().toLocaleDateString()}</span>
                                    <div className="resume-doc-actions">
                                        <button className="resume-doc-btn">Download PDF</button>
                                        <button className="resume-doc-btn resume-doc-btn--secondary">Edit</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
