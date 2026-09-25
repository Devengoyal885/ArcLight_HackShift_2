import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole } from '../../services/employerService';
import { getConsultancyProposals, submitConsultancyProposal, type ConsultancyProposal } from '../../services/academicianService';
import { Briefcase, MapPin, Clock, Loader2, Search, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import './AcademicianSubPages.css';

export default function ConsultancyPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [proposals, setProposals] = useState<ConsultancyProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const posted = await getAllPostedRoles();
                // Consultancy type doesn't exist yet in PostingType, so filter by tags or use 'training' type for now
                const consultancyPosts = posted.filter(r =>
                    (r.type === 'training' && (r.title.toLowerCase().includes('consult') || r.tags.some(t => t.toLowerCase().includes('consult')))) ||
                    r.status === 'active'
                );
                setOpportunities(consultancyPosts.filter(r => r.status === 'active'));
                if (user) setProposals(await getConsultancyProposals(user.uid));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [user]);

    const proposedRoleIds = new Set(proposals.map(p => p.roleId));

    const filtered = opportunities.filter(opp =>
        !searchQuery.trim() ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePropose = async (role: PostedRole) => {
        if (!user || !role.id) return;
        setSubmitting(role.id);
        try {
            await submitConsultancyProposal(user.uid, {
                roleId: role.id, projectTitle: role.title, companyName: role.companyName, status: 'interested',
            });
            setProposals(prev => [...prev, { roleId: role.id!, projectTitle: role.title, companyName: role.companyName, status: 'interested' }]);
        } catch (e) { console.error(e); } finally { setSubmitting(null); }
    };

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Briefcase size={28} className="acad-header-icon" />
                    <div><h1>Consultancy Marketplace</h1><p>Discover consultancy opportunities from industry partners</p></div>
                </motion.header>
                <div className="acad-search-bar"><Search size={16} /><input placeholder="Search consultancy opportunities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

                {proposals.length > 0 && (
                    <section className="acad-section">
                        <h2 className="acad-section-title">My Proposals</h2>
                        <div className="acad-reg-list">
                            {proposals.map((p, i) => (
                                <div key={p.id || i} className="acad-reg-card">
                                    <div className="acad-reg-info"><span className="acad-reg-title">{p.projectTitle}</span><span className="acad-reg-provider">{p.companyName}</span></div>
                                    <span className={`acad-status acad-status--${p.status}`}>{p.status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="acad-section">
                    <h2 className="acad-section-title">Available Opportunities</h2>
                    {loading ? (
                        <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="acad-empty"><AlertCircle size={36} /><h3>No Consultancy Opportunities</h3><p>Consultancy requirements will appear here when published by industry partners.</p></div>
                    ) : (
                        <div className="acad-cards-grid">
                            {filtered.map((opp, i) => (
                                <motion.div key={opp.id} className="acad-opp-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="acad-opp-header"><h3>{opp.title}</h3><span className="acad-opp-company">{opp.companyName}</span></div>
                                    <p className="acad-opp-desc">{opp.description?.slice(0, 200) || 'No description.'}</p>
                                    <div className="acad-opp-meta">{opp.location && <span><MapPin size={13} /> {opp.location}</span>}{opp.duration && <span><Clock size={13} /> {opp.duration}</span>}</div>
                                    {opp.tags.length > 0 && <div className="acad-opp-tags">{opp.tags.slice(0, 4).map(t => <span key={t} className="acad-tag">{t}</span>)}</div>}
                                    <div className="acad-opp-actions">
                                        {proposedRoleIds.has(opp.id!) ? (
                                            <span className="acad-btn-registered"><CheckCircle2 size={14} /> Interest Submitted</span>
                                        ) : (
                                            <button className="acad-btn-express" onClick={() => handlePropose(opp)} disabled={submitting === opp.id}>
                                                {submitting === opp.id ? <Loader2 size={14} className="spin" /> : <FileText size={14} />} Express Interest
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
