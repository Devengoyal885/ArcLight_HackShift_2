import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getOffCampusTracker, addOffCampusEntry, updateOffCampusEntry, deleteOffCampusEntry,
    computeTrackerStats, type OffCampusTracker, type TrackStatus,
} from '../../services/offCampusService';
import {
    Globe, Plus, Trash2, Edit3, X, ExternalLink, MapPin, Building2,
    DollarSign, Clock, Calendar, Loader2, TrendingUp, AlertCircle, Link2, Star,
} from 'lucide-react';
import './OffCampusPage.css';

const STATUS_PIPELINE: { key: TrackStatus; label: string; color: string }[] = [
    { key: 'saved',      label: '📌 Saved',      color: '#64748b' },
    { key: 'applied',    label: '📤 Applied',     color: '#3b82f6' },
    { key: 'screening',  label: '🔍 Screening',   color: '#8b5cf6' },
    { key: 'assessment', label: '📝 Assessment',  color: '#f59e0b' },
    { key: 'interview',  label: '💬 Interview',   color: '#10b981' },
    { key: 'offer',      label: '🎉 Offer!',      color: '#7c3aed' },
    { key: 'rejected',   label: '❌ Rejected',    color: '#ef4444' },
    { key: 'withdrawn',  label: '🚫 Withdrawn',   color: '#94a3b8' },
];

const SOURCE_OPTIONS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'Naukri', 'AngelList', 'Internshala', 'Other'];

const EMPTY_FORM: Omit<OffCampusTracker, 'id' | 'createdAt' | 'updatedAt'> = {
    company: '', role: '', location: '', workType: 'hybrid',
    source: 'LinkedIn', sourceUrl: '', status: 'saved',
    salaryMin: undefined, salaryMax: undefined, currency: 'INR',
    notes: '', contactName: '', contactEmail: '',
    appliedDate: '', deadline: '', nextActionDate: '', nextActionNote: '',
    tags: [], isFavorite: false,
};

