import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, getProjects, saveOpportunity, getSavedOpportunities, unsaveOpportunity } from '../../services/profileService';
import { getAllOpportunities, searchOpportunities, matchOpportunityToSkills } from '../../services/opportunityService';
import { applyToRole, getCandidateApplications, getAllPostedRoles } from '../../services/employerService';
import { getRoleRecommendations, type RoleRecommendation } from '../../services/jobRecommendationService';
import type { OpportunityCard } from '../../services/opportunityService';
import type { UserCapability } from '../../services/profileService';
import {
    Calendar, ExternalLink, ChevronDown, ChevronUp, MapPin, Building2,
    Briefcase, Search, Filter, Star, ChevronLeft, ChevronRight,
    Brain, TrendingUp, DollarSign, Target, AlertTriangle, X, Loader2,
    BookmarkCheck, Bookmark, Zap, Sparkles, CheckCircle2, AlertCircle, User, Clock, SearchX
} from 'lucide-react';
import { CompanyReviewsModal } from '../../components/ui/CompanyReviewsModal';
import { SkillGapModal } from '../../components/ui/SkillGapModal';
import { EmptyState } from '../../components/ui/EmptyState';
import './OpportunitiesPage.css';

type MatchState = 'READY NOW' | 'NEAR MATCH' | 'SKILL-BUILDING' | 'ALL';
type PageTab = 'all' | 'recommended';

const stateColors: Record<string, string> = {
    'READY NOW': '#10b981',
    'NEAR MATCH': '#2563eb',
    'SKILL-BUILDING': '#f59e0b',
};

const matchTagColors: Record<string, { bg: string; text: string }> = {
    'Best Match':    { bg: '#dcfce7', text: '#16a34a' },
    'Good Fit':      { bg: '#dbeafe', text: '#1d4ed8' },
    'Partial Match': { bg: '#fef3c7', text: '#b45309' },
    'Low Match':     { bg: '#f1f5f9', text: '#475569' },
};

