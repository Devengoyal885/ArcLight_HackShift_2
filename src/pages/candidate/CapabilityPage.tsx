import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { EvidenceDrawer } from '../../components/capability/EvidenceDrawer';
import { ConfidenceIndicator } from '../../components/capability/ConfidenceIndicator';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, getAssessmentHistory, getProjects } from '../../services/profileService';
import type { UserCapability, AssessmentRecord, UserProject } from '../../services/profileService';
import { callGemini } from '../../lib/gemini';
import { Loader2, RefreshCw, BrainCircuit, Lightbulb } from 'lucide-react';
import './CapabilityPage.css';

// Curated color palette for capability nodes
const CAPABILITY_COLORS = [
    '#2563eb', '#0ea5e9', '#10b981', '#7c3aed',
    '#f59e0b', '#f4845f', '#6366f1', '#ec4899',
    '#14b8a6', '#8b5cf6',
];

interface CapabilityNode {
    id: string;
    label: string;
    score: number;
    confidence: number;
    color: string;
    evidenceSources: string[];
}

function buildEvidenceItems(
    cap: UserCapability,
    assessments: AssessmentRecord[],
    projects: UserProject[]
) {
    const items: { type: 'github' | 'project' | 'assessment' | 'trial' | 'publication'; label: string; date: string; verified: boolean }[] = [];

    // From assessment history
    const domainAssessments = assessments.filter(a =>
        a.domain.toLowerCase().includes(cap.skill.toLowerCase()) ||
        cap.skill.toLowerCase().includes(a.domain.toLowerCase())
    );
    for (const a of domainAssessments.slice(0, 2)) {
        items.push({
            type: 'assessment',
            label: `${a.domain} Assessment — ${a.score}% score`,
            date: a.completedAt ? new Date(a.completedAt as string).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent',
            verified: a.score >= 70,
        });
    }

    // From GitHub projects
    const relatedProjects = projects.filter(p =>
        p.technologies?.some(t => t.toLowerCase().includes(cap.skill.toLowerCase())) ||
        p.language?.toLowerCase().includes(cap.skill.toLowerCase()) ||
        p.name.toLowerCase().includes(cap.skill.toLowerCase())
    );
    for (const p of relatedProjects.slice(0, 2)) {
        items.push({
            type: p.source === 'github' ? 'github' : 'project',
            label: p.name + (p.stars ? ` (★ ${p.stars})` : ''),
            date: 'Ongoing',
            verified: p.source === 'github',
        });
    }

    // From evidenceSources field
    if (cap.evidenceSources?.includes('GitHub') && items.length === 0) {
        items.push({ type: 'github', label: 'GitHub repositories', date: 'Ongoing', verified: true });
    }

    return items;
}

