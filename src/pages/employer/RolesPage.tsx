import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    generateCapabilityModel, postRole, getPostedRoles,
    deletePostedRole, updatePostedRole,
    type PostedRole, type CapabilityModel, type PostingType,
} from '../../services/employerService';
import {
    ArrowRight, Search, Loader2, Plus, Briefcase, BookOpen,
    GraduationCap, FlaskConical, CheckCircle2, Trash2,
    Globe, Calendar, DollarSign, Users, AlertCircle, Copy, Clock,
    Rocket,
} from 'lucide-react';
import './RolesPage.css';

const TIME_PRESETS = [
    { label: '11:59 PM', value: '23:59', desc: 'End of Day cutoff' },
    { label: '06:00 PM', value: '18:00', desc: 'Office EOD cutoff' },
    { label: '12:00 PM', value: '12:00', desc: 'Noon cutoff' },
    { label: '09:00 AM', value: '09:00', desc: 'Morning cutoff' },
];

const TYPE_LABELS: Record<PostingType, string> = {
    placement: '💼 Placement',
    internship: '🎓 Internship',
    training: '📚 Training Program',
    fdp: '🏫 FDP (Faculty Dev.)',
    research: '🔬 Research Project',
    apprenticeship: '🔧 Apprenticeship',
};

const TYPE_COLORS: Record<PostingType, string> = {
    placement: '#2563eb',
    internship: '#10b981',
    training: '#7c3aed',
    fdp: '#f59e0b',
    research: '#0ea5e9',
    apprenticeship: '#f4845f',
};

