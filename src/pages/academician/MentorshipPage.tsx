import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getMentorProfile, saveMentorProfile, type MentorProfile } from '../../services/academicianService';
import { Users, Loader2, Save, CheckCircle2, Briefcase, Plus, UserPlus } from 'lucide-react';
import './AcademicianSubPages.css';

export default function MentorshipPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<MentorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [expertise, setExpertise] = useState('');
    const [availability, setAvailability] = useState<'available' | 'limited' | 'unavailable'>('available');
    const [maxMentees, setMaxMentees] = useState(5);
    const [bio, setBio] = useState('');

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const p = await getMentorProfile(user.uid);
                if (p) {
                    setProfile(p);
                    setExpertise(p.expertise.join(', '));
                    setAvailability(p.availability);
                    setMaxMentees(p.maxMentees);
                    setBio(p.bio || '');
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaved(false);
        try {
            const data: Partial<MentorProfile> = {
                expertise: expertise.split(',').map(s => s.trim()).filter(Boolean),
                availability,
                maxMentees,
                bio,
                currentMentees: profile?.currentMentees || 0,
            };
            await saveMentorProfile(user.uid, data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Users size={28} className="acad-header-icon" />
                    <div><h1>Mentorship Profile</h1><p>Manage your availability to mentor students and junior faculty</p></div>
                </motion.header>

                {loading ? (
                    <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading profile...</p></div>
                ) : (
                    <section className="acad-section">
                        <div style={{ maxWidth: '600px', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                            <div className="acad-form-group">
                                <label>Expertise (comma separated)</label>
                                <input value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="e.g. Machine Learning, Cloud Architecture" />
                            </div>
                            <div className="acad-form-group">
                                <label>Availability</label>
                                <select 
                                    value={availability} 
                                    onChange={e => setAvailability(e.target.value as any)}
                                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', color: '#0f172a', outline: 'none', width: '100%', fontSize: '14px' }}
                                >
                                    <option value="available">Available for new mentees</option>
                                    <option value="limited">Limited availability</option>
                                    <option value="unavailable">Not accepting mentees</option>
                                </select>
                            </div>
                            <div className="acad-form-group">
                                <label>Max Mentees</label>
                                <input type="number" min="1" max="50" value={maxMentees} onChange={e => setMaxMentees(parseInt(e.target.value) || 1)} />
                            </div>
                            <div className="acad-form-group">
                                <label>Short Bio / Mentorship Style</label>
                                <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe how you help mentees..." />
                            </div>

                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem',
                                    padding: '0.75rem 1.5rem', background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                                    fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                {saving ? <Loader2 size={16} className="spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {saved ? 'Saved!' : 'Save Profile'}
                            </button>
                            {saved && (
                                <p style={{ marginTop: '12px', fontSize: '13px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={14} /> Profile saved — your mentorship availability is now visible to students on CapAble.
                                </p>
                            )}
                        </div>

                        {/* Student Project Allocation Section */}
                        <div style={{ maxWidth: '800px', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Briefcase size={20} color="#6366f1" /> Student Project Allocation
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Allocate capstone or semester projects to your assigned mentees.</p>
                                </div>
                                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                    <Plus size={16} /> Create Project
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                {[
                                    { title: 'AI-based Resume Scorer', type: 'Capstone Project', mentees: ['Rishabh (CSE)', 'Alex (IT)'], status: 'In Progress' },
                                    { title: 'Smart Campus IoT Network', type: 'Semester Project', mentees: ['Unallocated'], status: 'Open' },
                                    { title: 'Blockchain Identity Verification', type: 'Research Project', mentees: ['David (CSE)'], status: 'Under Review' },
                                ].map((proj, i) => (
                                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{proj.title}</h3>
                                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb' }}>{proj.type}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                                                Assigned to: {proj.mentees.join(', ')}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: proj.status === 'Open' ? '#10b981' : '#64748b' }}>{proj.status}</span>
                                            <button style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                                <UserPlus size={14} /> Allocate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mentee Attendance & Engagement Section */}
                        <div style={{ maxWidth: '800px', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={20} color="#10b981" /> Mentee Engagement & Attendance
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Monitor your mentees' activity and engagement on CapAble.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[
                                    { name: 'Rishabh (CSE)', attendance: '92%', lastActive: '2 hours ago', status: 'Highly Engaged', color: '#10b981' },
                                    { name: 'Alex (IT)', attendance: '78%', lastActive: 'Yesterday', status: 'Moderate', color: '#f59e0b' },
                                    { name: 'David (CSE)', attendance: '45%', lastActive: '5 days ago', status: 'At Risk', color: '#ef4444' },
                                ].map((mentee, i) => (
                                    <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{mentee.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Last active: {mentee.lastActive}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Attendance</div>
                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{mentee.attendance}</div>
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: mentee.color, background: `${mentee.color}15`, padding: '4px 10px', borderRadius: '12px' }}>
                                                {mentee.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
