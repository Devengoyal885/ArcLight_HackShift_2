import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole } from '../../services/employerService';
import { getResearchInterests, expressResearchInterest, type ResearchInterest } from '../../services/academicianService';
import { FlaskConical, MapPin, Clock, Loader2, Search, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import './AcademicianSubPages.css';

export default function ResearchPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [interests, setInterests] = useState<ResearchInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [posted, ints] = await Promise.all([
                    getAllPostedRoles(),
                    user ? getResearchInterests(user.uid) : Promise.resolve([]),
                ]);
                setOpportunities(posted.filter(r => r.type === 'research' && r.status === 'active'));
                setInterests(ints);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [user]);

    const interestedRoleIds = new Set(interests.map(r => r.roleId));

    const filtered = opportunities.filter(opp =>
        !searchQuery.trim() ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExpress = async (role: PostedRole) => {
        if (!user || !role.id) return;
        setSubmitting(role.id);
        try {
            await expressResearchInterest(user.uid, {
                roleId: role.id, projectTitle: role.title, companyName: role.companyName, status: 'interested',
            });
            setInterests(prev => [...prev, { roleId: role.id!, projectTitle: role.title, companyName: role.companyName, status: 'interested' }]);
        } catch (e) { console.error(e); } finally { setSubmitting(null); }
    };

    const [activeTab, setActiveTab] = useState<'projects' | 'grants' | 'coauthors' | 'journals'>('projects');

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <FlaskConical size={28} className="acad-header-icon" />
                    <div>
                        <h1>Research & Collaboration</h1>
                        <p>Discover projects, funding, co-authors, and track submissions</p>
                    </div>
                </motion.header>

                <div className="acad-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-slate-800)', paddingBottom: '12px' }}>
                    <button className={`acad-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')} style={{ background: activeTab === 'projects' ? 'var(--color-slate-800)' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Industry Projects</button>
                    <button className={`acad-tab ${activeTab === 'grants' ? 'active' : ''}`} onClick={() => setActiveTab('grants')} style={{ background: activeTab === 'grants' ? 'var(--color-slate-800)' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Grants & Funding</button>
                    <button className={`acad-tab ${activeTab === 'coauthors' ? 'active' : ''}`} onClick={() => setActiveTab('coauthors')} style={{ background: activeTab === 'coauthors' ? 'var(--color-slate-800)' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Co-Author Discovery</button>
                    <button className={`acad-tab ${activeTab === 'journals' ? 'active' : ''}`} onClick={() => setActiveTab('journals')} style={{ background: activeTab === 'journals' ? 'var(--color-slate-800)' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Journal Tracker</button>
                </div>

                {activeTab === 'projects' && (
                    <>
                        <div className="acad-search-bar"><Search size={16} /><input placeholder="Search research projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

                        {interests.length > 0 && (
                            <section className="acad-section">
                                <h2 className="acad-section-title">My Interests</h2>
                                <div className="acad-reg-list">
                                    {interests.map((int, i) => (
                                        <div key={int.id || i} className="acad-reg-card">
                                            <div className="acad-reg-info"><span className="acad-reg-title">{int.projectTitle}</span><span className="acad-reg-provider">{int.companyName}</span></div>
                                            <span className={`acad-status acad-status--${int.status}`}>{int.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="acad-section">
                            <h2 className="acad-section-title">Open Research Projects</h2>
                            {loading ? (
                                <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading...</p></div>
                            ) : filtered.length === 0 ? (
                                <div className="acad-empty"><AlertCircle size={36} /><h3>No Research Projects</h3><p>Research collaboration opportunities will appear here when published by industry partners.</p></div>
                            ) : (
                                <div className="acad-cards-grid">
                                    {filtered.map((opp, i) => (
                                        <motion.div key={opp.id} className="acad-opp-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <div className="acad-opp-header"><h3>{opp.title}</h3><span className="acad-opp-company">{opp.companyName}</span></div>
                                            <p className="acad-opp-desc">{opp.description?.slice(0, 200) || 'No description.'}</p>
                                            <div className="acad-opp-meta">{opp.location && <span><MapPin size={13} /> {opp.location}</span>}{opp.duration && <span><Clock size={13} /> {opp.duration}</span>}</div>
                                            {opp.tags.length > 0 && <div className="acad-opp-tags">{opp.tags.slice(0, 4).map(t => <span key={t} className="acad-tag">{t}</span>)}</div>}
                                            <div className="acad-opp-actions">
                                                {interestedRoleIds.has(opp.id!) ? (
                                                    <span className="acad-btn-registered"><CheckCircle2 size={14} /> Interest Expressed</span>
                                                ) : (
                                                    <button className="acad-btn-express" onClick={() => handleExpress(opp)} disabled={submitting === opp.id}>
                                                        {submitting === opp.id ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Express Interest
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'grants' && (
                    <section className="acad-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="acad-section-title">Grants & Funding Opportunities</h2>
                        </div>
                        <div className="acad-cards-grid">
                            {[
                                { title: 'AI in Healthcare Seed Grant', agency: 'National Science Foundation', amount: '$50,000', deadline: 'Oct 15, 2026' },
                                { title: 'Sustainable Energy Research Fund', agency: 'Dept of Energy', amount: '$120,000', deadline: 'Nov 01, 2026' }
                            ].map((g, i) => (
                                <div key={i} className="acad-opp-card" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="acad-opp-header"><h3>{g.title}</h3><span className="acad-opp-company">{g.agency}</span></div>
                                    <div className="acad-opp-meta" style={{ marginTop: '12px' }}>
                                        <span><CheckCircle2 size={13} /> {g.amount}</span>
                                        <span><Clock size={13} /> Due {g.deadline}</span>
                                    </div>
                                    <div className="acad-opp-actions"><button className="acad-btn-express">View Details</button></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'coauthors' && (
                    <section className="acad-section">
                        <h2 className="acad-section-title">Co-Author Discovery</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Find researchers with complementary skills and overlapping interests across the CapAble network.</p>
                        <div className="acad-cards-grid">
                            {[
                                { name: 'Dr. Sarah Jenkins', dept: 'Computer Science', interests: 'Machine Learning, NLP', hindex: 14 },
                                { name: 'Prof. Amit Patel', dept: 'Electrical Engineering', interests: 'IoT, Signal Processing', hindex: 22 }
                            ].map((a, i) => (
                                <div key={i} className="acad-opp-card" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="acad-opp-header"><h3>{a.name}</h3><span className="acad-opp-company">{a.dept}</span></div>
                                    <p className="acad-opp-desc">Interests: {a.interests}</p>
                                    <div className="acad-opp-meta" style={{ marginTop: '12px' }}>
                                        <span style={{ color: '#3b82f6' }}>h-index: {a.hindex}</span>
                                    </div>
                                    <div className="acad-opp-actions"><button className="acad-btn-express">Connect</button></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'journals' && (
                    <section className="acad-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="acad-section-title">Journal Submission Tracker</h2>
                            <button className="acad-btn-express" style={{ width: 'auto' }}>+ Add Submission</button>
                        </div>
                        <div className="acad-reg-list">
                            {[
                                { paper: 'Optimizing Deep Neural Networks for Edge Devices', journal: 'IEEE Transactions on Neural Networks', status: 'Under Review', date: 'Sept 10, 2026' },
                                { paper: 'A Survey of Quantum Cryptography Protocols', journal: 'ACM Computing Surveys', status: 'Accepted', date: 'Aug 22, 2026' }
                            ].map((s, i) => (
                                <div key={i} className="acad-reg-card">
                                    <div className="acad-reg-info">
                                        <span className="acad-reg-title">{s.paper}</span>
                                        <span className="acad-reg-provider">{s.journal} • Submitted {s.date}</span>
                                    </div>
                                    <span className={`acad-status acad-status--${s.status === 'Accepted' ? 'approved' : 'pending'}`}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
