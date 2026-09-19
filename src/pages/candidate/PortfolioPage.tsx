import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { CapabilityFingerprint } from '../../components/capability/CapabilityFingerprint';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { growthTimeline, candidateProfile, candidateCapabilities } from '../../data/candidate';
import './PortfolioPage.css';

const capMap: Record<string, number> = {};
candidateCapabilities.forEach(c => { capMap[c.label] = c.score; });

export default function PortfolioPage() {
    return (
        <div className="portfolio-page">
            <FloatingNavbar variant="candidate" />
            <div className="portfolio-bg" />

            <main className="portfolio-main">
                {/* Hero identity */}
                <motion.div className="portfolio-hero" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="portfolio-avatar">{candidateProfile.initials}</div>
                    <div className="portfolio-identity">
                        <div className="portfolio-name-row">
                            <h1 className="portfolio-name">{candidateProfile.name}</h1>
                            <VerificationBadge state="VERIFIED" />
                        </div>
                        <p className="portfolio-role">{candidateProfile.role}</p>
                        <p className="portfolio-tagline">Building capability. Proving it. Finding where it belongs.</p>
                    </div>
                    <div className="portfolio-stats">
                        <div className="portfolio-stat">
                            <span className="ps-val">{candidateProfile.capabilityConfidence}%</span>
                            <span className="ps-lbl">Capability Confidence</span>
                        </div>
                        <div className="portfolio-stat">
                            <span className="ps-val">{candidateProfile.verifiedEvidence}</span>
                            <span className="ps-lbl">Verified Evidence</span>
                        </div>
                        <div className="portfolio-stat">
                            <span className="ps-val">{candidateProfile.projectCount}</span>
                            <span className="ps-lbl">Projects</span>
                        </div>
                    </div>
                </motion.div>

                <div className="portfolio-layout">
                    {/* Left: Fingerprint */}
                    <motion.div className="portfolio-left" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <div className="portfolio-section-card">
                            <p className="portfolio-section-label">CAPABILITY FINGERPRINT</p>
                            <CapabilityFingerprint capabilities={capMap} size={280} accentColor="#2563eb" />
                        </div>

                        <div className="portfolio-section-card">
                            <p className="portfolio-section-label">CAPABILITY EVOLUTION</p>
                            <div className="portfolio-timeline">
                                {growthTimeline.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        className="portfolio-timeline-item"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + i * 0.07 }}
                                    >
                                        <div className="portfolio-tl-dot" style={{ background: item.color }} />
                                        <div className="portfolio-tl-line" />
                                        <div className="portfolio-tl-year">{item.year}</div>
                                        <div className="portfolio-tl-body">
                                            <span className="portfolio-tl-skill" style={{ color: item.color }}>{item.label}</span>
                                            <span className="portfolio-tl-level">{item.level}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Projects + Verified Work */}
                    <motion.div className="portfolio-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <div className="portfolio-section-card">
                            <p className="portfolio-section-label">VERIFIED WORK</p>
                            <div className="portfolio-projects">
                                {[
                                    { name: 'CityPulse AI', desc: 'Real-time vehicle intelligence platform — National SIH 2026', caps: ['React', 'Python', 'Data Analysis'], verified: true },
                                    { name: 'NLP Bias Detector', desc: 'Research paper + working model on NLP fairness', caps: ['Research', 'Machine Learning', 'Python'], verified: true },
                                    { name: 'Image Classifier', desc: 'CIFAR-10 CNN classifier — 91.4% accuracy', caps: ['Machine Learning', 'Python'], verified: true },
                                    { name: 'Automation Suite', desc: 'Production Python automation for a real client', caps: ['Python', 'Cloud'], verified: false },
                                ].map((proj, i) => (
                                    <motion.div
                                        key={proj.name}
                                        className="portfolio-project-card"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.07 }}
                                    >
                                        <div className="portfolio-proj-header">
                                            <span className="portfolio-proj-name">{proj.name}</span>
                                            <VerificationBadge state={proj.verified ? 'VERIFIED' : 'PRACTISED'} size="sm" />
                                        </div>
                                        <p className="portfolio-proj-desc">{proj.desc}</p>
                                        <div className="portfolio-proj-caps">
                                            {proj.caps.map(c => (
                                                <span key={c} className="portfolio-proj-cap">{c}</span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="portfolio-no-social">
                            <span className="portfolio-no-social-icon">◎</span>
                            <div>
                                <p className="portfolio-no-social-title">No follower counts. No likes. No connections.</p>
                                <p className="portfolio-no-social-sub">Only capabilities, evidence, and verified growth matter here.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