export default function OffCampusPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { dbUid } = useAuth();
    const [entries, setEntries] = useState<OffCampusTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<TrackStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<OffCampusTracker | null>(null);
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!dbUid) return;
        getOffCampusTracker(dbUid).then(data => { setEntries(data); setLoading(false); });
    }, [dbUid]);

    const stats = computeTrackerStats(entries);

    const filtered = entries.filter(e => {
        if (filterStatus !== 'all' && e.status !== filterStatus) return false;
        if (search && !e.company.toLowerCase().includes(search.toLowerCase()) &&
            !e.role.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const openCreate = () => {
        setEditingEntry(null);
        setForm({ ...EMPTY_FORM });
        setShowModal(true);
    };

    const openEdit = (entry: OffCampusTracker) => {
        setEditingEntry(entry);
        setForm({ ...EMPTY_FORM, ...entry });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!dbUid || !form.company || !form.role) return;
        setSaving(true);
        try {
            if (editingEntry?.id) {
                await updateOffCampusEntry(dbUid, editingEntry.id, form);
                setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...form } : e));
            } else {
                const id = await addOffCampusEntry(dbUid, form);
                setEntries(prev => [{ ...form, id }, ...prev]);
            }
            setShowModal(false);
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!dbUid) return;
        setDeletingId(id);
        await deleteOffCampusEntry(dbUid, id);
        setEntries(prev => prev.filter(e => e.id !== id));
        setDeletingId(null);
    };

    const handleStatusChange = async (entry: OffCampusTracker, newStatus: TrackStatus) => {
        if (!dbUid || !entry.id) return;
        await updateOffCampusEntry(dbUid, entry.id, { status: newStatus });
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
    };

    const getStatusConf = (s: TrackStatus) => STATUS_PIPELINE.find(p => p.key === s) || STATUS_PIPELINE[0];

    return (
        <div className="offcampus-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            <div className="offcampus-container">
                {/* Header */}
                <motion.div className="offcampus-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="offcampus-title"><Globe size={26} /> Off-Campus Tracker</h1>
                        <p className="offcampus-subtitle">Track jobs you find on LinkedIn, Indeed, company websites & more</p>
                    </div>
                    <button className="offcampus-add-btn" onClick={openCreate}><Plus size={18} /> Add Opportunity</button>
                </motion.div>

                {/* Stats */}
                <motion.div className="offcampus-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {[
                        { label: 'Total', value: stats.total, color: '#6366f1' },
                        { label: 'Applied', value: stats.applied, color: '#3b82f6' },
                        { label: 'In Progress', value: stats.inProgress, color: '#10b981' },
                        { label: 'Offers', value: stats.offers, color: '#7c3aed' },
                        { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
                    ].map(s => (
                        <div key={s.label} className="offcampus-stat-card" style={{ borderColor: s.color + '30' }}>
                            <span className="offcampus-stat-num" style={{ color: s.color }}>{s.value}</span>
                            <span className="offcampus-stat-lbl">{s.label}</span>
                        </div>
                    ))}
                    <div className="offcampus-stat-card offcampus-stat-conversion">
                        <span className="offcampus-stat-num" style={{ color: '#f59e0b' }}>{stats.conversionRate}%</span>
                        <span className="offcampus-stat-lbl">Conversion</span>
                    </div>
                </motion.div>

                {/* Upcoming Actions Alert */}
                {stats.upcomingActions.length > 0 && (
                    <div className="offcampus-actions-alert">
                        <AlertCircle size={15} color="#f59e0b" />
                        <span>You have <strong>{stats.upcomingActions.length} follow-up{stats.upcomingActions.length > 1 ? 's' : ''}</strong> due soon:&nbsp;
                            {stats.upcomingActions.slice(0, 2).map(e => e.company).join(', ')}
                        </span>
                    </div>
                )}

                {/* Filters */}
                <div className="offcampus-filters">
                    <input className="offcampus-search" placeholder="🔍  Search company or role..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="offcampus-status-filters">
                        <button className={`offcampus-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}>All</button>
                        {STATUS_PIPELINE.map(s => (
                            <button key={s.key}
                                className={`offcampus-filter-btn ${filterStatus === s.key ? 'active' : ''}`}
                                style={filterStatus === s.key ? { background: s.color + '20', borderColor: s.color + '50', color: s.color } : {}}
                                onClick={() => setFilterStatus(s.key)}>{s.label}</button>
                        ))}
                    </div>
                </div>

                {/* Entries */}
                {loading ? (
                    <div className="offcampus-loading"><Loader2 size={28} className="offcampus-spinner" /><p>Loading tracker...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="offcampus-empty">
                        <div style={{ fontSize: '2.5rem' }}>🌍</div>
                        <h3>{search || filterStatus !== 'all' ? 'No matching entries' : 'Start Tracking'}</h3>
                        <p>{search || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first off-campus opportunity to start tracking'}</p>
                        {!search && filterStatus === 'all' && (
                            <button className="offcampus-add-btn" onClick={openCreate}><Plus size={16} /> Add First Job</button>
                        )}
                    </div>
                ) : (
                    <div className="offcampus-list">
                        <AnimatePresence>
                            {filtered.map((entry, i) => {
                                const statusConf = getStatusConf(entry.status);
                                const isExpanded = expandedId === entry.id;
                                return (
                                    <motion.div key={entry.id} className={`offcampus-card ${entry.isFavorite ? 'favorite' : ''}`}
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.04 }} layout>
                                        <div className="offcampus-card-main" onClick={() => setExpandedId(isExpanded ? null : entry.id!)}>
                                            <div className="offcampus-card-left">
                                                <div className="offcampus-company-icon">{entry.company[0]?.toUpperCase()}</div>
                                                <div>
                                                    <div className="offcampus-card-role">{entry.role}</div>
                                                    <div className="offcampus-card-meta">
                                                        <span><Building2 size={12} /> {entry.company}</span>
                                                        {entry.location && <span><MapPin size={12} /> {entry.location}</span>}
                                                        <span className="offcampus-source-badge">{entry.source}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="offcampus-card-right">
                                                {entry.salaryMin && (
                                                    <span className="offcampus-salary">
                                                        <DollarSign size={12} />
                                                        {entry.currency} {(entry.salaryMin / 100000).toFixed(1)}
                                                        {entry.salaryMax ? `–${(entry.salaryMax / 100000).toFixed(1)}` : ''}L
                                                    </span>
                                                )}
                                                <span className="offcampus-status-pill"
                                                    style={{ background: statusConf.color + '18', color: statusConf.color, border: `1px solid ${statusConf.color}30` }}>
                                                    {statusConf.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Status Change */}
                                        <div className="offcampus-status-track">
                                            {STATUS_PIPELINE.slice(0, 6).map(s => (
                                                <button key={s.key}
                                                    className={`offcampus-track-step ${entry.status === s.key ? 'active' : ''}`}
                                                    style={entry.status === s.key ? { borderColor: s.color, background: s.color + '18', color: s.color } : {}}
                                                    onClick={() => handleStatusChange(entry, s.key)}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Expanded */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div className="offcampus-expanded"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}>
                                                    <div className="offcampus-expanded-grid">
                                                        {entry.deadline && <div className="offcampus-detail"><Calendar size={13} /> <span>Deadline: {entry.deadline}</span></div>}
                                                        {entry.appliedDate && <div className="offcampus-detail"><Clock size={13} /> <span>Applied: {entry.appliedDate}</span></div>}
                                                        {entry.contactName && <div className="offcampus-detail"><span>Contact: {entry.contactName} {entry.contactEmail ? `(${entry.contactEmail})` : ''}</span></div>}
                                                        {entry.nextActionNote && <div className="offcampus-detail offcampus-detail--action"><AlertCircle size={13} /> <span>{entry.nextActionNote}</span></div>}
                                                    </div>
                                                    {entry.notes && <p className="offcampus-notes">{entry.notes}</p>}
                                                    <div className="offcampus-expanded-actions">
                                                        {entry.sourceUrl && (
                                                            <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="offcampus-link-btn">
                                                                <ExternalLink size={13} /> View Job
                                                            </a>
                                                        )}
                                                        <button className="offcampus-edit-btn" onClick={() => openEdit(entry)}><Edit3 size={13} /> Edit</button>
                                                        <button className="offcampus-del-btn" disabled={deletingId === entry.id}
                                                            onClick={() => handleDelete(entry.id!)}>
                                                            {deletingId === entry.id ? <Loader2 size={13} className="offcampus-spinner" /> : <Trash2 size={13} />}
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

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="offcampus-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div className="offcampus-modal" initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}>
                            <div className="offcampus-modal-header">
                                <h2>{editingEntry ? 'Edit Entry' : 'Track New Opportunity'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>
                            <div className="offcampus-modal-body">
                                <div className="offcampus-form-row">
                                    <div className="offcampus-form-group">
                                        <label>Company *</label>
                                        <input className="offcampus-input" placeholder="Google, Amazon, Startupname..."
                                            value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                                    </div>
                                    <div className="offcampus-form-group">
                                        <label>Role *</label>
                                        <input className="offcampus-input" placeholder="SDE Intern, Data Analyst..."
                                            value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="offcampus-form-row">
                                    <div className="offcampus-form-group">
                                        <label>Source</label>
                                        <select className="offcampus-select" value={form.source}
                                            onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                                            {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="offcampus-form-group">
                                        <label>Work Type</label>
                                        <select className="offcampus-select" value={form.workType}
                                            onChange={e => setForm(p => ({ ...p, workType: e.target.value as any }))}>
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="onsite">On-site</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="offcampus-form-row">
                                    <div className="offcampus-form-group">
                                        <label>Location</label>
                                        <input className="offcampus-input" placeholder="Bangalore, Mumbai, Remote..."
                                            value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                                    </div>
                                    <div className="offcampus-form-group">
                                        <label>Status</label>
                                        <select className="offcampus-select" value={form.status}
                                            onChange={e => setForm(p => ({ ...p, status: e.target.value as TrackStatus }))}>
                                            {STATUS_PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="offcampus-form-row">
                                    <div className="offcampus-form-group">
                                        <label>Salary Min (₹)</label>
                                        <input type="number" className="offcampus-input" placeholder="500000"
                                            value={form.salaryMin || ''} onChange={e => setForm(p => ({ ...p, salaryMin: Number(e.target.value) }))} />
                                    </div>
                                    <div className="offcampus-form-group">
                                        <label>Salary Max (₹)</label>
                                        <input type="number" className="offcampus-input" placeholder="800000"
                                            value={form.salaryMax || ''} onChange={e => setForm(p => ({ ...p, salaryMax: Number(e.target.value) }))} />
                                    </div>
                                </div>
                                <div className="offcampus-form-group">
                                    <label>Job URL</label>
                                    <input className="offcampus-input" placeholder="https://linkedin.com/jobs/..."
                                        value={form.sourceUrl || ''} onChange={e => setForm(p => ({ ...p, sourceUrl: e.target.value }))} />
                                </div>
                                <div className="offcampus-form-row">
                                    <div className="offcampus-form-group">
                                        <label>Applied Date</label>
                                        <input type="date" className="offcampus-input" value={form.appliedDate || ''}
                                            onChange={e => setForm(p => ({ ...p, appliedDate: e.target.value }))} />
                                    </div>
                                    <div className="offcampus-form-group">
                                        <label>Deadline</label>
                                        <input type="date" className="offcampus-input" value={form.deadline || ''}
                                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="offcampus-form-group">
                                    <label>Next Follow-up Action</label>
                                    <input className="offcampus-input" placeholder="Send follow-up email, prepare for interview..."
                                        value={form.nextActionNote || ''} onChange={e => setForm(p => ({ ...p, nextActionNote: e.target.value }))} />
                                </div>
                                <div className="offcampus-form-group">
                                    <label>Notes</label>
                                    <textarea className="offcampus-textarea" rows={3}
                                        placeholder="Any notes about this opportunity..."
                                        value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                                </div>
                            </div>
                            <div className="offcampus-modal-footer">
                                <button className="offcampus-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="offcampus-btn-save" onClick={handleSave}
                                    disabled={saving || !form.company || !form.role}>
                                    {saving ? <Loader2 size={16} className="offcampus-spinner" /> : <Plus size={16} />}
                                    {editingEntry ? 'Update' : 'Add Opportunity'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
