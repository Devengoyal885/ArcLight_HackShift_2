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
    Globe, Calendar, DollarSign, Users, AlertCircle, Copy,
} from 'lucide-react';
import './RolesPage.css';

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
        deadline: '',
        description: '',
        customQuestions: '',
        seatCapacity: '',
        autoCloseOnSeatCap: false,
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
        if (formData.salary) rolePayload.salary = formData.salary;
        if (formData.stipend) rolePayload.stipend = formData.stipend;
        if (formData.duration || model.suggestedDuration) rolePayload.duration = formData.duration || model.suggestedDuration;
        if (formData.deadline) rolePayload.deadline = formData.deadline;
        if (formData.seatCapacity) rolePayload.seatCapacity = parseInt(formData.seatCapacity, 10);
        if (formData.autoCloseOnSeatCap) rolePayload.autoCloseOnSeatCap = true;

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
        setFormData({
            location: role.location || 'India',
            remote: !!role.remote,
            salary: role.salary || '',
            stipend: role.stipend || '',
            duration: role.duration || '',
            deadline: role.deadline || '',
            description: role.description || '',
            customQuestions: '',
            seatCapacity: role.seatCapacity ? String(role.seatCapacity) : '',
            autoCloseOnSeatCap: role.autoCloseOnSeatCap || false,
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
                        <Plus size={15} /> Post New Opportunity
                    </button>
                    <button
                        className={`roles-tab ${activeTab === 'my-roles' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-roles')}
                    >
                        <Briefcase size={15} /> My Posted Roles {myRoles.length > 0 && <span className="roles-tab-badge">{myRoles.length}</span>}
                    </button>
                </div>

                {/* ── Generate Tab ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'generate' && (
                        <motion.div key="gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {/* Templates */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '14px', color: '#64748b', alignSelf: 'center' }}>Templates:</span>
                                {['Frontend Engineer', 'Backend Developer', 'Data Scientist', 'Marketing Intern', 'Product Manager'].map(t => (
                                    <button 
                                        key={t}
                                        style={{ background: '#f1f5f9', border: 'none', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                                        onClick={() => setRoleQuery(t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {/* Search input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                                <div className="roles-search-row" style={{ marginBottom: 0 }}>
                                    <div className="roles-search-wrap">
                                        <Search size={16} className="roles-search-icon" />
                                        <input
                                            className="roles-search-input"
                                            value={roleQuery}
                                            onChange={e => setRoleQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                                            placeholder="Job Title (e.g. Frontend Engineer, ML Internship…)"
                                        />
                                    </div>
                                    <button className="roles-analyze-btn" onClick={handleAnalyze} disabled={analyzing || !roleQuery.trim()}>
                                        {analyzing
                                            ? <><Loader2 size={15} className="spin" /> Analysing…</>
                                            : <>Extract Capability Model <ArrowRight size={15} /></>
                                        }
                                    </button>
                                </div>
                                <textarea
                                    className="roles-search-input"
                                    style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 12, resize: 'vertical' }}
                                    placeholder="Paste full Job Description here to extract skills and capabilities accurately..."
                                    value={formData.description}
                                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            {error && (
                                <div className="roles-error">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            {analyzing && (
                                <div className="roles-analyzing">
                                    <div className="roles-analyzing-spinner" />
                                    <p>Extracting capability model using AI…</p>
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

                                        {/* Post form */}
                                        <div className="roles-post-form">
                                            <p className="roles-result-label">POST THIS OPPORTUNITY</p>

                                            <div className="roles-form-group">
                                                <label>Location</label>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                                                    placeholder="e.g. Mumbai, India"
                                                />
                                            </div>
                                            <div className="roles-form-group">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.remote}
                                                        onChange={e => setFormData(f => ({ ...f, remote: e.target.checked }))}
                                                    />{' '}
                                                    Remote / Work from Home
                                                </label>
                                            </div>
                                            {(model.type === 'placement') && (
                                                <div className="roles-form-group">
                                                    <label>Salary / CTC (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.salary}
                                                        onChange={e => setFormData(f => ({ ...f, salary: e.target.value }))}
                                                        placeholder="e.g. ₹8-12 LPA"
                                                    />
                                                </div>
                                            )}
                                            {(model.type === 'internship' || model.type === 'fdp' || model.type === 'apprenticeship') && (
                                                <div className="roles-form-group">
                                                    <label>Stipend (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.stipend}
                                                        onChange={e => setFormData(f => ({ ...f, stipend: e.target.value }))}
                                                        placeholder="e.g. ₹15,000/month"
                                                    />
                                                </div>
                                            )}
                                            <div className="roles-form-group">
                                                <label>Duration (optional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.duration}
                                                    onChange={e => setFormData(f => ({ ...f, duration: e.target.value }))}
                                                    placeholder={model.suggestedDuration || 'e.g. 6 months'}
                                                />
                                            </div>
                                            <div className="roles-form-group">
                                                <label>Application Deadline (optional)</label>
                                                <input
                                                    type="date"
                                                    value={formData.deadline}
                                                    onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))}
                                                />
                                            </div>
                                            <div className="roles-form-group">
                                                <label>Seat / Capacity Limit (optional)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="e.g. 10 (Close applications after 10 applied)"
                                                    value={formData.seatCapacity || ''}
                                                    onChange={e => setFormData(f => ({ ...f, seatCapacity: e.target.value }))}
                                                />
                                            </div>
                                            {formData.seatCapacity && (
                                                <div className="roles-form-group">
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!formData.autoCloseOnSeatCap}
                                                            onChange={e => setFormData(f => ({ ...f, autoCloseOnSeatCap: e.target.checked }))}
                                                        />
                                                        Auto-close role when limit is reached
                                                    </label>
                                                </div>
                                            )}
                                            <div className="roles-form-group">
                                                <label>Description (optional — AI summary will be used if blank)</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                                    rows={3}
                                                    placeholder={model.summary}
                                                />
                                            </div>
                                            <div className="roles-form-group">
                                                <label>Custom Application Questions (one per line, optional)</label>
                                                <textarea
                                                    value={formData.customQuestions}
                                                    onChange={e => setFormData(f => ({ ...f, customQuestions: e.target.value }))}
                                                    rows={3}
                                                    placeholder="e.g. Why do you want to join our company?"
                                                />
                                            </div>
                                            <div className="roles-form-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer' }}>
                                                    <input type="checkbox" defaultChecked />
                                                    Automatically notify eligible candidates upon posting
                                                </label>
                                            </div>

                                            {postSuccess && (
                                                <div className="roles-success">
                                                    <CheckCircle2 size={16} /> Role posted successfully! Visible to students now.
                                                </div>
                                            )}

                                            <button
                                                className="roles-post-btn"
                                                onClick={handlePost}
                                                disabled={posting || postSuccess}
                                            >
                                                {posting
                                                    ? <><Loader2 size={15} className="spin" /> Posting…</>
                                                    : postSuccess
                                                    ? <><CheckCircle2 size={15} /> Posted!</>
                                                    : <>Post Live to Student Feed <ArrowRight size={15} /></>
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
