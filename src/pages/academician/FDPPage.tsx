import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole } from '../../services/employerService';
import { getFDPRegistrations, registerForFDP, type FDPRegistration } from '../../services/academicianService';
import {
    GraduationCap, MapPin, Calendar, ExternalLink, Loader2,
    Search, CheckCircle2, Clock, AlertCircle, BookOpen,
} from 'lucide-react';
import './AcademicianSubPages.css';

export default function FDPPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [registrations, setRegistrations] = useState<FDPRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [registering, setRegistering] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [posted, regs] = await Promise.all([
                    getAllPostedRoles(),
                    user ? getFDPRegistrations(user.uid) : Promise.resolve([]),
                ]);
                setOpportunities(posted.filter(r => r.type === 'fdp' && r.status === 'active'));
                setRegistrations(regs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const registeredRoleIds = new Set(registrations.map(r => r.roleId));

    const filtered = opportunities.filter(opp =>
        !searchQuery.trim() ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleRegister = async (role: PostedRole) => {
        if (!user || !role.id) return;
        setRegistering(role.id);
        try {
            await registerForFDP(user.uid, {
                roleId: role.id,
                roleTitle: role.title,
                provider: role.companyName,
                status: 'registered',
            });
            setRegistrations(prev => [...prev, { roleId: role.id!, roleTitle: role.title, provider: role.companyName, status: 'registered' }]);
        } catch (e) {
            console.error(e);
        } finally {
            setRegistering(null);
        }
    };

    return (
        <div className="acad-subpage">
            <FloatingNavbar variant="academician" />
            <div className="acad-content">
                <motion.header className="acad-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <GraduationCap size={28} className="acad-header-icon" />
                    <div>
                        <h1>Faculty Development Programs</h1>
                        <p>Discover and register for FDPs published by industry partners</p>
                    </div>
                </motion.header>

                <div className="acad-search-bar">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search FDPs by title, provider, or topic..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* My Registrations */}
                {registrations.length > 0 && (
                    <section className="acad-section">
                        <h2 className="acad-section-title">My Registrations</h2>
                        <div className="acad-reg-list">
                            {registrations.map((reg, i) => (
                                <motion.div key={reg.id || i} className="acad-reg-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="acad-reg-info">
                                        <span className="acad-reg-title">{reg.roleTitle}</span>
                                        <span className="acad-reg-provider">{reg.provider}</span>
                                    </div>
                                    <span className={`acad-status acad-status--${reg.status}`}>{reg.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Available FDPs */}
                <section className="acad-section">
                    <h2 className="acad-section-title">Available Programs</h2>
                    {loading ? (
                        <div className="acad-loading"><Loader2 size={28} className="spin" /><p>Loading FDPs...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="acad-empty">
                            <AlertCircle size={36} />
                            <h3>No FDPs Available</h3>
                            <p>New faculty development programs will appear here when published by industry partners.</p>
                        </div>
                    ) : (
                        <div className="acad-cards-grid">
                            {filtered.map((opp, i) => (
                                <motion.div
                                    key={opp.id}
                                    className="acad-opp-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="acad-opp-header">
                                        <h3>{opp.title}</h3>
                                        <span className="acad-opp-company">{opp.companyName}</span>
                                    </div>
                                    <p className="acad-opp-desc">{opp.description?.slice(0, 200) || 'No description provided.'}</p>
                                    <div className="acad-opp-meta">
                                        {opp.location && <span><MapPin size={13} /> {opp.location}</span>}
                                        {opp.duration && <span><Clock size={13} /> {opp.duration}</span>}
                                    </div>
                                    {opp.tags.length > 0 && (
                                        <div className="acad-opp-tags">
                                            {opp.tags.slice(0, 4).map(t => <span key={t} className="acad-tag">{t}</span>)}
                                        </div>
                                    )}
                                    <div className="acad-opp-actions">
                                        {registeredRoleIds.has(opp.id!) ? (
                                            <span className="acad-btn-registered"><CheckCircle2 size={14} /> Registered</span>
                                        ) : (
                                            <button
                                                className="acad-btn-register"
                                                onClick={() => handleRegister(opp)}
                                                disabled={registering === opp.id}
                                            >
                                                {registering === opp.id ? <Loader2 size={14} className="spin" /> : <BookOpen size={14} />}
                                                Register
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
