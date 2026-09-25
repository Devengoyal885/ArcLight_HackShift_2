import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole } from '../../services/employerService';
import { Briefcase, MapPin, Clock, Loader2, Search, AlertCircle, DollarSign } from 'lucide-react';
import './AcademicianSubPages.css';

export default function AcademicianInternshipsPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const posted = await getAllPostedRoles();
                setOpportunities(posted.filter(r => r.type === 'internship' && r.status === 'active'));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, []);

    const filtered = opportunities.filter(opp =>
        !searchQuery.trim() ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Briefcase size={28} className="acad-header-icon" />
                    <div><h1>Faculty Internships</h1><p>Browse industry internship opportunities for faculty members</p></div>
                </motion.header>
                <div className="acad-search-bar"><Search size={16} /><input placeholder="Search internships..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

                <section className="acad-section">
                    <h2 className="acad-section-title">Available Internships</h2>
                    {loading ? (
                        <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="acad-empty"><AlertCircle size={36} /><h3>No Faculty Internships</h3><p>Faculty internship opportunities will appear here when published.</p></div>
                    ) : (
                        <div className="acad-cards-grid">
                            {filtered.map((opp, i) => (
                                <motion.div key={opp.id} className="acad-opp-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="acad-opp-header"><h3>{opp.title}</h3><span className="acad-opp-company">{opp.companyName}</span></div>
                                    <p className="acad-opp-desc">{opp.description?.slice(0, 200) || 'No description.'}</p>
                                    <div className="acad-opp-meta">
                                        {opp.location && <span><MapPin size={13} /> {opp.location}</span>}
                                        {opp.duration && <span><Clock size={13} /> {opp.duration}</span>}
                                        {opp.stipend && <span><DollarSign size={13} /> {opp.stipend}</span>}
                                    </div>
                                    {opp.tags.length > 0 && <div className="acad-opp-tags">{opp.tags.slice(0, 4).map(t => <span key={t} className="acad-tag">{t}</span>)}</div>}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
