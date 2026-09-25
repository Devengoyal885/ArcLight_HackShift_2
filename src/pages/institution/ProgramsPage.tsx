import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getInstitutionEvents, postInstitutionEvent, deleteInstitutionEvent,
    type InstitutionEvent,
} from '../../services/institutionService';
import {
    CalendarDays, Plus, Trash2, Loader2, AlertCircle,
    Mic2, BookOpen, Rocket, Users2, MapPin, Link2, X,
} from 'lucide-react';
import './InstitutionSubPages.css';

const EVENT_TYPES: { value: InstitutionEvent['type']; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'workshop', label: 'Workshop', icon: <BookOpen size={14} />, color: '#d97706' },
    { value: 'guest_lecture', label: 'Guest Lecture', icon: <Mic2 size={14} />, color: '#0369a1' },
    { value: 'live_project', label: 'Live Industry Project', icon: <Rocket size={14} />, color: '#059669' },
    { value: 'placement_drive', label: 'Placement Drive', icon: <Users2 size={14} />, color: '#7c3aed' },
];

function getTypeInfo(type: InstitutionEvent['type']) {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

const EMPTY_FORM: Omit<InstitutionEvent, 'id' | 'createdAt' | 'institutionCode'> = {
    type: 'workshop',
    title: '',
    description: '',
    speaker: '',
    company: '',
    date: '',
    mode: 'offline',
    venue: '',
    link: '',
};

export default function ProgramsPage() {
    const { profile: adminProfile } = useAuth();
    const institutionCode = adminProfile?.institutionCode || 'DEFAULT';

    const [events, setEvents] = useState<InstitutionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

    const reload = () =>
        getInstitutionEvents(institutionCode)
            .then(setEvents)
            .catch(console.error)
            .finally(() => setLoading(false));

    useEffect(() => { reload(); }, [institutionCode]);

    const now = new Date().toISOString();
    const displayEvents = events.filter(e => {
        if (filter === 'upcoming') return e.date >= now;
        if (filter === 'past') return e.date < now;
        return true;
    });

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.date) return;
        setSaving(true);
        try {
            await postInstitutionEvent(institutionCode, form);
            setSaved(true);
            setForm({ ...EMPTY_FORM });
            setShowForm(false);
            await reload();
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteInstitutionEvent(institutionCode, id);
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (e) { console.error(e); }
    };

    const set = (key: keyof typeof form, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <CalendarDays size={28} className="inst-header-icon" />
                    <div>
                        <h1>Event Manager</h1>
                        <p>Create and manage workshops, guest lectures, live projects, and placement drives</p>
                    </div>
                </motion.header>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div className="inst-subtabs">
                        {(['all', 'upcoming', 'past'] as const).map(f => (
                            <button
                                key={f}
                                className={`inst-subtab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="inst-btn-primary" onClick={() => setShowForm(v => !v)}>
                        {showForm ? <X size={15} /> : <Plus size={15} />}
                        {showForm ? 'Cancel' : 'New Event'}
                    </button>
                </div>

                {/* Success banner */}
                <AnimatePresence>
                    {saved && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}
                        >
                            ✓ Event published — it's now visible to all students and faculty in your institution.
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Event Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            className="inst-create-form"
                            initial={{ opacity: 0, y: -12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            style={{ marginBottom: '2rem' }}
                        >
                            <h3><CalendarDays size={16} /> Create New Event</h3>

                            {/* Type selector */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                {EVENT_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => set('type', t.value)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '0.45rem 0.9rem', borderRadius: 8, border: '1.5px solid',
                                            borderColor: form.type === t.value ? t.color : '#e2e8f0',
                                            background: form.type === t.value ? t.color + '15' : 'white',
                                            color: form.type === t.value ? t.color : '#64748b',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="inst-form-grid">
                                <div className="inst-form-group full">
                                    <label className="inst-form-label">Event Title *</label>
                                    <input className="inst-form-input" placeholder="e.g. Machine Learning Workshop by Google" value={form.title} onChange={e => set('title', e.target.value)} />
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Speaker / Host</label>
                                    <input className="inst-form-input" placeholder="Dr. Sharma / John Doe" value={form.speaker} onChange={e => set('speaker', e.target.value)} />
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Company / Organization</label>
                                    <input className="inst-form-input" placeholder="Google, Infosys, etc." value={form.company} onChange={e => set('company', e.target.value)} />
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Date & Time *</label>
                                    <input className="inst-form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Mode</label>
                                    <select className="inst-form-input" value={form.mode} onChange={e => set('mode', e.target.value as any)}>
                                        <option value="offline">Offline</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Venue (if offline)</label>
                                    <input className="inst-form-input" placeholder="Seminar Hall A, Block 3" value={form.venue} onChange={e => set('venue', e.target.value)} />
                                </div>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Meeting Link (if online)</label>
                                    <input className="inst-form-input" type="url" placeholder="https://meet.google.com/..." value={form.link} onChange={e => set('link', e.target.value)} />
                                </div>
                                <div className="inst-form-group full">
                                    <label className="inst-form-label">Description</label>
                                    <textarea
                                        className="inst-form-input"
                                        rows={3}
                                        placeholder="What will students learn? What should they bring? Any prerequisites?"
                                        value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div className="inst-form-actions">
                                    <button className="inst-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button
                                        className="inst-btn-primary"
                                        onClick={handleSubmit}
                                        disabled={saving || !form.title.trim() || !form.date}
                                    >
                                        {saving ? <Loader2 size={14} className="spin" /> : <CalendarDays size={14} />}
                                        Publish Event
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Events list */}
                {loading ? (
                    <div className="inst-loading"><Loader2 size={32} className="spin" /><p>Loading events...</p></div>
                ) : displayEvents.length === 0 ? (
                    <div className="inst-empty">
                        <AlertCircle size={32} />
                        <h3>{filter === 'past' ? 'No Past Events' : filter === 'upcoming' ? 'No Upcoming Events' : 'No Events Yet'}</h3>
                        <p>
                            {filter === 'all'
                                ? 'Create your first workshop, guest lecture, or placement drive. It will be visible to all students and faculty in your institution.'
                                : `No ${filter} events found.`}
                        </p>
                    </div>
                ) : (
                    <div className="inst-event-grid">
                        {displayEvents.map((event, i) => {
                            const typeInfo = getTypeInfo(event.type);
                            const isPast = event.date < now;
                            return (
                                <motion.div
                                    key={event.id || i}
                                    className="inst-event-card"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ opacity: isPast ? 0.75 : 1 }}
                                >
                                    <div className="inst-event-card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span className={`inst-badge inst-badge--${event.type}`} style={{ background: typeInfo.color + '15', color: typeInfo.color }}>
                                                {typeInfo.icon} {typeInfo.label}
                                            </span>
                                            <span className={`inst-badge inst-badge--${event.mode}`}>
                                                {event.mode}
                                            </span>
                                            {isPast && (
                                                <span className="inst-badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Past</span>
                                            )}
                                        </div>
                                        <button
                                            className="inst-event-delete"
                                            onClick={() => event.id && handleDelete(event.id)}
                                            title="Delete event"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <p className="inst-event-title">{event.title}</p>

                                    <div className="inst-event-meta">
                                        {event.speaker && (
                                            <span><Mic2 size={12} /> {event.speaker}</span>
                                        )}
                                        {event.company && (
                                            <span>@ {event.company}</span>
                                        )}
                                        <span>
                                            <CalendarDays size={12} />
                                            {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {event.venue && (
                                            <span><MapPin size={12} /> {event.venue}</span>
                                        )}
                                        {event.link && (
                                            <a href={event.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Link2 size={12} /> Join Link
                                            </a>
                                        )}
                                    </div>

                                    {event.description && (
                                        <p className="inst-event-desc">{event.description}</p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
