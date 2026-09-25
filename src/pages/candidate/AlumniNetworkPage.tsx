/**
 * Alumni Network Page
 * Placed alumni from the same institution are surfaced here with
 * opt-in mentorship request capability.
 *
 * Firestore: users/{uid} where role==='candidate' && isPlaced===true
 *            mentorshipRequests/{uid}/requests/{fromUid}
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    collection, query, where, getDocs, addDoc, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    Users, GraduationCap, Briefcase, MapPin, Link2, MessageCircle,
    Search, Filter, Loader2, Star, CheckCircle2, Building2,
} from 'lucide-react';
import './AlumniNetworkPage.css';

interface AlumniProfile {
    uid: string;
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
}

export default function AlumniNetworkPage() {
    const { dbUid, profile } = useAuth();

    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('All');
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [tab, setTab] = useState<'all' | 'mentors'>('all');

    const instCode = profile?.institutionCode || '';

    useEffect(() => {
        if (!instCode) { setLoading(false); return; }
        const q = query(
            collection(db, 'users'),
            where('institutionCode', '==', instCode),
            where('isPlaced', '==', true),
            limit(60),
        );
        getDocs(q).then(snap => {
            setAlumni(snap.docs
                .map(d => ({ uid: d.id, ...d.data() } as AlumniProfile))
                .filter(a => a.uid !== dbUid)
            );
        }).finally(() => setLoading(false));
    }, [instCode, dbUid]);

    const handleMentorRequest = async (alumniUid: string, alumniName: string) => {
        if (!dbUid || sendingTo) return;
        setSendingTo(alumniUid);
        try {
            await addDoc(collection(db, 'mentorshipRequests', alumniUid, 'requests'), {
                fromUid: dbUid,
                fromName: profile?.name || '',
                fromEmail: profile?.email || '',
                message: `Hi ${alumniName}, I'm a ${(profile as any)?.branch || ''} student and would love to connect with you for mentorship guidance on my career in your domain.`,
                sentAt: serverTimestamp(),
                status: 'pending',
            });
            setSentRequests(prev => new Set([...prev, alumniUid]));
        } finally {
            setSendingTo(null);
        }
    };

    const branches = ['All', ...Array.from(new Set(alumni.map(a => a.branch).filter(Boolean)))];

    const filtered = alumni
        .filter(a => tab === 'mentors' ? a.mentorAvailable : true)
        .filter(a => !filterBranch || filterBranch === 'All' || a.branch === filterBranch)
        .filter(a => !search.trim() || [a.name, a.company, a.role, a.headline].some(
            f => f?.toLowerCase().includes(search.toLowerCase())
        ));

    return (
        <div className="alum-page">
            <FloatingNavbar variant="candidate" />
            <div className="alum-content">
                <motion.header className="alum-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1>Alumni Network</h1>
                        <p>Connect with placed alumni from your institution — get mentorship & career advice</p>
                    </div>
                    <div className="alum-stat">
                        <Users size={16} /> {alumni.length} placed alumni
                    </div>
                </motion.header>

                {/* Tabs + Filters */}
                <div className="alum-controls">
                    <div className="alum-tabs">
                        <button className={`alum-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Alumni</button>
                        <button className={`alum-tab ${tab === 'mentors' ? 'active' : ''}`} onClick={() => setTab('mentors')}>
                            <Star size={13} /> Open to Mentor
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
                ) : !instCode ? (
                    <div className="alum-empty">
                        <Building2 size={48} color="#e2e8f0" />
                        <p>No institution linked. Ask your placement cell to invite you.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="alum-empty">
                        <GraduationCap size={48} color="#e2e8f0" />
                        <p>{search ? 'No alumni match your search.' : 'No placed alumni found yet. Check back later!'}</p>
                    </div>
                ) : (
                    <div className="alum-grid">
                        {filtered.map((alum, i) => (
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

                                <div className="alum-avatar">
                                    {alum.photoURL
                                        ? <img src={alum.photoURL} alt={alum.name} />
                                        : <span>{alum.name.charAt(0)}</span>
                                    }
                                </div>

                                <h3 className="alum-name">{alum.name}</h3>

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
                                    {alum.linkedin && (
                                        <a href={`https://linkedin.com/in/${alum.linkedin}`} target="_blank" rel="noopener noreferrer" className="alum-btn alum-btn--linkedin">
                                            <Briefcase size={13} /> Connect
                                        </a>
                                    )}
                                    {alum.mentorAvailable && (
                                        <button
                                            className={`alum-btn alum-btn--mentor ${sentRequests.has(alum.uid) ? 'sent' : ''}`}
                                            onClick={() => !sentRequests.has(alum.uid) && handleMentorRequest(alum.uid, alum.name)}
                                            disabled={!!sendingTo || sentRequests.has(alum.uid)}
                                        >
                                            {sendingTo === alum.uid
                                                ? <Loader2 size={13} className="spin" />
                                                : sentRequests.has(alum.uid)
                                                ? <><CheckCircle2 size={13} /> Requested</>
                                                : <><MessageCircle size={13} /> Ask for Mentorship</>
                                            }
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
