import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getInstitutionEvents, type InstitutionEvent } from '../../services/institutionService';
import { getWorkshopRegistrations, registerForWorkshop, type WorkshopRegistration } from '../../services/academicianService';
import { MapPin, Clock, Loader2, Search, CheckCircle2, AlertCircle, Calendar, Ticket, Building2, User } from 'lucide-react';
import './AcademicianSubPages.css';

export default function WorkshopsPage() {
    const { user, profile } = useAuth();
    const [events, setEvents] = useState<InstitutionEvent[]>([]);
    const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [registering, setRegistering] = useState<string | null>(null);

    const institutionCode = profile?.institutionCode;

    useEffect(() => {
        (async () => {
            if (!user || !institutionCode) {
                setLoading(false);
                return;
            }
            try {
                const [instEvents, regs] = await Promise.all([
                    getInstitutionEvents(institutionCode),
                    getWorkshopRegistrations(user.uid),
                ]);
                
                // Only show workshops and guest lectures
                const relevantEvents = instEvents.filter(e => e.type === 'workshop' || e.type === 'guest_lecture');
                setEvents(relevantEvents);
                setRegistrations(regs);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [user, institutionCode]);

    const registeredEventIds = new Set(registrations.map(r => r.roleId));

    const filtered = events.filter(evt =>
        !searchQuery.trim() ||
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRegister = async (evt: InstitutionEvent) => {
        if (!user || !evt.id) return;
        setRegistering(evt.id);
        try {
            await registerForWorkshop(user.uid, {
                roleId: evt.id, title: evt.title, provider: evt.company || evt.speaker, status: 'registered',
            });
            setRegistrations(prev => [...prev, { roleId: evt.id!, title: evt.title, provider: evt.company || evt.speaker, status: 'registered' }]);
        } catch (e) { console.error(e); } finally { setRegistering(null); }
    };

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Calendar size={28} className="acad-header-icon" />
                    <div><h1>Industry Workshops & Guest Lectures</h1><p>Register for specialized training sessions and lectures from partner companies.</p></div>
                </motion.header>
                <div className="acad-search-bar"><Search size={16} /><input placeholder="Search workshops..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

                {registrations.length > 0 && (
                    <section className="acad-section">
                        <h2 className="acad-section-title">My Registrations</h2>
                        <div className="acad-reg-list">
                            {registrations.map((reg, i) => (
                                <div key={reg.id || i} className="acad-reg-card">
                                    <div className="acad-reg-info"><span className="acad-reg-title">{reg.title}</span><span className="acad-reg-provider">{reg.provider}</span></div>
                                    <span className={`acad-status acad-status--${reg.status}`}>{reg.status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="acad-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1))', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>Industry Expert Matching</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '600px' }}>Request a guest speaker from our network of industry professionals for your classes or department events.</p>
                        </div>
                        <button style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} /> Request Speaker
                        </button>
                    </div>
                </section>

                <section className="acad-section">
                    <h2 className="acad-section-title">Upcoming Workshops</h2>
                    {loading ? (
                        <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading events...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="acad-empty"><AlertCircle size={36} /><h3>No Upcoming Workshops</h3><p>Workshops will appear here when published by your institution's admin.</p></div>
                    ) : (
                        <div className="acad-cards-grid">
                            {filtered.map((evt, i) => (
                                <motion.div key={evt.id} className="acad-opp-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="acad-opp-header">
                                        <h3>{evt.title}</h3>
                                        <span className="acad-opp-company" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Building2 size={12} /> {evt.company}</span>
                                    </div>
                                    <p className="acad-opp-desc">{evt.description}</p>
                                    
                                    <div className="acad-opp-meta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                        {evt.speaker && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={13} /> {evt.speaker}</span>}
                                        {evt.date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {new Date(evt.date).toLocaleDateString()}</span>}
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}><MapPin size={13} /> {evt.mode} {evt.venue && `- ${evt.venue}`}</span>
                                    </div>

                                    <div className="acad-opp-actions" style={{ marginTop: '1.25rem' }}>
                                        {registeredEventIds.has(evt.id!) ? (
                                            <span className="acad-btn-registered" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}><CheckCircle2 size={16} /> Registered</span>
                                        ) : (
                                            <button className="acad-btn-register" onClick={() => handleRegister(evt)} disabled={registering === evt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                                {registering === evt.id ? <Loader2 size={14} className="spin" /> : <Ticket size={14} />} Register Now
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
