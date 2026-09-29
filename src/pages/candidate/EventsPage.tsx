import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getUpcomingEvents, registerForEvent, unregisterFromEvent, seedSampleEvents,
    type PlatformEvent, type EventType,
} from '../../services/communityService';
import {
    Calendar, Video, Mic, Code2, Users, Briefcase, Globe, Clock, MapPin,
    ExternalLink, CheckCircle2, Plus, Loader2, Search, Tag,
} from 'lucide-react';
import './EventsPage.css';

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: ReactNode; color: string; emoji: string }> = {
    webinar: { label: 'Webinar', icon: <Video size={14} />, color: '#6366f1', emoji: '🎥' },
    workshop: { label: 'Workshop', icon: <Code2 size={14} />, color: '#2563eb', emoji: '🛠️' },
    hackathon: { label: 'Hackathon', icon: <Code2 size={14} />, color: '#7c3aed', emoji: '⚡' },
    career_fair: { label: 'Career Fair', icon: <Briefcase size={14} />, color: '#059669', emoji: '🏢' },
    gd_session: { label: 'GD Session', icon: <Mic size={14} />, color: '#d97706', emoji: '🎙️' },
    networking: { label: 'Networking', icon: <Users size={14} />, color: '#ec4899', emoji: '🤝' },
};

function formatEventDate(dateStr: string): { day: string; month: string; time: string; full: string } {
    const d = new Date(dateStr);
    return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        full: d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    };
}

