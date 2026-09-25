import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getMentorProfile, saveMentorProfile, type MentorProfile } from '../../services/academicianService';
import { Users, Loader2, Save, CheckCircle2 } from 'lucide-react';
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
                        <div style={{ maxWidth: '600px', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
                    </section>
                )}
            </div>
        </div>
    );
}
