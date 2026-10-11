import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getGoals, addGoal, updateGoal, deleteGoal, toggleMilestone, computeGoalStats,
    type Goal, type GoalCategory, type GoalMilestone,
} from '../../services/goalsService';
import {
    Target, Plus, Trash2, CheckCircle2, Circle, Calendar, Edit3, X,
    Sparkles, TrendingUp, Flag, BookOpen, Briefcase, Award, Users,
    AlertTriangle, ChevronRight, BarChart3, Loader2, Clock
} from 'lucide-react';
import './GoalsPage.css';

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: ReactNode; color: string }> = {
    skill: { label: 'Skill Development', icon: <TrendingUp size={14} />, color: '#6366f1' },
    job_application: { label: 'Job Applications', icon: <Briefcase size={14} />, color: '#2563eb' },
    preparation: { label: 'Interview Prep', icon: <Target size={14} />, color: '#f59e0b' },
    learning: { label: 'Learning', icon: <BookOpen size={14} />, color: '#10b981' },
    networking: { label: 'Networking', icon: <Users size={14} />, color: '#8b5cf6' },
    certification: { label: 'Certification', icon: <Award size={14} />, color: '#ec4899' },
    other: { label: 'Other', icon: <Flag size={14} />, color: '#64748b' },
};

const STATUS_COLORS = {
    active: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    completed: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    overdue: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    paused: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

function daysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDeadline(dateStr: string): string {
    const days = daysUntil(dateStr);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
}

export default function GoalsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | Goal['status']>('all');
    const [filterCat, setFilterCat] = useState<'all' | GoalCategory>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState<Partial<Goal>>({
        title: '', category: 'skill', status: 'active',
        progress: 0, reminderEnabled: true,
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    const [milestoneInput, setMilestoneInput] = useState('');
    const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
    const [saving, setSaving] = useState(false);

    const fetchGoals = useCallback(async () => {
        if (!dbUid) return;
        setLoading(true);
        const g = await getGoals(dbUid);
        setGoals(g);
        setLoading(false);
    }, [dbUid]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const stats = computeGoalStats(goals);

    const filteredGoals = goals.filter(g => {
        if (filterStatus !== 'all' && g.status !== filterStatus) return false;
        if (filterCat !== 'all' && g.category !== filterCat) return false;
        return true;
    });

    const openCreate = () => {
        setEditingGoal(null);
        setForm({
            title: '', description: '', category: 'skill', status: 'active',
            progress: 0, reminderEnabled: true,
            deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        });
        setMilestones([]);
        setShowModal(true);
    };

    const openEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setForm({ ...goal });
        setMilestones(goal.milestones || []);
        setShowModal(true);
    };

    const addMilestone = () => {
        if (!milestoneInput.trim()) return;
        setMilestones(prev => [...prev, {
            id: Date.now().toString(),
            title: milestoneInput.trim(),
            completed: false,
        }]);
        setMilestoneInput('');
    };

    const handleSave = async () => {
        if (!dbUid || !form.title?.trim()) return;
        setSaving(true);
        try {
            const payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
                title: form.title!.trim(),
                description: form.description || '',
                category: form.category as GoalCategory,
                deadline: form.deadline!,
                status: form.status as Goal['status'],
                progress: milestones.length > 0
                    ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
                    : form.progress || 0,
                milestones,
                linkedSkill: form.linkedSkill,
                reminderEnabled: form.reminderEnabled ?? true,
            };

            if (editingGoal?.id) {
                await updateGoal(dbUid, editingGoal.id, payload);
            } else {
                await addGoal(dbUid, payload);
            }
            await fetchGoals();
            setShowModal(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!dbUid) return;
        setDeletingId(id);
        await deleteGoal(dbUid, id);
        setGoals(prev => prev.filter(g => g.id !== id));
        setDeletingId(null);
    };

    const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
        if (!dbUid || !goal.id) return;
        const updated = await toggleMilestone(dbUid, goal.id, milestoneId, goal.milestones || []);
        setGoals(prev => prev.map(g => g.id === goal.id
            ? { ...g, milestones: updated, progress: Math.round((updated.filter(m => m.completed).length / updated.length) * 100) }
            : g
        ));
    };

    return (
        <div className="goals-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}

            <div className="goals-container">
                {/* Header */}
                <motion.div className="goals-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    <div>
                        <h1 className="goals-title">
                            <Target size={28} className="goals-title-icon" />
                            Career Goals
                        </h1>
                        <p className="goals-subtitle">Set goals, track milestones, stay on target</p>
                    </div>
                    <button className="goals-add-btn" onClick={openCreate}>
                        <Plus size={18} />
                        New Goal
                    </button>
                </motion.div>

                {/* Stats Cards */}
                <motion.div className="goals-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}>
                    {[
                        { label: 'Total', value: stats.total, color: '#6366f1' },
                        { label: 'Active', value: stats.active, color: '#2563eb' },
                        { label: 'Completed', value: stats.completed, color: '#10b981' },
                        { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
                    ].map(s => (
                        <div key={s.label} className="goals-stat-card" style={{ borderColor: s.color + '30' }}>
                            <span className="goals-stat-value" style={{ color: s.color }}>{s.value}</span>
                            <span className="goals-stat-label">{s.label}</span>
                        </div>
                    ))}
                    <div className="goals-stat-card goals-stat-card--progress">
                        <div className="goals-stat-progress-ring">
                            <svg viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#7c3aed" strokeWidth="4"
                                    strokeDasharray={`${(stats.completionRate / 100) * 100.5} 100.5`}
                                    strokeLinecap="round" transform="rotate(-90 20 20)" />
                            </svg>
                            <span>{stats.completionRate}%</span>
                        </div>
                        <span className="goals-stat-label">Completion</span>
                    </div>
                </motion.div>

                {/* Upcoming Deadlines Alert */}
                {stats.upcomingDeadlines.length > 0 && (
                    <motion.div className="goals-deadline-alert"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}>
                        <AlertTriangle size={16} color="#d97706" />
                        <span>
                            <strong>{stats.upcomingDeadlines.length} goal{stats.upcomingDeadlines.length > 1 ? 's' : ''}</strong> due within 7 days:&nbsp;
                            {stats.upcomingDeadlines.slice(0, 2).map(g => g.title).join(', ')}
                            {stats.upcomingDeadlines.length > 2 && ` +${stats.upcomingDeadlines.length - 2} more`}
                        </span>
                    </motion.div>
                )}

                {/* Filters */}
                <div className="goals-filters">
                    <div className="goals-filter-group">
                        {(['all', 'active', 'completed', 'overdue', 'paused'] as const).map(s => (
                            <button key={s}
                                className={`goals-filter-btn ${filterStatus === s ? 'active' : ''}`}
                                onClick={() => setFilterStatus(s)}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <select className="goals-cat-select"
                        value={filterCat}
                        onChange={e => setFilterCat(e.target.value as any)}>
                        <option value="all">All Categories</option>
                        {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>

                {/* Goals List */}
                {loading ? (
                    <div className="goals-loading">
                        <Loader2 size={32} className="goals-spinner" />
                        <p>Loading your goals...</p>
                    </div>
                ) : filteredGoals.length === 0 ? (
                    <motion.div className="goals-empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="goals-empty-icon">🎯</div>
                        <h3>No goals yet</h3>
                        <p>Set your first career goal to stay focused and motivated</p>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>Use the <strong>+ New Goal</strong> button above to get started.</p>
                    </motion.div>
                ) : (
                    <div className="goals-list">
                        <AnimatePresence>
                            {filteredGoals.map((goal, i) => {
                                const catConf = CATEGORY_CONFIG[goal.category];
                                const statusConf = STATUS_COLORS[goal.status];
                                const daysLeft = daysUntil(goal.deadline);
                                const isExpanded = expandedId === goal.id;
                                return (
                                    <motion.div key={goal.id}
                                        className="goal-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        layout>
                                        {/* Card Header */}
                                        <div className="goal-card-header"
                                            onClick={() => setExpandedId(isExpanded ? null : goal.id!)}>
                                            <div className="goal-card-left">
                                                <div className="goal-cat-dot"
                                                    style={{ background: catConf.color }}>
                                                    {catConf.icon}
                                                </div>
                                                <div>
                                                    <h3 className="goal-card-title">{goal.title}</h3>
                                                    <div className="goal-card-meta">
                                                        <span className="goal-cat-badge"
                                                            style={{ background: catConf.color + '18', color: catConf.color }}>
                                                            {catConf.label}
                                                        </span>
                                                        <span className="goal-deadline-badge"
                                                            style={{
                                                                color: daysLeft < 0 ? '#dc2626' : daysLeft <= 3 ? '#d97706' : '#64748b'
                                                            }}>
                                                            <Clock size={12} />
                                                            {formatDeadline(goal.deadline)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="goal-card-right">
                                                <span className="goal-status-badge"
                                                    style={{
                                                        background: statusConf.bg,
                                                        color: statusConf.text,
                                                        border: `1px solid ${statusConf.border}`,
                                                    }}>
                                                    {goal.status}
                                                </span>
                                                <ChevronRight size={16} className={`goal-expand-icon ${isExpanded ? 'rotated' : ''}`} />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="goal-progress-section">
                                            <div className="goal-progress-bar">
                                                <motion.div className="goal-progress-fill"
                                                    style={{ background: catConf.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${goal.progress}%` }}
                                                    transition={{ duration: 0.6, ease: 'easeOut' }} />
                                            </div>
                                            <span className="goal-progress-pct">{goal.progress}%</span>
                                        </div>

                                        {/* Expanded Content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div className="goal-expanded"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}>
                                                    {goal.description && (
                                                        <p className="goal-description">{goal.description}</p>
                                                    )}

                                                    {/* Milestones */}
                                                    {(goal.milestones?.length ?? 0) > 0 && (
                                                        <div className="goal-milestones">
                                                            <h4>Milestones</h4>
                                                            {goal.milestones!.map(m => (
                                                                <button key={m.id}
                                                                    className={`goal-milestone ${m.completed ? 'completed' : ''}`}
                                                                    onClick={() => handleToggleMilestone(goal, m.id)}>
                                                                    {m.completed
                                                                        ? <CheckCircle2 size={16} color="#10b981" />
                                                                        : <Circle size={16} color="#94a3b8" />}
                                                                    <span>{m.title}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="goal-actions">
                                                        {goal.status !== 'completed' && (
                                                            <button className="goal-action-btn goal-action-complete"
                                                                onClick={() => {
                                                                    if (dbUid && goal.id) {
                                                                        updateGoal(dbUid, goal.id, { status: 'completed', progress: 100 });
                                                                        setGoals(prev => prev.map(g => g.id === goal.id
                                                                            ? { ...g, status: 'completed', progress: 100 } : g));
                                                                    }
                                                                }}>
                                                                <CheckCircle2 size={14} /> Mark Complete
                                                            </button>
                                                        )}
                                                        <button className="goal-action-btn goal-action-edit"
                                                            onClick={() => openEdit(goal)}>
                                                            <Edit3 size={14} /> Edit
                                                        </button>
                                                        <button className="goal-action-btn goal-action-delete"
                                                            disabled={deletingId === goal.id}
                                                            onClick={() => handleDelete(goal.id!)}>
                                                            {deletingId === goal.id
                                                                ? <Loader2 size={14} className="goals-spinner" />
                                                                : <Trash2 size={14} />}
                                                            Delete
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="goals-modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div className="goals-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}>
                            <div className="goals-modal-header">
                                <h2>{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>

                            <div className="goals-modal-body">
                                <div className="goals-form-group">
                                    <label>Goal Title *</label>
                                    <input
                                        placeholder="e.g. Get an internship at a product company"
                                        value={form.title || ''}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        className="goals-input" />
                                </div>

                                <div className="goals-form-group">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="What does success look like for this goal?"
                                        value={form.description || ''}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        className="goals-textarea" rows={3} />
                                </div>

                                <div className="goals-form-row">
                                    <div className="goals-form-group">
                                        <label>Category</label>
                                        <select className="goals-select"
                                            value={form.category}
                                            onChange={e => setForm(p => ({ ...p, category: e.target.value as GoalCategory }))}>
                                            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="goals-form-group">
                                        <label>Deadline</label>
                                        <input type="date" className="goals-input"
                                            value={form.deadline || ''}
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div className="goals-form-group">
                                    <label>Milestones (optional)</label>
                                    <div className="goals-milestone-input">
                                        <input
                                            placeholder="Add a milestone step..."
                                            value={milestoneInput}
                                            onChange={e => setMilestoneInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addMilestone()}
                                            className="goals-input" />
                                        <button className="goals-milestone-add-btn" onClick={addMilestone}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {milestones.length > 0 && (
                                        <div className="goals-milestone-list">
                                            {milestones.map((m, idx) => (
                                                <div key={m.id} className="goals-milestone-item">
                                                    <span className="goals-milestone-num">{idx + 1}</span>
                                                    <span>{m.title}</span>
                                                    <button onClick={() => setMilestones(p => p.filter(x => x.id !== m.id))}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="goals-form-group">
                                    <label>Linked Skill (optional)</label>
                                    <input placeholder="e.g. React, Data Structures, Python"
                                        value={form.linkedSkill || ''}
                                        onChange={e => setForm(p => ({ ...p, linkedSkill: e.target.value }))}
                                        className="goals-input" />
                                </div>
                            </div>

                            <div className="goals-modal-footer">
                                <button className="goals-btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className="goals-btn-save" onClick={handleSave} disabled={saving || !form.title?.trim()}>
                                    {saving ? <Loader2 size={16} className="goals-spinner" /> : <Sparkles size={16} />}
                                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
