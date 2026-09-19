import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, FolderOpen, ClipboardCheck, FlaskConical, BookOpen } from 'lucide-react';
import type { EvidenceItem } from '../../data/candidate';
import { VerificationBadge } from './VerificationBadge';
import './EvidenceDrawer.css';

const iconMap = {
    github: Code,
    project: FolderOpen,
    assessment: ClipboardCheck,
    trial: FlaskConical,
    publication: BookOpen,
};

interface EvidenceDrawerProps {
    open: boolean;
    onClose: () => void;
    capability: string;
    score: number;
    evidence: EvidenceItem[];
    aiExplanation?: string;
}

export function EvidenceDrawer({ open, onClose, capability, score, evidence, aiExplanation }: EvidenceDrawerProps) {
    const verified = evidence.filter(e => e.verified).length;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className="evidence-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                    >
                        <div className="drawer-header">
                            <div>
                                <h3 className="drawer-title">{capability}</h3>
                                <p className="drawer-meta">{score}% capability · {verified} verified</p>
                            </div>
                            <button className="drawer-close" onClick={onClose}><X size={16} /></button>
                        </div>

                        {aiExplanation && (
                            <div className="drawer-ai-box">
                                <p className="drawer-ai-label">Why CapAble? thinks you have this capability</p>
                                <p className="drawer-ai-text">{aiExplanation}</p>
                            </div>
                        )}

                        <div className="drawer-disclaimer">
                            <span className="drawer-disclaimer-pill">AI ESTIMATION ≠ PROOF</span>
                            <p>Evidence below supports this score. Verification upgrades your confidence.</p>
                        </div>

                        <div className="drawer-evidence-list">
                            {evidence.map((item, i) => {
                                const Icon = iconMap[item.type];
                                return (
                                    <motion.div
                                        key={i}
                                        className="evidence-item"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className={`evidence-icon evidence-icon--${item.type}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="evidence-body">
                                            <p className="evidence-label">{item.label}</p>
                                            <p className="evidence-date">{item.date}</p>
                                        </div>
                                        <VerificationBadge state={item.verified ? 'VERIFIED' : 'PREDICTED'} size="sm" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
