/**
 * DrivesAdminPage.tsx
 * ──────────────────────────────────────────────────────────
 * Institution Admin: Create, manage, and view placement drives.
 * Uses eligibilityService for CRUD on placementDrives collection.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    createPlacementDrive, getPlacementDrives, updateDriveStatus, getDriveRegistrations,
    updateOfferStatus, type PlacementDrive, type EligibilityCriteria, type DriveRegistration,
} from '../../services/eligibilityService';
import {
    Plus, Search, Building2, Briefcase, Calendar, Users, ChevronDown, ChevronUp,
    CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Edit3, Eye,
    Filter, TrendingUp, MapPin, DollarSign, X
} from 'lucide-react';
import './InstitutionSubPages.css';
import './DrivesAdminPage.css';

type DriveStatus = 'all' | 'open' | 'closed' | 'draft';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    open:   { bg: '#dcfce7', text: '#16a34a', icon: <CheckCircle2 size={13} /> },
    closed: { bg: '#fee2e2', text: '#dc2626', icon: <XCircle size={13} /> },
    draft:  { bg: '#f1f5f9', text: '#64748b', icon: <Clock size={13} /> },
};

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML', 'DS', 'Other'];

interface CreateDriveForm {
    title: string;
    company: string;
    roleTitle: string;
    package: string;
    location: string;
    description: string;
    deadline: string;
    minCGPA: string;
    allowedBranches: string[];
    maxBacklogs: string;
    graduationYear: string;
    requiredSkills: string;
    status: 'draft' | 'open';
}

const EMPTY_FORM: CreateDriveForm = {
    title: '',
    company: '',
    roleTitle: '',
    package: '',
    location: '',
    description: '',
    deadline: '',
    minCGPA: '',
    allowedBranches: [],
    maxBacklogs: '0',
    graduationYear: String(new Date().getFullYear() + 1),
    requiredSkills: '',
    status: 'open',
};

export default function DrivesAdminPage() {
    const { profile } = useAuth();
    const institutionCode = profile?.institutionCode || '';

    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<DriveStatus>('all');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<CreateDriveForm>(EMPTY_FORM);
    const [expandedDriveId, setExpandedDriveId] = useState<string | null>(null);
    const [driveRegistrations, setDriveRegistrations] = useState<Record<string, DriveRegistration[]>>({});
    const [loadingRegs, setLoadingRegs] = useState<string | null>(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!institutionCode) return;
        setLoading(true);
        getPlacementDrives(institutionCode)
            .then(setDrives)
            .catch(() => setError('Failed to load drives'))
            .finally(() => setLoading(false));
    }, [institutionCode]);

    const filtered = drives.filter(d => {
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.company.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleCreateDrive = async () => {
        setFormError('');
        if (!form.title || !form.company || !form.roleTitle || !form.deadline) {
            setFormError('Please fill all required fields.');
            return;
        }
        if (!institutionCode) { setFormError('Institution code not found. Please complete your profile.'); return; }

        setCreating(true);
        try {
            const eligibility: EligibilityCriteria = {};
            if (form.minCGPA) eligibility.minCGPA = parseFloat(form.minCGPA);
            if (form.allowedBranches.length > 0) eligibility.allowedBranches = form.allowedBranches;
            if (form.maxBacklogs !== '') eligibility.maxBacklogs = parseInt(form.maxBacklogs);
            if (form.graduationYear) eligibility.graduationYear = parseInt(form.graduationYear);
            if (form.requiredSkills) eligibility.requiredSkills = form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);

            const newDrive: Omit<PlacementDrive, 'id' | 'createdAt' | 'applicationCount'> = {
                institutionCode,
                title: form.title,
                company: form.company,
                roleTitle: form.roleTitle,
                package: form.package || undefined,
                location: form.location || undefined,
                description: form.description || undefined,
                deadline: form.deadline,
                eligibility,
                status: form.status,
            };

            const driveId = await createPlacementDrive(newDrive);
            const created: PlacementDrive = { ...newDrive, id: driveId, applicationCount: 0 };
            setDrives(prev => [created, ...prev]);
            setShowCreateModal(false);
            setForm(EMPTY_FORM);
        } catch (e: any) {
            setFormError('Failed to create drive: ' + (e.message || 'Unknown error'));
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (drive: PlacementDrive) => {
        const newStatus: PlacementDrive['status'] = drive.status === 'open' ? 'closed' : 'open';
        try {
            await updateDriveStatus(drive.id!, newStatus);
            setDrives(prev => prev.map(d => d.id === drive.id ? { ...d, status: newStatus } : d));
        } catch (e) {
            console.error('Status update failed', e);
        }
    };

    const handleViewRegistrations = async (driveId: string) => {
        if (expandedDriveId === driveId) {
            setExpandedDriveId(null);
            return;
        }
        setExpandedDriveId(driveId);
        if (driveRegistrations[driveId]) return;
        setLoadingRegs(driveId);
        try {
            const regs = await getDriveRegistrations(driveId);
            setDriveRegistrations(prev => ({ ...prev, [driveId]: regs }));
        } catch (e) {
            console.error('Failed to load registrations', e);
        } finally {
            setLoadingRegs(null);
        }
    };

    const handleUpdateOfferStatus = async (driveId: string, uid: string, status: 'pending' | 'offered' | 'rejected') => {
        try {
            await updateOfferStatus(driveId, uid, status);
            setDriveRegistrations(prev => ({
                ...prev,
                [driveId]: prev[driveId].map(r => r.uid === uid ? { ...r, offerStatus: status } : r)
            }));
        } catch (e) {
            console.error('Failed to update offer status', e);
        }
    };

    const handleUploadOfferLetter = async (driveId: string, uid: string) => {
        const url = prompt('Enter Offer Letter URL (Google Drive / PDF link):');
        if (url) {
            try {
                await updateOfferStatus(driveId, uid, 'offered', url);
                setDriveRegistrations(prev => ({
                    ...prev,
                    [driveId]: prev[driveId].map(r => r.uid === uid ? { ...r, offerStatus: 'offered', offerLetterUrl: url } : r)
                }));
            } catch (e) {
                console.error('Failed to upload offer letter', e);
            }
        }
    };

    const toggleBranch = (branch: string) => {
        setForm(prev => ({
            ...prev,
            allowedBranches: prev.allowedBranches.includes(branch)
                ? prev.allowedBranches.filter(b => b !== branch)
                : [...prev.allowedBranches, branch]
        }));
    };

    const stats = {
        total: drives.length,
        open: drives.filter(d => d.status === 'open').length,
        totalApps: drives.reduce((acc, d) => acc + (d.applicationCount || 0), 0),
    };

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">

                {/* Header */}
                <div className="inst-header">
                    <Briefcase size={28} className="inst-header-icon" />
                    <div>
                        <h1>Placement Drives</h1>
                        <p>Create and manage campus placement drives with eligibility rules and student registrations.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="drives-stats">
                    {[
                        { label: 'Total Drives', value: stats.total, color: '#2563eb', icon: <Briefcase size={18} /> },
                        { label: 'Active Drives', value: stats.open, color: '#10b981', icon: <CheckCircle2 size={18} /> },
                        { label: 'Total Applications', value: stats.totalApps, color: '#7c3aed', icon: <Users size={18} /> },
                    ].map(s => (
                        <div key={s.label} className="drives-stat-card" style={{ borderLeftColor: s.color }}>
                            <div className="drives-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            <div>
                                <div className="drives-stat-value" style={{ color: s.color }}>{s.value}</div>
                                <div className="drives-stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="inst-toolbar">
                    <div className="inst-search-bar">
                        <Search size={16} />
                        <input placeholder="Search by company or drive title…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="drives-status-tabs">
                        {(['all', 'open', 'closed', 'draft'] as DriveStatus[]).map(s => (
                            <button
                                key={s}
                                className={`drives-status-tab ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="drives-create-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> Create Drive
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="drives-error">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {/* Drives list */}
                {loading ? (
                    <div className="drives-center">
                        <Loader2 size={32} className="spin" />
                        <p>Loading placement drives…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="drives-center">
                        <Briefcase size={48} color="#94a3b8" />
                        <p>{drives.length === 0 ? 'No drives yet. Create your first placement drive!' : 'No drives match your filters.'}</p>
                        {drives.length === 0 && (
                            <button className="drives-create-btn" onClick={() => setShowCreateModal(true)}>
                                <Plus size={16} /> Create First Drive
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="drives-list">
                        <AnimatePresence>
                            {filtered.map((drive, i) => {
                                const sc = STATUS_COLORS[drive.status] || STATUS_COLORS.draft;
                                const isExpanded = expandedDriveId === drive.id;
                                const regs = driveRegistrations[drive.id!] || [];
                                const eligible = regs.filter(r => r.eligible).length;
                                return (
                                    <motion.div
                                        key={drive.id}
                                        className="drive-card"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <div className="drive-card-main">
                                            <div className="drive-company-logo">
                                                <Building2 size={22} color="#2563eb" />
                                            </div>
                                            <div className="drive-info">
                                                <div className="drive-title-row">
                                                    <h3 className="drive-title">{drive.title}</h3>
                                                    <span className="drive-status-badge" style={{ background: sc.bg, color: sc.text }}>
                                                        {sc.icon} {drive.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="drive-company">{drive.company} — {drive.roleTitle}</p>
                                                <div className="drive-meta">
                                                    {drive.location && <span><MapPin size={13} /> {drive.location}</span>}
                                                    {drive.package && <span><DollarSign size={13} /> {drive.package}</span>}
                                                    <span><Calendar size={13} /> Deadline: {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span><Users size={13} /> {drive.applicationCount || 0} applications</span>
                                                </div>
                                                <div className="drive-eligibility-preview">
                                                    {drive.eligibility.minCGPA && <span className="elig-chip">Min CGPA {drive.eligibility.minCGPA}</span>}
                                                    {drive.eligibility.maxBacklogs !== undefined && <span className="elig-chip">Max {drive.eligibility.maxBacklogs} backlogs</span>}
                                                    {drive.eligibility.graduationYear && <span className="elig-chip">Batch {drive.eligibility.graduationYear}</span>}
                                                    {drive.eligibility.allowedBranches && drive.eligibility.allowedBranches.length > 0 && (
                                                        <span className="elig-chip">{drive.eligibility.allowedBranches.slice(0, 3).join(', ')}{drive.eligibility.allowedBranches.length > 3 ? ` +${drive.eligibility.allowedBranches.length - 3}` : ''}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="drive-actions">
                                                <button
                                                    className={`drive-toggle-btn ${drive.status === 'open' ? 'close' : 'open'}`}
                                                    onClick={() => handleToggleStatus(drive)}
                                                >
                                                    {drive.status === 'open' ? 'Close Drive' : 'Open Drive'}
                                                </button>
                                                <button
                                                    className="drive-view-btn"
                                                    onClick={() => handleViewRegistrations(drive.id!)}
                                                >
                                                    <Eye size={14} />
                                                    {isExpanded ? 'Hide' : 'View'} Registrations
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Registrations panel */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    className="drive-registrations"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    {loadingRegs === drive.id ? (
                                                        <div className="drives-center" style={{ padding: '24px' }}>
                                                            <Loader2 size={20} className="spin" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="regs-summary" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '16px' }}>
                                                                        <span><strong>{regs.length}</strong> registered</span>
                                                                        <span style={{ color: '#16a34a' }}><strong>{eligible}</strong> eligible</span>
                                                                        <span style={{ color: '#dc2626' }}><strong>{regs.length - eligible}</strong> ineligible</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            View JD Archive
                                                                        </button>
                                                                        <button style={{ padding: '6px 12px', background: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            Export Shortlist (CSV)
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Drive Day Toolkit</div>
                                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                                        <button style={{ padding: '8px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                                                            <Users size={16} /> Open Walk-in Registration Desk
                                                                        </button>
                                                                        <button style={{ padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                                                            <MapPin size={16} /> Generate Check-in QR Code
                                                                        </button>
                                                                        <button style={{ padding: '8px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                                                            <Edit3 size={16} /> Collect Digital Consent Forms
                                                                        </button>
                                                                        <button style={{ padding: '8px 16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                                                            <Calendar size={16} /> Manage Venue & Slots (Logistics)
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {regs.length === 0 ? (
                                                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No student registrations yet.</p>
                                                            ) : (
                                                                <div className="regs-table-wrap">
                                                                    <table className="regs-table">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Student</th>
                                                                                <th>CGPA</th>
                                                                                <th>Branch</th>
                                                                                <th>Eligible</th>
                                                                                <th>Reason</th>
                                                                                <th>Offer Status</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {regs.map((r, ri) => (
                                                                                <tr key={ri} className={r.eligible ? 'eligible-row' : 'ineligible-row'}>
                                                                                    <td>
                                                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.name}</div>
                                                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.email}</div>
                                                                                    </td>
                                                                                    <td>{r.cgpa ?? '—'}</td>
                                                                                    <td>{r.branch ?? '—'}</td>
                                                                                    <td>
                                                                                        {r.eligible
                                                                                            ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Yes</span>
                                                                                            : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗ No</span>}
                                                                                    </td>
                                                                                    <td style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px' }}>
                                                                                        {r.eligibilityReasons?.join('; ') || '—'}
                                                                                    </td>
                                                                                    <td>
                                                                                        {r.eligible ? (
                                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                <select 
                                                                                                    value={r.offerStatus || 'pending'} 
                                                                                                    onChange={(e) => handleUpdateOfferStatus(drive.id!, r.uid, e.target.value as any)}
                                                                                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: r.offerStatus === 'offered' ? '#dcfce7' : r.offerStatus === 'rejected' ? '#fee2e2' : '#f1f5f9' }}
                                                                                                >
                                                                                                    <option value="pending">Pending</option>
                                                                                                    <option value="offered">Offered</option>
                                                                                                    <option value="rejected">Rejected</option>
                                                                                                </select>
                                                                                                {r.offerStatus === 'offered' && (
                                                                                                    r.offerLetterUrl ? (
                                                                                                        <a href={r.offerLetterUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline' }}>View Letter</a>
                                                                                                    ) : (
                                                                                                        <button onClick={() => handleUploadOfferLetter(drive.id!, r.uid)} style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Upload</button>
                                                                                                    )
                                                                                                )}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>N/A</span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Create Drive Modal ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}>
                        <motion.div className="drive-modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2><Plus size={20} /> Create Placement Drive</h2>
                                <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
                            </div>

                            <div className="modal-body">
                                <div className="modal-section">
                                    <h3 className="modal-section-title">Drive Details</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Drive Title *</label>
                                            <input placeholder="e.g. TCS NQT 2025 Campus Drive" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Company *</label>
                                            <input placeholder="e.g. Tata Consultancy Services" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Role/Designation *</label>
                                            <input placeholder="e.g. Software Engineer" value={form.roleTitle} onChange={e => setForm(p => ({ ...p, roleTitle: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Package / CTC</label>
                                            <input placeholder="e.g. 3.5–7 LPA" value={form.package} onChange={e => setForm(p => ({ ...p, package: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Location</label>
                                            <input placeholder="e.g. Bengaluru / Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Application Deadline *</label>
                                            <input type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea rows={3} placeholder="Describe the drive, rounds, process, etc." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Eligibility Rules</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Minimum CGPA</label>
                                            <input type="number" step="0.1" min="0" max="10" placeholder="e.g. 6.5" value={form.minCGPA} onChange={e => setForm(p => ({ ...p, minCGPA: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Backlogs Allowed</label>
                                            <input type="number" min="0" placeholder="0 = no backlogs" value={form.maxBacklogs} onChange={e => setForm(p => ({ ...p, maxBacklogs: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Graduation Year</label>
                                            <input type="number" placeholder="e.g. 2025" value={form.graduationYear} onChange={e => setForm(p => ({ ...p, graduationYear: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Required Skills (comma-separated)</label>
                                        <input placeholder="e.g. Python, SQL, Excel" value={form.requiredSkills} onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Allowed Branches</label>
                                        <div className="branch-picker">
                                            {BRANCHES.map(b => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    className={`branch-chip ${form.allowedBranches.includes(b) ? 'selected' : ''}`}
                                                    onClick={() => toggleBranch(b)}
                                                >
                                                    {b}
                                                </button>
                                            ))}
                                        </div>
                                        {form.allowedBranches.length === 0 && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>No selection = all branches eligible</p>}
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3 className="modal-section-title">Publish Status</h3>
                                    <div className="status-picker">
                                        {(['open', 'draft'] as const).map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`status-pick-btn ${form.status === s ? 'selected' : ''}`}
                                                onClick={() => setForm(p => ({ ...p, status: s }))}
                                            >
                                                {s === 'open' ? <><CheckCircle2 size={15} /> Publish Immediately</> : <><Clock size={15} /> Save as Draft</>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formError && <div className="form-error"><AlertCircle size={15} /> {formError}</div>}
                            </div>

                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button className="modal-submit-btn" onClick={handleCreateDrive} disabled={creating}>
                                    {creating ? <><Loader2 size={15} className="spin" /> Creating…</> : <><Plus size={15} /> Create Drive</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