export default function CapabilityPage() {
    const { user, dbUid } = useAuth();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [aiExplanation, setAiExplanation] = useState<string | undefined>(undefined);
    const [loadingExplanation, setLoadingExplanation] = useState(false);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            getCapabilities(dbUid!),
            getAssessmentHistory(dbUid!),
            getProjects(dbUid!),
        ]).then(([caps, asmts, projs]) => {
            setCapabilities(caps);
            setAssessments(asmts);
            setProjects(projs);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, [user]);


    // Build display nodes from real capabilities
    const nodes: CapabilityNode[] = capabilities.map((cap, i) => ({
        id: cap.id || cap.skill,
        label: cap.skill,
        score: cap.score,
        confidence: cap.confidence === 'high' ? 88 : cap.confidence === 'medium' ? 72 : 55,
        color: CAPABILITY_COLORS[i % CAPABILITY_COLORS.length],
        evidenceSources: cap.evidenceSources || [],
    }));

    const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
    const selectedCap = selected ? capabilities.find(c => (c.id || c.skill) === selected) : null;

    const handleNodeClick = async (node: CapabilityNode) => {
        if (selected === node.id) {
            setSelected(null);
            setAiExplanation(undefined);
            return;
        }
        setSelected(node.id);
        setAiExplanation(undefined);
        setLoadingExplanation(true);
        try {
            const cacheKey = `cap_explain_${dbUid}_${node.label}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                setAiExplanation(cached);
                setLoadingExplanation(false);
                return;
            }
            const capSummary = capabilities.map(c => `${c.skill}: ${c.score}%`).join(', ');
            const prompt = `The candidate has a capability profile: ${capSummary}. 
Explain in 2 short sentences why their "${node.label}" score is ${node.score}%, 
referencing their evidence sources (${node.evidenceSources.join(', ') || 'resume and self-assessment'}).
Be specific and encouraging. Do not use placeholder text.`;
            const explanation = await callGemini(prompt);
            if (explanation) {
                localStorage.setItem(cacheKey, explanation);
                setAiExplanation(explanation);
            }
        } catch (e) {
            console.error('AI explanation failed:', e);
        } finally {
            setLoadingExplanation(false);
        }
    };

    const selectedEvidence = selectedCap
        ? buildEvidenceItems(selectedCap, assessments, projects)
        : [];

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
                        Every score is built from your real evidence — GitHub, assessments, and projects.
                        Click any capability to see your proof and get an AI explanation.
                    </p>
                    <div className="cap-page-disclaimer">
                        <span className="cap-disclaimer-pill">AI ESTIMATION ≠ PROOF</span>
                        <p>Predictions show potential. Verification adds proof. Your evidence trail is what employers actually see.</p>
                    </div>
                </motion.div>

                {loading && (
                    <div className="cap-loading">
                        <Loader2 size={28} className="spin" />
                        <p>Loading your capability profile…</p>
                    </div>
                )}

                {!loading && nodes.length === 0 && (
                    <div className="cap-empty">
                        <BrainCircuit size={32} color="#94a3b8" />
                        <p>No capabilities built yet.</p>
                        <p className="cap-empty-sub">
                            Take an <a href="/candidate/assessments">assessment</a> or <a href="/candidate/portfolio">sync your GitHub</a> to build your profile.
                        </p>
                    </div>
                )}

                {!loading && nodes.length > 0 && (
                    <>
                        {/* Capability graph */}
                        <div className="cap-graph">
                            {nodes.map((node, i) => {
                                const isSelected = selected === node.id;
                                return (
                                    <motion.button
                                        key={node.id}
                                        className={`cap-node ${isSelected ? 'cap-node--selected' : ''}`}
                                        onClick={() => handleNodeClick(node)}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{ '--accent': node.color } as React.CSSProperties}
                                    >
                                        <div className="cap-node-ring" style={{ borderColor: node.color }} />

                                        <svg className="cap-node-svg" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3" />
                                            <circle
                                                cx="50" cy="50" r="42"
                                                fill="none"
                                                stroke={node.color}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 42}`}
                                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - node.score / 100)}`}
                                                transform="rotate(-90 50 50)"
                                                style={{ filter: `drop-shadow(0 0 4px ${node.color}60)` }}
                                            />
                                        </svg>

                                        <div className="cap-node-content">
                                            <span className="cap-node-score" style={{ color: node.color }}>{node.score}%</span>
                                            <span className="cap-node-label">{node.label}</span>
                                            <ConfidenceIndicator
                                                level={node.confidence >= 85 ? 'HIGH' : node.confidence >= 70 ? 'MEDIUM' : 'LOW'}
                                                percent={node.confidence}
                                            />
                                            <span className="cap-node-evidence">
                                                {node.evidenceSources.length > 0
                                                    ? node.evidenceSources.slice(0, 2).join(' · ')
                                                    : 'Resume'}
                                            </span>
                                        </div>

                                        {isSelected && <div className="cap-node-selected-ring" style={{ borderColor: node.color }} />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Inline AI explanation */}
                        <AnimatePresence>
                            {selected && (
                                <motion.div
                                    className="cap-ai-panel"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                >
                                    <Lightbulb size={16} color="#f59e0b" />
                                    <div className="cap-ai-text">
                                        {loadingExplanation
                                            ? <span className="cap-ai-loading"><Loader2 size={14} className="spin" /> Analysing your evidence…</span>
                                            : <span>{aiExplanation || `Your ${selectedNode?.label} score of ${selectedNode?.score}% is based on your verified evidence.`}</span>
                                        }
                                    </div>
                                    <button
                                        className="cap-ai-refresh"
                                        onClick={() => {
                                            if (!selectedNode) return;
                                            localStorage.removeItem(`cap_explain_${dbUid}_${selectedNode.label}`);
                                            handleNodeClick(selectedNode);
                                        }}
                                        title="Refresh explanation"
                                    >
                                        <RefreshCw size={13} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                    </>
                )}
            </main>

            {/* Evidence Drawer */}
            <EvidenceDrawer
                open={!!selected}
                onClose={() => { setSelected(null); setAiExplanation(undefined); }}
                capability={selectedNode?.label ?? ''}
                score={selectedNode?.score ?? 0}
                evidence={selectedEvidence}
                aiExplanation={aiExplanation}
            />
        </div>
    );
}
