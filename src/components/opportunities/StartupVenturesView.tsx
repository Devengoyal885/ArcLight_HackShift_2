import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
    getStartupVentures,
    createStartupVenture,
    sendCollaborationRequest,
    getVentureWorkspace,
    saveVentureWorkspace,
    reportVentureIdea,
    type StartupVenture,
    type VentureWorkspace,
    type VentureTask
} from '../../services/ventureService';
import {
    Rocket, Users, Search, Plus, Sparkles, MapPin, DollarSign,
    Briefcase, CheckCircle2, ShieldCheck, Lock, Globe, X, Loader2,
    Send, Award, Filter, Lightbulb, Flag, CheckSquare, Square,
    ListTodo, FolderKanban, ExternalLink, ShieldAlert, FileText, Check
} from 'lucide-react';
import './StartupVenturesView.css';

const STAGES = ['All', 'Idea', 'Prototype', 'MVP', 'Early Traction', 'Growth'];

export default function StartupVenturesView() {
    const { user, dbUid, profile } = useAuth();
    const [ventures, setVentures] = useState<StartupVenture[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStage, setSelectedStage] = useState('All');

    // Collaboration modal
    const [selectedVenture, setSelectedVenture] = useState<StartupVenture | null>(null);
    const [roleChoice, setRoleChoice] = useState('');
    const [collabMsg, setCollabMsg] = useState('');
    const [sendingCollab, setSendingCollab] = useState(false);
    const [collabSuccess, setCollabSuccess] = useState(false);

    // Create Venture modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTagline, setNewTagline] = useState('');
    const [newProblem, setNewProblem] = useState('');
    const [newSolution, setNewSolution] = useState('');
    const [newStage, setNewStage] = useState<StartupVenture['stage']>('MVP');
    const [newDomain, setNewDomain] = useState('AI / ML');
    const [newRoles, setNewRoles] = useState('Technical Co-Founder');
    const [newSkills, setNewSkills] = useState('React, TypeScript, Python');
    const [newEquity, setNewEquity] = useState('10% – 15%');
    const [newStipend, setNewStipend] = useState('Equity-first / Grants');
    const [newVisibility, setNewVisibility] = useState<StartupVenture['visibility']>('public');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

    // Active View: Explore Ventures vs Venture Workspace
    const [activeTab, setActiveTab] = useState<'explore' | 'workspace'>('explore');

    // Moderation / Report modal state (Section 17)
    const [reportingVenture, setReportingVenture] = useState<StartupVenture | null>(null);
    const [reportReason, setReportReason] = useState<'ip_infringement' | 'plagiarism' | 'inappropriate' | 'spam' | 'other'>('ip_infringement');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    // Venture Workspace state (Section 8.3)
    const [workspace, setWorkspace] = useState<VentureWorkspace | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadVentures = async () => {
        setLoading(true);
        try {
            const list = await getStartupVentures();
            setVentures(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadWorkspace = async (vId = 'venture-1') => {
        try {
            const ws = await getVentureWorkspace(vId);
            setWorkspace(ws);
        } catch (e) {
            console.warn('[Workspace] load failed:', e);
        }
    };

    useEffect(() => {
        loadVentures();
        loadWorkspace();
    }, []);

    const handleToggleMilestone = async (mId: string) => {
        if (!workspace) return;
        const updated = {
            ...workspace,
            milestones: workspace.milestones.map(m => {
                if (m.id !== mId) return m;
                const nextStatus: 'completed' | 'in_progress' | 'pending' =
                    m.status === 'completed' ? 'in_progress' : m.status === 'in_progress' ? 'pending' : 'completed';
                return { ...m, status: nextStatus };
            }),
        };
        setWorkspace(updated);
        await saveVentureWorkspace(updated);
        showToast('Milestone status updated!');
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !newTaskTitle.trim()) return;
        const newTask: VentureTask = {
            id: `task_${Date.now()}`,
            title: newTaskTitle.trim(),
            assignee: profile?.name || 'Founding Team',
            status: 'todo',
            priority: newTaskPriority,
        };
        const updated = {
            ...workspace,
            tasks: [newTask, ...workspace.tasks],
        };
        setWorkspace(updated);
        setNewTaskTitle('');
        await saveVentureWorkspace(updated);
        showToast('New venture sprint task added!');
    };

    const handleToggleTaskStatus = async (tId: string) => {
        if (!workspace) return;
        const updated = {
            ...workspace,
            tasks: workspace.tasks.map(t => {
                if (t.id !== tId) return t;
                const nextStatus: 'todo' | 'in_progress' | 'done' =
                    t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
                return { ...t, status: nextStatus };
            }),
        };
        setWorkspace(updated);
        await saveVentureWorkspace(updated);
    };

    const handleSendReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportingVenture) return;
        setSubmittingReport(true);
        try {
            await reportVentureIdea({
                ventureId: reportingVenture.id,
                ventureTitle: reportingVenture.title,
                reporterUid: dbUid || user?.uid,
                reason: reportReason,
                details: reportDetails.trim(),
            });
            showToast('Report submitted for review. Thank you for protecting community IP.', 'info');
            setReportingVenture(null);
            setReportDetails('');
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingReport(false);
        }
    };

    const filtered = ventures.filter(v => {
        const matchesStage = selectedStage === 'All' || v.stage === selectedStage;
        const matchesSearch = !search.trim() ||
            v.title.toLowerCase().includes(search.toLowerCase()) ||
            v.tagline.toLowerCase().includes(search.toLowerCase()) ||
            v.domain.toLowerCase().includes(search.toLowerCase()) ||
            v.skillsNeeded.some(s => s.toLowerCase().includes(search.toLowerCase()));
        return matchesStage && matchesSearch;
    });

    const handleSendCollab = async () => {
        if (!selectedVenture || !user) return;
        setSendingCollab(true);
        try {
            await sendCollaborationRequest({
                ventureId: selectedVenture.id,
                ventureTitle: selectedVenture.title,
                fromUid: dbUid || user.uid,
                fromName: profile?.name || user.displayName || 'Candidate',
                fromEmail: user.email || '',
                fromHeadline: profile?.headline || 'Aspiring Co-Founder & Engineer',
                toUid: selectedVenture.ownerUid,
                roleInterested: roleChoice || selectedVenture.rolesNeeded[0] || 'Co-Founder',
                message: collabMsg || 'I am excited about this venture and would love to collaborate on the technology architecture and product execution.',
                skills: profile?.skills || ['Software Engineering', 'Problem Solving'],
            });
            setCollabSuccess(true);
            showToast(`Collaboration request sent to ${selectedVenture.ownerName}!`);
            setTimeout(() => {
                setCollabSuccess(false);
                setSelectedVenture(null);
                setCollabMsg('');
            }, 1800);
        } catch (e) {
            console.error(e);
        } finally {
            setSendingCollab(false);
        }
    };

    const handleCreateVenture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newTagline.trim()) return;

        setCreating(true);
        try {
            const createdId = await createStartupVenture({
                ownerUid: dbUid || user?.uid || 'user-1',
                ownerName: profile?.name || user?.displayName || 'Student Founder',
                title: newTitle.trim(),
                tagline: newTagline.trim(),
                problem: newProblem.trim() || 'Addressing market inefficiency in existing systems.',
                solution: newSolution.trim() || 'Building an AI-driven, scalable platform.',
                stage: newStage,
                domain: newDomain.trim(),
                skillsNeeded: newSkills.split(',').map(s => s.trim()).filter(Boolean),
                rolesNeeded: newRoles.split(',').map(r => r.trim()).filter(Boolean),
                equityOffer: newEquity.trim(),
                stipendOffer: newStipend.trim(),
                location: profile?.institutionName || 'India',
                remote: true,
                visibility: newVisibility,
            });

            showToast(`🎉 "${newTitle}" posted to CapAble Ventures!`);
            setShowCreateModal(false);
            // Reset form
            setNewTitle('');
            setNewTagline('');
            setNewProblem('');
            setNewSolution('');
            await loadVentures();
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="sv-container">
            {toast && (
                <div className={`sv-toast ${toast.type}`}>
                    <CheckCircle2 size={16} />
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* View Navigation */}
            <div className="sv-tab-nav">
                <button
                    className={`sv-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                    onClick={() => setActiveTab('explore')}
                >
                    <Rocket size={15} /> Explore Ventures & Co-Founders
                </button>
                <button
                    className={`sv-tab-btn ${activeTab === 'workspace' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workspace')}
                >
                    <FolderKanban size={15} /> Venture Workspace
                    <span className="sv-tab-badge">Section 8.3</span>
                </button>
            </div>

            {activeTab === 'explore' ? (
                <>
                    {/* Banner */}
                    <div className="sv-banner">
                        <div className="sv-banner-content">
                            <span className="sv-eyebrow">
                                <Sparkles size={13} /> CAPABLE VENTURES & CO-FOUNDER NETWORK
                            </span>
                            <h2>Turn Ideas into Teams, Prototypes & Startups</h2>
                            <p>
                                Discover early-stage ventures seeking technical co-founders, join campus startup teams, or publish your own venture with complete IP privacy controls.
                            </p>
                        </div>
                        <div className="sv-banner-action">
                            <button className="sv-btn-primary" onClick={() => setShowCreateModal(true)}>
                                <Plus size={16} /> Post Venture Idea
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="sv-controls">
                        <div className="sv-search">
                            <Search size={16} />
                            <input
                                placeholder="Search ventures by domain, tech stack (e.g. eBPF, PyTorch, FinTech)..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="sv-chips">
                            {STAGES.map(stage => (
                                <button
                                    key={stage}
                                    className={`sv-chip ${selectedStage === stage ? 'active' : ''}`}
                                    onClick={() => setSelectedStage(stage)}
                                >
                                    {stage === 'All' ? 'All Stages' : stage}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ventures Grid */}
                    {loading ? (
                        <div className="sv-loading">
                            <Loader2 size={32} className="sv-spin" />
                            <span>Loading verified startup opportunities...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="sv-empty">
                            <Lightbulb size={36} />
                            <h3>No ventures found for "{search}"</h3>
                            <p>Be the first founder to post a venture idea in this category!</p>
                            <button className="sv-btn-primary" onClick={() => setShowCreateModal(true)}>
                                <Plus size={16} /> Post First Venture
                            </button>
                        </div>
                    ) : (
                        <div className="sv-grid">
                            {filtered.map(v => (
                                <div key={v.id} className="sv-card">
                                    <div className="sv-card-header">
                                        <div>
                                            <span className="sv-domain-badge">{v.domain}</span>
                                            <h3 className="sv-card-title">{v.title}</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={`sv-stage-badge ${v.stage.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {v.stage}
                                            </span>
                                            <button
                                                className="sv-card-flag-btn"
                                                title="Report / Flag idea for IP or content concern"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReportingVenture(v);
                                                }}
                                            >
                                                <Flag size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="sv-tagline">{v.tagline}</p>

                                    <div className="sv-section-box">
                                        <p className="sv-box-label">The Problem</p>
                                        <p className="sv-box-text">{v.problem}</p>
                                    </div>

                                    <div className="sv-roles-needed">
                                        <span className="sv-roles-label">Seeking Co-Founders / Talent:</span>
                                        <div className="sv-roles-tags">
                                            {v.rolesNeeded.map((r, i) => (
                                                <span key={i} className="sv-role-pill">
                                                    <Briefcase size={12} /> {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sv-skills-row">
                                        {v.skillsNeeded.map((s, i) => (
                                            <span key={i} className="sv-skill-tag">{s}</span>
                                        ))}
                                    </div>

                                    <div className="sv-card-footer">
                                        <div className="sv-comp-meta">
                                            <div className="sv-equity">
                                                <Award size={14} color="#7c3aed" />
                                                <span>Equity: <strong>{v.equityOffer}</strong></span>
                                            </div>
                                            <div className="sv-location">
                                                <MapPin size={13} color="#64748b" />
                                                <span>{v.location} {v.remote && '(Remote OK)'}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="sv-btn-connect"
                                            onClick={() => {
                                                setSelectedVenture(v);
                                                setRoleChoice(v.rolesNeeded[0] || 'Technical Co-Founder');
                                            }}
                                        >
                                            <Rocket size={15} /> Connect as Co-Founder
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                /* Venture Workspace View (Section 8.3) */
                <div className="sv-workspace">
                    <div className="sv-ws-header">
                        <div className="sv-ws-title">
                            <h3><Rocket size={20} color="#6366f1" /> {workspace?.title || 'My Venture Workspace'}</h3>
                            <p>{workspace?.notes || 'Track prototype roadmap, team collaboration, sprint tasks, and incubator applications.'}</p>
                        </div>
                        <div className="sv-ws-links">
                            {workspace?.pitchDeckUrl && (
                                <a href={workspace.pitchDeckUrl} target="_blank" rel="noreferrer" className="sv-ws-link-btn">
                                    <FileText size={14} /> Pitch Deck
                                </a>
                            )}
                            {workspace?.repoUrl && (
                                <a href={workspace.repoUrl} target="_blank" rel="noreferrer" className="sv-ws-link-btn">
                                    <ExternalLink size={14} /> GitHub Repo
                                </a>
                            )}
                            <button className="sv-btn-primary" onClick={() => setShowCreateModal(true)}>
                                <Plus size={15} /> Post New Update
                            </button>
                        </div>
                    </div>

                    <div className="sv-ws-grid">
                        {/* Milestones Card */}
                        <div className="sv-ws-card">
                            <div className="sv-ws-card-header">
                                <h4><CheckSquare size={16} color="#10b981" /> Venture Milestones Roadmap</h4>
                                {workspace && (
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                                        {Math.round((workspace.milestones.filter(m => m.status === 'completed').length / (workspace.milestones.length || 1)) * 100)}% Complete
                                    </span>
                                )}
                            </div>

                            {workspace && (
                                <div className="sv-milestone-rail">
                                    <div
                                        className="sv-milestone-fill"
                                        style={{
                                            width: `${Math.round((workspace.milestones.filter(m => m.status === 'completed').length / (workspace.milestones.length || 1)) * 100)}%`
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {workspace?.milestones.map(m => (
                                    <div key={m.id} className="sv-milestone-item">
                                        <div
                                            className="sv-ms-check"
                                            onClick={() => handleToggleMilestone(m.id)}
                                        >
                                            {m.status === 'completed' ? (
                                                <CheckCircle2 size={18} color="#10b981" />
                                            ) : m.status === 'in_progress' ? (
                                                <Loader2 size={18} color="#6366f1" className="sv-spin" />
                                            ) : (
                                                <Square size={18} color="#cbd5e1" />
                                            )}
                                        </div>
                                        <div className="sv-ms-info">
                                            <div className={`sv-ms-title ${m.status === 'completed' ? 'completed' : ''}`}>
                                                <span>{m.title}</span>
                                                {m.dueDate && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Due: {m.dueDate}</span>}
                                            </div>
                                            <p className="sv-ms-desc">{m.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sprint Tasks Card */}
                        <div className="sv-ws-card">
                            <div className="sv-ws-card-header">
                                <h4><ListTodo size={16} color="#6366f1" /> Sprint Tasks & Kanban</h4>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                    {workspace?.tasks.filter(t => t.status === 'done').length} / {workspace?.tasks.length} Done
                                </span>
                            </div>

                            <form onSubmit={handleAddTask} className="sv-task-add">
                                <input
                                    className="sv-task-input"
                                    placeholder="Add sprint task (e.g. Test OAuth with E-Cell)..."
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                                <select
                                    style={{ padding: '0 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                    value={newTaskPriority}
                                    onChange={e => setNewTaskPriority(e.target.value as any)}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                <button type="submit" className="sv-btn-primary" style={{ padding: '8px 12px' }}>
                                    <Plus size={14} /> Add
                                </button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                                {workspace?.tasks.map(t => (
                                    <div
                                        key={t.id}
                                        className={`sv-task-item ${t.status === 'done' ? 'done' : ''}`}
                                        onClick={() => handleToggleTaskStatus(t.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {t.status === 'done' ? (
                                                <CheckCircle2 size={16} color="#10b981" />
                                            ) : (
                                                <Square size={16} color="#94a3b8" />
                                            )}
                                            <span style={{ fontSize: '13px', fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                                                {t.title}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={`sv-task-tag ${t.priority}`}>{t.priority}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{t.assignee}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Team Roster Card */}
                        <div className="sv-ws-card" style={{ gridColumn: 'span 2' }}>
                            <div className="sv-ws-card-header">
                                <h4><Users size={16} color="#7c3aed" /> Founding Team & Equity Cap Table</h4>
                                <button className="sv-btn-secondary" onClick={() => setActiveTab('explore')}>
                                    <Plus size={14} /> Recruit Co-Founder
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {workspace?.team.map(member => (
                                    <div key={member.id} className="sv-team-row">
                                        <div>
                                            <div className="sv-team-name">{member.name}</div>
                                            <div className="sv-team-role">{member.role} • Joined: {member.joinedAt}</div>
                                        </div>
                                        <div className="sv-team-equity">
                                            Equity: {member.equityShare}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collaboration Modal */}
            <AnimatePresence>
                {selectedVenture && (
                    <div className="sv-modal-backdrop" onClick={() => setSelectedVenture(null)}>
                        <motion.div
                            className="sv-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sv-modal-header">
                                <div>
                                    <span className="sv-eyebrow">CO-FOUNDER INVITATION</span>
                                    <h3>Collaborate with {selectedVenture.title}</h3>
                                </div>
                                <button className="sv-modal-close" onClick={() => setSelectedVenture(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {collabSuccess ? (
                                <div className="sv-modal-success">
                                    <CheckCircle2 size={48} color="#10b981" />
                                    <h4>Request Sent Successfully!</h4>
                                    <p>Founder {selectedVenture.ownerName} will review your verified profile & projects.</p>
                                </div>
                            ) : (
                                <div className="sv-modal-body">
                                    <div className="sv-modal-summary">
                                        <p><strong>Founder:</strong> {selectedVenture.ownerName}</p>
                                        <p><strong>Domain:</strong> {selectedVenture.domain} ({selectedVenture.stage})</p>
                                        <p><strong>Equity Offer:</strong> {selectedVenture.equityOffer}</p>
                                    </div>

                                    <div className="sv-form-group">
                                        <label>Role You Want to Fill</label>
                                        <select
                                            value={roleChoice}
                                            onChange={e => setRoleChoice(e.target.value)}
                                        >
                                            {selectedVenture.rolesNeeded.map((r, i) => (
                                                <option key={i} value={r}>{r}</option>
                                            ))}
                                            <option value="Advisor / Fractional Contributor">Advisor / Fractional Contributor</option>
                                        </select>
                                    </div>

                                    <div className="sv-form-group">
                                        <label>Pitch Your Synergy & Experience</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Explain why you are the ideal co-founder, relevant projects you have shipped, and your availability..."
                                            value={collabMsg}
                                            onChange={e => setCollabMsg(e.target.value)}
                                        />
                                    </div>

                                    <div className="sv-modal-actions">
                                        <button className="sv-btn-secondary" onClick={() => setSelectedVenture(null)}>
                                            Cancel
                                        </button>
                                        <button
                                            className="sv-btn-primary"
                                            onClick={handleSendCollab}
                                            disabled={sendingCollab}
                                        >
                                            {sendingCollab ? (
                                                <><Loader2 size={16} className="sv-spin" /> Sending...</>
                                            ) : (
                                                <><Send size={15} /> Send Co-Founder Request</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Venture Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="sv-modal-backdrop" onClick={() => setShowCreateModal(false)}>
                        <motion.div
                            className="sv-modal sv-modal-lg"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sv-modal-header">
                                <div>
                                    <span className="sv-eyebrow">NEW VENTURE CREATION</span>
                                    <h3>Post a Venture & Find Co-Founders</h3>
                                </div>
                                <button className="sv-modal-close" onClick={() => setShowCreateModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateVenture} className="sv-modal-body">
                                <div className="sv-form-grid">
                                    <div className="sv-form-group">
                                        <label>Startup / Venture Name *</label>
                                        <input
                                            required
                                            placeholder="e.g. KavachAI, DronePulse, EduMesh"
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="sv-form-group">
                                        <label>Current Stage</label>
                                        <select
                                            value={newStage}
                                            onChange={e => setNewStage(e.target.value as any)}
                                        >
                                            <option value="Idea">Idea</option>
                                            <option value="Prototype">Prototype</option>
                                            <option value="MVP">MVP</option>
                                            <option value="Early Traction">Early Traction</option>
                                            <option value="Growth">Growth</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="sv-form-group">
                                    <label>One-Line Tagline *</label>
                                    <input
                                        required
                                        placeholder="Clear summary: e.g. Autonomous cyber defense for rural cooperative banks"
                                        value={newTagline}
                                        onChange={e => setNewTagline(e.target.value)}
                                    />
                                </div>

                                <div className="sv-form-grid">
                                    <div className="sv-form-group">
                                        <label>Problem Statement</label>
                                        <textarea
                                            rows={2}
                                            placeholder="What core market pain point are you solving?"
                                            value={newProblem}
                                            onChange={e => setNewProblem(e.target.value)}
                                        />
                                    </div>
                                    <div className="sv-form-group">
                                        <label>Proposed Solution / Architecture</label>
                                        <textarea
                                            rows={2}
                                            placeholder="How does your technology or business model solve it?"
                                            value={newSolution}
                                            onChange={e => setNewSolution(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="sv-form-grid">
                                    <div className="sv-form-group">
                                        <label>Roles Needed (comma-separated)</label>
                                        <input
                                            placeholder="e.g. Technical Co-Founder, Rust Engineer, UI/UX"
                                            value={newRoles}
                                            onChange={e => setNewRoles(e.target.value)}
                                        />
                                    </div>
                                    <div className="sv-form-group">
                                        <label>Key Tech Stack / Skills (comma-separated)</label>
                                        <input
                                            placeholder="e.g. PyTorch, Next.js, Embedded C++, Web3"
                                            value={newSkills}
                                            onChange={e => setNewSkills(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="sv-form-grid">
                                    <div className="sv-form-group">
                                        <label>Equity Terms</label>
                                        <input
                                            placeholder="e.g. 10% – 15%, Equal Partner 33%"
                                            value={newEquity}
                                            onChange={e => setNewEquity(e.target.value)}
                                        />
                                    </div>
                                    <div className="sv-form-group">
                                        <label>Visibility Setting</label>
                                        <select
                                            value={newVisibility}
                                            onChange={e => setNewVisibility(e.target.value as any)}
                                        >
                                            <option value="public">Public (Visible to all students & founders)</option>
                                            <option value="collaborators">Collaborators Only</option>
                                            <option value="private">Private Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="sv-privacy-note">
                                    <ShieldCheck size={16} color="#059669" />
                                    <span>
                                        <strong>IP Protection:</strong> You maintain full ownership of your concept. Visibility controls allow you to share only macro summaries publicly while protecting proprietary algorithms.
                                    </span>
                                </div>

                                <div className="sv-modal-actions">
                                    <button type="button" className="sv-btn-secondary" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="sv-btn-primary" disabled={creating}>
                                        {creating ? (
                                            <><Loader2 size={16} className="sv-spin" /> Publishing Venture...</>
                                        ) : (
                                            <><Rocket size={16} /> Publish Venture Listing</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Moderation / Report Modal (Section 17) */}
            <AnimatePresence>
                {reportingVenture && (
                    <div className="sv-modal-backdrop" onClick={() => setReportingVenture(null)}>
                        <motion.div
                            className="sv-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sv-modal-header">
                                <div>
                                    <span className="sv-eyebrow" style={{ color: '#ef4444' }}>
                                        <ShieldAlert size={13} /> CONTENT MODERATION & IP PROTECTION
                                    </span>
                                    <h3>Report Venture Idea: {reportingVenture.title}</h3>
                                </div>
                                <button className="sv-modal-close" onClick={() => setReportingVenture(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSendReport} className="sv-modal-body">
                                <div className="sv-form-group">
                                    <label>Reason for Flagging / Reporting</label>
                                    <select
                                        value={reportReason}
                                        onChange={e => setReportReason(e.target.value as any)}
                                    >
                                        <option value="ip_infringement">🛡️ Intellectual Property / Copyright Infringement</option>
                                        <option value="plagiarism">📋 Plagiarism of existing student/startup concept</option>
                                        <option value="inappropriate">⚠️ Inappropriate, abusive, or harmful content</option>
                                        <option value="spam">🚫 Spam, misleading advertisement, or fraudulent role</option>
                                        <option value="other">💬 Other violation of Community Guidelines</option>
                                    </select>
                                </div>

                                <div className="sv-form-group">
                                    <label>Provide Details / Context *</label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Please detail why this venture listing violates guidelines or infringes intellectual property..."
                                        value={reportDetails}
                                        onChange={e => setReportDetails(e.target.value)}
                                    />
                                </div>

                                <div className="sv-privacy-note">
                                    <ShieldCheck size={16} color="#059669" />
                                    <span>
                                        Reports are audited confidentially by institution E-Cell admins and the CapAble moderation trust team.
                                    </span>
                                </div>

                                <div className="sv-modal-actions">
                                    <button type="button" className="sv-btn-secondary" onClick={() => setReportingVenture(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="sv-btn-primary"
                                        style={{ background: '#ef4444', borderColor: '#dc2626' }}
                                        disabled={submittingReport || !reportDetails.trim()}
                                    >
                                        {submittingReport ? (
                                            <><Loader2 size={16} className="sv-spin" /> Submitting Report...</>
                                        ) : (
                                            <><Flag size={15} /> Submit Report</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