function daysUntilEvent(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function EventsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid } = useAuth();
    const [events, setEvents] = useState<PlatformEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<EventType | 'all'>('all');
    const [search, setSearch] = useState('');
    const [registering, setRegistering] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!dbUid) return;
        setLoading(true);
        getUpcomingEvents(30).then(async (data) => {
            if (data.length === 0) {
                await seedSampleEvents();
                const refreshed = await getUpcomingEvents(30);
                setEvents(refreshed);
            } else {
                setEvents(data);
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [dbUid]);

    const handleRegister = async (event: PlatformEvent) => {
        if (!dbUid || !event.id) return;
        setRegistering(event.id);
        try {
            const isRegistered = event.registeredUids.includes(dbUid);
            if (isRegistered) {
                await unregisterFromEvent(event.id, dbUid);
                setEvents(prev => prev.map(e => e.id === event.id
                    ? { ...e, registeredUids: e.registeredUids.filter(u => u !== dbUid) }
                    : e
                ));
            } else {
                await registerForEvent(event.id, dbUid);
                setEvents(prev => prev.map(e => e.id === event.id
                    ? { ...e, registeredUids: [...e.registeredUids, dbUid] }
                    : e
                ));
            }
        } finally {
            setRegistering(null);
        }
    };

    const filtered = events.filter(e => {
        if (filter !== 'all' && e.type !== filter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
            !e.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const upcoming = filtered.filter(e => daysUntilEvent(e.date) <= 7 && daysUntilEvent(e.date) >= 0);
    const later = filtered.filter(e => daysUntilEvent(e.date) > 7);

    return (
        <div className="events-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            <div className="events-container">
                {/* Header */}
                <motion.div className="events-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="events-title"><Calendar size={26} /> Events & Webinars</h1>
                        <p className="events-subtitle">Career fairs, webinars, workshops, mock GD sessions & more</p>
                    </div>
                    <div className="events-header-stats">
                        <div className="events-stat">
                            <span className="events-stat-num">{events.length}</span>
                            <span className="events-stat-lbl">Upcoming</span>
                        </div>
                        <div className="events-stat">
                            <span className="events-stat-num">{events.filter(e => e.registeredUids.includes(dbUid || '')).length}</span>
                            <span className="events-stat-lbl">Registered</span>
                        </div>
                    </div>
                </motion.div>

                {/* Search + Filter */}
                <div className="events-controls">
                    <div className="events-search">
                        <Search size={15} color="#64748b" />
                        <input placeholder="Search events..." value={search}
                            onChange={e => setSearch(e.target.value)} className="events-search-input" />
                    </div>
                    <div className="events-type-filters">
                        <button className={`events-type-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}>All</button>
                        {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                            <button key={k}
                                className={`events-type-btn ${filter === k ? 'active' : ''}`}
                                onClick={() => setFilter(k as EventType)}
                                style={filter === k ? { background: v.color + '20', borderColor: v.color + '50', color: v.color } : {}}>
                                {v.emoji} {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="events-loading"><Loader2 size={28} className="events-spinner" /><p>Loading events...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="events-empty">
                        <div style={{ fontSize: '2.5rem' }}>📅</div>
                        <h3>No events found</h3>
                        <p>Check back soon for upcoming events and webinars!</p>
                    </div>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <section className="events-section">
                                <div className="events-section-label">
                                    <span className="events-section-dot events-section-dot--hot" />
                                    This Week
                                </div>
                                <div className="events-grid">
                                    {upcoming.map((ev, i) => <EventCard key={ev.id} event={ev} dbUid={dbUid || ''} registering={registering} onRegister={handleRegister} expanded={expandedId === ev.id} onToggle={() => setExpandedId(expandedId === ev.id ? null : ev.id!)} index={i} />)}
                                </div>
                            </section>
                        )}
                        {later.length > 0 && (
                            <section className="events-section">
                                <div className="events-section-label">
                                    <span className="events-section-dot" />
                                    Coming Up
                                </div>
                                <div className="events-grid">
                                    {later.map((ev, i) => <EventCard key={ev.id} event={ev} dbUid={dbUid || ''} registering={registering} onRegister={handleRegister} expanded={expandedId === ev.id} onToggle={() => setExpandedId(expandedId === ev.id ? null : ev.id!)} index={i} />)}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function EventCard({ event, dbUid, registering, onRegister, expanded, onToggle, index }: {
    event: PlatformEvent; dbUid: string; registering: string | null;
    onRegister: (e: PlatformEvent) => void; expanded: boolean; onToggle: () => void; index: number;
}) {
    const conf = EVENT_TYPE_CONFIG[event.type];
    const isRegistered = event.registeredUids.includes(dbUid);
    const daysLeft = daysUntilEvent(event.date);
    const dateInfo = formatEventDate(event.date);
    const spotsLeft = event.maxParticipants
        ? event.maxParticipants - event.registeredUids.length
        : null;

    return (
        <motion.div className={`event-card ${isRegistered ? 'registered' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            layout>
            {/* Date Badge */}
            <div className="event-date-badge">
                <span className="event-date-day">{dateInfo.day}</span>
                <span className="event-date-month">{dateInfo.month}</span>
            </div>

            <div className="event-card-body">
                <div className="event-card-top">
                    <div className="event-type-badge"
                        style={{ background: conf.color + '20', color: conf.color, border: `1px solid ${conf.color}30` }}>
                        {conf.emoji} {conf.label}
                    </div>
                    {daysLeft === 0 && <span className="event-today-badge">Today</span>}
                    {daysLeft === 1 && <span className="event-tomorrow-badge">Tomorrow</span>}
                    {isRegistered && <span className="event-registered-badge"><CheckCircle2 size={11} /> Registered</span>}
                </div>

                <h3 className="event-title" onClick={onToggle}>{event.title}</h3>

                <div className="event-meta">
                    <span><Clock size={12} /> {dateInfo.time} · {event.duration ? `${event.duration} min` : ''}</span>
                    {event.isOnline
                        ? <span><Globe size={12} /> Online</span>
                        : <span><MapPin size={12} /> {event.venue}</span>
                    }
                    <span><Users size={12} /> {event.registeredUids.length} registered
                        {spotsLeft !== null && spotsLeft < 20 && <> · <strong style={{ color: '#ef4444' }}>{spotsLeft} spots left</strong></>}
                    </span>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div className="event-description"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}>
                            <p>{event.description}</p>
                            {event.tags.length > 0 && (
                                <div className="event-tags">
                                    {event.tags.map(t => <span key={t} className="event-tag">#{t}</span>)}
                                </div>
                            )}
                            <p className="event-organizer">Organized by: <strong>{event.organizer}</strong></p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="event-card-footer">
                    <button className="event-details-btn" onClick={onToggle}>
                        {expanded ? 'Less' : 'Details'}
                    </button>
                    <div className="event-card-actions">
                        {event.link && (
                            <a href={event.link} target="_blank" rel="noopener noreferrer"
                                className="event-join-link" onClick={e => e.stopPropagation()}>
                                <ExternalLink size={13} /> View
                            </a>
                        )}
                        <button
                            className={`event-register-btn ${isRegistered ? 'unregister' : ''}`}
                            disabled={registering === event.id || (spotsLeft !== null && spotsLeft <= 0 && !isRegistered)}
                            onClick={() => onRegister(event)}>
                            {registering === event.id
                                ? <Loader2 size={13} className="events-spinner" />
                                : isRegistered
                                    ? <><CheckCircle2 size={13} /> Registered</>
                                    : <><Plus size={13} /> Register</>}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