export default function OpportunitiesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const navigate = useNavigate();

    // Tab
    const [pageTab, setPageTab] = useState<PageTab>('all');
    
    // Skill Gap Modal
    const [selectedRecommendation, setSelectedRecommendation] = useState<RoleRecommendation | null>(null);

    // Capabilities & Projects for AI matching
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [capsLoaded, setCapsLoaded] = useState(false);

    // All opportunities pool
    const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // AI Recommendations
    const [recommendations, setRecommendations] = useState<RoleRecommendation[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);

    // Saved / Applied
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [savedDocIds, setSavedDocIds] = useState<Record<string, string>>({});
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [applying, setApplying] = useState<string | null>(null);

    // Filters
    const [filter, setFilter] = useState<MatchState>('ALL');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [jobType, setJobType] = useState<'placement' | 'internship' | 'all'>('all');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [salaryMin, setSalaryMin] = useState<number | null>(null);
    const [companySize, setCompanySize] = useState<'all' | 'startup' | 'mid' | 'enterprise'>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Company Reviews Modal
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    const carouselRef = useRef<HTMLDivElement>(null);

    // Load capabilities
    useEffect(() => {
        if (!user) return;
        getCapabilities(dbUid!).then(caps => {
            setCapabilities(caps);
            setCapsLoaded(true);
        }).catch(err => {
            console.error(err);
            setCapsLoaded(true);
        });
    }, [user]);

    // Load saved opportunities
    useEffect(() => {
        if (!user || !dbUid) return;
        getSavedOpportunities(dbUid).then(saved => {
            const ids = new Set(saved.map(s => s.opportunityId));
            const docMap: Record<string, string> = {};
            saved.forEach(s => { if (s.id) docMap[s.opportunityId] = s.id; });
            setSavedIds(ids);
            setSavedDocIds(docMap);
        }).catch(console.error);

        getCandidateApplications(dbUid).then((apps: any[]) => {
            const appliedSet = new Set(apps.map(a => a.roleId || a.opportunityId));
            setAppliedIds(appliedSet);
        }).catch(console.error);
    }, [user, dbUid]);

    // Load all jobs
    useEffect(() => {
        if (!capsLoaded) return;
        setLoading(true);
        setError(false);
        const userSkills = capabilities.map(c => c.skill);

        getAllOpportunities().then(jobs => {
            const scored = jobs.map(j => matchOpportunityToSkills(j, userSkills));
            const internal = scored.filter(j => j.isInternalPosting);
            const external = scored.filter(j => !j.isInternalPosting).sort((a, b) => (b.match || 0) - (a.match || 0));
            setOpportunities([...internal, ...external]);
        }).catch(() => setError(true))
          .finally(() => setLoading(false));
    }, [capabilities, capsLoaded, user]);

    // Load AI Recommendations from posted roles
    useEffect(() => {
        if (!capsLoaded || pageTab !== 'recommended') return;
        setRecsLoading(true);
        (async () => {
            try {
                const [roles, projects] = await Promise.all([
                    getAllPostedRoles(),
                    getProjects(dbUid!).catch(() => []),
                ]);
                const recs = getRoleRecommendations(
                    roles,
                    capabilities,
                    projects,
                    profile?.headline,
                    profile?.location,
                    30
                );
                setRecommendations(recs);
            } catch (e) {
                console.error('[Recommendations]', e);
            } finally {
                setRecsLoading(false);
            }
        })();
    }, [pageTab, capsLoaded, capabilities]);

    // Manual search
    const handleSearch = () => {
        const userSkills = capabilities.map(c => c.skill);
        setLoading(true);
        setError(false);

        if (!searchQuery.trim()) {
            getAllOpportunities()
                .then(jobs => {
                    const scored = jobs.map(j => matchOpportunityToSkills(j, userSkills));
                    scored.sort((a, b) => (b.match || 0) - (a.match || 0));
                    setOpportunities(scored);
                })
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        } else {
            searchOpportunities({ query: searchQuery, skills: userSkills, remote: remoteOnly || undefined, type: jobType })
                .then(jobs => {
                    const scored = jobs.map(j => matchOpportunityToSkills(j, userSkills));
                    scored.sort((a, b) => (b.match || 0) - (a.match || 0));
                    setOpportunities(scored);
                })
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        }
    };

    // Client-side filters
    let filtered = [...opportunities];
    if (jobType === 'internship') filtered = filtered.filter(o => o.type === 'internship' || o.title.toLowerCase().includes('intern'));
    if (jobType === 'placement')  filtered = filtered.filter(o => o.type !== 'internship' && !o.title.toLowerCase().includes('intern'));
    if (remoteOnly) filtered = filtered.filter(o => o.remote);
    if (filter !== 'ALL') filtered = filtered.filter(o => o.matchState === filter);
    // Salary filter: extract leading number from salary strings like "6 LPA", "₹8–12 LPA"
    if (salaryMin !== null) {
        filtered = filtered.filter(o => {
            const raw = (o as any).salary || (o as any).stipend || '';
            if (!raw) return false;
            const match = String(raw).replace(/[^0-9.]/g, ' ').trim().split(/\s+/)[0];
            const num = parseFloat(match);
            return !isNaN(num) && num >= salaryMin!;
        });
    }
    // Company size filter
    if (companySize !== 'all') {
        filtered = filtered.filter(o => {
            const size = ((o as any).companySize || '').toLowerCase();
            if (companySize === 'startup') return size.includes('startup') || size.includes('small');
            if (companySize === 'mid') return size.includes('mid') || size.includes('medium');
            if (companySize === 'enterprise') return size.includes('enterprise') || size.includes('large') || size.includes('mnc');
            return true;
        });
    }

    // Featured
    const featured = opportunities.filter(o => (o.match || 0) >= 75).slice(0, 4);

    const scrollCarousel = (dir: 'left' | 'right') => {
        carouselRef.current?.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    };

    const handleSave = async (opp: OpportunityCard) => {
        if (!user) return;
        const isCurrentlySaved = savedIds.has(opp.id);
        
        // Optimistic update
        setSavedIds(prev => {
            const s = new Set(prev);
            if (isCurrentlySaved) s.delete(opp.id);
            else s.add(opp.id);
            return s;
        });

        try {
            if (isCurrentlySaved) {
                const docId = savedDocIds[opp.id];
                if (docId) {
                    await unsaveOpportunity(dbUid!, docId);
                }
            } else {
                const newDocId = await saveOpportunity(dbUid!, {
                    opportunityId: opp.id,
                    title: opp.title,
                    company: opp.company,
                    url: opp.url,
                });
                // Assuming saveOpportunity returns the docId. If it returns void, we might need a fetch later, 
                // but for now the optimistic update works for the UI state.
            }
        } catch (err) {
            console.error("Failed to save/unsave:", err);
            // Revert on error
            setSavedIds(prev => {
                const s = new Set(prev);
                if (isCurrentlySaved) s.add(opp.id);
                else s.delete(opp.id);
                return s;
            });
        }
    };

    const handleApply = async (opp: OpportunityCard) => {
        if (opp.isInternalPosting && opp.internalRoleId) {
            if (!user) return;
            setApplying(opp.id);
            try {
                await applyToRole(opp.internalRoleId, {
                    roleId: opp.internalRoleId,
                    roleTitle: opp.title,
                    companyName: opp.company,
                    candidateUid: dbUid!,
                    candidateName: profile?.name || user.displayName || 'Candidate',
                    candidateEmail: profile?.email || user.email || '',
                    candidateHeadline: profile?.headline || '',
                    capabilityMatch: opp.match || 0,
                    status: 'Applied'
                });
                setAppliedIds(prev => new Set(prev).add(opp.internalRoleId!));
                alert('Successfully applied to this role!');
            } catch (err) {
                console.error('Apply error', err);
                alert('Failed to apply. Please try again.');
            } finally {
                setApplying(null);
            }
        } else {
            window.open(opp.url, '_blank', 'noopener noreferrer');
        }
    };

    const handleApplyRecommended = async (rec: RoleRecommendation) => {
        if (!user) return;
        const role = rec.role;
        const rid = role.id!;
        setApplying(rid);
        try {
            await applyToRole(rid, {
                roleId: rid,
                roleTitle: role.title,
                companyName: role.companyName,
                candidateUid: dbUid!,
                candidateName: profile?.name || user.displayName || 'Candidate',
                candidateEmail: profile?.email || user.email || '',
                candidateHeadline: profile?.headline || '',
                capabilityMatch: rec.score,
                status: 'Applied'
            });
            setAppliedIds(prev => new Set(prev).add(rid));
            alert('Application submitted!');
        } catch (e) {
            alert('Failed to apply. Try again.');
        } finally {
            setApplying(null);
        }
    };

    return (
        <div className="opp-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="opp-bg" />}

            <main className="opp-main">
                <motion.div className="opp-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="opp-header-content">
                        <span className="opp-eyebrow">OPPORTUNITY RADAR</span>
                        <h1 className="opp-title">Real opportunities matched to<br /><em>your verified capabilities.</em></h1>
                        <p className="opp-sub">Live jobs from Remotive and Google Jobs, matched to your actual skills. Updated in real-time.</p>
                    </div>
                </motion.div>

                {/* Page tabs */}
                <div className="opp-page-tabs">
                    <button
                        className={`opp-page-tab ${pageTab === 'all' ? 'active' : ''}`}
                        onClick={() => setPageTab('all')}
                    >
                        <Search size={16} /> All Opportunities
                    </button>
                    <button
                        className={`opp-page-tab ${pageTab === 'recommended' ? 'active' : ''}`}
                        onClick={() => setPageTab('recommended')}
                    >
                        <Brain size={16} /> AI Recommendations
                        <span className="opp-tab-badge">NEW</span>
                    </button>
                </div>

                {/* ── AI RECOMMENDATIONS TAB ── */}
                {pageTab === 'recommended' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="recs-header">
                            <div>
                                <h2 className="recs-title"><Brain size={22} color="#7c3aed" /> AI-Powered Role Matches</h2>
                                <p className="recs-subtitle">Scored across skill overlap, headline alignment, location, and project keywords</p>
                            </div>
                        </div>

                        {recsLoading ? (
                            <div className="opp-state-center">
                                <Loader2 size={28} className="spin" />
                                <p>Analysing your profile against all available roles…</p>
                            </div>
                        ) : recommendations.length === 0 ? (
                            <div className="opp-state-center">
                                <Target size={36} color="#94a3b8" />
                                <p>No internal platform roles available yet.<br />Check back after employers post more roles.</p>
                            </div>
                        ) : (
                            <div className="recs-grid">
                                {recommendations.map((rec, i) => {
                                    const tag = matchTagColors[rec.matchTag];
                                    const rid = rec.role.id!;
                                    const isApplied = appliedIds.has(rid);
                                    return (
                                        <motion.div
                                            key={rid}
                                            className="rec-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                        >
                                            {/* Score circle */}
                                            <div className="rec-score-wrap">
                                                <div className="rec-score-ring" style={{ '--score': `${rec.score}` } as React.CSSProperties}>
                                                    <span className="rec-score-num">{rec.score}</span>
                                                    <span className="rec-score-label">/ 100</span>
                                                </div>
                                                <span className="rec-tag" style={{ background: tag.bg, color: tag.text }}>{rec.matchTag}</span>
                                            </div>

                                            <div className="rec-body">
                                                <h3 className="rec-role-title">{rec.role.title}</h3>
                                                <p 
                                                    className="rec-company" 
                                                    style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedCompany(rec.role.companyName); }}
                                                >
                                                    {rec.role.companyName}
                                                </p>
                                                <div className="rec-meta">
                                                    <span><MapPin size={13} /> {rec.role.location}</span>
                                                    <span><Briefcase size={13} /> {rec.role.type}</span>
                                                    {rec.role.salary && <span><DollarSign size={13} /> {rec.role.salary}</span>}
                                                </div>

                                                {/* Match reasons */}
                                                {rec.matchReasons.length > 0 && (
                                                    <div className="rec-reasons">
                                                        {rec.matchReasons.slice(0, 3).map((r, ri) => (
                                                            <span key={ri} className="rec-reason"><CheckCircle2 size={12} /> {r}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Missing skills */}
                                                {rec.missingSkills.length > 0 && (
                                                    <div className="rec-missing">
                                                        <span className="rec-missing-label"><AlertTriangle size={12} /> Skill gaps:</span>
                                                        {rec.missingSkills.slice(0, 3).map(s => (
                                                            <span key={s} className="rec-skill-gap">{s}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="rec-actions">
                                                    <button
                                                        className="rec-apply-btn"
                                                        disabled={applying === rid || isApplied}
                                                        onClick={() => !isApplied && handleApplyRecommended(rec)}
                                                        style={isApplied ? { background: '#22c55e', cursor: 'not-allowed' } : {}}
                                                    >
                                                        {isApplied ? <><CheckCircle2 size={14} /> Applied</> : applying === rid ? <><Loader2 size={14} className="spin" /> Applying…</> : <>Apply Now →</>}
                                                    </button>
                                                    <button
                                                        className="rec-tailor-btn"
                                                        onClick={() => {
                                                            const jd = `Job Title: ${rec.role.title}\nCompany: ${rec.role.companyName}\nSkills: ${rec.role.requiredSkills?.join(', ') || ''}\nDescription: ${rec.role.description || ''}`;
                                                            navigate('/candidate/resume', { state: { jdText: jd } });
                                                        }}
                                                    >
                                                        <Sparkles size={13} /> Tailor Resume
                                                    </button>
                                                    <button
                                                        className="rec-tailor-btn"
                                                        style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                                                        onClick={() => setSelectedRecommendation(rec)}
                                                    >
                                                        <Brain size={13} /> AI Match Details
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── ALL OPPORTUNITIES TAB ── */}
                {pageTab === 'all' && (
                    <>
                        {/* Featured Carousel */}
                        {!loading && featured.length > 0 && (
                            <motion.section className="opp-featured-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <div className="featured-header">
                                    <h2><Star size={20} fill="#f59e0b" color="#f59e0b" /> Top Matches for You</h2>
                                    <div className="carousel-nav">
                                        <button onClick={() => scrollCarousel('left')} className="carousel-btn"><ChevronLeft size={20} /></button>
                                        <button onClick={() => scrollCarousel('right')} className="carousel-btn"><ChevronRight size={20} /></button>
                                    </div>
                                </div>

                                <div className="featured-carousel-wrapper">
                                    <div className="featured-carousel" ref={carouselRef}>
                                        {featured.map(opp => (
                                            <div key={`feat-${opp.id}`} className="featured-card">
                                                <div className="feat-card-header">
                                                    <div className="feat-company-logo"><Building2 size={24} color="#64748b" /></div>
                                                    <div className="feat-match-badge" style={{ color: stateColors[opp.matchState || 'SKILL-BUILDING'], background: (stateColors[opp.matchState || 'SKILL-BUILDING']) + '15' }}>
                                                        <Zap size={14} /> {opp.match}% Match
                                                    </div>
                                                </div>
                                                <h3 className="feat-role">{opp.title}</h3>
                                                <p 
                                                    className="feat-company"
                                                    style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedCompany(opp.company); }}
                                                >
                                                    {opp.company}
                                                </p>
                                                <div className="feat-meta">
                                                    <span><MapPin size={12} /> {opp.location}</span>
                                                    <span><Briefcase size={12} /> {opp.type}</span>
                                                </div>
                                                <div className="opp-btn-group" style={{ marginTop: '16px' }}>
                                                    <button
                                                        onClick={() => handleApply(opp)}
                                                        className="opp-btn opp-btn-secondary"
                                                        disabled={applying === opp.id}
                                                    >
                                                        {applying === opp.id ? <><Loader2 size={14} className="spin" /> Applying...</> : <>Apply Now <ExternalLink size={14} /></>}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const jd = `Job Title: ${opp.title}\nCompany: ${opp.company}\nDetails: ${opp.description || opp.tags.join(', ')}`;
                                                            navigate('/candidate/resume', { state: { jdText: jd } });
                                                        }}
                                                        className="opp-btn opp-btn-primary"
                                                    >
                                                        <Sparkles size={14} className="opp-btn-icon" /> Tailor Resume
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        <div className="opp-layout">
                            {/* Sidebar Filters */}
                            <motion.aside className="opp-sidebar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                <div className="sidebar-widget">
                                    <h3><Search size={16} /> Search Roles</h3>
                                    <div className="search-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="e.g. Frontend Developer"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                    <button className="opp-search-btn" onClick={handleSearch}>Search</button>
                                </div>

                                {/* Quick Filter Chips for Mobile/Fast Access */}
                                <div className="quick-filter-chips">
                                    <button 
                                        className={`quick-chip ${filter === 'READY NOW' ? 'active' : ''}`}
                                        onClick={() => setFilter(filter === 'READY NOW' ? 'ALL' : 'READY NOW')}
                                    >
                                        🔥 Ready Now
                                    </button>
                                    <button 
                                        className={`quick-chip ${jobType === 'internship' ? 'active' : ''}`}
                                        onClick={() => setJobType(jobType === 'internship' ? 'all' : 'internship')}
                                    >
                                        🎓 Internships
                                    </button>
                                    <button 
                                        className={`quick-chip ${remoteOnly ? 'active' : ''}`}
                                        onClick={() => setRemoteOnly(!remoteOnly)}
                                    >
                                        💻 Remote
                                    </button>
                                    <button 
                                        className={`quick-chip ${salaryMin === 8 ? 'active' : ''}`}
                                        onClick={() => setSalaryMin(salaryMin === 8 ? null : 8)}
                                    >
                                        💰 8+ LPA
                                    </button>
                                </div>

                                <div className="sidebar-widget">
                                    <h3><Filter size={16} /> Match Level</h3>
                                    <div className="filter-options">
                                        {(['ALL', 'READY NOW', 'NEAR MATCH', 'SKILL-BUILDING'] as MatchState[]).map(f => (
                                            <button
                                                key={f}
                                                className={`sidebar-filter-btn ${filter === f ? 'active' : ''}`}
                                                onClick={() => setFilter(f)}
                                            >
                                                {f !== 'ALL' && <span className="filter-dot" style={{ background: stateColors[f] }} />}
                                                <span className="filter-label">{f}</span>
                                                {filter === f && <span className="filter-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="sidebar-widget">
                                    <h3>Job Type</h3>
                                    <div className="filter-options">
                                        {(['all', 'placement', 'internship'] as const).map(t => (
                                            <button key={t} className={`sidebar-filter-btn ${jobType === t ? 'active' : ''}`} onClick={() => setJobType(t)}>
                                                <span className="filter-label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                                {jobType === t && <span className="filter-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="sidebar-widget">
                                    <h3>Work Mode</h3>
                                    <label className="custom-checkbox">
                                        <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
                                        Remote only
                                    </label>
                                </div>

                                <div className="sidebar-widget">
                                    <h3><Building2 size={16} /> Company Size</h3>
                                    <div className="filter-options">
                                        {([['all', 'All Sizes'], ['startup', 'Startup (<200)'], ['mid', 'Mid-size (200–1k)'], ['enterprise', 'Enterprise (1k+)']] as const).map(([val, label]) => (
                                            <button
                                                key={val}
                                                className={`sidebar-filter-btn ${companySize === val ? 'active' : ''}`}
                                                onClick={() => setCompanySize(val)}
                                            >
                                                <span className="filter-label">{label}</span>
                                                {companySize === val && <span className="filter-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* NEW: Salary filter */}
                                <div className="sidebar-widget">
                                    <h3><DollarSign size={16} /> Min Salary (LPA)</h3>
                                    <div className="salary-range-opts">
                                        {[null, 3, 5, 8, 12, 20].map(val => (
                                            <button
                                                key={String(val)}
                                                className={`sidebar-filter-btn ${salaryMin === val ? 'active' : ''}`}
                                                onClick={() => setSalaryMin(val)}
                                            >
                                                <span className="filter-label">{val === null ? 'Any' : `${val}+ LPA`}</span>
                                                {salaryMin === val && <span className="filter-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="sidebar-widget opp-source-badge">
                                    <p>Sources: <strong>Remotive</strong> + <strong>Google Jobs</strong></p>
                                    <p className="opp-source-note">Real listings, updated live</p>
                                </div>
                            </motion.aside>

                            {/* Feed */}
                            <motion.div className="opp-feed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                <div className="feed-header">
                                    <h2>
                                        {loading ? 'Loading opportunities...' : `Showing ${filtered.length} opportunities`}
                                    </h2>
                                    <select className="feed-sort" onChange={e => {
                                        if (e.target.value === 'match') setOpportunities(prev => [...prev].sort((a, b) => (b.match || 0) - (a.match || 0)));
                                    }}>
                                        <option value="match">Sort by: Match %</option>
                                        <option value="newest">Sort by: Newest</option>
                                    </select>
                                </div>

                                {loading && (
                                    <div className="opp-state-center">
                                        <Loader2 size={28} className="spin" />
                                        <p>Fetching real opportunities matched to your skills...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="opp-state-center">
                                        <AlertCircle size={28} color="#ef4444" />
                                        <p>Could not load opportunities. Check your connection.</p>
                                    </div>
                                )}

                                {!loading && !error && filtered.length === 0 && (
                                    <EmptyState
                                        icon={SearchX}
                                        title="No matches found"
                                        description="We couldn't find any opportunities matching your current filters. Try adjusting your search criteria."
                                    />
                                )}

                                {/* CapAble Exclusive Platform Postings */}
                                {!loading && !error && filtered.some(o => o.isInternalPosting) && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '4px 12px', borderRadius: '20px' }}>✨ CapAble Platform Postings</span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>Posted directly by companies on CapAble</span>
                                        </div>
                                        {filtered.filter(o => o.isInternalPosting).map((opp, i) => {
                                            const isExpanded = expanded === opp.id;
                                            const isSaved = savedIds.has(opp.id);
                                            return (
                                                <motion.div
                                                    key={opp.id}
                                                    className={`opp-card ${isExpanded ? 'expanded' : ''}`}
                                                    style={{ border: '2px solid #bfdbfe', background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)' }}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    layout
                                                >
                                                    <div className="opp-card-main" onClick={() => setExpanded(isExpanded ? null : opp.id)}>
                                                        <div className="opp-card-logo"><Building2 size={24} color="#1d4ed8" /></div>
                                                        <div className="opp-card-info">
                                                            <div className="opp-title-row">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <h3 className="opp-card-title">{opp.title}</h3>
                                                                    <span style={{ background: '#1d4ed8', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>✨ CapAble Exclusive</span>
                                                                </div>
                                                                {opp.match !== undefined && (
                                                                    <span className="opp-card-match" style={{ color: stateColors[opp.matchState || 'SKILL-BUILDING'], background: (stateColors[opp.matchState || 'SKILL-BUILDING']) + '15' }}>
                                                                        {opp.match}% Match
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p 
                                                                className="opp-card-company"
                                                                style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCompany(opp.company); }}
                                                            >
                                                                {opp.company}
                                                            </p>
                                                            <div className="opp-card-meta">
                                                                <span><MapPin size={14} /> {opp.location}</span>
                                                                <span><Briefcase size={14} /> {opp.type}</span>
                                                                {opp.salary && <span><DollarSign size={14} /> {opp.salary}</span>}
                                                                {opp.remote && <span style={{ color: '#10b981', fontWeight: 600 }}>🌐 Remote</span>}
                                                                {opp.applicantCount !== undefined && <span><User size={14} /> {opp.applicantCount} applicants</span>}
                                                                {opp.deadline && <span><Clock size={14} /> Due: {new Date(opp.deadline).toLocaleDateString()}</span>}
                                                            </div>
                                                            <div className="opp-card-tags">
                                                                {opp.tags.map(tag => <span key={tag} className="opp-tag">{tag}</span>)}
                                                            </div>
                                                        </div>
                                                        <div className="opp-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                                            <button
                                                                style={{
                                                                    background: appliedIds.has(opp.internalRoleId!) ? '#22c55e' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px',
                                                                    padding: '8px 16px', fontWeight: 700, fontSize: '13px', cursor: appliedIds.has(opp.internalRoleId!) ? 'not-allowed' : 'pointer',
                                                                    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                                                                    opacity: applying === opp.id ? 0.7 : 1,
                                                                }}
                                                                disabled={applying === opp.id || appliedIds.has(opp.internalRoleId!)}
                                                                onClick={e => { e.stopPropagation(); if (!appliedIds.has(opp.internalRoleId!)) handleApply(opp); }}
                                                            >
                                                                {appliedIds.has(opp.internalRoleId!) ? <>Already Applied ✓</> : applying === opp.id ? <><Loader2 size={13} className="spin" /> Applying…</> : <>Apply Now →</>}
                                                            </button>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button
                                                                    className={`opp-save-btn ${isSaved ? 'saved' : ''}`}
                                                                    onClick={e => { e.stopPropagation(); handleSave(opp); }}
                                                                >
                                                                    {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                                                                </button>
                                                                <button className="opp-expand-btn">
                                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div className="opp-card-expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                                {opp.description && <p className="opp-desc">{opp.description}</p>}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                        <div style={{ borderBottom: '1px solid #e2e8f0', margin: '16px 0 20px' }} />
                                    </div>
                                )}

                                <div className="opp-list">
                                    <AnimatePresence>
                                        {!loading && !error && filtered.filter(o => !o.isInternalPosting).map((opp, i) => {
                                            const isExpanded = expanded === opp.id;
                                            const isSaved = savedIds.has(opp.id);
                                            return (
                                                <motion.div
                                                    key={opp.id}
                                                    className={`opp-card ${isExpanded ? 'expanded' : ''}`}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    layout
                                                >
                                                    <div className="opp-card-main" onClick={() => setExpanded(isExpanded ? null : opp.id)}>
                                                        <div className="opp-card-logo"><Building2 size={24} color="#94a3b8" /></div>

                                                        <div className="opp-card-info">
                                                            <div className="opp-title-row">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <h3 className="opp-card-title">{opp.title}</h3>
                                                                </div>
                                                                {opp.match !== undefined && (
                                                                    <span className="opp-card-match" style={{ color: stateColors[opp.matchState || 'SKILL-BUILDING'], background: (stateColors[opp.matchState || 'SKILL-BUILDING']) + '15' }}>
                                                                        {opp.match}% Match
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p 
                                                                className="opp-card-company"
                                                                style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCompany(opp.company); }}
                                                            >
                                                                {opp.company}
                                                            </p>
                                                            <div className="opp-card-meta">
                                                                <span><MapPin size={14} /> {opp.location}</span>
                                                                <span><Briefcase size={14} /> {opp.type}</span>
                                                                {opp.salary && <span><DollarSign size={14} /> {opp.salary}</span>}
                                                                {opp.postedAt && <span><Calendar size={14} /> {new Date(opp.postedAt).toLocaleDateString()}</span>}
                                                                {opp.applicantCount !== undefined && <span><User size={14} /> {opp.applicantCount} applicants</span>}
                                                                {opp.deadline && <span><Clock size={14} /> Due: {new Date(opp.deadline).toLocaleDateString()}</span>}
                                                            </div>
                                                            <div className="opp-card-tags">
                                                                {opp.tags.map(tag => <span key={tag} className="opp-tag">{tag}</span>)}
                                                            </div>
                                                        </div>

                                                        <div className="opp-card-actions">
                                                            <button
                                                                className={`opp-save-btn ${isSaved ? 'saved' : ''}`}
                                                                onClick={e => { e.stopPropagation(); handleSave(opp); }}
                                                                title={isSaved ? 'Unsave' : 'Save'}
                                                            >
                                                                {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                                                            </button>
                                                            <button className="opp-expand-btn">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                className="opp-card-detail"
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                            >
                                                                <div className="opp-detail-inner">
                                                                    {(opp.matchingSkills?.length || opp.missingSkills?.length) && (
                                                                        <div className="opp-skill-breakdown">
                                                                            {opp.matchingSkills && opp.matchingSkills.length > 0 && (
                                                                                <div>
                                                                                    <p className="opp-skills-label opp-skills-match">✓ Strong matches</p>
                                                                                    <div className="opp-skills-chips">
                                                                                        {opp.matchingSkills.map(s => <span key={s} className="opp-skill-chip match">{s}</span>)}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {opp.missingSkills && opp.missingSkills.length > 0 && (
                                                                                <div>
                                                                                    <p className="opp-skills-label opp-skills-gap">△ Potential gaps</p>
                                                                                    <div className="opp-skills-chips">
                                                                                        {opp.missingSkills.map(s => <span key={s} className="opp-skill-chip gap">{s}</span>)}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {opp.description && (
                                                                        <p className="opp-description">{opp.description}</p>
                                                                    )}

                                                                    <div className="opp-detail-actions">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); if (opp.isInternalPosting && !appliedIds.has(opp.internalRoleId!)) handleApply(opp); else if (!opp.isInternalPosting) window.open(opp.url, '_blank', 'noopener noreferrer'); }}
                                                                            className="opp-btn opp-btn-secondary"
                                                                            disabled={applying === opp.id || (opp.isInternalPosting && appliedIds.has(opp.internalRoleId!))}
                                                                            style={(opp.isInternalPosting && appliedIds.has(opp.internalRoleId!)) ? { background: '#22c55e', color: 'white', border: 'none' } : {}}
                                                                        >
                                                                            {(opp.isInternalPosting && appliedIds.has(opp.internalRoleId!)) ? <>Already Applied ✓</> : applying === opp.id ? <><Loader2 size={16} className="spin" /> Applying...</> : <>Apply Now <ExternalLink size={16} /></>}
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const jd = `Job Title: ${opp.title}\nCompany: ${opp.company}\nDetails: ${opp.description || opp.tags.join(', ')}`;
                                                                                navigate('/candidate/resume', { state: { jdText: jd } });
                                                                            }}
                                                                            className="opp-btn opp-btn-primary"
                                                                        >
                                                                            <Sparkles size={16} className="opp-btn-icon" /> Tailor Resume
                                                                        </button>
                                                                        <button
                                                                            className={`opp-action-secondary ${isSaved ? 'saved' : ''}`}
                                                                            onClick={() => handleSave(opp)}
                                                                        >
                                                                            {isSaved ? <><BookmarkCheck size={14} /> Saved</> : <><Bookmark size={14} /> Save for Later</>}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </main>
            
            <CompanyReviewsModal 
                isOpen={!!selectedCompany}
                companyName={selectedCompany || ''}
                onClose={() => setSelectedCompany(null)}
            />

            {/* Skill Gap Modal */}
            <SkillGapModal
                isOpen={!!selectedRecommendation}
                onClose={() => setSelectedRecommendation(null)}
                recommendation={selectedRecommendation}
            />
        </div>
    );
}
