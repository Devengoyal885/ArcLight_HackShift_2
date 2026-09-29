import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getPostedRoles, getApplicationsForRole, type PostedRole, type RoleApplication } from '../../services/employerService';
import {
    createInterviewSlot, getInterviewSlots, bookInterviewSlot, deleteInterviewSlot,
    cancelInterviewSlot, type InterviewSlot,
} from '../../services/interviewSchedulerService';
import { notifyInterviewWhatsApp } from '../../services/twilioService';
import {
    CalendarDays, Plus, Trash2, Video, Building2, Phone,
    Loader2, Users, CheckCircle2, X, Briefcase, Clock, Link,
} from 'lucide-react';
import './InterviewSchedulerPage.css';

const MODE_ICON = { video: <Video size={14} />, in_person: <Building2 size={14} />, phone: <Phone size={14} /> };
const MODE_LABEL = { video: 'Video Call', in_person: 'In Person', phone: 'Phone' };
const STATUS_COLOR = { available: '#10b981', booked: '#2563eb', cancelled: '#ef4444' };

function timeAgo(ts: any) {
    if (!ts) return '';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InterviewSchedulerPage() {
    const { dbUid, profile } = useAuth();

    const [roles, setRoles] = useState<PostedRole[]>([]);
    const [selectedRole, setSelectedRole] = useState<PostedRole | null>(null);
    const [slots, setSlots] = useState<InterviewSlot[]>([]);
    const [applications, setApplications] = useState<RoleApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Create slot form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        date: '', time: '', duration: 30,
        mode: 'video' as InterviewSlot['mode'],
        meetLink: '', venue: '',
    });

    // Book modal
    const [bookSlot, setBookSlot] = useState<InterviewSlot | null>(null);
    const [bookingAppId, setBookingAppId] = useState('');
    const [bookingCandidateUid, setBookingCandidateUid] = useState('');

    useEffect(() => {
        if (!dbUid) return;
        getPostedRoles(dbUid).then(r => {
            setRoles(r);
            if (r.length > 0) setSelectedRole(r[0]);
        }).finally(() => setLoading(false));
    }, [dbUid]);

    useEffect(() => {
        if (!dbUid || !selectedRole) return;
        Promise.all([
            getInterviewSlots(dbUid, selectedRole.id),
            getApplicationsForRole(selectedRole.id!),
        ]).then(([s, a]) => { setSlots(s); setApplications(a); });
    }, [dbUid, selectedRole]);

    const handleCreateSlot = async () => {
        if (!dbUid || !selectedRole || !form.date || !form.time) return;
        setSaving(true);
        try {
            await createInterviewSlot(dbUid, {
                roleId: selectedRole.id!,
                roleTitle: selectedRole.title,
                date: form.date,
                time: form.time,
                duration: form.duration,
                mode: form.mode,
                meetLink: form.meetLink,
                venue: form.venue,
            });
            // Refresh slots
            const refreshed = await getInterviewSlots(dbUid, selectedRole.id);
            setSlots(refreshed);
            setShowForm(false);
            setForm({ date: '', time: '', duration: 30, mode: 'video', meetLink: '', venue: '' });
        } finally {
            setSaving(false);
        }
    };

    const handleBook = async () => {
        if (!dbUid || !bookSlot?.id || !bookingAppId) return;
        setSaving(true);
        try {
            const app = applications.find(a => a.id === bookingAppId);
            if (!app) return;
            await bookInterviewSlot(dbUid, bookSlot.id, {
                candidateUid: app.candidateUid,
                candidateName: app.candidateName,
                candidateEmail: app.candidateEmail,
                appId: bookingAppId,
            });

            // Trigger WhatsApp Notification
            if (selectedRole?.companyName) {
                await notifyInterviewWhatsApp({
                    phone: "+1234567890", // placeholder for demo
                    candidateName: app.candidateName,
                    company: selectedRole.companyName,
                    role: selectedRole.title,
                    date: bookSlot.date,
                    time: bookSlot.time,
                    mode: bookSlot.mode,
                    meetLink: bookSlot.meetLink
                }).catch(console.error);
            }

            const refreshed = await getInterviewSlots(dbUid, selectedRole?.id);
            setSlots(refreshed);
            setBookSlot(null);
            setBookingAppId('');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (slotId: string) => {
        if (!dbUid) return;
        await deleteInterviewSlot(dbUid, slotId);
        setSlots(prev => prev.filter(s => s.id !== slotId));
    };

    const availableApps = applications.filter(a =>
        a.status === 'Screening' || a.status === 'Interview Scheduled'
    );

    const slotsByDate = slots.reduce<Record<string, InterviewSlot[]>>((acc, s) => {
        if (!acc[s.date]) acc[s.date] = [];
        acc[s.date].push(s);
        return acc;
    }, {});

    return (
        <div className="sched-page">
            <FloatingNavbar variant="employer" />

            <div className="sched-content">
                <motion.header className="sched-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                    <CalendarDays size={28} color="#2563eb" />
                    <div>
                        <h1>Interview Scheduler</h1>
                        <p>Create time slots and assign candidates to interviews</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="sched-add-btn" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }} title="Send candidates a link to pick their own time">
                            <Link size={14} /> Self-Schedule Link
                        </button>
                        <button className="sched-add-btn" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }} title="Sync with Google or Outlook Calendar">
                            <CalendarDays size={14} /> Sync Calendar
                        </button>
                        <button className="sched-add-btn" onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Add Slot
                        </button>
                    </div>
                </motion.header>

                {/* Role tabs */}
                {roles.length > 0 && (
                    <div className="sched-role-tabs">
                        {roles.map(r => (
                            <button
                                key={r.id}
                                className={`sched-role-tab ${selectedRole?.id === r.id ? 'active' : ''}`}
                                onClick={() => setSelectedRole(r)}
                            >
                                <Briefcase size={13} /> {r.title}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="sched-empty"><Loader2 size={32} className="spin" /></div>
                ) : roles.length === 0 ? (
                    <div className="sched-empty">
                        <Briefcase size={48} color="#e2e8f0" />
                        <p>Post a role first to schedule interviews.</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="sched-empty">
                        <CalendarDays size={48} color="#e2e8f0" />
                        <p>No interview slots yet. Click <strong>Add Slot</strong> to create one.</p>
                    </div>
                ) : (
                    /* Calendar-style view */
                    <div className="sched-calendar">
                        {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, daySlots]) => (
                            <div key={date} className="sched-day">
                                <div className="sched-day-label">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                                        weekday: 'long', day: 'numeric', month: 'long',
                                    })}
                                </div>
                                <div className="sched-day-slots">
                                    {daySlots.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                                        <motion.div
                                            key={slot.id}
                                            className={`sched-slot sched-slot--${slot.status}`}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <div className="sched-slot-time">
                                                <Clock size={13} /> {slot.time}
                                                <span className="sched-slot-dur">· {slot.duration} min</span>
                                            </div>
                                            <div className="sched-slot-mode">
                                                {MODE_ICON[slot.mode]} {MODE_LABEL[slot.mode]}
                                                {slot.meetLink && <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="sched-slot-link"><Link size={12} /></a>}
                                            </div>
                                            <div className="sched-slot-status" style={{ color: STATUS_COLOR[slot.status] }}>
                                                ● {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                                                {slot.bookedByName && <span> — {slot.bookedByName}</span>}
                                            </div>
                                            <div className="sched-slot-actions">
                                                {slot.status === 'available' && (
                                                    <button className="sched-slot-btn sched-slot-btn--book" onClick={() => setBookSlot(slot)}>
                                                        <Users size={12} /> Book
                                                    </button>
                                                )}
                                                <button
                                                    className="sched-slot-btn sched-slot-btn--del"
                                                    onClick={() => handleDelete(slot.id!)}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Slot Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <div className="sched-overlay" onClick={() => setShowForm(false)}>
                        <motion.div
                            className="sched-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="sched-modal-header">
                                <CalendarDays size={20} color="#2563eb" />
                                <h3>Add Interview Slot</h3>
                                <button onClick={() => setShowForm(false)}><X size={18} /></button>
                            </div>

                            <div className="sched-modal-grid">
                                <div className="sched-field">
                                    <label>Date</label>
                                    <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                                <div className="sched-field">
                                    <label>Time</label>
                                    <input type="time" value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                                </div>
                                <div className="sched-field">
                                    <label>Duration (min)</label>
                                    <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}>
                                        {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
                                    </select>
                                </div>
                                <div className="sched-field">
                                    <label>Mode</label>
                                    <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as InterviewSlot['mode'] }))}>
                                        <option value="video">🎥 Video Call</option>
                                        <option value="in_person">🏢 In Person</option>
                                        <option value="phone">📞 Phone</option>
                                    </select>
                                </div>
                                {form.mode === 'video' && (
                                    <div className="sched-field sched-field--full">
                                        <label>Meet Link (optional)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input placeholder="https://meet.google.com/..." value={form.meetLink}
                                                onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
                                                style={{ flex: 1 }} />
                                            <button 
                                                className="sched-add-btn" 
                                                style={{ padding: '0 12px', whiteSpace: 'nowrap', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
                                                onClick={() => setForm(f => ({ ...f, meetLink: 'https://zoom.us/j/' + Math.floor(Math.random()*1000000000) }))}
                                            >
                                                Generate Zoom/Meet
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {form.mode === 'in_person' && (
                                    <div className="sched-field sched-field--full">
                                        <label>Venue</label>
                                        <input placeholder="Office address / room number" value={form.venue}
                                            onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="sched-field sched-field--full" style={{ marginTop: '12px', marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>
                                    <input type="checkbox" defaultChecked />
                                    Send automated email/SMS reminders (24h & 1h before)
                                </label>
                            </div>

                            <button className="sched-modal-submit" onClick={handleCreateSlot}
                                disabled={saving || !form.date || !form.time}>
                                {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                                {saving ? 'Creating...' : 'Create Slot'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Book Slot Modal ── */}
            <AnimatePresence>
                {bookSlot && (
                    <div className="sched-overlay" onClick={() => setBookSlot(null)}>
                        <motion.div
                            className="sched-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="sched-modal-header">
                                <Users size={20} color="#10b981" />
                                <h3>Book Slot for Candidate</h3>
                                <button onClick={() => setBookSlot(null)}><X size={18} /></button>
                            </div>
                            <p className="sched-modal-sub">
                                Slot: <strong>{bookSlot.date}</strong> at <strong>{bookSlot.time}</strong> ({bookSlot.duration} min, {MODE_LABEL[bookSlot.mode]})
                            </p>

                            <div className="sched-field sched-field--full" style={{ marginBottom: 16 }}>
                                <label>Select Candidate</label>
                                <select value={bookingAppId} onChange={e => setBookingAppId(e.target.value)}>
                                    <option value="">— Choose an applicant —</option>
                                    {availableApps.map(a => (
                                        <option key={a.id} value={a.id}>{a.candidateName} ({a.status})</option>
                                    ))}
                                </select>
                            </div>

                            <button className="sched-modal-submit sched-modal-submit--green"
                                onClick={handleBook} disabled={saving || !bookingAppId}>
                                {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                                {saving ? 'Booking...' : 'Confirm & Notify Candidate'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
