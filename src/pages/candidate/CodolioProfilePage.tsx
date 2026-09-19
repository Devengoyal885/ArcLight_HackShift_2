import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { buildCandidateProfileState } from '../../engines/profileEngine';
import { seedEcosystem } from '../../data/seedData';
import type { CandidateProfileState } from '../../types/domain';
import { CheckCircle, MapPin, GraduationCap, Archive, Award, Layers } from 'lucide-react';
import './CodolioProfilePage.css';

export default function CodolioProfilePage() {
    const [state, setState] = useState<CandidateProfileState | null>(null);

    useEffect(() => {
        // Ensure mock ecosystem is populated so analytics engines have raw events to process
        seedEcosystem();

        // Compute derived profile purely from backend/engine state
        const derivedState = buildCandidateProfileState();
        setState(derivedState);
    }, []);

    if (!state) {
        return (
            <div className="cp-page flex-center">
                <p>Loading Derived Profile Ecosystem...</p>
            </div>
        );
    }

    const { identity, capabilities, growth, metrics, evidence, career } = state;

    return (
        <div className="cp-page">
            <FloatingNavbar variant="candidate" />

            <div className="cp-content">
                {/* ─── SIDEBAR: Read-Only Identity ─── */}
                <aside className="cp-sidebar">
                    <div className="cp-card cp-profile-card">
                        <div className="cp-avatar-wrap">
                            <img src={identity.avatar || ''} alt={identity.name} className="cp-avatar-img" />
                        </div>
                        <h1 className="cp-profile-name">{identity.name}</h1>
                        <p className="cp-username">@{identity.username} <CheckCircle size={13} className="cp-verified-icon" /></p>
                        <p className="cp-bio">{identity.bio}</p>

                        <div className="cp-meta-rows" style={{ marginTop: '16px' }}>
                            <div className="cp-meta-row"><MapPin size={12} /><span>{identity.location}</span></div>
                            {identity.education[0] && <div className="cp-meta-row"><GraduationCap size={12} /><span>{identity.education[0]}</span></div>}
                        </div>
                    </div>

                    <div className="cp-card">
                        <div className="cp-card-header">
                            <Archive size={14} />
                            <span>Ecosystem Vitality</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Capability Confidence</span>
                            <span className="cp-stat-accent text-green">{metrics.overallConfidence}%</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Verified Evidence</span>
                            <span className="cp-stat-accent">{metrics.verifiedEvidenceCount}</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Profile Readiness</span>
                            <span className="cp-stat-accent">{metrics.completeness}%</span>
                        </div>
                    </div>
                </aside>

                {/* ─── MAIN CONTENT: Derived Sections ─── */}
                <main className="cp-main">

                    {/* Activity Heatmap row */}
                    <div className="cp-row cp-row--top">
                        <motion.div className="cp-card cp-stat-card">
                            <p className="cp-stat-label">Active Days</p>
                            <div className="cp-stat-big">{growth.activeDays}</div>
                            <p className="cp-stat-sub">Derived from Activity Events</p>
                        </motion.div>

                        <motion.div className="cp-card cp-stat-card">
                            <p className="cp-stat-label">Current Streak</p>
                            <div className="cp-stat-big">{growth.currentStreak}</div>
                        </motion.div>

                        {/* Visual Heatmap based on engine dates */}
                        <motion.div className="cp-card cp-heatmap-card" style={{ flex: 2 }}>
                            <p className="cp-stat-label">Activity Density</p>
                            <div className="cp-heatmap-grid" style={{ marginTop: '8px' }}>
                                {growth.heatmap.map((cell, i) => (
                                    <div
                                        key={i}
                                        className="cp-heatmap-cell"
                                        style={{
                                            background: cell.active
                                                ? `rgba(37, 99, 235, ${0.2 + cell.intensity * 0.8})`
                                                : '#e2e8f0',
                                        }}
                                        title={cell.active ? `Active on ${cell.date}` : 'Idle'}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Capability Vault */}
                    <div className="cp-row">
                        <motion.div className="cp-card" style={{ flex: 1 }}>
                            <p className="cp-card-header-title" style={{ marginBottom: '16px' }}><Layers size={16} /> Capability Fingerprint</p>
                            <div className="cp-dsa-bars">
                                {capabilities.map(cap => (
                                    <div key={cap.id} className="cp-dsa-row">
                                        <span className="cp-dsa-label">{cap.name || cap.id.replace('cap_', '').toUpperCase()}</span>
                                        <div className="cp-dsa-track">
                                            <motion.div
                                                className="cp-dsa-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cap.score}%` }}
                                            />
                                        </div>
                                        <span className="cp-dsa-count">{cap.score}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Derived Skill Gaps vs Career Target */}
                        <motion.div className="cp-card" style={{ flex: 1 }}>
                            <p className="cp-card-header-title" style={{ marginBottom: '16px' }}>Transition Gaps: {career.targetRole}</p>
                            {career.gaps.map((gap, i) => (
                                <div key={i} className="cp-ranking-block">
                                    <p className="cp-ranking-platform">{gap.capabilityName}</p>
                                    <div className="cp-ranking-rating text-red">Gap: {gap.gap}%</div>
                                    <p className="cp-ranking-max">Requires {gap.targetScore}% (Current: {gap.currentScore}%)</p>
                                </div>
                            ))}
                            {career.gaps.length === 0 && (
                                <p className="cp-bio">You are fully capable for the {career.targetRole} role!</p>
                            )}
                        </motion.div>
                    </div>

                    {/* Verified Evidence Vault */}
                    <div className="cp-row">
                        <motion.div className="cp-card" style={{ width: '100%' }}>
                            <div className="cp-card-header-row" style={{ marginBottom: '16px' }}>
                                <span className="cp-card-label"><Award size={16} /> Verified Evidence Vault</span>
                                <span className="cp-award-count">{evidence.length} Items</span>
                            </div>

                            <div className="cp-awards-row">
                                {evidence.map(ev => (
                                    <div key={ev.id} className="cp-award-hex" style={{ borderColor: ev.verificationStatus === 'verified' ? '#10b981' : '#cbd5e1', padding: '16px', borderRadius: '8px', minWidth: '220px', textAlign: 'left' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{ev.type}</span>
                                        <p style={{ fontWeight: 600, fontSize: '15px', color: '#0f172a', margin: '4px 0' }}>{ev.title}</p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '11px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: '12px' }}>Str: {ev.strength}%</span>
                                            {ev.verificationStatus === 'verified' && (
                                                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px' }}>✓ Verified</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                </main>
            </div>
        </div>
    );
}
