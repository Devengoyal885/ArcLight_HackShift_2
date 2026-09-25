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

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <FlaskConical size={28} className="acad-header-icon" />
                    <div><h1>Research Collaboration</h1><p>Discover industry research projects and express interest</p></div>
                </motion.header>
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
            </div>
        </div>
    );
}
