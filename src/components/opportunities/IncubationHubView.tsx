import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
    getIncubationPrograms,
    applyToIncubationProgram,
    type IncubationProgram
} from '../../services/ventureService';
import {
    Building2, Award, Calendar, CheckCircle2, ChevronRight,
    MapPin, Sparkles, ExternalLink, ShieldCheck, X, Loader2, Send,
    FileText, Users, DollarSign, Search
} from 'lucide-react';
import './IncubationHubView.css';

export default function IncubationHubView() {
    const { user, dbUid, profile } = useAuth();
    const [programs, setPrograms] = useState<IncubationProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Application Modal
    const [selectedProgram, setSelectedProgram] = useState<IncubationProgram | null>(null);
    const [startupName, setStartupName] = useState('');
    const [pitchSummary, setPitchSummary] = useState('');
    const [deckUrl, setDeckUrl] = useState('');
    const [teamSize, setTeamSize] = useState(2);
    const [submitting, setSubmitting] = useState(false);
    const [appSuccess, setAppSuccess] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const list = await getIncubationPrograms();
            setPrograms(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, []);

    const filtered = programs.filter(p =>
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.institutionName.toLowerCase().includes(search.toLowerCase()) ||
        p.organizer.toLowerCase().includes(search.toLowerCase()) ||
        p.grantAmount.toLowerCase().includes(search.toLowerCase())
    );

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgram || !user) return;

        setSubmitting(true);
        try {
            await applyToIncubationProgram({
                programId: selectedProgram.id,
                programTitle: selectedProgram.title,
                institutionCode: selectedProgram.institutionCode,
                applicantUid: dbUid || user.uid,
                applicantName: profile?.name || user.displayName || 'Applicant',
                applicantEmail: user.email || '',
                startupName: startupName.trim(),
                pitchSummary: pitchSummary.trim(),
                deckUrl: deckUrl.trim() || undefined,
                teamSize: Number(teamSize) || 1,
            });

            setAppSuccess(true);
            showToast(`Application submitted to ${selectedProgram.title}!`);
            setTimeout(() => {
                setAppSuccess(false);
                setSelectedProgram(null);
                setStartupName('');
                setPitchSummary('');
                setDeckUrl('');
            }, 1800);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDaysRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0) return 'Deadline Today';
        return `${days} days left`;
    };

    return (
        <div className="inc-container">
            {toast && (
                <div className="inc-toast">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{toast}</span>
                </div>
            )}

            {/* Banner */}
            <div className="inc-banner">
                <div className="inc-banner-content">
                    <span className="inc-eyebrow">
                        <Building2 size={13} /> INSTITUTIONAL E-CELLS & INCUBATION
                    </span>
                    <h2>Apply for Seed Grants, Prototyping Labs & Accelerator Cohorts</h2>
                    <p>
                        Institutional incubators and E-Cells provide verified non-dilutive grants, prototyping facilities, patent filing support, and investor demo days for student startups.
                    </p>
                </div>
                <div className="inc-banner-stats">
                    <div className="inc-stat-chip">
                        <Award size={18} color="#f59e0b" />
                        <div>
                            <strong>₹50L+</strong>
                            <span>Active Grants</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="inc-search-bar">
                <Search size={16} />
                <input
                    placeholder="Search programs by institute, grant or cohort (e.g. IIT, BITS, NIDHI)..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Program List */}
            {loading ? (
                <div className="inc-loading">
                    <Loader2 size={32} className="inc-spin" />
                    <span>Loading institutional incubation cohorts...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="inc-empty">
                    <Building2 size={36} />
                    <h3>No incubation programs found for "{search}"</h3>
                </div>
            ) : (
                <div className="inc-list">
                    {filtered.map(p => (
                        <div key={p.id} className="inc-card">
                            <div className="inc-card-top">
                                <div>
                                    <div className="inc-inst-row">
                                        <Building2 size={13} color="#4f46e5" />
                                        <span className="inc-inst-name">{p.institutionName}</span>
                                        <span className="inc-mode-badge">{p.mode}</span>
                                    </div>
                                    <h3 className="inc-card-title">{p.title}</h3>
                                    <p className="inc-organizer">Organized by {p.organizer} • {p.cohort}</p>
                                </div>

                                <div className="inc-deadline-badge">
                                    <Calendar size={13} />
                                    <span>{formatDaysRemaining(p.deadline)}</span>
                                </div>
                            </div>

                            <p className="inc-desc">{p.description}</p>

                            <div className="inc-grant-box">
                                <Award size={18} color="#d97706" />
                                <div>
                                    <span className="inc-grant-label">Grant & Funding Pool:</span>
                                    <strong className="inc-grant-value">{p.grantAmount}</strong>
                                </div>
                            </div>

                            <div className="inc-perks-section">
                                <span className="inc-perks-label">Cohort Perks & Facilities:</span>
                                <ul className="inc-perks-list">
                                    {p.perks.map((perk, i) => (
                                        <li key={i}>
                                            <CheckCircle2 size={13} color="#059669" />
                                            <span>{perk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="inc-eligibility-note">
                                <strong>Eligibility:</strong> {p.eligibility}
                            </div>

                            <div className="inc-card-footer">
                                <div className="inc-status-tag">
                                    <span className="inc-pulse-dot" />
                                    {p.status}
                                </div>

                                <button
                                    className="inc-btn-apply"
                                    onClick={() => setSelectedProgram(p)}
                                >
                                    <Sparkles size={15} /> Apply for Incubation
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Application Modal */}
            <AnimatePresence>
                {selectedProgram && (
                    <div className="inc-modal-backdrop" onClick={() => setSelectedProgram(null)}>
                        <motion.div
                            className="inc-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="inc-modal-header">
                                <div>
                                    <span className="inc-eyebrow">INCUBATION APPLICATION</span>
                                    <h3>Apply to {selectedProgram.title}</h3>
                                </div>
                                <button className="inc-modal-close" onClick={() => setSelectedProgram(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {appSuccess ? (
                                <div className="inc-modal-success">
                                    <CheckCircle2 size={48} color="#10b981" />
                                    <h4>Application Submitted!</h4>
                                    <p>
                                        Your pitch has been routed to {selectedProgram.organizer}. You will receive status updates in your Applications hub.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleApply} className="inc-modal-body">
                                    <div className="inc-summary-banner">
                                        <p><strong>Host:</strong> {selectedProgram.institutionName}</p>
                                        <p><strong>Grant Support:</strong> {selectedProgram.grantAmount}</p>
                                        <p><strong>Evaluation:</strong> Reviewing on a rolling cohort basis</p>
                                    </div>

                                    <div className="inc-form-group">
                                        <label>Startup / Prototype Name *</label>
                                        <input
                                            required
                                            placeholder="e.g. KrishiDrishti, KavachAI"
                                            value={startupName}
                                            onChange={e => setStartupName(e.target.value)}
                                        />
                                    </div>

                                    <div className="inc-form-group">
                                        <label>Executive Pitch Summary (Max 250 words) *</label>
                                        <textarea
                                            required
                                            rows={4}
                                            placeholder="Summarize the core problem, your proprietary solution/prototype, current traction, and why this incubator cohort is critical..."
                                            value={pitchSummary}
                                            onChange={e => setPitchSummary(e.target.value)}
                                        />
                                    </div>

                                    <div className="inc-form-grid">
                                        <div className="inc-form-group">
                                            <label>Team Size</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={15}
                                                value={teamSize}
                                                onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div className="inc-form-group">
                                            <label>Pitch Deck / Demo Link (Optional)</label>
                                            <input
                                                placeholder="https://drive.google.com/... or Notion link"
                                                value={deckUrl}
                                                onChange={e => setDeckUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="inc-terms-note">
                                        <ShieldCheck size={16} color="#4f46e5" />
                                        <span>
                                            Applications are reviewed under standard academic non-disclosure protocols by authorized incubator faculty and evaluation committee members.
                                        </span>
                                    </div>

                                    <div className="inc-modal-actions">
                                        <button type="button" className="inc-btn-secondary" onClick={() => setSelectedProgram(null)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="inc-btn-primary" disabled={submitting}>
                                            {submitting ? (
                                                <><Loader2 size={16} className="inc-spin" /> Submitting Application...</>
                                            ) : (
                                                <><Send size={15} /> Submit Application</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
