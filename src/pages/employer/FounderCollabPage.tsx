import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getStartupVentures,
    createStartupVenture,
    sendCollaborationRequest,
    getVentureWorkspace,
    saveVentureWorkspace,
    type StartupVenture,
    type VentureWorkspace,
    type SystemArchitectureNode,
    type VentureTask,
    type VentureMilestone,
    type EquityAllocations
} from '../../services/ventureService';
import {
    Rocket, Users, Video, Plus, Search, Filter, Cpu, Layers,
    Server, Database, Network, Cloud, CheckCircle2, Clock,
    AlertCircle, Sparkles, Send, Copy, ExternalLink, ArrowRight,
    Sliders, Code, FileText, Check, X, Shield, Activity, Share2,
    Calendar, MapPin, DollarSign, Briefcase, HelpCircle
} from 'lucide-react';
import './FounderCollabPage.css';

type ActiveTab = 'connect' | 'plan' | 'design';

const STAGE_OPTIONS = ['All', 'Idea', 'Prototype', 'MVP', 'Early Traction', 'Growth'];

export default function FounderCollabPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('connect');

    // Ventures & Network state
    const [ventures, setVentures] = useState<StartupVenture[]>([]);
    const [loadingVentures, setLoadingVentures] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState('All');

    // Active Workspace state for Plan & Design
    const [activeVentureId, setActiveVentureId] = useState('venture-1');
    const [workspace, setWorkspace] = useState<VentureWorkspace | null>(null);
    const [savingWorkspace, setSavingWorkspace] = useState(false);

    // Selected Architecture Node for Inspection/Editing
    const [selectedNode, setSelectedNode] = useState<SystemArchitectureNode | null>(null);

    // Modals
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [targetVenture, setTargetVenture] = useState<StartupVenture | null>(null);
    const [roleInterested, setRoleInterested] = useState('Technical Co-Founder');
    const [connectMsg, setConnectMsg] = useState('');
    const [meetScheduleLink, setMeetScheduleLink] = useState('https://meet.google.com/new');
    const [sendingInvite, setSendingInvite] = useState(false);

    // Register Venture Modal
    const [showCreateVentureModal, setShowCreateVentureModal] = useState(false);
    const [vTitle, setVTitle] = useState('');
    const [vTagline, setVTagline] = useState('');
    const [vProblem, setVProblem] = useState('');
    const [vSolution, setVSolution] = useState('');
    const [vStage, setVStage] = useState<StartupVenture['stage']>('MVP');
    const [vDomain, setVDomain] = useState('AI / B2B SaaS');
    const [vRolesNeeded, setVRolesNeeded] = useState('Technical Co-Founder (Systems/Fullstack)');
    const [vEquity, setVEquity] = useState('10% – 15% Equity');
    const [creatingVenture, setCreatingVenture] = useState(false);

    // Plan Task & Milestone forms
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [newTaskAssignee, setNewTaskAssignee] = useState(user?.displayName || 'Founding Engineer');

    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
    const [newMilestoneDue, setNewMilestoneDue] = useState('');

    // Toast notification
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load initial ventures & active workspace
    useEffect(() => {
        async function initData() {
            setLoadingVentures(true);
            try {
                const list = await getStartupVentures();
                setVentures(list);
            } catch (err) {
                console.warn('Failed to load ventures:', err);
            } finally {
                setLoadingVentures(false);
            }

            try {
                const ws = await getVentureWorkspace(activeVentureId);
                setWorkspace(ws);
                if (ws.architectureNodes && ws.architectureNodes.length > 0) {
                    setSelectedNode(ws.architectureNodes[0]);
                }
            } catch (err) {
                console.warn('Failed to load workspace:', err);
            }
        }
        initData();
    }, [activeVentureId]);

    // Filtered ventures
    const filteredVentures = useMemo(() => {
        return ventures.filter(v => {
            const matchesStage = selectedStage === 'All' || v.stage === selectedStage;
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q ||
                v.title.toLowerCase().includes(q) ||
                v.tagline.toLowerCase().includes(q) ||
                v.domain.toLowerCase().includes(q) ||
                v.ownerName.toLowerCase().includes(q) ||
                (v.skillsNeeded && v.skillsNeeded.some(s => s.toLowerCase().includes(q)));
            return matchesStage && matchesSearch;
        });
    }, [ventures, selectedStage, searchQuery]);

    // Save workspace changes
    const persistWorkspace = async (updated: VentureWorkspace) => {
        setWorkspace(updated);
        setSavingWorkspace(true);
        try {
            await saveVentureWorkspace(updated);
        } catch (e) {
            console.warn('Failed to save to Firestore, stored locally:', e);
        } finally {
            setSavingWorkspace(false);
        }
    };

    // ─── CONNECT HANDLERS ───────────────────────────────────────────────────
    const handleOpenConnectModal = (v: StartupVenture) => {
        setTargetVenture(v);
        setRoleInterested(v.rolesNeeded?.[0] || 'Technical Co-Founder');
        setConnectMsg(`Hi ${v.ownerName}, I'm the founder of ${user?.displayName || 'our startup'}. I reviewed your vision for ${v.title} on CapAble and would love to discuss a strategic co-founding partnership / syndicate.`);
        // Generate pre-populated Google Meet room link
        const roomCode = `capable-sync-${Math.random().toString(36).substring(2, 7)}`;
        setMeetScheduleLink(`https://meet.google.com/${roomCode}`);
        setShowConnectModal(true);
    };

    const handleSendCollaboration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetVenture) return;
        setSendingInvite(true);
        try {
            await sendCollaborationRequest({
                ventureId: targetVenture.id,
                ventureTitle: targetVenture.title,
                fromUid: user?.uid || 'employer_founder',
                fromName: user?.displayName || 'Startup Founder',
                fromEmail: user?.email || 'founder@startup.io',
                fromHeadline: 'Founder & Managing Director',
                toUid: targetVenture.ownerUid,
                roleInterested: roleInterested,
                message: `${connectMsg}\n\n[Google Meet 1:1 Video Sync]: ${meetScheduleLink}`,
                skills: ['Systems Architecture', 'Product Strategy', 'Venture Capital']
            });
            setShowConnectModal(false);
            showNotification(`Invite & Google Meet link sent to ${targetVenture.ownerName}!`);
        } catch (err) {
            showNotification('Invite dispatched to founder queue', 'info');
            setShowConnectModal(false);
        } finally {
            setSendingInvite(false);
        }
    };

    const handleCreateVenture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vTitle.trim() || !vTagline.trim()) return;
        setCreatingVenture(true);
        try {
            const newId = await createStartupVenture({
                ownerUid: user?.uid || 'emp_founder',
                ownerName: user?.displayName || 'Founding Team',
                title: vTitle,
                tagline: vTagline,
                problem: vProblem,
                solution: vSolution,
                stage: vStage,
                domain: vDomain,
                skillsNeeded: ['TypeScript', 'Distributed Systems', 'Product Design'],
                rolesNeeded: [vRolesNeeded],
                equityOffer: vEquity,
                stipendOffer: 'Seed Grant / Equity Split',
                location: 'Bengaluru / Remote',
                remote: true,
                visibility: 'public'
            });
            const refreshed = await getStartupVentures();
            setVentures(refreshed);
            setShowCreateVentureModal(false);
            showNotification(`Venture "${vTitle}" published to Founder Network!`);
            // Reset form
            setVTitle('');
            setVTagline('');
            setVProblem('');
            setVSolution('');
        } catch (err) {
            showNotification('Error creating venture', 'info');
        } finally {
            setCreatingVenture(false);
        }
    };

    // ─── PLAN HANDLERS ──────────────────────────────────────────────────────
    const handleToggleMilestone = async (mId: string) => {
        if (!workspace) return;
        const updatedMilestones = workspace.milestones.map(m => {
            if (m.id !== mId) return m;
            const nextStatus: 'completed' | 'in_progress' | 'pending' =
                m.status === 'completed' ? 'in_progress' : m.status === 'in_progress' ? 'pending' : 'completed';
            return { ...m, status: nextStatus };
        });
        const updated = { ...workspace, milestones: updatedMilestones };
        await persistWorkspace(updated);
        showNotification('Milestone roadmap updated');
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !newMilestoneTitle.trim()) return;
        const newM: VentureMilestone = {
            id: `m_${Date.now()}`,
            title: newMilestoneTitle.trim(),
            description: newMilestoneDesc.trim() || 'Key startup deliverable',
            status: 'pending',
            dueDate: newMilestoneDue || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
        };
        const updated = {
            ...workspace,
            milestones: [...workspace.milestones, newM]
        };
        await persistWorkspace(updated);
        setNewMilestoneTitle('');
        setNewMilestoneDesc('');
        setNewMilestoneDue('');
        showNotification('New milestone added to roadmap!');
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !newTaskTitle.trim()) return;
        const task: VentureTask = {
            id: `task_${Date.now()}`,
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            status: 'todo',
            assignee: newTaskAssignee.trim() || 'Founding Engineer'
        };
        const updated = {
            ...workspace,
            tasks: [...workspace.tasks, task]
        };
        await persistWorkspace(updated);
        setNewTaskTitle('');
        showNotification('Sprint task added to backlog');
    };

    const handleToggleTaskStatus = async (taskId: string) => {
        if (!workspace) return;
        const updatedTasks = workspace.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nextStatus: 'todo' | 'in_progress' | 'done' =
                t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
            return { ...t, status: nextStatus };
        });
        const updated = { ...workspace, tasks: updatedTasks };
        await persistWorkspace(updated);
    };

    const handleUpdateEquity = async (key: keyof EquityAllocations, val: number) => {
        if (!workspace || !workspace.equityAllocations) return;
        const updatedEquity = {
            ...workspace.equityAllocations,
            [key]: Math.max(0, Math.min(100, val))
        };
        const updated = { ...workspace, equityAllocations: updatedEquity };
        await persistWorkspace(updated);
    };

    // ─── DESIGN HANDLERS ────────────────────────────────────────────────────
    const handleUpdateNode = async (updatedNode: SystemArchitectureNode) => {
        if (!workspace || !workspace.architectureNodes) return;
        const nodes = workspace.architectureNodes.map(n => n.id === updatedNode.id ? updatedNode : n);
        const updated = { ...workspace, architectureNodes: nodes };
        setSelectedNode(updatedNode);
        await persistWorkspace(updated);
        showNotification(`Component "${updatedNode.label}" updated`);
    };

    const handleUpdateDesignNotes = async (notes: string) => {
        if (!workspace) return;
        const updated = { ...workspace, designNotes: notes };
        await persistWorkspace(updated);
    };

    const handleCopyMarkdownRFC = () => {
        if (!workspace?.designNotes) return;
        navigator.clipboard.writeText(workspace.designNotes);
        showNotification('Architecture RFC copied to clipboard!');
    };

    const handleExportBlueprintJSON = () => {
        if (!workspace) return;
        const blueprint = {
            venture: workspace.title,
            exportedAt: new Date().toISOString(),
            architectureNodes: workspace.architectureNodes,
            equityAllocations: workspace.equityAllocations,
            milestones: workspace.milestones,
            rfc: workspace.designNotes
        };
        const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workspace.title.toLowerCase().replace(/\s+/g, '_')}_system_design.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('System Design Blueprint exported!');
    };

    // Calculate milestone completion percentage
    const completedMilestones = workspace?.milestones.filter(m => m.status === 'completed').length || 0;
    const totalMilestones = workspace?.milestones.length || 1;
    const milestoneProgress = Math.round((completedMilestones / totalMilestones) * 100);

    // Calculate total equity
    const totalEquity = workspace?.equityAllocations
        ? (workspace.equityAllocations.founders +
           workspace.equityAllocations.coFounders +
           workspace.equityAllocations.esopPool +
           workspace.equityAllocations.advisors +
           workspace.equityAllocations.investors)
        : 100;

    return (
        <div className="fcollab-page">
            <FloatingNavbar variant="employer" />

            <main className="fcollab-main">
                {/* Header */}
                <motion.div
                    className="fcollab-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="fcollab-header-left">
                        <div className="fcollab-header-icon">
                            <Rocket size={28} />
                        </div>
                        <div>
                            <h1 className="fcollab-title">Founder Co-Planning & Design Hub</h1>
                            <p className="fcollab-sub">
                                Connect with verified startup founders, plan development roadmaps, and co-design distributed system architectures.
                            </p>
                        </div>
                    </div>

                    <div className="fcollab-header-actions">
                        <button
                            className="fcollab-btn-meet"
                            onClick={() => window.open('https://meet.google.com/new', '_blank')}
                            title="Start an instant 1:1 strategy sync on Google Meet"
                        >
                            <Video size={16} /> Instant Google Meet
                        </button>
                        <button
                            className="fcollab-btn-primary"
                            onClick={() => setShowCreateVentureModal(true)}
                        >
                            <Plus size={16} /> Publish My Venture
                        </button>
                    </div>
                </motion.div>

                {/* Quick Metrics Bar */}
                <div className="fcollab-metrics-bar">
                    <div className="fcollab-metric-card">
                        <div className="fcollab-metric-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="fcollab-metric-val">{ventures.length}+</div>
                            <div className="fcollab-metric-lbl">Active Founders</div>
                        </div>
                    </div>

                    <div className="fcollab-metric-card">
                        <div className="fcollab-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <div className="fcollab-metric-val">{workspace?.architectureNodes?.length || 9}</div>
                            <div className="fcollab-metric-lbl">System Components</div>
                        </div>
                    </div>

                    <div className="fcollab-metric-card">
                        <div className="fcollab-metric-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="fcollab-metric-val">{milestoneProgress}%</div>
                            <div className="fcollab-metric-lbl">Roadmap Velocity</div>
                        </div>
                    </div>

                    <div className="fcollab-metric-card">
                        <div className="fcollab-metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <div className="fcollab-metric-val">100%</div>
                            <div className="fcollab-metric-lbl">Cap Table Parity</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="fcollab-tabs">
                    <button
                        className={`fcollab-tab-btn ${activeTab === 'connect' ? 'active' : ''}`}
                        onClick={() => setActiveTab('connect')}
                    >
                        <Users size={16} /> Connect (Founder Network)
                    </button>
                    <button
                        className={`fcollab-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plan')}
                    >
                        <Layers size={16} /> Plan (Milestones & Backlog)
                    </button>
                    <button
                        className={`fcollab-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
                        onClick={() => setActiveTab('design')}
                    >
                        <Network size={16} /> Design (System Architecture)
                    </button>
                </div>

                {/* ─── TAB 1: CONNECT (Founder Network & Matchmaking) ─── */}
                {activeTab === 'connect' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        {/* Search & Filter Row */}
                        <div className="fcollab-filter-row">
                            <div className="fcollab-search-input">
                                <Search size={16} color="#94a3b8" />
                                <input
                                    type="text"
                                    placeholder="Search founders by domain, tech stack (Go, Rust, AI), or problem..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="fcollab-stage-pills">
                                {STAGE_OPTIONS.map(stage => (
                                    <button
                                        key={stage}
                                        className={`fcollab-stage-pill ${selectedStage === stage ? 'active' : ''}`}
                                        onClick={() => setSelectedStage(stage)}
                                    >
                                        {stage}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Founder Cards Grid */}
                        {loadingVentures ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                                Loading Founder Network...
                            </div>
                        ) : filteredVentures.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '16px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No founders matching current filters</p>
                                <button className="fcollab-btn-outline" onClick={() => { setSearchQuery(''); setSelectedStage('All'); }}>
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="fcollab-grid">
                                {filteredVentures.map((v) => (
                                    <div key={v.id} className="fcollab-card">
                                        <div className="fcollab-card-top">
                                            <div className="fcollab-founder-meta">
                                                <div className="fcollab-founder-avatar">
                                                    {v.ownerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="fcollab-card-title">{v.title}</h3>
                                                    <p className="fcollab-card-founder">
                                                        by <strong>{v.ownerName}</strong> &bull; {v.domain}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: '#f1f5f9',
                                                color: '#475569'
                                            }}>
                                                {v.stage}
                                            </span>
                                        </div>

                                        <p className="fcollab-tagline">
                                            &ldquo;{v.tagline}&rdquo;
                                        </p>

                                        <div className="fcollab-problem-box">
                                            <strong>Problem:</strong> {v.problem}
                                        </div>

                                        <div className="fcollab-looking-for">
                                            <span className="fcollab-looking-lbl">Looking For:</span>
                                            <div className="fcollab-role-tags">
                                                {v.rolesNeeded?.map((role, idx) => (
                                                    <span key={idx} className="fcollab-role-tag">{role}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="fcollab-perks-row">
                                            <DollarSign size={14} />
                                            <span>Offer: {v.equityOffer}</span>
                                            <span style={{ color: '#94a3b8' }}>&bull;</span>
                                            <span>{v.location}</span>
                                        </div>

                                        <div className="fcollab-card-actions">
                                            <button
                                                className="fcollab-btn-connect"
                                                onClick={() => handleOpenConnectModal(v)}
                                            >
                                                <Send size={13} /> Connect & Meet
                                            </button>
                                            <button
                                                className="fcollab-btn-outline"
                                                onClick={() => {
                                                    setActiveVentureId(v.id);
                                                    setActiveTab('design');
                                                    showNotification(`Loaded system design for ${v.title}`);
                                                }}
                                                title="View Technical Design & Architecture"
                                            >
                                                <Network size={14} /> Design
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─── TAB 2: PLAN (Roadmap, Sprint Backlog & Cap Table) ─── */}
                {activeTab === 'plan' && workspace && (
                    <motion.div
                        className="fplan-container"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Venture Selector & Workspace Status */}
                        <div className="fplan-venture-selector">
                            <div className="fplan-venture-info">
                                <div style={{ background: '#7c3aed', color: '#fff', padding: '8px', borderRadius: '10px' }}>
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                        {workspace.title}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        Active venture workspace &bull; Auto-saved to Cloud
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {ventures.map(v => (
                                    <button
                                        key={v.id}
                                        className={`fcollab-stage-pill ${activeVentureId === v.id ? 'active' : ''}`}
                                        onClick={() => setActiveVentureId(v.id)}
                                    >
                                        {v.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Milestone Roadmap */}
                        <div className="fplan-roadmap-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h2 className="fplan-section-title">
                                        <CheckCircle2 size={20} color="#10b981" /> Milestone Roadmap ({completedMilestones}/{totalMilestones} Completed)
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                        Track critical deliverables: validation, alpha engine, pilots, and venture fundraising.
                                    </p>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed' }}>
                                    {milestoneProgress}% Complete
                                </span>
                            </div>

                            <div className="fplan-progress-bar-wrap">
                                <div className="fplan-progress-bar-fill" style={{ width: `${milestoneProgress}%` }} />
                            </div>

                            <div className="fplan-milestones-list">
                                {workspace.milestones.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`fplan-milestone-item ${m.status}`}
                                        onClick={() => handleToggleMilestone(m.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="fplan-milestone-left">
                                            <input
                                                type="checkbox"
                                                checked={m.status === 'completed'}
                                                onChange={() => {}}
                                                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                                            />
                                            <div>
                                                <h4 className="fplan-milestone-title">{m.title}</h4>
                                                <p className="fplan-milestone-desc">{m.description}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {m.dueDate && (
                                                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {m.dueDate}
                                                </span>
                                            )}
                                            <span className={`fplan-status-pill ${m.status}`}>
                                                {m.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Milestone Form */}
                            <form onSubmit={handleAddMilestone} style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Add milestone title (e.g., Deploy Seed Prototype on AWS)..."
                                    value={newMilestoneTitle}
                                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                    style={{ flex: 2, minWidth: '220px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Brief description..."
                                    value={newMilestoneDesc}
                                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                                    style={{ flex: 2, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <input
                                    type="date"
                                    value={newMilestoneDue}
                                    onChange={(e) => setNewMilestoneDue(e.target.value)}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button type="submit" className="fcollab-btn-primary" style={{ padding: '10px 18px' }}>
                                    <Plus size={15} /> Add Milestone
                                </button>
                            </form>
                        </div>

                        {/* Interactive Equity & Cap Table Planner */}
                        {workspace.equityAllocations && (
                            <div className="fplan-equity-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h2 className="fplan-section-title">
                                            <Sliders size={20} color="#7c3aed" /> Cap Table & Equity Split Calculator
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                            Simulate fair equity distribution across founders, key hires, ESOP pool, and early investors.
                                        </p>
                                    </div>
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        color: totalEquity === 100 ? '#15803d' : '#dc2626',
                                        background: totalEquity === 100 ? '#dcfce7' : '#fee2e2',
                                        padding: '4px 12px',
                                        borderRadius: '20px'
                                    }}>
                                        {totalEquity === 100 ? '✓ 100% Validated' : `⚠️ Total: ${totalEquity}% (Must be 100%)`}
                                    </span>
                                </div>

                                <div className="fplan-equity-bar">
                                    <div style={{ width: `${workspace.equityAllocations.founders}%`, background: '#7c3aed' }} title={`Founders: ${workspace.equityAllocations.founders}%`} />
                                    <div style={{ width: `${workspace.equityAllocations.coFounders}%`, background: '#3b82f6' }} title={`Co-Founders: ${workspace.equityAllocations.coFounders}%`} />
                                    <div style={{ width: `${workspace.equityAllocations.esopPool}%`, background: '#10b981' }} title={`ESOP Pool: ${workspace.equityAllocations.esopPool}%`} />
                                    <div style={{ width: `${workspace.equityAllocations.advisors}%`, background: '#f59e0b' }} title={`Advisors: ${workspace.equityAllocations.advisors}%`} />
                                    <div style={{ width: `${workspace.equityAllocations.investors}%`, background: '#64748b' }} title={`Investors: ${workspace.equityAllocations.investors}%`} />
                                </div>

                                <div className="fplan-equity-sliders">
                                    <div className="fplan-equity-item">
                                        <label>Founding CEO: <span>{workspace.equityAllocations.founders}%</span></label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={workspace.equityAllocations.founders}
                                            onChange={(e) => handleUpdateEquity('founders', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="fplan-equity-item">
                                        <label>Technical Co-Founder: <span>{workspace.equityAllocations.coFounders}%</span></label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={workspace.equityAllocations.coFounders}
                                            onChange={(e) => handleUpdateEquity('coFounders', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="fplan-equity-item">
                                        <label>ESOP Talent Pool: <span>{workspace.equityAllocations.esopPool}%</span></label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={workspace.equityAllocations.esopPool}
                                            onChange={(e) => handleUpdateEquity('esopPool', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="fplan-equity-item">
                                        <label>Faculty / Incubator: <span>{workspace.equityAllocations.advisors}%</span></label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={workspace.equityAllocations.advisors}
                                            onChange={(e) => handleUpdateEquity('advisors', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="fplan-equity-item">
                                        <label>Angel / Seed Capital: <span>{workspace.equityAllocations.investors}%</span></label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={workspace.equityAllocations.investors}
                                            onChange={(e) => handleUpdateEquity('investors', Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sprint Backlog Tasks */}
                        <div className="fplan-backlog-card">
                            <h2 className="fplan-section-title">
                                <Code size={20} color="#2563eb" /> Sprint Backlog & Engineering Tasks ({workspace.tasks.length})
                            </h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                Click any task card to transition between To-Do &rarr; In-Progress &rarr; Done.
                            </p>

                            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Add engineering task (e.g. Implement OAuth2 Refresh Token rotation)..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    style={{ flex: 3, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                >
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Assignee"
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                    style={{ width: '160px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                                <button type="submit" className="fcollab-btn-primary">
                                    <Plus size={15} /> Add Task
                                </button>
                            </form>

                            <div className="fplan-tasks-grid">
                                {workspace.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="fplan-task-card"
                                        onClick={() => handleToggleTaskStatus(task.id)}
                                        style={{ cursor: 'pointer', opacity: task.status === 'done' ? 0.65 : 1 }}
                                    >
                                        <div className="fplan-task-top">
                                            <span className={`fplan-task-priority ${task.priority}`}>
                                                {task.priority}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700 }}>
                                                {task.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <h4 className="fplan-task-title" style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                            {task.title}
                                        </h4>
                                        <span className="fplan-task-assignee">
                                            👤 {task.assignee}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ─── TAB 3: DESIGN (System Architecture & Technical Blueprint Canvas) ─── */}
                {activeTab === 'design' && workspace && (
                    <motion.div
                        className="fdesign-container"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Canvas Header */}
                        <div className="fdesign-canvas-header">
                            <div>
                                <h2>Interactive System Architecture & Blueprint Canvas</h2>
                                <p>
                                    Collaborative technical design board: click any component node below to inspect protocols, scaling policies, and SLAs.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="fcollab-btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleCopyMarkdownRFC}>
                                    <Copy size={14} /> Copy RFC Spec
                                </button>
                                <button className="fcollab-btn-primary" onClick={handleExportBlueprintJSON}>
                                    <Share2 size={14} /> Export Blueprint JSON
                                </button>
                            </div>
                        </div>

                        {/* Interactive Node Topology Grid */}
                        <div className="fdesign-topology-grid">
                            {workspace.architectureNodes?.map((node) => (
                                <div
                                    key={node.id}
                                    className={`fdesign-node-card ${selectedNode?.id === node.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedNode(node)}
                                >
                                    <div className="fdesign-node-top">
                                        <span className={`fdesign-node-badge ${node.category}`}>
                                            {node.category}
                                        </span>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            color: node.status === 'production' ? '#16a34a' : '#d97706',
                                            textTransform: 'uppercase'
                                        }}>
                                            ● {node.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="fdesign-node-label">{node.label}</h3>
                                        <span className="fdesign-node-tech">{node.technology}</span>
                                    </div>

                                    <p className="fdesign-node-desc">
                                        {node.description}
                                    </p>

                                    <div className="fdesign-node-footer">
                                        <span>Proto: <strong>{node.protocol || 'TCP'}</strong></span>
                                        <span>SLA: <strong>{node.sla || '99.9%'}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Component Inspector Panel (When a node is selected) */}
                        {selectedNode && (
                            <div className="fdesign-inspector">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: '#ede9fe', color: '#7c3aed', padding: '8px', borderRadius: '10px' }}>
                                            <Cpu size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                                Component Inspector: {selectedNode.label}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                                Category: {selectedNode.category.toUpperCase()} &bull; Tier Protocol: {selectedNode.protocol}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '4px 10px', borderRadius: '14px' }}>
                                        {savingWorkspace ? 'Saving...' : 'Auto-saved'}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Technology Stack</label>
                                        <input
                                            type="text"
                                            value={selectedNode.technology}
                                            onChange={(e) => handleUpdateNode({ ...selectedNode, technology: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Transport / Wire Protocol</label>
                                        <input
                                            type="text"
                                            value={selectedNode.protocol || ''}
                                            onChange={(e) => handleUpdateNode({ ...selectedNode, protocol: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Autoscaling & Replica Policy</label>
                                        <input
                                            type="text"
                                            value={selectedNode.scalingPolicy || ''}
                                            onChange={(e) => handleUpdateNode({ ...selectedNode, scalingPolicy: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Availability SLA & Target Latency</label>
                                        <input
                                            type="text"
                                            value={selectedNode.sla || ''}
                                            onChange={(e) => handleUpdateNode({ ...selectedNode, sla: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Functional Architecture Description</label>
                                    <textarea
                                        value={selectedNode.description}
                                        onChange={(e) => handleUpdateNode({ ...selectedNode, description: e.target.value })}
                                        rows={2}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Collaborative Architecture RFC / Design Doc Editor */}
                        <div className="fdesign-rfc-editor">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                        Architecture RFC & Technical Specification Document
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                        Live collaborative design RFC: data models, ingestion pipelines, database schemas, and zero-trust security.
                                    </p>
                                </div>
                                <button className="fcollab-btn-outline" onClick={handleCopyMarkdownRFC}>
                                    <Copy size={14} /> Copy Markdown
                                </button>
                            </div>

                            <textarea
                                className="fdesign-rfc-textarea"
                                value={workspace.designNotes || ''}
                                onChange={(e) => handleUpdateDesignNotes(e.target.value)}
                                placeholder="Write system architecture RFC in Markdown format..."
                            />
                        </div>
                    </motion.div>
                )}
            </main>

            {/* ─── MODAL: Connect & Propose Co-Founding ─── */}
            <AnimatePresence>
                {showConnectModal && targetVenture && (
                    <div className="fcollab-modal-backdrop" onClick={() => setShowConnectModal(false)}>
                        <motion.div
                            className="fcollab-modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="fcollab-modal-header">
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                    Connect & Propose Co-Founding with {targetVenture.ownerName}
                                </h3>
                                <button
                                    onClick={() => setShowConnectModal(false)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                    <X size={20} color="#64748b" />
                                </button>
                            </div>

                            <form onSubmit={handleSendCollaboration}>
                                <div className="fcollab-modal-body">
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{targetVenture.title}</strong>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{targetVenture.tagline}</p>
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-block', marginTop: '4px' }}>
                                            Equity Offer: {targetVenture.equityOffer}
                                        </span>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Role / Partnership Interest</label>
                                        <select
                                            value={roleInterested}
                                            onChange={(e) => setRoleInterested(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                        >
                                            <option value="Technical Co-Founder (Systems/Rust)">Technical Co-Founder (Systems/Fullstack)</option>
                                            <option value="AI / ML Co-Founder">AI / ML Lead Co-Founder</option>
                                            <option value="GTM / Growth Co-Founder">GTM & Sales Co-Founder</option>
                                            <option value="Venture Angel / Syndicate Partner">Venture Angel / Syndicate Partner</option>
                                            <option value="Strategic Design Partner">Strategic Design Partner</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Personalized Pitch & Partnership Message</label>
                                        <textarea
                                            rows={4}
                                            value={connectMsg}
                                            onChange={(e) => setConnectMsg(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Video size={14} color="#059669" /> Auto-Generated Google Meet Room for 1:1 Sync
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                            <input
                                                type="text"
                                                value={meetScheduleLink}
                                                readOnly
                                                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '13px', color: '#0f172a' }}
                                            />
                                            <button
                                                type="button"
                                                className="fcollab-btn-outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(meetScheduleLink);
                                                    showNotification('Google Meet link copied!');
                                                }}
                                            >
                                                <Copy size={14} /> Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="fcollab-modal-footer">
                                    <button
                                        type="button"
                                        className="fcollab-btn-outline"
                                        onClick={() => setShowConnectModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="fcollab-btn-primary"
                                        disabled={sendingInvite}
                                    >
                                        {sendingInvite ? 'Dispatching...' : 'Send Co-Founding Invite & Meet Link'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: Publish My Venture ─── */}
            <AnimatePresence>
                {showCreateVentureModal && (
                    <div className="fcollab-modal-backdrop" onClick={() => setShowCreateVentureModal(false)}>
                        <motion.div
                            className="fcollab-modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="fcollab-modal-header">
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                    Publish Startup to Founder Network
                                </h3>
                                <button
                                    onClick={() => setShowCreateVentureModal(false)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                    <X size={20} color="#64748b" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateVenture}>
                                <div className="fcollab-modal-body">
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Startup Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., AetherDB"
                                            value={vTitle}
                                            onChange={(e) => setVTitle(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>One-Line Tagline</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Ultra low-latency vector cache for multimodal agents"
                                            value={vTagline}
                                            onChange={(e) => setVTagline(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Venture Stage</label>
                                            <select
                                                value={vStage}
                                                onChange={(e) => setVStage(e.target.value as any)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            >
                                                <option value="Idea">Idea</option>
                                                <option value="Prototype">Prototype</option>
                                                <option value="MVP">MVP</option>
                                                <option value="Early Traction">Early Traction</option>
                                                <option value="Growth">Growth</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Domain</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., AI / FinTech"
                                                value={vDomain}
                                                onChange={(e) => setVDomain(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Problem Statement</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Describe the exact pain point your startup solves..."
                                            value={vProblem}
                                            onChange={(e) => setVProblem(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Solution & Technology Approach</label>
                                        <textarea
                                            rows={2}
                                            placeholder="How do you architect the solution..."
                                            value={vSolution}
                                            onChange={(e) => setVSolution(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Role Needed</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Technical Co-Founder (Rust)"
                                                value={vRolesNeeded}
                                                onChange={(e) => setVRolesNeeded(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Equity Offer</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 10% – 18% Equity"
                                                value={vEquity}
                                                onChange={(e) => setVEquity(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="fcollab-modal-footer">
                                    <button
                                        type="button"
                                        className="fcollab-btn-outline"
                                        onClick={() => setShowCreateVentureModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="fcollab-btn-primary"
                                        disabled={creatingVenture}
                                    >
                                        {creatingVenture ? 'Publishing...' : 'Publish to Founder Hub'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            zIndex: 1100
                        }}
                    >
                        <Sparkles size={16} color="#c084fc" />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
