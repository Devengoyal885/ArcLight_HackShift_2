import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getPostedRoles, getApplicationsForRole, type PostedRole, type RoleApplication } from '../../services/employerService';
import {
    PIPELINE_STAGES, STAGE_CONFIG, moveApplication, autoShortlist,
    generateOfferLetter, type PipelineStage, type OfferLetterData,
} from '../../services/pipelineService';
import { Link } from 'react-router-dom';
import {
    Kanban, ChevronRight, ChevronLeft, Loader2, Users, Briefcase,
    Zap, FileText, ExternalLink, AlertCircle, Trophy, X, Settings2,
    ArrowRight, Check, Download, GitCompare
} from 'lucide-react';
import { CandidateComparisonModal } from '../../components/ui/CandidateComparisonModal';
import './PipelinePage.css';

/** Export all pipeline candidates for a role as CSV */
function exportPipelineCSV(apps: AppWithMeta[], roleTitle: string) {
    const header = ['Name', 'Email', 'Stage', 'Match Score (%)', 'Applied At'];
    const rows = apps.map(a => [
        a.candidateName,
        a.candidateEmail,
        a.status,
        a.capabilityMatch ?? '',
        a.appliedAt ? new Date((a.appliedAt as any).seconds * 1000).toLocaleDateString('en-IN') : '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_${roleTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

type AppWithMeta = RoleApplication & { id: string };

function getInitials(name: string) {
    return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Offer Letter Modal ────────────────────────────────────────────────────────
function OfferModal({ app, companyName, onClose }: { app: AppWithMeta; companyName: string; onClose: () => void }) {
    const [form, setForm] = useState<OfferLetterData>({
        candidateName: app.candidateName,
        roleTitle: app.roleTitle,
        companyName,
        salary: '',
        startDate: '',
        location: 'India',
        employerName: '',
        employerDesignation: 'HR Manager',
    });

    const upd = (k: keyof OfferLetterData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div className="pipe-modal-overlay" onClick={onClose}>
            <div className="pipe-modal" onClick={e => e.stopPropagation()}>
                <div className="pipe-modal-header">
                    <FileText size={20} color="#2563eb" />
                    <h3>Generate Offer Letter</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <p className="pipe-modal-sub">For <strong>{app.candidateName}</strong> — {app.roleTitle}</p>

                <div className="pipe-modal-grid">
                    {([
                        ['CTC / Salary', 'salary', '₹6 LPA / ₹50,000/month'],
                        ['Start Date', 'startDate', '01 November 2026'],
                        ['Location', 'location', 'Bengaluru, Karnataka'],
                        ['Your Name', 'employerName', 'John Doe'],
                        ['Your Designation', 'employerDesignation', 'HR Manager'],
                    ] as [string, keyof OfferLetterData, string][]).map(([label, key, ph]) => (
                        <div key={key} className="pipe-modal-field">
                            <label>{label}</label>
                            <input
                                value={form[key] as string}
                                onChange={e => upd(key, e.target.value)}
                                placeholder={ph}
                            />
                        </div>
                    ))}
                </div>

                <button
                    className="pipe-modal-submit"
                    onClick={() => { generateOfferLetter(form); onClose(); }}
                    disabled={!form.salary || !form.startDate || !form.employerName}
                >
                    <FileText size={16} /> Generate & Print Offer Letter
                </button>
            </div>
        </div>
    );
}

// ── Auto-Shortlist Modal ──────────────────────────────────────────────────────
function AutoShortlistModal({
    apps, roleId, onDone, onClose,
}: { apps: AppWithMeta[]; roleId: string; onDone: (n: number) => void; onClose: () => void }) {
    const [threshold, setThreshold] = useState(70);
    const [running, setRunning] = useState(false);
    const eligible = apps.filter(a => a.status === 'Applied' && (a.capabilityMatch ?? 0) >= threshold);

    const run = async () => {
        setRunning(true);
        const n = await autoShortlist(apps, roleId, threshold);
        setRunning(false);
        onDone(n);
    };

    return (
        <div className="pipe-modal-overlay" onClick={onClose}>
            <div className="pipe-modal" onClick={e => e.stopPropagation()}>
                <div className="pipe-modal-header">
                    <Zap size={20} color="#f59e0b" />
                    <h3>Auto-Shortlist</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <p className="pipe-modal-sub">Move candidates scoring above threshold from <strong>Applied → Screening</strong></p>

                <div className="pipe-autoshort-threshold">
                    <label>Minimum Match Score: <strong>{threshold}%</strong></label>
                    <input
                        type="range" min={40} max={95} step={5}
                        value={threshold}
                        onChange={e => setThreshold(+e.target.value)}
                        className="pipe-slider"
                    />
                    <div className="pipe-autoshort-info">
                        <span>{eligible.length} candidates will be shortlisted</span>
                        <span>{apps.filter(a => a.status === 'Applied').length} total in Applied</span>
                    </div>
                </div>

                <button
                    className="pipe-modal-submit"
                    onClick={run}
                    disabled={running || eligible.length === 0}
                >
                    {running ? <Loader2 size={16} className="spin" /> : <Zap size={16} />}
                    {running ? 'Shortlisting...' : `Shortlist ${eligible.length} Candidates`}
                </button>
            </div>
        </div>
    );
}

// ── Candidate Card ────────────────────────────────────────────────────────────
function CandidateCard({
    app, onMove, onOffer, onCompareToggle, isCompareSelected, isPending,
}: {
    app: AppWithMeta;
    onMove: (appId: string, dir: 'next' | 'prev' | 'reject') => void;
    onOffer: (app: AppWithMeta) => void;
    onCompareToggle: (appId: string) => void;
    isCompareSelected: boolean;
    isPending: boolean;
}) {
    const stageIdx = PIPELINE_STAGES.indexOf(app.status as PipelineStage);
    const canGoNext = stageIdx < PIPELINE_STAGES.length - 1;
    const canGoPrev = stageIdx > 0;
    const isRejected = app.status === 'Rejected';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pipe-card ${isPending ? 'pipe-card--moving' : ''}`}
        >
            <div className="pipe-card-top">
                <div className="pipe-card-avatar">{getInitials(app.candidateName)}</div>
                <div className="pipe-card-info">
                    <div className="pipe-card-name">{app.candidateName}</div>
                    <div className="pipe-card-email">{app.candidateEmail}</div>
                </div>
                {(app.capabilityMatch ?? 0) > 0 && (
                    <div className={`pipe-card-match ${(app.capabilityMatch ?? 0) >= 80 ? 'high' : (app.capabilityMatch ?? 0) >= 60 ? 'mid' : 'low'}`}>
                        {app.capabilityMatch}%
                    </div>
                )}
            </div>

            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                <input type="text" placeholder="@team Add comment..." style={{ width: '100%', fontSize: '11px', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
            </div>

            <div className="pipe-card-actions">
                <Link to={`/employer/candidate/${app.candidateUid}`} className="pipe-card-btn pipe-card-btn--view">
                    <ExternalLink size={13} /> Profile
                </Link>
                <button className={`pipe-card-btn ${isCompareSelected ? 'pipe-card-btn--compare-active' : ''}`} style={isCompareSelected ? { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' } : {}} title="Select for comparison" onClick={() => onCompareToggle(app.id)}>
                    <GitCompare size={13} /> Compare
                </button>
                {app.status === 'Interview Scheduled' && (
                    <button className="pipe-card-btn" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }} title="Interview Scorecard & Panel">
                        <Trophy size={13} /> Scorecard
                    </button>
                )}
                {app.status === 'Offer Extended' && (
                    <button className="pipe-card-btn pipe-card-btn--offer" onClick={() => onOffer(app)}>
                        <FileText size={13} /> Offer Letter
                    </button>
                )}
                {!isRejected && (
                    <button
                        className="pipe-card-btn pipe-card-btn--reject"
                        onClick={() => {
                            if (window.confirm("Reject candidate? An automated rejection email will be sent.")) {
                                onMove(app.id, 'reject');
                            }
                        }}
                        disabled={isPending}
                        title="Reject & Auto-Email"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {!isRejected && (
                <div className="pipe-card-move">
                    <button
                        className="pipe-move-btn"
                        onClick={() => onMove(app.id, 'prev')}
                        disabled={!canGoPrev || isPending}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="pipe-stage-label">{app.status}</span>
                    <button
                        className="pipe-move-btn pipe-move-btn--next"
                        onClick={() => onMove(app.id, 'next')}
                        disabled={!canGoNext || isPending}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PipelinePage() {
    const { dbUid, profile } = useAuth();
    const [roles, setRoles] = useState<PostedRole[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [applications, setApplications] = useState<AppWithMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingApps, setLoadingApps] = useState(false);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [offerApp, setOfferApp] = useState<AppWithMeta | null>(null);
    const [showAutoShortlist, setShowAutoShortlist] = useState(false);
    const [shortlistResult, setShortlistResult] = useState<string | null>(null);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const toggleCompare = useCallback((appId: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(appId)) return prev.filter(id => id !== appId);
            if (prev.length >= 2) return prev;
            return [...prev, appId];
        });
    }, []);

    const companyName = (profile as any)?.companyName ?? 'Your Company';

    useEffect(() => {
        if (!dbUid) return;
        getPostedRoles(dbUid).then(r => {
            setRoles(r);
            if (r.length > 0) setSelectedRoleId(r[0].id!);
        }).finally(() => setLoading(false));
    }, [dbUid]);

    useEffect(() => {
        if (!selectedRoleId) return;
        setLoadingApps(true);
        getApplicationsForRole(selectedRoleId)
            .then(apps => setApplications(apps as AppWithMeta[]))
            .finally(() => setLoadingApps(false));
    }, [selectedRoleId]);

    const handleMove = useCallback(async (appId: string, dir: 'next' | 'prev' | 'reject') => {
        const app = applications.find(a => a.id === appId);
        if (!app || !selectedRoleId) return;

        const stageIdx = PIPELINE_STAGES.indexOf(app.status as PipelineStage);
        let newStage: PipelineStage;
        if (dir === 'reject') newStage = 'Rejected';
        else if (dir === 'next') newStage = PIPELINE_STAGES[Math.min(stageIdx + 1, PIPELINE_STAGES.length - 1)];
        else newStage = PIPELINE_STAGES[Math.max(stageIdx - 1, 0)];

        setPendingIds(s => new Set(s).add(appId));
        try {
            await moveApplication(selectedRoleId, appId, newStage);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStage } : a));
        } finally {
            setPendingIds(s => { const n = new Set(s); n.delete(appId); return n; });
        }
    }, [applications, selectedRoleId]);

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const appsByStage = (stage: PipelineStage | 'Rejected') =>
        applications.filter(a => a.status === stage);

    const kpis = [
        { label: 'Total Applied', value: applications.length, color: '#2563eb' },
        { label: 'Shortlisted', value: appsByStage('Screening').length, color: '#f59e0b' },
        { label: 'Offers Extended', value: appsByStage('Offer Extended').length, color: '#10b981' },
        { label: 'Placed', value: appsByStage('Placed').length, color: '#059669' },
    ];

    return (
        <div className="pipe-page">
            <FloatingNavbar variant="employer" />

            <div className="pipe-content">
                <motion.header className="pipe-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <Kanban size={28} color="#2563eb" />
                    <div>
                        <h1>Hiring Pipeline</h1>
                        <p>Drag candidates through your hiring funnel stage by stage</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {selectedRoleId && applications.length > 0 && (
                            <button className="pipe-autoshort-btn" onClick={() => setShowAutoShortlist(true)}>
                                <Zap size={15} /> Auto-Shortlist & Bulk Move
                            </button>
                        )}
                        {applications.length > 0 && selectedRole && (
                            <button
                                className="pipe-autoshort-btn"
                                style={{ background: '#0f172a' }}
                                onClick={() => exportPipelineCSV(applications, selectedRole.title)}
                                title="Export pipeline as CSV"
                            >
                                <Download size={15} /> Export CSV
                            </button>
                        )}
                    </div>
                </motion.header>

                {/* Role selector */}
                {!loading && roles.length > 0 && (
                    <div className="pipe-role-tabs">
                        {roles.map(r => (
                            <button
                                key={r.id}
                                className={`pipe-role-tab ${selectedRoleId === r.id ? 'active' : ''}`}
                                onClick={() => setSelectedRoleId(r.id!)}
                            >
                                <Briefcase size={13} /> {r.title}
                                <span className="pipe-role-tab-count">
                                    {applications.filter(a => a.status !== 'Rejected').length}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* KPIs */}
                {!loadingApps && applications.length > 0 && (
                    <motion.div className="pipe-kpis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {kpis.map(k => (
                            <div key={k.label} className="pipe-kpi">
                                <div className="pipe-kpi-val" style={{ color: k.color }}>{k.value}</div>
                                <div className="pipe-kpi-label">{k.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Auto-shortlist toast */}
                <AnimatePresence>
                    {shortlistResult && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="pipe-shortlist-toast"
                            onAnimationComplete={() => setTimeout(() => setShortlistResult(null), 3000)}
                        >
                            <Check size={16} /> {shortlistResult}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="pipe-empty"><Loader2 size={32} className="spin" /><p>Loading roles...</p></div>
                ) : roles.length === 0 ? (
                    <div className="pipe-empty">
                        <Briefcase size={48} color="#e2e8f0" />
                        <h3>No roles posted yet</h3>
                        <p>Post a role first to start managing your hiring pipeline.</p>
                        <Link to="/employer/roles" className="pipe-cta">Post a Role <ArrowRight size={14} /></Link>
                    </div>
                ) : loadingApps ? (
                    <div className="pipe-empty"><Loader2 size={32} className="spin" /><p>Loading applications...</p></div>
                ) : applications.length === 0 ? (
                    <div className="pipe-empty">
                        <Users size={48} color="#e2e8f0" />
                        <h3>No applications yet</h3>
                        <p>Share your role link with candidates to get applications.</p>
                    </div>
                ) : (
                    /* ── Kanban Board ── */
                    <div className="pipe-board">
                        {PIPELINE_STAGES.map(stage => {
                            const cfg = STAGE_CONFIG[stage];
                            const cols = appsByStage(stage);
                            return (
                                <div key={stage} className="pipe-column">
                                    <div className="pipe-col-header" style={{ borderTopColor: cfg.color }}>
                                        <span className="pipe-col-emoji">{cfg.emoji}</span>
                                        <span className="pipe-col-name">{stage}</span>
                                        <span className="pipe-col-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                            {cols.length}
                                        </span>
                                    </div>
                                    <div className="pipe-col-body">
                                        <AnimatePresence>
                                            {cols.map(app => (
                                                <CandidateCard
                                                    key={app.id}
                                                    app={app}
                                                    onMove={handleMove}
                                                    onOffer={setOfferApp}
                                                    onCompareToggle={toggleCompare}
                                                    isCompareSelected={selectedForCompare.includes(app.id)}
                                                    isPending={pendingIds.has(app.id)}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        {cols.length === 0 && (
                                            <div className="pipe-col-empty">Empty</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Rejected column */}
                        {appsByStage('Rejected').length > 0 && (
                            <div className="pipe-column pipe-column--rejected">
                                <div className="pipe-col-header" style={{ borderTopColor: '#ef4444' }}>
                                    <span>✖</span>
                                    <span className="pipe-col-name">Rejected</span>
                                    <span className="pipe-col-badge" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                        {appsByStage('Rejected').length}
                                    </span>
                                </div>
                                <div className="pipe-col-body">
                                    {appsByStage('Rejected').map(app => (
                                        <CandidateCard
                                            key={app.id}
                                            app={app}
                                            onMove={handleMove}
                                            onOffer={setOfferApp}
                                            onCompareToggle={toggleCompare}
                                            isCompareSelected={selectedForCompare.includes(app.id)}
                                            isPending={pendingIds.has(app.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {offerApp && (
                <OfferModal app={offerApp} companyName={companyName} onClose={() => setOfferApp(null)} />
            )}
            {showAutoShortlist && selectedRoleId && (
                <AutoShortlistModal
                    apps={applications}
                    roleId={selectedRoleId}
                    onClose={() => setShowAutoShortlist(false)}
                    onDone={n => {
                        setShowAutoShortlist(false);
                        setApplications(prev => prev.map(a =>
                            a.status === 'Applied' && (a.capabilityMatch ?? 0) >= 70
                                ? { ...a, status: 'Screening' as PipelineStage }
                                : a
                        ));
                        setShortlistResult(`✅ ${n} candidates auto-shortlisted to Screening`);
                    }}
                />
            )}

            {/* Action floating bar when candidates selected for comparison */}
            <AnimatePresence>
                {selectedForCompare.length > 0 && (
                    <motion.div 
                        className="pipe-compare-float"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                    >
                        <span>{selectedForCompare.length} selected for comparison</span>
                        <button 
                            disabled={selectedForCompare.length < 2} 
                            onClick={() => setShowCompareModal(true)}
                            className="pipe-compare-trigger-btn"
                        >
                            Compare Now
                        </button>
                        <button onClick={() => setSelectedForCompare([])} className="pipe-compare-clear-btn">Clear</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Candidate Comparison Modal */}
            {showCompareModal && selectedForCompare.length === 2 && (
                <CandidateComparisonModal 
                    candidates={applications.filter(a => selectedForCompare.includes(a.id)).map(a => ({
                        candidateUid: a.candidateUid,
                        candidateName: a.candidateName,
                        candidateHeadline: a.candidateHeadline,
                        roleTitle: selectedRole?.title || "Role",
                        status: a.status,
                        capabilityMatch: a.capabilityMatch,
                        appliedAt: a.appliedAt
                    }))} 
                    onClose={() => setShowCompareModal(false)} 
                />
            )}
        </div>
    );
}
