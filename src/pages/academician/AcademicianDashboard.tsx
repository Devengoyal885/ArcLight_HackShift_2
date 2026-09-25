import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole, type PostingType } from '../../services/employerService';
import { updateProfile } from '../../services/profileService';
import {
    GraduationCap, BookOpen, FlaskConical, Briefcase,
    MapPin, Calendar, ExternalLink, Loader2, Search,
    Zap, ArrowRight, Building2, CheckCircle2, AlertTriangle, X,
} from 'lucide-react';
import './AcademicianDashboard.css';

const ACADEMIC_TYPES: PostingType[] = ['fdp', 'research', 'training', 'internship'];

const TYPE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    fdp: { label: 'Faculty Development Program', icon: <GraduationCap size={16} />, color: '#7c3aed' },
    research: { label: 'Research Collaboration', icon: <FlaskConical size={16} />, color: '#0ea5e9' },
    training: { label: 'Industry Training', icon: <BookOpen size={16} />, color: '#f59e0b' },
    internship: { label: 'Faculty Internship', icon: <Briefcase size={16} />, color: '#10b981' },
};

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
}

export default function AcademicianDashboard() {
    const { user, dbUid, profile } = useAuth();
    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<PostingType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Institution code editing
    const [showInstBanner, setShowInstBanner] = useState(false);
    const [instCodeInput, setInstCodeInput] = useState('');
    const [savingInstCode, setSavingInstCode] = useState(false);
    const [instCodeSaved, setInstCodeSaved] = useState(false);

    const firstName = user?.displayName?.split(' ')[0] || 'Faculty';
    const institutionCode = (profile as any)?.institutionCode as string | undefined;

    // Show banner if institutionCode is missing after profile loads
    useEffect(() => {
        if (profile !== null && !institutionCode) {
            setShowInstBanner(true);
        } else {
            setShowInstBanner(false);
        }
    }, [profile, institutionCode]);

    const handleSaveInstCode = async () => {
        if (!dbUid || !instCodeInput.trim()) return;
        setSavingInstCode(true);
        try {
            await updateProfile(dbUid, { institutionCode: instCodeInput.trim().toUpperCase() } as any);
            setInstCodeSaved(true);
            setShowInstBanner(false);
            setTimeout(() => setInstCodeSaved(false), 4000);
        } catch (e) {
            console.error('[AcademicianDashboard] saveInstCode failed:', e);
        } finally {
            setSavingInstCode(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                // Fetch all employer-posted roles and filter for academic types
                const posted = await getAllPostedRoles();
                const academic = posted.filter(r => ACADEMIC_TYPES.includes(r.type));
                setOpportunities(academic);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = opportunities.filter(opp => {
        const matchesType = activeFilter === 'all' || opp.type === activeFilter;
        const matchesSearch = !searchQuery.trim() ||
            opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opp.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opp.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const fdpCount = opportunities.filter(o => o.type === 'fdp').length;
    const researchCount = opportunities.filter(o => o.type === 'research').length;
    const trainingCount = opportunities.filter(o => o.type === 'training').length;
    const internshipCount = opportunities.filter(o => o.type === 'internship').length;

    return (
        <div className="acad-page">
            <FloatingNavbar variant="academician" />

            <div className="acad-bg">
                <div className="acad-orb acad-orb--1" />
                <div className="acad-orb acad-orb--2" />
            </div>

            <main className="acad-main">
                {/* Header */}
                <motion.div className="acad-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="acad-eyebrow">{greeting()}</p>
                    <h1 className="acad-title">{firstName},<br /><em>Academia Meets Industry.</em></h1>
                    <p className="acad-sub">
                        Discover FDPs, faculty internships, research collaborations, and industry training programs — all posted live by industries.
                    </p>
                </motion.div>

                {/* ── Institution Code Banner / Status ── */}
                <AnimatePresence>
                    {showInstBanner && (
                        <motion.div
                            className="acad-inst-banner"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <div className="acad-inst-banner-icon"><AlertTriangle size={18} color="#d97706" /></div>
                            <div className="acad-inst-banner-body">
                                <strong>Set your institution code</strong>
                                <span>so the admin dashboard can count you as faculty.</span>
                                <div className="acad-inst-input-row">
                                    <input
                                        className="acad-inst-input"
                                        placeholder="e.g. CU, VJTI, IITB"
                                        value={instCodeInput}
                                        onChange={e => setInstCodeInput(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveInstCode()}
                                    />
                                    <button
                                        className="acad-inst-save-btn"
                                        onClick={handleSaveInstCode}
                                        disabled={savingInstCode || !instCodeInput.trim()}
                                    >
                                        {savingInstCode ? <Loader2 size={13} className="acad-spin" /> : 'Save'}
                                    </button>
                                </div>
                            </div>
                            <button className="acad-inst-banner-close" onClick={() => setShowInstBanner(false)}>
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Institution code set confirmation */}
                {instCodeSaved && (
                    <motion.div
                        className="acad-inst-success"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <CheckCircle2 size={16} color="#10b981" />
                        Institution code saved! Admin can now see you in the dashboard.
                    </motion.div>
                )}

                {/* Show current code if set */}
                {!showInstBanner && institutionCode && (
                    <div className="acad-inst-code-tag">
                        <Building2 size={13} />
                        Institution: <strong>{institutionCode}</strong>
                        <button
                            className="acad-inst-change-btn"
                            onClick={() => { setInstCodeInput(institutionCode); setShowInstBanner(true); }}
                        >change</button>
                    </div>
                )}

                {/* Stats strip */}
                <motion.div className="acad-stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {[
                        { label: 'FDPs', count: fdpCount, color: '#7c3aed', icon: <GraduationCap size={18} /> },
                        { label: 'Research Projects', count: researchCount, color: '#0ea5e9', icon: <FlaskConical size={18} /> },
                        { label: 'Training Programs', count: trainingCount, color: '#f59e0b', icon: <BookOpen size={18} /> },
                        { label: 'Faculty Internships', count: internshipCount, color: '#10b981', icon: <Briefcase size={18} /> },
                    ].map(stat => (
                        <div key={stat.label} className="acad-stat-card">
                            <span style={{ color: stat.color }}>{stat.icon}</span>
                            <span className="acad-stat-num" style={{ color: stat.color }}>{stat.count}</span>
                            <span className="acad-stat-label">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Search + Filter */}
                <div className="acad-controls">
                    <div className="acad-search-wrap">
                        <Search size={16} className="acad-search-icon" />
                        <input
                            className="acad-search-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search programs, institutions, skills…"
                        />
                    </div>
                    <div className="acad-filters">
                        {(['all', ...ACADEMIC_TYPES] as const).map(type => (
                            <button
                                key={type}
                                className={`acad-filter-btn ${activeFilter === type ? 'active' : ''}`}
                                onClick={() => setActiveFilter(type)}
                                style={activeFilter === type && type !== 'all'
                                    ? { background: TYPE_INFO[type]?.color, color: 'white', borderColor: TYPE_INFO[type]?.color }
                                    : {}}
                            >
                                {type === 'all' ? 'All Programs' : TYPE_INFO[type]?.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className="acad-loading">
                        <Loader2 size={24} className="acad-spin" />
                        <p>Loading academic opportunities…</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="acad-empty">
                        <GraduationCap size={36} color="#94a3b8" />
                        <p>No programs found yet.</p>
                        <p className="acad-empty-sub">
                            Industry partners post FDPs, research projects, and training programs here.
                            Check back soon, or ask your institution to partner with CapAble.
                        </p>
                    </div>
                )}

                {/* Opportunity cards */}
                <div className="acad-grid">
                    {filtered.map((opp, i) => {
                        const typeInfo = TYPE_INFO[opp.type] || TYPE_INFO['training'];
                        return (
                            <motion.div
                                key={opp.id}
                                className="acad-card"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <div className="acad-card-top">
                                    <div className="acad-type-badge" style={{ background: typeInfo.color + '15', color: typeInfo.color }}>
                                        {typeInfo.icon}
                                        {typeInfo.label}
                                    </div>
                                    <div className="acad-company-logo">
                                        {opp.companyName?.charAt(0) || 'C'}
                                    </div>
                                </div>

                                <h3 className="acad-card-title">{opp.title}</h3>
                                <p className="acad-card-company">{opp.companyName}</p>

                                <div className="acad-card-meta">
                                    <span><MapPin size={13} /> {opp.location}{opp.remote ? ' · Remote' : ''}</span>
                                    {opp.duration && <span><Calendar size={13} /> {opp.duration}</span>}
                                    {(opp.stipend || opp.salary) && <span><Zap size={13} /> {opp.stipend || opp.salary}</span>}
                                </div>

                                {opp.description && (
                                    <p className="acad-card-desc">
                                        {opp.description.slice(0, 140)}{opp.description.length > 140 ? '…' : ''}
                                    </p>
                                )}

                                <div className="acad-card-tags">
                                    {opp.tags.slice(0, 4).map(t => (
                                        <span key={t} className="acad-card-tag">{t}</span>
                                    ))}
                                </div>

                                <div className="acad-card-footer">
                                    {opp.deadline && (
                                        <span className="acad-deadline">
                                            <Calendar size={12} /> Deadline: {new Date(opp.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                    <button className="acad-apply-btn" style={{ background: typeInfo.color }}>
                                        Apply Now <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick links panel */}
                <motion.div className="acad-links-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="acad-links-title">Quick Actions for Faculty</p>
                    <div className="acad-links-grid">
                        <a href="https://www.aicte-india.org/fdp" target="_blank" rel="noopener noreferrer" className="acad-quick-link">
                            <GraduationCap size={16} /> AICTE FDP Programs <ExternalLink size={12} />
                        </a>
                        <a href="https://www.dst.gov.in" target="_blank" rel="noopener noreferrer" className="acad-quick-link">
                            <FlaskConical size={16} /> DST Research Grants <ExternalLink size={12} />
                        </a>
                        <a href="https://www.linkedin.com/jobs/search/?keywords=faculty+internship" target="_blank" rel="noopener noreferrer" className="acad-quick-link">
                            <Briefcase size={16} /> Faculty Internships on LinkedIn <ExternalLink size={12} />
                        </a>
                        <a href="https://www.coursera.org/instructor" target="_blank" rel="noopener noreferrer" className="acad-quick-link">
                            <BookOpen size={16} /> Teach on Coursera <ExternalLink size={12} />
                        </a>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
