import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';

interface Suggestion {
    label: string;
    action: string;
    points: number;
}

interface Props {
    score: number;
    suggestions: Suggestion[];
    onDismiss?: () => void;
}

const getStrength = (score: number): { label: string; color: string; bg: string } => {
    if (score >= 90) return { label: 'All-Star', color: '#10b981', bg: '#10b98120' };
    if (score >= 75) return { label: 'Expert', color: '#2563eb', bg: '#2563eb20' };
    if (score >= 55) return { label: 'Intermediate', color: '#f59e0b', bg: '#f59e0b20' };
    if (score >= 35) return { label: 'Beginner', color: '#f97316', bg: '#f9731620' };
    return { label: 'Starter', color: '#ef4444', bg: '#ef444420' };
};

export default function ProfileCompleteness({ score, suggestions, onDismiss }: Props) {
    const [expanded, setExpanded] = useState(false);
    const strength = getStrength(score);
    const topSuggestions = suggestions.slice(0, expanded ? 999 : 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-completeness-banner"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid #334155',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 24,
                position: 'relative',
            }}
        >
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#64748b', padding: 4,
                    }}
                >
                    <X size={14} />
                </button>
            )}

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                            fontSize: 13, fontWeight: 700, color: strength.color,
                            background: strength.bg, borderRadius: 6, padding: '2px 10px',
                        }}>
                            {strength.label}
                        </span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            Profile Strength
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: 8, background: '#1e293b', borderRadius: 99,
                        border: '1px solid #334155', overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                height: '100%',
                                borderRadius: 99,
                                background: `linear-gradient(90deg, ${strength.color}88, ${strength.color})`,
                                boxShadow: `0 0 12px ${strength.color}40`,
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    fontSize: 28, fontWeight: 800,
                    color: strength.color,
                    minWidth: 56, textAlign: 'right',
                }}>
                    {score}%
                </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Complete these to improve your profile
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence>
                            {topSuggestions.map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        background: '#ffffff08', borderRadius: 10,
                                        padding: '10px 12px',
                                        border: '1px solid #334155',
                                    }}
                                >
                                    <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.action}</div>
                                    </div>
                                    <div style={{
                                        fontSize: 11, fontWeight: 700, color: '#10b981',
                                        background: '#10b98115', borderRadius: 6, padding: '2px 8px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        +{s.points}%
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {suggestions.length > 3 && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            style={{
                                marginTop: 10, background: 'none', border: 'none',
                                cursor: 'pointer', color: '#2563eb', fontSize: 12,
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {expanded ? 'Show less' : `Show ${suggestions.length - 3} more suggestions`}
                        </button>
                    )}
                </div>
            )}

            {score >= 90 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: '#10b981', fontSize: 13, fontWeight: 600,
                }}>
                    <CheckCircle2 size={16} />
                    Your profile is complete! You're 5x more likely to be shortlisted.
                </div>
            )}

            {score < 90 && (
                <div style={{
                    marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                    color: '#64748b', fontSize: 11,
                }}>
                    <Zap size={12} style={{ color: '#f59e0b' }} />
                    Complete profiles get <strong style={{ color: '#f59e0b' }}>5x more recruiter views</strong>
                </div>
            )}
        </motion.div>
    );
}
