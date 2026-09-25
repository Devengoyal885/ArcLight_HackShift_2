import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getInstitutionCandidates,
    getInstitutionFaculty,
    getStudentRecord,
    type StudentRecord,
} from '../../services/institutionService';
import type { UserProfile } from '../../services/profileService';
import {
    Users, GraduationCap, Search, Loader2, AlertCircle,
    ChevronDown, ChevronUp, ExternalLink, BookOpen, Briefcase, Award, Download,
    Upload, UserPlus, CheckCircle2, X,
} from 'lucide-react';
import { parseInviteCSV, bulkCreateInvites, type PendingInvite } from '../../services/inviteService';
import './InstitutionSubPages.css';

type PeopleTab = 'students' | 'faculty';

export default function StudentsPage() {
    const { user, profile: adminProfile } = useAuth();
    const [peopleTab, setPeopleTab] = useState<PeopleTab>('students');
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [faculty, setFaculty] = useState<UserProfile[]>([]);
    const [records, setRecords] = useState<Record<string, StudentRecord>>({});
    const [loading, setLoading] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    // Bulk invite state
    const [showInvitePanel, setShowInvitePanel] = useState(false);
    const [inviteRows, setInviteRows] = useState<Omit<PendingInvite, 'institutionCode' | 'institutionName' | 'status' | 'invitedAt'>[]>([]);
    const [inviting, setInviting] = useState(false);
    const [inviteResult, setInviteResult] = useState<{ success: number; skipped: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const institutionCode = adminProfile?.institutionCode || '';
    const institutionName = (adminProfile as any)?.institutionName || '';

    useEffect(() => {
        setLoading(true);
        Promise.all([
            institutionCode
                ? getInstitutionCandidates(institutionCode)
                : import('../../services/institutionService').then(m => m.getAllStudents()),
            institutionCode
                ? getInstitutionFaculty(institutionCode)
                : import('../../services/institutionService').then(m => m.getAllFaculty()),
        ])
            .then(([s, f]) => { setStudents(s); setFaculty(f as UserProfile[]); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [institutionCode]);

    const currentList = peopleTab === 'students' ? students : faculty;

    const filtered = currentList.filter(s =>
        !search.trim() ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.headline?.toLowerCase().includes(search.toLowerCase())
    );

    const toggleExpand = async (uid: string, profile: UserProfile) => {
        if (expanded === uid) { setExpanded(null); return; }
        setExpanded(uid);
        if (!records[uid]) {
            setLoadingRecords(true);
            try {
                const rec = await getStudentRecord(uid, profile);
                setRecords(prev => ({ ...prev, [uid]: rec }));
            } finally {
                setLoadingRecords(false);
            }
        }
    };

    const exportStudentsCSV = () => {
        const header = ['Name', 'Email', 'Department', 'Skills Count', 'Top Skills', 'Applications'];
        const rows = filtered.map(s => {
            const rec = records[s.uid];
            return [
                s.name || '',
                s.email || '',
                (s as any).department || '',
                rec ? rec.capabilityCount : '',
                rec ? rec.topSkills.join(' | ') : '',
                rec ? rec.applicationCount : '',
            ];
        });
        const csvContent = [header, ...rows]
            .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `capable_students_${institutionCode}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const text = ev.target?.result as string;
            const parsed = parseInviteCSV(text);
            setInviteRows(parsed);
            setInviteResult(null);
        };
        reader.readAsText(file);
    };

    const handleSendInvites = async () => {
        if (!inviteRows.length || !institutionCode) return;
        setInviting(true);
        try {
            const result = await bulkCreateInvites(institutionCode, institutionName, inviteRows);
            setInviteResult(result);
            setInviteRows([]);
        } catch (err) {
            console.error(err);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Users size={28} className="inst-header-icon" />
                    <div>
                        <h1>People Directory</h1>
                        <p>Students and faculty registered under your institution</p>
                    </div>
                    <button
                        onClick={() => { setShowInvitePanel(p => !p); setInviteResult(null); setInviteRows([]); }}
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px',
                            padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <UserPlus size={16} /> Bulk Invite Students
                    </button>
                </motion.header>

                {/* ── Bulk Invite Panel ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {showInvitePanel && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            style={{
                                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px',
                                padding: '24px', marginBottom: '24px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Bulk Student Invite via CSV</h3>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                                        Upload a CSV with columns: <code>email, name, department, batch, rollno</code>
                                    </p>
                                </div>
                                <button onClick={() => setShowInvitePanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {inviteResult ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                                    <CheckCircle2 size={24} color="#10b981" />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#065f46' }}>Invites sent successfully!</div>
                                        <div style={{ fontSize: '13px', color: '#047857' }}>
                                            {inviteResult.success} new invites created. {inviteResult.skipped} skipped (already invited).
                                            Students who sign up with their email will auto-join your institution.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            style={{ display: 'none' }}
                                            onChange={handleCSVUpload}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                background: 'white', border: '1.5px dashed #cbd5e1', borderRadius: '10px',
                                                padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#334155',
                                            }}
                                        >
                                            <Upload size={16} /> Choose CSV File
                                        </button>
                                        <a
                                            href="data:text/csv;charset=utf-8,email,name,department,batch,rollno%0Astudent@college.edu,Student Name,Computer Science,2025,CS001"
                                            download="capable_invite_template.csv"
                                            style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline' }}
                                        >
                                            Download template
                                        </a>
                                    </div>

                                    {inviteRows.length > 0 && (
                                        <>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                                                Preview: <strong>{inviteRows.length} students</strong> found in CSV
                                            </div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f1f5f9' }}>
                                                            {['Email', 'Name', 'Dept', 'Batch', 'Roll No'].map(h => (
                                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {inviteRows.slice(0, 10).map((row, i) => (
                                                            <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '7px 12px', color: '#0f172a' }}>{row.email}</td>
                                                                <td style={{ padding: '7px 12px', color: '#334155' }}>{row.name || '—'}</td>
                                                                <td style={{ padding: '7px 12px', color: '#334155' }}>{row.department || '—'}</td>
                                                                <td style={{ padding: '7px 12px', color: '#334155' }}>{row.batch || '—'}</td>
                                                                <td style={{ padding: '7px 12px', color: '#334155' }}>{row.rollNo || '—'}</td>
                                                            </tr>
                                                        ))}
                                                        {inviteRows.length > 10 && (
                                                            <tr><td colSpan={5} style={{ padding: '8px 12px', color: '#94a3b8', textAlign: 'center' }}>
                                                                +{inviteRows.length - 10} more rows...
                                                            </td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <button
                                                onClick={handleSendInvites}
                                                disabled={inviting || !institutionCode}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    background: '#2563eb', color: 'white', border: 'none',
                                                    borderRadius: '10px', padding: '11px 24px', fontSize: '14px',
                                                    fontWeight: 600, cursor: inviting ? 'not-allowed' : 'pointer',
                                                    opacity: inviting ? 0.7 : 1,
                                                }}
                                            >
                                                {inviting ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
                                                {inviting ? 'Creating invites...' : `Send ${inviteRows.length} Invites`}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sub-tabs: Students | Faculty */}
                <div className="inst-subtabs">
                    <button
                        className={`inst-subtab ${peopleTab === 'students' ? 'active' : ''}`}
                        onClick={() => { setPeopleTab('students'); setExpanded(null); setSearch(''); }}
                    >
                        <Users size={14} /> Students ({students.length})
                    </button>
                    <button
                        className={`inst-subtab ${peopleTab === 'faculty' ? 'active' : ''}`}
                        onClick={() => { setPeopleTab('faculty'); setExpanded(null); setSearch(''); }}
                    >
                        <GraduationCap size={14} /> Faculty ({faculty.length})
                    </button>
                </div>

                {/* Search + Export */}
                <div className="inst-toolbar">
                    <div className="inst-search-bar">
                        <Search size={15} />
                        <input
                            placeholder={`Search ${peopleTab === 'students' ? 'students' : 'faculty'} by name, email or headline…`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {peopleTab === 'students' && filtered.length > 0 && (
                        <button
                            onClick={exportStudentsCSV}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#0f172a', color: 'white',
                                border: 'none', borderRadius: '8px',
                                padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                            title="Export student directory as CSV for NAAC/NIRF reporting"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="inst-loading"><Loader2 size={32} className="spin" /><p>Loading directory...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="inst-empty">
                        <AlertCircle size={32} />
                        <h3>No {peopleTab === 'students' ? 'Students' : 'Faculty'} Found</h3>
                        <p>
                            {institutionCode
                                ? `No ${peopleTab} are linked to institution code "${institutionCode}" yet.`
                                : `No ${peopleTab} have registered on the platform yet.`}
                        </p>
                    </div>
                ) : (
                    <div className="inst-table-container">
                        <table className="inst-table">
                            <thead>
                                <tr>
                                    <th>Person</th>
                                    <th>{peopleTab === 'students' ? 'Skills' : 'Department'}</th>
                                    <th>{peopleTab === 'students' ? 'Progress' : 'Mentorship'}</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((person, i) => {
                                    const uid = person.uid || '';
                                    const rec = records[uid];
                                    const isExpanded = expanded === uid;
                                    const initials = person.name?.charAt(0).toUpperCase() || '?';

                                    return (
                                        <>
                                            <motion.tr
                                                key={uid}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleExpand(uid, person)}
                                            >
                                                <td>
                                                    <div className="inst-student-cell">
                                                        {person.avatar ? (
                                                            <img src={person.avatar} alt={person.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="inst-avatar" style={peopleTab === 'faculty' ? { background: 'linear-gradient(135deg, #7c3aed, #a855f7)' } : {}}>
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="inst-name">{person.name}</div>
                                                            <div className="inst-email">{person.email || person.headline}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {peopleTab === 'students' ? (
                                                        <div className="inst-skill-tags">
                                                            {(person.capabilities?.slice(0, 3) || []).map((c: any) => (
                                                                <span key={c.skill} className="inst-skill-tag">{c.skill}</span>
                                                            ))}
                                                            {!person.capabilities?.length && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No skills yet</span>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>{(person as any).department || 'Not specified'}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {peopleTab === 'students' ? (
                                                        <div>
                                                            <div className="inst-progress-bar">
                                                                <div
                                                                    className="inst-progress-fill"
                                                                    style={{ width: `${person.profileComplete ? 100 : 35}%` }}
                                                                />
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                {person.profileComplete ? 'Profile complete' : 'In progress'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className={`inst-badge inst-badge--${(person as any).mentorshipStatus === 'available' ? 'Placed' : 'Screening'}`}>
                                                            {(person as any).mentorshipStatus || 'Not set'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`inst-badge inst-badge--${person.profileComplete ? 'complete' : 'onboarding'}`}>
                                                        {person.profileComplete ? 'Active' : 'Onboarding'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <Link
                                                            to={`/profile/${uid}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inst-view-btn"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={12} /> Profile
                                                        </Link>
                                                        <button className="inst-view-btn" onClick={e => { e.stopPropagation(); toggleExpand(uid, person); }}>
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>

                                            {/* Expanded record row */}
                                            {isExpanded && (
                                                <tr key={`${uid}-expand`}>
                                                    <td colSpan={5} style={{ padding: 0, background: '#f8fafc' }}>
                                                        <AnimatePresence>
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                style={{ overflow: 'hidden' }}
                                                            >
                                                                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                                                    {loadingRecords && !rec ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.82rem' }}>
                                                                            <Loader2 size={16} className="spin" /> Loading record...
                                                                        </div>
                                                                    ) : rec ? (
                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                                                                            {/* Capabilities */}
                                                                            <div>
                                                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 0.75rem' }}>
                                                                                    <Award size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                                                    Top Capabilities ({rec.capabilityCount} total)
                                                                                </p>
                                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                                    {rec.topSkills.length > 0 ? rec.topSkills.map(s => (
                                                                                        <span key={s} className="inst-skill-tag">{s}</span>
                                                                                    )) : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No verified skills yet</span>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Learning */}
                                                                            <div>
                                                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 0.75rem' }}>
                                                                                    <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                                                    Learning Activity
                                                                                </p>
                                                                                <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                                                                                    <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#2563eb' }}>{rec.learningCount}</div>
                                                                                    <div style={{ color: '#64748b' }}>Active Learning Paths</div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Applications */}
                                                                            <div>
                                                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 0.75rem' }}>
                                                                                    <Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                                                    Placement Activity
                                                                                </p>
                                                                                <div>
                                                                                    <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#10b981' }}>{rec.applicationCount}</div>
                                                                                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Job Applications</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No detailed records available.</span>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
