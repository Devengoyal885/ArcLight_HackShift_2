import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getFacultyProfile, saveFacultyProfile, type FacultyProfile } from '../../services/academicianService';
import { GraduationCap, Loader2, Save, CheckCircle2 } from 'lucide-react';
import './AcademicianSubPages.css';

export default function AcademicianProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<FacultyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');
    const [expertise, setExpertise] = useState('');
    const [researchAreas, setResearchAreas] = useState('');
    const [publications, setPublications] = useState<number>(0);
    const [hIndex, setHIndex] = useState<number>(0);
    const [citations, setCitations] = useState<number>(0);
    const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [googleScholarUrl, setGoogleScholarUrl] = useState('');

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const p = await getFacultyProfile(user.uid);
                if (p) {
                    setProfile(p);
                    setName(p.name || user.displayName || '');
                    setInstitution(p.institution || '');
                    setDepartment(p.department || '');
                    setDesignation(p.designation || '');
                    setExpertise(p.expertise?.join(', ') || '');
                    setResearchAreas(p.researchAreas?.join(', ') || '');
                    setPublications(p.publications || 0);
                    setHIndex((p as any).hIndex || 0);
                    setCitations((p as any).citations || 0);
                    setYearsOfExperience(p.yearsOfExperience || 0);
                    setLinkedinUrl(p.linkedinUrl || '');
                    setGoogleScholarUrl(p.googleScholarUrl || '');
                } else {
                    setName(user.displayName || '');
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaved(false);
        try {
            const data: Partial<FacultyProfile> = {
                name,
                institution,
                department,
                designation,
                expertise: expertise.split(',').map(s => s.trim()).filter(Boolean),
                researchAreas: researchAreas.split(',').map(s => s.trim()).filter(Boolean),
                publications,
                hIndex,
                citations,
                yearsOfExperience,
                linkedinUrl,
                googleScholarUrl,
                availableForMentorship: profile?.availableForMentorship || false,
                availableForConsultancy: profile?.availableForConsultancy || false,
            };
            await saveFacultyProfile(user.uid, data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <GraduationCap size={28} className="acad-header-icon" />
                    <div><h1>Faculty Profile</h1><p>Manage your academic identity, expertise, and research areas</p></div>
                </motion.header>

                {loading ? (
                    <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading profile...</p></div>
                ) : (
                    <section className="acad-section">
                        <div style={{ maxWidth: '600px', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="acad-form-group">
                                <label>Full Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="acad-form-group">
                                <label>Institution / University</label>
                                <input value={institution} onChange={e => setInstitution(e.target.value)} />
                            </div>
                            <div className="acad-form-group">
                                <label>Department</label>
                                <input value={department} onChange={e => setDepartment(e.target.value)} />
                            </div>
                            <div className="acad-form-group">
                                <label>Designation</label>
                                <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Assistant Professor, HOD" />
                            </div>
                            <div className="acad-form-group">
                                <label>Teaching Expertise (comma separated)</label>
                                <textarea rows={2} value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="e.g. Data Structures, Operating Systems" />
                            </div>
                            <div className="acad-form-group">
                                <label>Research Areas (comma separated)</label>
                                <textarea rows={2} value={researchAreas} onChange={e => setResearchAreas(e.target.value)} placeholder="e.g. Quantum Computing, Network Security" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="acad-form-group">
                                    <label>Years of Experience</label>
                                    <input type="number" min="0" value={yearsOfExperience} onChange={e => setYearsOfExperience(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="acad-form-group">
                                    <label>Number of Publications</label>
                                    <input type="number" min="0" value={publications} onChange={e => setPublications(parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                                <div className="acad-form-group">
                                    <label>h-index (Google Scholar)</label>
                                    <input type="number" min="0" value={hIndex} onChange={e => setHIndex(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="acad-form-group">
                                    <label>Total Citations</label>
                                    <input type="number" min="0" value={citations} onChange={e => setCitations(parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div className="acad-form-group">
                                <label>Google Scholar URL</label>
                                <input value={googleScholarUrl} onChange={e => setGoogleScholarUrl(e.target.value)} />
                            </div>
                            <div className="acad-form-group">
                                <label>LinkedIn URL</label>
                                <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                            </div>

                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem',
                                    padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                                    fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? <Loader2 size={16} className="spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {saved ? 'Saved!' : 'Save Profile'}
                            </button>
                        </div>

                        {/* Faculty Awards Nomination Section */}
                        <div style={{ maxWidth: '600px', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Faculty Awards Nomination</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Apply or nominate peers for institutional and national excellence awards.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[
                                    { title: 'Best Researcher Award 2026', org: 'AICTE', status: 'Open', deadline: 'Oct 30' },
                                    { title: 'Excellence in Teaching', org: 'University Grants Commission', status: 'Nominated', deadline: 'Nov 15' },
                                ].map((award, i) => (
                                    <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{award.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{award.org} • Deadline: {award.deadline}</div>
                                        </div>
                                        <div>
                                            {award.status === 'Open' ? (
                                                <button style={{ background: '#2563eb', border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Apply</button>
                                            ) : (
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>{award.status}</span>
                                            )}
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
