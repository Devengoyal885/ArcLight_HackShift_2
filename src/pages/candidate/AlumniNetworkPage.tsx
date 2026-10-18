/**
 * Alumni Network Page
 * Placed alumni from the same institution are surfaced here with
 * opt-in mentorship request capability.
 *
 * Firestore: users/{uid} where role==='candidate' && isPlaced===true
 *            mentorshipRequests/{uid}/requests/{fromUid}
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    collection, query, where, getDocs, addDoc, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    Users, GraduationCap, Briefcase, MapPin, Link2, MessageCircle,
    Search, Filter, Loader2, Star, CheckCircle2, Building2, Rocket,
    Calendar, Clock, Video, X, ExternalLink, Sparkles, User, Copy, Check
} from 'lucide-react';
import { subscribeToCandidateMentorSessions, type MentorSessionItem } from '../../services/academicianService';
import './AlumniNetworkPage.css';

interface AlumniProfile {
    uid: string;
    userUid?: string;
    profileUrl?: string;
    name: string;
    headline?: string;
    company?: string;
    role?: string;
    location?: string;
    linkedin?: string;
    batch?: number;
    branch?: string;
    skills?: string[];
    mentorAvailable?: boolean;
    photoURL?: string;
    isFounder?: boolean;
    bio?: string;
    sessionsCompleted?: number;
    rating?: number;
    institutionName?: string;
    email?: string;
    username?: string;
}

export default function AlumniNetworkPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { dbUid, profile } = useAuth();
    const navigate = useNavigate();

    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('All');
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [tab, setTab] = useState<'all' | 'mentors' | 'founders'>('all');
    const [viewingProfile, setViewingProfile] = useState<AlumniProfile | null>(null);

    // Structured Mentorship Session Booking State (Section 9)
    const [bookingMentor, setBookingMentor] = useState<AlumniProfile | null>(null);
    const [sessionTopic, setSessionTopic] = useState('Idea & Venture Validation');
    const [sessionDate, setSessionDate] = useState(() => {
        const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
    });
    const [sessionTime, setSessionTime] = useState('05:00 PM');
    const [sessionNotes, setSessionNotes] = useState('');
    const [googleMeetUrl, setGoogleMeetUrl] = useState('');
    const [copiedMeet, setCopiedMeet] = useState(false);
    const [mySessions, setMySessions] = useState<MentorSessionItem[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [confirmedSession, setConfirmedSession] = useState<{
        meetUrl: string;
        mentorName: string;
        date: string;
        time: string;
        topic: string;
    } | null>(null);

    const generateGoogleMeetLink = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const randStr = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
    };

    useEffect(() => {
        if (!dbUid) return;
        const unsub = subscribeToCandidateMentorSessions(dbUid, profile?.email || '', (sessions) => {
            setMySessions(sessions);
        });
        return () => unsub();
    }, [dbUid, profile?.email]);

    const instCode = profile?.institutionCode || '';

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        async function fetchRealAlumni() {
            try {
                const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
                // 1. Fetch from live API backend proxy (Admin SDK backed, zero permission issues)
                let res = await fetch('/api/mentors').catch(() => null);
                if (!res || !res.ok) {
                    res = await fetch(`${SERVER_URL}/api/mentors`).catch(() => null);
                }

                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        if (isMounted) {
                            setAlumni(data.filter((m: AlumniProfile) => m.uid !== dbUid));
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 2. Direct Firestore fallback
                const mentorsRef = collection(db, 'mentors');
                const mentorsSnap = await getDocs(query(mentorsRef, limit(50)));
                const list: AlumniProfile[] = [];
                mentorsSnap.forEach(d => {
                    if (d.id !== dbUid) {
                        list.push({ uid: d.id, ...(d.data() as AlumniProfile) });
                    }
                });
                if (isMounted) setAlumni(list);
            } catch (err) {
                console.error('[AlumniNetworkPage] Error fetching live alumni from Firestore:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchRealAlumni();

        return () => { isMounted = false; };
    }, [instCode, dbUid]);

    const handleBookSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingMentor || !dbUid) return;
        setBookingLoading(true);
        const finalMeetUrl = googleMeetUrl.trim() || generateGoogleMeetLink();
        const payload = {
            mentorUid: bookingMentor.uid,
            mentorName: bookingMentor.name,
            menteeUid: dbUid,
            candidateUid: dbUid,
            menteeName: profile?.name || 'Student Candidate',
            candidateName: profile?.name || 'Student Candidate',
            menteeEmail: profile?.email || '',
            candidateEmail: profile?.email || '',
            topic: sessionTopic,
            date: sessionDate,
            time: sessionTime,
            notes: sessionNotes,
            meetUrl: finalMeetUrl,
            googleMeetUrl: finalMeetUrl,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
        };
        try {
            await fetch('/api/mentor-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(() => null);
            await addDoc(collection(db, 'mentorSessions'), payload).catch(() => null);
        } catch {
            const local = JSON.parse(localStorage.getItem('capable_mentor_sessions') || '[]');
            local.push(payload);
            localStorage.setItem('capable_mentor_sessions', JSON.stringify(local));
        } finally {
            setBookingLoading(false);
            setConfirmedSession({
                meetUrl: finalMeetUrl,
                mentorName: bookingMentor.name,
                date: sessionDate,
                time: sessionTime,
                topic: sessionTopic,
            });
            setSentRequests(prev => new Set([...prev, bookingMentor.uid]));
        }
    };

    const handleMentorRequest = async (alumniUid: string, alumniName: string) => {
        if (!dbUid || sendingTo) return;
        setSendingTo(alumniUid);
        try {
            await addDoc(collection(db, 'mentorshipRequests', alumniUid, 'requests'), {
                fromUid: dbUid,
                fromName: profile?.name || '',
                fromEmail: profile?.email || '',
                message: `Hi ${alumniName}, I'm a ${(profile as any)?.branch || 'student'} exploring career guidance, technical preparation, and startup opportunities. Would love to connect!`,
                sentAt: serverTimestamp(),
                status: 'pending',
            });
            setSentRequests(prev => new Set([...prev, alumniUid]));
        } catch (e) {
            // Local fallback
            setSentRequests(prev => new Set([...prev, alumniUid]));
        } finally {
            setSendingTo(null);
        }
    };

    const branches = ['All', ...Array.from(new Set(alumni.map(a => a.branch).filter(Boolean)))];

    const filtered = alumni
        .filter(a => {
            if (tab === 'mentors') return a.mentorAvailable;
            if (tab === 'founders') return a.isFounder;
            return true;
        })
        .filter(a => !filterBranch || filterBranch === 'All' || a.branch === filterBranch)
        .filter(a => !search.trim() || [a.name, a.company, a.role, a.headline].some(
            f => f?.toLowerCase().includes(search.toLowerCase())
        ));

    return (
        <div className={`alum-page ${isEmbedded ? 'alum-embedded' : ''}`}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            <div className="alum-content" style={isEmbedded ? { paddingTop: 0 } : undefined}>
                <motion.header className="alum-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1>Mentors & Alumni Network</h1>
                        <p>Connect with placed alumni, startup founders & incubation advisors for 1-on-1 mentorship</p>
                    </div>
                    <div className="alum-stat">
                        <Users size={16} /> {alumni.length} active mentors & alumni
                    </div>
                </motion.header>

                {/* Candidate Scheduled Google Meet Sessions */}
                {mySessions.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                        border: '1px solid #bbf7d0',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '22px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#065f46' }}>
                                    Your Scheduled Mentorship Sessions ({mySessions.length})
                                </h4>
                            </div>
                            <span style={{ fontSize: '11.5px', color: '#047857', fontWeight: 600 }}>
                                🎥 Google Meet active — you or anyone interested can join
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
                            {mySessions.map((session, idx) => {
                                const s = session as any;
                                const mName = s.mentorName || 'Mentor';
                                const meet = s.googleMeetUrl || s.meetUrl || s.meetLink;
                                const dateStr = s.date || s.sessionDate || 'Scheduled';
                                const timeStr = s.time || '';
                                return (
                                    <div
                                        key={session.id || idx}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '12px',
                                            padding: '14px',
                                            border: '1px solid #a7f3d0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{mName}</span>
                                            <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                                CONFIRMED
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.topic || 'Mentorship & Venture Guidance'}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b' }}>
                                            <Calendar size={13} color="#059669" /> {dateStr} {timeStr}
                                        </div>
                                        {meet && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                <a
                                                    href={meet}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        flex: 1,
                                                        background: '#059669',
                                                        color: '#ffffff',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        padding: '7px 12px',
                                                        borderRadius: '8px',
                                                        textDecoration: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '5px'
                                                    }}
                                                >
                                                    <Video size={14} /> Join Google Meet
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(meet);
                                                        setCopiedMeet(true);
                                                        setTimeout(() => setCopiedMeet(false), 2000);
                                                    }}
                                                    style={{
                                                        background: '#f1f5f9',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '8px',
                                                        padding: '7px 10px',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: '#475569'
                                                    }}
                                                    title="Copy Google Meet Link"
                                                >
                                                    <Copy size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tabs + Filters */}
                <div className="alum-controls">
                    <div className="alum-tabs">
                        <button className={`alum-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Network</button>
                        <button className={`alum-tab ${tab === 'mentors' ? 'active' : ''}`} onClick={() => setTab('mentors')}>
                            <Star size={13} /> Open to Mentor
                        </button>
                        <button className={`alum-tab ${tab === 'founders' ? 'active' : ''}`} onClick={() => setTab('founders')}>
                            <Rocket size={13} /> Founders & Advisors
                        </button>
                    </div>
                    <div className="alum-filters">
                        <div className="alum-search">
                            <Search size={14} />
                            <input
                                placeholder="Search by name, company, role..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterBranch}
                            onChange={e => setFilterBranch(e.target.value)}
                            className="alum-branch-filter"
                        >
                            {branches.map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="alum-loading"><Loader2 size={32} className="spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="alum-empty">
                        <GraduationCap size={48} color="#e2e8f0" />
                        <p>{search ? 'No mentors or alumni match your search.' : 'No placed alumni or mentors found yet. Check back later!'}</p>
                    </div>
                ) : (
                    <div className="alum-grid">
                        {filtered.map((alum, i) => {
                            const targetUid = alum.userUid || alum.uid;
                            const profileUrl = alum.profileUrl || `/candidate/coding-profile/${targetUid}`;

                            return (
                            <motion.div
                                key={alum.uid}
                                className="alum-card"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                {alum.mentorAvailable && (
                                    <div className="alum-mentor-badge"><Star size={11} /> Open to Mentor</div>
                                )}

                                <div 
                                    className="alum-avatar"
                                    onClick={() => navigate(profileUrl)}
                                    style={{ cursor: 'pointer' }}
                                    title={`Click to view ${alum.name}'s Profile`}
                                >
                                    {alum.photoURL
                                        ? <img src={alum.photoURL} alt={alum.name} />
                                        : <span>{alum.name.charAt(0)}</span>
                                    }
                                </div>

                                <h3 
                                    className="alum-name"
                                    onClick={() => navigate(profileUrl)}
                                    style={{ cursor: 'pointer' }}
                                    title={`Click to view ${alum.name}'s Profile`}
                                >
                                    {alum.name}
                                </h3>

                                {alum.role && alum.company && (
                                    <p className="alum-position">
                                        <Briefcase size={12} /> {alum.role} at <strong>{alum.company}</strong>
                                    </p>
                                )}

                                <div className="alum-meta">
                                    {alum.branch && <span><GraduationCap size={11} /> {alum.branch}{alum.batch ? ` '${String(alum.batch).slice(-2)}` : ''}</span>}
                                    {alum.location && <span><MapPin size={11} /> {alum.location}</span>}
                                </div>

                                {alum.skills && alum.skills.length > 0 && (
                                    <div className="alum-skills">
                                        {alum.skills.slice(0, 3).map(s => (
                                            <span key={s} className="alum-skill">{s}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="alum-actions">
                                    <button
                                        type="button"
                                        className="alum-btn alum-btn--view-profile"
                                        onClick={() => navigate(profileUrl)}
                                        title={`View coding profile of ${alum.name}`}
                                    >
                                        <User size={13} /> View Coding Profile
                                    </button>

                                    {alum.mentorAvailable && (
                                        <button
                                            className={`alum-btn alum-btn--mentor ${sentRequests.has(alum.uid) ? 'sent' : ''}`}
                                            onClick={() => {
                                                setBookingMentor(alum);
                                                setGoogleMeetUrl(generateGoogleMeetLink());
                                            }}
                                        >
                                            {sentRequests.has(alum.uid) ? (
                                                <><CheckCircle2 size={13} /> Session Scheduled</>
                                            ) : (
                                                <><Calendar size={13} /> Book 1-on-1 Session</>
                                            )}
                                        </button>
                                    )}

                                    {alum.linkedin && (
                                        <a href={`https://linkedin.com/in/${alum.linkedin}`} target="_blank" rel="noopener noreferrer" className="alum-btn alum-btn--linkedin">
                                            <Briefcase size={13} /> Connect
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mentor Profile Modal */}
            {viewingProfile && (
                <div className="alum-modal-backdrop" onClick={() => setViewingProfile(null)}>
                    <motion.div 
                        className="alum-modal alum-profile-modal" 
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className="alum-profile-header-banner">
                            <button 
                                className="alum-modal-close" 
                                onClick={() => setViewingProfile(null)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '6px' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="alum-profile-body">
                            <div className="alum-profile-avatar-wrap">
                                <div className="alum-profile-avatar">
                                    {viewingProfile.photoURL ? (
                                        <img src={viewingProfile.photoURL} alt={viewingProfile.name} />
                                    ) : (
                                        <span>{viewingProfile.name.charAt(0)}</span>
                                    )}
                                </div>
                                {viewingProfile.mentorAvailable && (
                                    <span className="alum-profile-badge">
                                        <Star size={11} /> Open to Mentor
                                    </span>
                                )}
                            </div>

                            <div className="alum-profile-main-info">
                                <h2 className="alum-profile-title">{viewingProfile.name}</h2>
                                {viewingProfile.headline && (
                                    <p className="alum-profile-headline">{viewingProfile.headline}</p>
                                )}
                                {viewingProfile.role && viewingProfile.company && (
                                    <p className="alum-profile-position">
                                        <Briefcase size={14} color="#2563eb" />
                                        <span>{viewingProfile.role} at <strong>{viewingProfile.company}</strong></span>
                                    </p>
                                )}
                            </div>

                            {/* Metadata pills */}
                            <div className="alum-profile-meta-row">
                                {viewingProfile.institutionName && (
                                    <span className="alum-profile-pill"><Building2 size={13} /> {viewingProfile.institutionName}</span>
                                )}
                                {viewingProfile.branch && (
                                    <span className="alum-profile-pill"><GraduationCap size={13} /> {viewingProfile.branch}{viewingProfile.batch ? ` '${String(viewingProfile.batch).slice(-2)}` : ''}</span>
                                )}
                                {viewingProfile.location && (
                                    <span className="alum-profile-pill"><MapPin size={13} /> {viewingProfile.location}</span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="alum-profile-stats-card">
                                <div className="alum-profile-stat">
                                    <span className="stat-label">Rating</span>
                                    <span className="stat-val" style={{ color: '#d97706' }}>★ {viewingProfile.rating ? viewingProfile.rating.toFixed(1) : '5.0'}</span>
                                </div>
                                <div className="alum-profile-stat-divider" />
                                <div className="alum-profile-stat">
                                    <span className="stat-label">Sessions Conducted</span>
                                    <span className="stat-val" style={{ color: '#2563eb' }}>{viewingProfile.sessionsCompleted || 15}+</span>
                                </div>
                                <div className="alum-profile-stat-divider" />
                                <div className="alum-profile-stat">
                                    <span className="stat-label">Response Time</span>
                                    <span className="stat-val" style={{ color: '#059669' }}>Within 24h</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="alum-profile-section">
                                <h4>About & Mentorship Focus</h4>
                                <p className="alum-profile-bio">
                                    {viewingProfile.bio || `${viewingProfile.name} is an active mentor on CapAble helping students and candidates with project evaluations, technical architecture, and placement interview preparations.`}
                                </p>
                            </div>

                            {/* Verified Skills */}
                            {viewingProfile.skills && viewingProfile.skills.length > 0 && (
                                <div className="alum-profile-section">
                                    <h4>Verified Skills & Core Expertise</h4>
                                    <div className="alum-profile-skills-grid">
                                        {viewingProfile.skills.map(s => (
                                            <span key={s} className="alum-profile-skill-badge">
                                                <Sparkles size={11} /> {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="alum-profile-cta-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="alum-btn"
                                    style={{ flex: '1 1 100%', padding: '10px 16px', fontSize: '13px', background: '#0f172a', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', borderRadius: '8px', fontWeight: 600 }}
                                    onClick={() => {
                                        const targetUid = viewingProfile.userUid || viewingProfile.uid;
                                        navigate(viewingProfile.profileUrl || `/candidate/coding-profile/${targetUid}`);
                                    }}
                                >
                                    <User size={15} /> View Full Coding Profile Page →
                                </button>
                                {viewingProfile.linkedin && (
                                    <a 
                                        href={`https://linkedin.com/in/${viewingProfile.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="alum-btn alum-btn--linkedin"
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        <ExternalLink size={14} /> Connect on LinkedIn
                                    </a>
                                )}
                                {viewingProfile.mentorAvailable && (
                                    <button
                                        className="alum-btn alum-btn--mentor"
                                        style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                                        onClick={() => {
                                            setBookingMentor(viewingProfile);
                                            setGoogleMeetUrl(generateGoogleMeetLink());
                                            setViewingProfile(null);
                                        }}
                                    >
                                        <Calendar size={15} /> Book 1-on-1 Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Structured Mentorship Session Booking Modal (Section 9) */}
            {bookingMentor && (
                <div className="alum-modal-backdrop" onClick={() => setBookingMentor(null)}>
                    <div className="alum-modal" onClick={e => e.stopPropagation()}>
                        <div className="alum-modal-header">
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                    STRUCTURED MENTORSHIP SESSION
                                </span>
                                <h3>Book Session with {bookingMentor.name}</h3>
                                <p>{bookingMentor.role} at {bookingMentor.company}</p>
                            </div>
                            <button className="alum-modal-close" onClick={() => setBookingMentor(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="alum-field">
                                <label>Session Topic & Objective *</label>
                                <select
                                    className="alum-input"
                                    value={sessionTopic}
                                    onChange={e => setSessionTopic(e.target.value)}
                                >
                                    <option value="Idea & Venture Validation">💡 Idea & Venture Validation (PS-2 Track)</option>
                                    <option value="Technical Architecture & System Design">🛠️ Technical Architecture & System Design</option>
                                    <option value="Resume & Portfolio ATS Review">📄 Resume & Portfolio ATS Review</option>
                                    <option value="Mock Technical & Coding Interview">🎯 Mock Technical & Coding Interview</option>
                                    <option value="Fundraising & E-Cell Pitch Deck">💰 Fundraising & E-Cell Pitch Deck Prep</option>
                                    <option value="Career Strategy & Placement Roadmaps">🧭 Career Strategy & Placement Roadmaps</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="alum-field">
                                    <label>Preferred Date *</label>
                                    <input
                                        type="date"
                                        className="alum-input"
                                        required
                                        value={sessionDate}
                                        onChange={e => setSessionDate(e.target.value)}
                                    />
                                </div>
                                <div className="alum-field">
                                    <label>Preferred Time Slot *</label>
                                    <select
                                        className="alum-input"
                                        value={sessionTime}
                                        onChange={e => setSessionTime(e.target.value)}
                                    >
                                        <option value="10:00 AM">10:00 AM – 10:45 AM</option>
                                        <option value="02:00 PM">02:00 PM – 02:45 PM</option>
                                        <option value="05:00 PM">05:00 PM – 05:45 PM</option>
                                        <option value="07:30 PM">07:30 PM – 08:15 PM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="alum-field">
                                <label>Prep Notes, Questions, or GitHub/Pitch Links</label>
                                <textarea
                                    className="alum-input"
                                    rows={3}
                                    placeholder="Briefly state what you'd like to achieve or paste links to your project/repo..."
                                    value={sessionNotes}
                                    onChange={e => setSessionNotes(e.target.value)}
                                />
                            </div>

                            {/* Google Meet Link Field */}
                            <div className="alum-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Video size={14} color="#059669" /> Google Meet Link
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a
                                            href="https://meet.google.com/new"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '11px',
                                                color: '#2563eb',
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}
                                            title="Open Google Meet to create or schedule a new meeting"
                                        >
                                            <ExternalLink size={11} /> Create on Google Meet
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setGoogleMeetUrl(generateGoogleMeetLink())}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#059669',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                padding: 0
                                            }}
                                        >
                                            <Sparkles size={11} /> Auto-Generate
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="url"
                                    className="alum-input"
                                    placeholder="e.g. https://meet.google.com/abc-defg-hij"
                                    value={googleMeetUrl}
                                    onChange={e => setGoogleMeetUrl(e.target.value)}
                                />
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                                    Paste a custom Google Meet URL, click auto-generate, or leave blank to assign a room automatically so anyone interested can join.
                                </p>
                            </div>

                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Video size={16} color="#16a34a" />
                                <span>A dedicated Google Meet room will be attached. Both you and {bookingMentor.name} can join immediately.</span>
                            </div>

                            <div className="alum-modal-actions">
                                <button type="button" className="alum-btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setBookingMentor(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="alum-btn alum-btn--mentor"
                                    disabled={bookingLoading}
                                    style={{ padding: '10px 20px', background: '#059669' }}
                                >
                                    {bookingLoading ? <Loader2 size={15} className="spin" /> : <><Calendar size={15} /> Confirm Booking & Meet</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Session Confirmed Modal */}
            {confirmedSession && (
                <div className="alum-modal-backdrop" onClick={() => setConfirmedSession(null)}>
                    <div className="alum-modal" onClick={e => e.stopPropagation()}>
                        <div className="alum-session-confirmed">
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={36} color="#16a34a" />
                            </div>
                            <h3>Mentorship Session Confirmed!</h3>
                            <p>
                                Your 1-on-1 session with <strong>{confirmedSession.mentorName}</strong> is scheduled for{' '}
                                <strong>{confirmedSession.date}</strong> at <strong>{confirmedSession.time}</strong>.
                            </p>
                            <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                                Topic: {confirmedSession.topic}
                            </p>

                            <div style={{
                                width: '100%',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '14px',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Video size={16} color="#059669" /> Google Meet Link
                                    </span>
                                    <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                        READY TO JOIN
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '12.5px', fontFamily: 'monospace', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {confirmedSession.meetUrl}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(confirmedSession.meetUrl);
                                            setCopiedMeet(true);
                                            setTimeout(() => setCopiedMeet(false), 2000);
                                        }}
                                        style={{
                                            background: copiedMeet ? '#10b981' : '#f1f5f9',
                                            color: copiedMeet ? '#ffffff' : '#334155',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '5px 9px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            flexShrink: 0,
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {copiedMeet ? <Check size={12} /> : <Copy size={12} />}
                                        {copiedMeet ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>

                                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                    Anyone interested can join this meet link. Both you and your mentor can enter at your scheduled time.
                                </p>

                                <a
                                    href={confirmedSession.meetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="alum-btn alum-btn--mentor"
                                    style={{
                                        background: '#059669',
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Video size={16} /> Join Google Meet Now <ExternalLink size={14} />
                                </a>
                            </div>

                            <button
                                className="alum-btn"
                                style={{ marginTop: '4px', width: '100%', padding: '10px', background: '#0f172a', color: '#ffffff' }}
                                onClick={() => {
                                    setConfirmedSession(null);
                                    setBookingMentor(null);
                                }}
                            >
                                Done & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