export default function RolesPage() {
    const { user, dbUid } = useAuth();
    const [roleQuery, setRoleQuery] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [model, setModel] = useState<CapabilityModel | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Post role form
    const [showPostForm, setShowPostForm] = useState(false);
    const [posting, setPosting] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);
    const [formData, setFormData] = useState({
        location: 'India',
        remote: false,
        salary: '',
        stipend: '',
        duration: '',
        deadline: '',          // date part: 'YYYY-MM-DD'
        deadlineTime: '23:59', // time part: 'HH:mm'
        description: '',
        customQuestions: '',
        seatCapacity: '',
        autoCloseOnSeatCap: false,
        isStartupRole: false,
        startupStage: 'MVP' as 'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Growth',
        equityRange: '',
    });

    // My posted roles
    const [myRoles, setMyRoles] = useState<PostedRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [activeTab, setActiveTab] = useState<'generate' | 'my-roles'>('generate');

    const storedProfile = (() => {
        try { return JSON.parse(localStorage.getItem('employerProfile') || '{}'); } catch { return {}; }
    })();
    const companyName = user?.displayName || storedProfile.companyName || 'Your Company';

    useEffect(() => {
        if (!user || activeTab !== 'my-roles') return;
        setLoadingRoles(true);
        getPostedRoles(dbUid!)
            .then(setMyRoles)
            .catch(console.error)
            .finally(() => setLoadingRoles(false));
    }, [user, activeTab]);

    const handleAnalyze = async () => {
        if (!roleQuery.trim()) return;
        setAnalyzing(true);
        setError(null);
        setModel(null);
        setShowPostForm(false);
        try {
            const result = await generateCapabilityModel(roleQuery, formData.description || undefined);
            if (!result) throw new Error('AI did not return a valid capability model.');
            setModel(result);
            setShowPostForm(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to generate capability model.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePost = async () => {
        if (!user || !model) return;
        setPosting(true);
        setPostSuccess(false);
        
        // Combine deadline date + time into a single ISO-like string
        const deadlineValue = formData.deadline
            ? `${formData.deadline}T${formData.deadlineTime || '23:59'}:00`
            : undefined;

        const rolePayload: any = {
            employerUid: dbUid!,
            companyName,
            title: model.role,
            type: model.type,
            location: formData.location || 'India',
            remote: !!formData.remote,
            description: formData.description || model.summary || '',
            requiredSkills: model.suggestedSkills || [],
            requiredCapabilities: (model.capabilities || []).map(c => ({ skill: c.label || 'Skill', required: c.required || 0 })),
            tags: model.suggestedSkills || [],
            status: 'active',
        };
        if (deadlineValue) rolePayload.deadline = deadlineValue;
        if (formData.salary) rolePayload.salary = formData.salary;
        if (formData.stipend) rolePayload.stipend = formData.stipend;
        if (formData.duration || model.suggestedDuration) rolePayload.duration = formData.duration || model.suggestedDuration;
        if (formData.seatCapacity) rolePayload.seatCapacity = parseInt(formData.seatCapacity, 10);
        if (formData.autoCloseOnSeatCap) rolePayload.autoCloseOnSeatCap = true;

        if (formData.isStartupRole) {
            rolePayload.isStartupRole = true;
            rolePayload.startupStage = formData.startupStage;
            if (formData.equityRange) rolePayload.equityRange = formData.equityRange;
            rolePayload.tags = Array.from(new Set([...(rolePayload.tags || []), 'Startup', formData.startupStage]));
        }

        try {
            await postRole(dbUid!, rolePayload);
            setPostSuccess(true);
            setTimeout(() => {
                setPostSuccess(false);
                setShowPostForm(false);
                setModel(null);
                setRoleQuery('');
                setActiveTab('my-roles');
            }, 2000);
        } catch (e: any) {
            console.error("Error posting role:", e);
            setError(e?.message || 'Failed to post role. Please try again.');
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (role: PostedRole) => {
        if (!user || !role.id) return;
        if (!confirm(`Delete "${role.title}"? This cannot be undone.`)) return;
        await deletePostedRole(dbUid!, role.id);
        setMyRoles(prev => prev.filter(r => r.id !== role.id));
    };

    const handleToggleStatus = async (role: PostedRole) => {
        if (!user || !role.id) return;
        const newStatus = role.status === 'active' ? 'closed' : 'active';
        await updatePostedRole(dbUid!, role.id, { status: newStatus });
        setMyRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
    };

    const handleCloneRole = (role: PostedRole) => {
        setRoleQuery(role.title + ' (Copy)');
        const [dlDate, dlTime] = (role.deadline || '').split('T');
        setFormData({
            location: role.location || 'India',
            remote: !!role.remote,
            salary: role.salary || '',
            stipend: role.stipend || '',
            duration: role.duration || '',
            deadline: dlDate || '',
            deadlineTime: dlTime ? dlTime.substring(0, 5) : '23:59',
            description: role.description || '',
            customQuestions: '',
            seatCapacity: role.seatCapacity ? String(role.seatCapacity) : '',
            autoCloseOnSeatCap: role.autoCloseOnSeatCap || false,
            isStartupRole: role.isStartupRole || false,
            startupStage: role.startupStage || 'MVP',
            equityRange: role.equityRange || '',
        });
        setModel({
            role: role.title + ' (Copy)',
            type: role.type,
            summary: role.description || '',
            capabilities: role.requiredCapabilities ? role.requiredCapabilities.map(c => ({ label: c.skill, weight: (c as any).weight || 1, required: c.required })) : [],
            suggestedSkills: role.requiredSkills || [],
            suggestedDuration: role.duration
        });
        setShowPostForm(true);
        setActiveTab('generate');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Quick Date Shortcuts
    const setQuickDays = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setFormData(f => ({ ...f, deadline: `${yyyy}-${mm}-${dd}` }));
    };

    const setQuickMonthEnd = () => {
        const d = new Date();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const yyyy = end.getFullYear();
        const mm = String(end.getMonth() + 1).padStart(2, '0');
        const dd = String(end.getDate()).padStart(2, '0');
        setFormData(f => ({ ...f, deadline: `${yyyy}-${mm}-${dd}` }));
    };

    // Format deadline for display in My Roles cards
    const formatDeadline = (dl?: string) => {
        if (!dl) return null;
        try {
            const d = new Date(dl);
            return isNaN(d.getTime()) ? dl : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        } catch { return dl; }
    };

    return (
        <div className="roles-page">
            <FloatingNavbar variant="employer" />
            <main className="roles-main">
                <motion.div className="roles-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="roles-eyebrow">ROLE INTELLIGENCE</p>
                    <h1 className="roles-title">From description<br /><em>to live opportunity.</em></h1>
                    <p className="roles-sub">
                        Enter any role, internship, FDP, or research project — CapAble? extracts the capability model and posts it live to student feeds.
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="roles-tabs">
                    <button
                        className={`roles-tab ${activeTab === 'generate' ? 'active' : ''}`}
                        onClick={() => setActiveTab('generate')}
                    >
                        <Plus size={14} /> Post New Opportunity
                    </button>
                    <button
                        className={`roles-tab ${activeTab === 'my-roles' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-roles')}
                    >
                        <Briefcase size={14} /> My Posted Roles {myRoles.length > 0 && <span className="roles-tab-badge">{myRoles.length}</span>}
                    </button>
                </div>

                {/* ── Generate Tab ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'generate' && (
                        <motion.div key="gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            {/* Search Card */}
                            <div className="roles-search-card">
                                {/* Templates */}
                                <div className="roles-templates-row">
                                    <span className="roles-template-label">Quick Templates:</span>
                                    {['Frontend Engineer', 'Backend Developer', 'Data Scientist', 'Marketing Intern', 'Product Manager', 'ML Research Intern'].map(t => (
                                        <button key={t} className="roles-template-chip" onClick={() => setRoleQuery(t)}>
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {/* Search input */}
                                <div className="roles-search-row">
                                    <div className="roles-search-wrap">
                                        <Search size={15} className="roles-search-icon" />
                                        <input
                                            className="roles-search-input"
                                            value={roleQuery}
                                            onChange={e => setRoleQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                                            placeholder="Job title — e.g. Frontend Engineer, ML Internship, FDP in AI…"
                                        />
                                    </div>
                                    <button className="roles-analyze-btn" onClick={handleAnalyze} disabled={analyzing || !roleQuery.trim()}>
                                        {analyzing
                                            ? <><Loader2 size={15} className="spin" /> Analysing…</>
                                            : <>Extract Model <ArrowRight size={14} /></>
                                        }
                                    </button>
                                </div>

                                <textarea
                                    className="roles-desc-input"
                                    placeholder="Paste full Job Description here to extract skills and capabilities more accurately (optional)…"
                                    value={formData.description}
                                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            {error && (
                                <div className="roles-error" style={{ marginTop: 12 }}>
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}

                            {analyzing && (
                                <div className="roles-analyzing" style={{ marginTop: 12 }}>
                                    <div className="roles-analyzing-spinner" />
                                    <span>Extracting capability model using AI — this takes a few seconds…</span>
                                </div>
                            )}

                            {/* Capability Model Result */}
                            {model && !analyzing && (
                                <motion.div className="roles-result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                    {/* Pipeline steps */}
                                    <div className="roles-pipeline">
                                        {['DESCRIPTION', 'SKILL EXTRACTION', 'CAPABILITY MODEL', 'LIVE POSTING'].map((step, i) => (
                                            <span key={step} className="roles-pipeline-step">
                                                <motion.span
                                                    className="roles-pipeline-label"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.15 }}
                                                >{step}</motion.span>
                                                {i < 3 && <ArrowRight size={13} className="roles-pipeline-arrow" />}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="roles-result-layout">
                                        {/* Capability model */}
                                        <div className="roles-capability-model">
                                            <div className="roles-model-header">
                                                <p className="roles-result-label">REQUIRED CAPABILITIES — {model.role}</p>
                                                <span
                                                    className="roles-type-badge"
                                                    style={{ background: TYPE_COLORS[model.type] + '15', color: TYPE_COLORS[model.type] }}
                                                >
                                                    {TYPE_LABELS[model.type]}
                                                </span>
                                            </div>
                                            <p className="roles-model-summary">{model.summary}</p>
                                            <div className="roles-caps">
                                                {model.capabilities.map((cap, i) => (
                                                    <motion.div
                                                        key={cap.label}
                                                        className="roles-cap-item"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                    >
                                                        <div className="roles-cap-header">
                                                            <span className="roles-cap-name">{cap.label}</span>
                                                            <span className="roles-cap-weight">{Math.round(cap.weight * 100)}% weight</span>
                                                        </div>
                                                        <div className="roles-cap-track">
                                                            <div className="roles-cap-fill" style={{ width: `${cap.required}%` }} />
                                                        </div>
                                                        <span className="roles-cap-req">Required: {cap.required}%</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="roles-skill-tags">
                                                {model.suggestedSkills.map(s => (
                                                    <span key={s} className="roles-skill-tag">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Post form — glassmorphism panel */}
                                        <div className="roles-post-form">
                                            <p className="roles-result-label">📤 Post This Opportunity</p>

                                            <div className="roles-form-group">
                                                <label>📍 Location</label>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                                                    placeholder="e.g. Mumbai, India"
                                                />
                                            </div>

                                            <label className="roles-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.remote}
                                                    onChange={e => setFormData(f => ({ ...f, remote: e.target.checked }))}
                                                />
                                                🌐 Remote / Work from Home
                                            </label>

                                            {model.type === 'placement' && (
                                                <div className="roles-form-group">
                                                    <label>💰 Salary / CTC (optional)</label>
                                                    <input type="text" value={formData.salary}
                                                        onChange={e => setFormData(f => ({ ...f, salary: e.target.value }))}
                                                        placeholder="e.g. ₹8–12 LPA" />
                                                </div>
                                            )}

                                            {(model.type === 'internship' || model.type === 'fdp' || model.type === 'apprenticeship') && (
                                                <div className="roles-form-group">
                                                    <label>💵 Stipend (optional)</label>
                                                    <input type="text" value={formData.stipend}
                                                        onChange={e => setFormData(f => ({ ...f, stipend: e.target.value }))}
                                                        placeholder="e.g. ₹15,000/month" />
                                                </div>
                                            )}

                                            <div className="roles-form-group">
                                                <label>⏱ Duration (optional)</label>
                                                <input type="text" value={formData.duration}
                                                    onChange={e => setFormData(f => ({ ...f, duration: e.target.value }))}
                                                    placeholder={model.suggestedDuration || 'e.g. 6 months'} />
                                            </div>

                                            {/* ── Startup & Venture Track Toggle ── */}
                                            <div style={{
                                                background: formData.isStartupRole ? '#f5f3ff' : '#f8fafc',
                                                border: `1.5px solid ${formData.isStartupRole ? '#c4b5fd' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '14px',
                                                marginTop: '8px',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0, userSelect: 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Rocket size={16} color={formData.isStartupRole ? '#7c3aed' : '#64748b'} />
                                                        <div>
                                                            <strong style={{ fontSize: '13px', color: formData.isStartupRole ? '#5b21b6' : '#334155', display: 'block' }}>
                                                                Startup & Venture Track
                                                            </strong>
                                                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                                                Flag role for early-stage founding teams, co-founders & equity stakes
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isStartupRole}
                                                        onChange={e => setFormData(f => ({ ...f, isStartupRole: e.target.checked }))}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7c3aed' }}
                                                    />
                                                </label>

                                                {formData.isStartupRole && (
                                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <div className="roles-form-group">
                                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4c1d95' }}>Startup Venture Stage</label>
                                                            <select
                                                                value={formData.startupStage}
                                                                onChange={e => setFormData(f => ({ ...f, startupStage: e.target.value as any }))}
                                                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                                                            >
                                                                <option value="Idea">Idea Stage (Pre-product)</option>
                                                                <option value="Prototype">Prototype / Lab Stage</option>
                                                                <option value="MVP">MVP (Working Beta)</option>
                                                                <option value="Early Traction">Early Traction / Incubated</option>
                                                                <option value="Growth">Growth / Seed Funded</option>
                                                            </select>
                                                        </div>
                                                        <div className="roles-form-group">
                                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4c1d95' }}>Equity / Stake Offer (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={formData.equityRange}
                                                                onChange={e => setFormData(f => ({ ...f, equityRange: e.target.value }))}
                                                                placeholder="e.g. 2% – 5% or Co-Founder Equity"
                                                                style={{ background: '#fff' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="roles-form-divider" />

                                            {/* ── Deadline: date + exact time ── */}
                                            <div className="roles-form-group roles-deadline-section">
                                                <div className="roles-section-header">
                                                    <label><Calendar size={13} /> Application Deadline</label>
                                                    {formData.deadline && (
                                                        <button
                                                            type="button"
                                                            className="roles-clear-link"
                                                            onClick={() => setFormData(f => ({ ...f, deadline: '', deadlineTime: '23:59' }))}
                                                        >
                                                            ✕ Clear
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Quick Date Shortcuts */}
                                                <div className="roles-quick-row">
                                                    <span className="roles-quick-title">Quick:</span>
                                                    <button type="button" className="roles-quick-chip" onClick={() => setQuickDays(3)}>+3 Days</button>
                                                    <button type="button" className="roles-quick-chip" onClick={() => setQuickDays(7)}>+1 Wk</button>
                                                    <button type="button" className="roles-quick-chip" onClick={() => setQuickDays(14)}>+2 Wks</button>
                                                    <button type="button" className="roles-quick-chip" onClick={setQuickMonthEnd}>Month End</button>
                                                </div>

                                                {/* Side by side Date and Exact Cutoff Time (NEVER disabled!) */}
                                                <div className="roles-deadline-row">
                                                    <div className="roles-field-with-label">
                                                        <span className="roles-field-sub">End Date</span>
                                                        <input
                                                            type="date"
                                                            value={formData.deadline}
                                                            onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="roles-field-with-label">
                                                        <span className="roles-field-sub">Cutoff Time</span>
                                                        <input
                                                            type="time"
                                                            value={formData.deadlineTime}
                                                            onChange={e => setFormData(f => ({ ...f, deadlineTime: e.target.value }))}
                                                            title="Set exact cutoff time"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quick Time Presets */}
                                                <div className="roles-quick-row">
                                                    <span className="roles-quick-title">Time:</span>
                                                    {TIME_PRESETS.map(p => (
                                                        <button
                                                            key={p.value}
                                                            type="button"
                                                            className={`roles-quick-chip ${formData.deadlineTime === p.value ? 'active' : ''}`}
                                                            onClick={() => setFormData(f => ({ ...f, deadlineTime: p.value }))}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {formData.deadline ? (
                                                    <div className="roles-cutoff-summary active">
                                                        <CheckCircle2 size={13} />
                                                        <span>
                                                            Closes on <strong>{new Date(`${formData.deadline}T${formData.deadlineTime || '23:59'}:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong> at <strong>{new Date(`${formData.deadline}T${formData.deadlineTime || '23:59'}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="roles-deadline-hint">
                                                        <Clock size={12} /> Cutoff set to <strong>{new Date(`1970-01-01T${formData.deadlineTime || '23:59'}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong>. Pick date above to apply.
                                                    </span>
                                                )}
                                            </div>

                                            <div className="roles-form-group">
                                                <label>🪑 Seat Limit (optional)</label>
                                                <input
                                                    type="number" min="1"
                                                    placeholder="e.g. 10 — auto-close after limit"
                                                    value={formData.seatCapacity || ''}
                                                    onChange={e => setFormData(f => ({ ...f, seatCapacity: e.target.value }))}
                                                />
                                            </div>

                                            {formData.seatCapacity && (
                                                <label className="roles-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!formData.autoCloseOnSeatCap}
                                                        onChange={e => setFormData(f => ({ ...f, autoCloseOnSeatCap: e.target.checked }))}
                                                    />
                                                    🔒 Auto-close when seat limit is reached
                                                </label>
                                            )}

                                            <div className="roles-form-divider" />

                                            <div className="roles-form-group">
                                                <label>📝 Description override (AI summary used if blank)</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                                    rows={3}
                                                    placeholder={model.summary}
                                                />
                                            </div>

                                            <div className="roles-form-group">
                                                <label>❓ Custom Questions (one per line)</label>
                                                <textarea
                                                    value={formData.customQuestions}
                                                    onChange={e => setFormData(f => ({ ...f, customQuestions: e.target.value }))}
                                                    rows={2}
                                                    placeholder="e.g. Why do you want to join our company?"
                                                />
                                            </div>

                                            <label className="roles-checkbox-label">
                                                <input type="checkbox" defaultChecked />
                                                🔔 Notify eligible candidates automatically
                                            </label>

                                            {postSuccess && (
                                                <div className="roles-success">
                                                    <CheckCircle2 size={15} /> Role posted! Now visible to students.
                                                </div>
                                            )}

                                            <button
                                                className="roles-post-btn"
                                                onClick={handlePost}
                                                disabled={posting || postSuccess}
                                            >
                                                {posting
                                                    ? <><Loader2 size={15} className="spin" /> Publishing…</>
                                                    : postSuccess
                                                    ? <><CheckCircle2 size={15} /> Published!</>
                                                    : <>🚀 Post Live to Student Feed <ArrowRight size={14} /></>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ── My Roles Tab ── */}
                    {activeTab === 'my-roles' && (
                        <motion.div key="my" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {loadingRoles && (
                                <div className="roles-loading">
                                    <Loader2 size={24} className="spin" /> Loading your posted roles…
                                </div>
                            )}
                            {!loadingRoles && myRoles.length === 0 && (
                                <div className="roles-empty">
                                    <Briefcase size={32} color="#94a3b8" />
                                    <p>No roles posted yet.</p>
                                    <p className="roles-empty-sub">Use the "Post New Opportunity" tab to publish your first role to students.</p>
                                </div>
                            )}
                            <div className="roles-my-list">
                                {myRoles.map((role, i) => (
                                    <motion.div
                                        key={role.id}
                                        className={`roles-my-card ${role.status === 'closed' ? 'closed' : ''}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <div className="roles-my-card-header">
                                            <div>
                                                <h3 className="roles-my-title">{role.title}</h3>
                                                <span
                                                    className="roles-type-badge"
                                                    style={{ background: TYPE_COLORS[role.type] + '15', color: TYPE_COLORS[role.type] }}
                                                >
                                                    {TYPE_LABELS[role.type]}
                                                </span>
                                                {role.isStartupRole && (
                                                    <span
                                                        className="roles-type-badge"
                                                        style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', marginLeft: '6px' }}
                                                    >
                                                        <Rocket size={11} style={{ display: 'inline', marginRight: 4 }} />
                                                        Startup {role.startupStage ? `• ${role.startupStage}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="roles-my-actions">
                                                <button
                                                    className={`roles-status-btn ${role.status === 'active' ? 'active' : 'closed'}`}
                                                    onClick={() => handleToggleStatus(role)}
                                                >
                                                    {role.status === 'active' ? 'Active' : 'Closed'}
                                                </button>
                                                <button className="roles-delete-btn" onClick={() => handleCloneRole(role)} title="Clone Role" style={{ color: '#0ea5e9' }}>
                                                    <Copy size={14} />
                                                </button>
                                                <button className="roles-delete-btn" onClick={() => handleDelete(role)} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="roles-my-meta">
                                            <span><Globe size={13} /> {role.location}{role.remote ? ' · Remote' : ''}</span>
                                            {role.salary && <span><DollarSign size={13} /> {role.salary}</span>}
                                            {role.stipend && <span><DollarSign size={13} /> {role.stipend}</span>}
                                            {role.duration && <span><Calendar size={13} /> {role.duration}</span>}
                                            <span><Users size={13} /> {role.applicantCount ?? 0} applicants</span>
                                        </div>
                                        <div className="roles-skill-tags">
                                            {role.tags.slice(0, 5).map(t => <span key={t} className="roles-skill-tag">{t}</span>)}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
