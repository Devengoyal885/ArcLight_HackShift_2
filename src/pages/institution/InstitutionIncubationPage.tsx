import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getInstitutionIncubationApplications,
    getIncubationPrograms,
    updateIncubationApplicationStatus,
    createIncubationProgram,
    type IncubationApplication,
    type IncubationProgram
} from '../../services/ventureService';
import {
    Building2, Award, Calendar, CheckCircle2, ChevronRight,
    ExternalLink, ShieldCheck, X, Loader2, Send, Plus,
    Users, DollarSign, Filter, Search, ArrowRight, Clock, Star
} from 'lucide-react';
import './InstitutionIncubationPage.css';

export default function InstitutionIncubationPage() {
    const { profile: adminProfile } = useAuth();
    const instCode = adminProfile?.institutionCode || 'IIT-DELHI';

    const [tab, setTab] = useState<'applications' | 'cohorts'>('applications');
    const [applications, setApplications] = useState<IncubationApplication[]>([]);
    const [programs, setPrograms] = useState<IncubationProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');

    // Modal state for launching new cohort
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newOrganizer, setNewOrganizer] = useState('');
    const [newCohort, setNewCohort] = useState('Cohort 2026');
    const [newDesc, setNewDesc] = useState('');
    const [newGrant, setNewGrant] = useState('₹15,00,000 Seed Grant');
    const [newEligibility, setNewEligibility] = useState('');
    const [newPerks, setNewPerks] = useState('FabLab access, Cloud credits, Legal IPR support');
    const [newDeadlineDays, setNewDeadlineDays] = useState(30);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [apps, progs] = await Promise.all([
                getInstitutionIncubationApplications(instCode),
                getIncubationPrograms()
            ]);
            setApplications(apps);
            setPrograms(progs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [instCode]);

    const handleStatusChange = async (appId: string, newStatus: IncubationApplication['status']) => {
        try {
            await updateIncubationApplicationStatus(appId, newStatus);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            showToast(`Application status updated to ${newStatus.replace('_', ' ')}!`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const perksList = newPerks.split(',').map(p => p.trim()).filter(Boolean);
            const deadline = new Date(Date.now() + newDeadlineDays * 86400000).toISOString();

            await createIncubationProgram({
                institutionCode: instCode,
                institutionName: adminProfile?.institutionName || 'Institutional Incubator',
                title: newTitle.trim(),
                organizer: newOrganizer.trim() || 'E-Cell & TBI',
                cohort: newCohort.trim(),
                description: newDesc.trim(),
                grantAmount: newGrant.trim(),
                perks: perksList.length ? perksList : ['Prototyping facilities', 'Investor Demo Day'],
                eligibility: newEligibility.trim() || 'Enrolled undergraduate or postgraduate student ventures with working prototypes.',
                deadline,
                mode: 'Hybrid',
                status: 'Applications Open',
            });

            showToast('New incubation cohort launched successfully!');
            setShowModal(false);
            setNewTitle('');
            setNewDesc('');
            loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const filteredApps = applications.filter(a => {
        if (filterStatus !== 'all' && a.status !== filterStatus) return false;
        if (search.trim()) {
            const s = search.toLowerCase();
            return (
                a.startupName.toLowerCase().includes(s) ||
                a.applicantName.toLowerCase().includes(s) ||
                a.programTitle.toLowerCase().includes(s)
            );
        }
        return true;
    });

    return (
        <div className="inst-inc-page">
            <FloatingNavbar variant="institution" />

            {toast && (
                <div className="inst-inc-toast">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{toast}</span>
                </div>
            )}

            <div className="inst-inc-content">
                {/* Header */}
                <div className="inst-inc-header">
                    <div>
                        <div className="inst-inc-eyebrow">
                            <Building2 size={13} /> INSTITUTIONAL INCUBATION & E-CELL
                        </div>
                        <h1>E-Cell & Startup Incubation Workspace</h1>
                        <p>
                            Evaluate student venture pitch decks, award seed grants, and manage incubation cohorts for institution {instCode}.
                        </p>
                    </div>

                    <div className="inst-inc-header-actions">
                        <button className="inst-inc-btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={15} /> Launch Incubation Cohort
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="inst-inc-tabs">
                    <button
                        className={`inst-inc-tab ${tab === 'applications' ? 'active' : ''}`}
                        onClick={() => setTab('applications')}
                    >
                        <Award size={15} /> Student Pitch Submissions
                        {applications.length > 0 && <span className="inst-inc-badge">{applications.length}</span>}
                    </button>
                    <button
                        className={`inst-inc-tab ${tab === 'cohorts' ? 'active' : ''}`}
                        onClick={() => setTab('cohorts')}
                    >
                        <Building2 size={15} /> Active Cohorts & Programs
                        {programs.length > 0 && <span className="inst-inc-badge">{programs.length}</span>}
                    </button>
                </div>

                {/* Applications View */}
                {tab === 'applications' && (
                    <div className="inst-inc-tab-pane">
                        <div className="inst-inc-filters-row">
                            <div className="inst-inc-search">
                                <Search size={15} />
                                <input
                                    placeholder="Search by student, startup name, or program..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="inst-inc-status-chips">
                                {['all', 'submitted', 'under_review', 'shortlisted', 'selected', 'rejected'].map(st => (
                                    <button
                                        key={st}
                                        className={`inst-inc-chip ${filterStatus === st ? 'active' : ''}`}
                                        onClick={() => setFilterStatus(st)}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="inst-inc-loading">
                                <Loader2 size={32} className="spin" />
                                <p>Loading student pitch submissions...</p>
                            </div>
                        ) : filteredApps.length === 0 ? (
                            <div className="inst-inc-empty">
                                <Award size={40} color="#94a3b8" />
                                <h3>No pitch applications match this view</h3>
                                <p>Student startup proposals submitted to your incubator will be listed here for committee review.</p>
                            </div>
                        ) : (
                            <div className="inst-inc-cards-grid">
                                {filteredApps.map(app => {
                                    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                                        submitted: { label: 'New Submission', color: '#2563eb', bg: '#eff6ff' },
                                        under_review: { label: 'In Review', color: '#d97706', bg: '#fffbeb' },
                                        shortlisted: { label: 'Shortlisted for Pitch Day', color: '#7c3aed', bg: '#f5f3ff' },
                                        selected: { label: 'Grant Awarded / Incubated 🏆', color: '#059669', bg: '#ecfdf5' },
                                        rejected: { label: 'Declined', color: '#64748b', bg: '#f1f5f9' },
                                    };
                                    const conf = statusMap[app.status] || statusMap.submitted;

                                    return (
                                        <div key={app.id} className="inst-pitch-card">
                                            <div className="inst-pitch-top">
                                                <div>
                                                    <span className="inst-pitch-program">{app.programTitle}</span>
                                                    <h3 className="inst-pitch-title">{app.startupName}</h3>
                                                    <p className="inst-pitch-founder">
                                                        Founder: <strong>{app.applicantName}</strong> ({app.applicantEmail}) • Team of {app.teamSize}
                                                    </p>
                                                </div>

                                                <span className="inst-pitch-status" style={{ background: conf.bg, color: conf.color }}>
                                                    {conf.label}
                                                </span>
                                            </div>

                                            <div className="inst-pitch-body">
                                                <p className="inst-pitch-summary">{app.pitchSummary}</p>
                                            </div>

                                            <div className="inst-pitch-meta">
                                                <span>
                                                    <Calendar size={13} /> Submitted {new Date(app.submittedAt).toLocaleDateString()}
                                                </span>
                                                {app.deckUrl && (
                                                    <a
                                                        href={app.deckUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inst-pitch-deck-link"
                                                    >
                                                        <ExternalLink size={13} /> View Pitch Deck
                                                    </a>
                                                )}
                                            </div>

                                            <div className="inst-pitch-actions">
                                                <span className="inst-action-label">Evaluation Action:</span>
                                                <button
                                                    className="inst-btn-act"
                                                    onClick={() => handleStatusChange(app.id, 'under_review')}
                                                    disabled={app.status === 'under_review'}
                                                >
                                                    Mark In Review
                                                </button>
                                                <button
                                                    className="inst-btn-act inst-btn-purple"
                                                    onClick={() => handleStatusChange(app.id, 'shortlisted')}
                                                    disabled={app.status === 'shortlisted'}
                                                >
                                                    Shortlist for Pitch
                                                </button>
                                                <button
                                                    className="inst-btn-act inst-btn-green"
                                                    onClick={() => handleStatusChange(app.id, 'selected')}
                                                    disabled={app.status === 'selected'}
                                                >
                                                    Award Grant / Incubate 🏆
                                                </button>
                                                <button
                                                    className="inst-btn-act inst-btn-gray"
                                                    onClick={() => handleStatusChange(app.id, 'rejected')}
                                                    disabled={app.status === 'rejected'}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Cohorts View */}
                {tab === 'cohorts' && (
                    <div className="inst-inc-tab-pane">
                        <div className="inst-cohort-list">
                            {programs.map(p => (
                                <div key={p.id} className="inst-cohort-card">
                                    <div className="inst-cohort-top">
                                        <div>
                                            <span className="inst-cohort-inst">{p.institutionName} • {p.mode}</span>
                                            <h3 className="inst-cohort-title">{p.title}</h3>
                                            <p className="inst-cohort-sub">{p.organizer} • {p.cohort}</p>
                                        </div>
                                        <div className="inst-cohort-grant-badge">
                                            <Award size={16} />
                                            <span>{p.grantAmount}</span>
                                        </div>
                                    </div>
                                    <p className="inst-cohort-desc">{p.description}</p>
                                    <div className="inst-cohort-perks">
                                        {p.perks.map((perk, i) => (
                                            <span key={i} className="inst-cohort-perk-tag">✓ {perk}</span>
                                        ))}
                                    </div>
                                    <div className="inst-cohort-footer">
                                        <span>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>
                                        <span className="inst-cohort-status-tag">● {p.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Launch Cohort Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="inst-modal-backdrop" onClick={() => setShowModal(false)}>
                        <motion.div
                            className="inst-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="inst-modal-header">
                                <div>
                                    <span className="inst-modal-eyebrow">NEW INCUBATION CHALLENGE</span>
                                    <h3>Launch Incubation Cohort / Grant Pool</h3>
                                </div>
                                <button className="inst-modal-close" onClick={() => setShowModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateProgram} className="inst-modal-body">
                                <div className="inst-modal-group">
                                    <label>Cohort / Challenge Title *</label>
                                    <input
                                        required
                                        placeholder="e.g. Pre-Seed Startup Acceleration Cohort 2026"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                    />
                                </div>

                                <div className="inst-modal-grid">
                                    <div className="inst-modal-group">
                                        <label>Organizer (Department / Center)</label>
                                        <input
                                            placeholder="e.g. Foundation for Innovation / E-Cell"
                                            value={newOrganizer}
                                            onChange={e => setNewOrganizer(e.target.value)}
                                        />
                                    </div>
                                    <div className="inst-modal-group">
                                        <label>Cohort Identifier</label>
                                        <input
                                            placeholder="e.g. Batch 5 (Summer 2026)"
                                            value={newCohort}
                                            onChange={e => setNewCohort(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="inst-modal-grid">
                                    <div className="inst-modal-group">
                                        <label>Grant & Funding Pool</label>
                                        <input
                                            placeholder="e.g. Up to ₹25,00,000 NIDHI-PRAYAS Grant"
                                            value={newGrant}
                                            onChange={e => setNewGrant(e.target.value)}
                                        />
                                    </div>
                                    <div className="inst-modal-group">
                                        <label>Application Window (Days)</label>
                                        <input
                                            type="number"
                                            min={7}
                                            max={90}
                                            value={newDeadlineDays}
                                            onChange={e => setNewDeadlineDays(parseInt(e.target.value) || 30)}
                                        />
                                    </div>
                                </div>

                                <div className="inst-modal-group">
                                    <label>Description & Scope *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Detail the incubation objectives, support offered, mentoring tracks and Demo Day showcase..."
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                    />
                                </div>

                                <div className="inst-modal-group">
                                    <label>Perks & Facilities (comma-separated)</label>
                                    <input
                                        placeholder="Supercomputing FabLab, Patent filing reimbursement, $100K Cloud credits"
                                        value={newPerks}
                                        onChange={e => setNewPerks(e.target.value)}
                                    />
                                </div>

                                <div className="inst-modal-group">
                                    <label>Eligibility Criteria</label>
                                    <input
                                        placeholder="e.g. Undergraduate / postgraduate student teams with working hardware or software prototypes"
                                        value={newEligibility}
                                        onChange={e => setNewEligibility(e.target.value)}
                                    />
                                </div>

                                <div className="inst-modal-actions">
                                    <button type="button" className="inst-btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="inst-btn-primary" disabled={creating}>
                                        {creating ? <><Loader2 size={16} className="spin" /> Launching...</> : 'Launch Cohort'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
