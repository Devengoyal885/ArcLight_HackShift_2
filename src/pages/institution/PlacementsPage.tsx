import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { getGlobalPlacements, verifyPlacementOffer, type PlacementRecord } from '../../services/institutionService';
import { TrendingUp, Search, Loader2, AlertCircle, CheckCircle2, XCircle, FileText, IndianRupee } from 'lucide-react';
import './InstitutionSubPages.css';

const STATUS_ORDER = [
    { key: 'Applied', label: 'Applied', color: '#7c3aed' },
    { key: 'Screening', label: 'Screening', color: '#3b82f6' },
    { key: 'OA Pending', label: 'OA', color: '#06b6d4' },
    { key: 'Interview Scheduled', label: 'Interview', color: '#f59e0b' },
    { key: 'Offer Extended', label: 'Offer', color: '#10b981' },
    { key: 'Placed', label: 'Placed', color: '#059669' },
];

export default function PlacementsPage() {
    const [placements, setPlacements] = useState<PlacementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const loadPlacements = () => {
        getGlobalPlacements()
            .then(setPlacements)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPlacements();
    }, []);

    const handleVerify = async (roleId: string, appId: string, verify: boolean) => {
        if (!roleId || !appId) return;
        try {
            await verifyPlacementOffer(roleId, appId, verify);
            loadPlacements();
        } catch (e) {
            console.error("Failed to verify offer", e);
        }
    };

    const filtered = placements.filter(p => {
        const matchesSearch = !search.trim() ||
            p.studentName.toLowerCase().includes(search.toLowerCase()) ||
            p.companyName.toLowerCase().includes(search.toLowerCase()) ||
            p.roleTitle.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Funnel counts
    const funnelData = STATUS_ORDER.map(s => ({
        ...s,
        count: placements.filter(p => p.status === s.key).length,
    }));
    const maxFunnelCount = Math.max(...funnelData.map(f => f.count), 1);

    // Company breakdown
    const companyBreakdown = Object.entries(
        placements.reduce((acc, p) => {
            acc[p.companyName] = (acc[p.companyName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <TrendingUp size={28} className="inst-header-icon" />
                    <div>
                        <h1>Placement Pipeline</h1>
                        <p>Track every student application from submission to placement</p>
                    </div>
                </motion.header>

                {/* Funnel */}
                {!loading && placements.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}
                    >
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', margin: '0 0 1.5rem' }}>
                            Placement Funnel
                        </p>
                        <div className="inst-funnel">
                            {funnelData.map((step, i) => {
                                const pct = (step.count / maxFunnelCount) * 180;
                                return (
                                    <div key={step.key} className="inst-funnel-step">
                                        <span className="inst-funnel-count" style={{ color: step.color }}>{step.count}</span>
                                        <motion.div
                                            className="inst-funnel-bar"
                                            style={{ background: step.color + '22', border: `2px solid ${step.color}`, height: Math.max(pct, 24) }}
                                            initial={{ height: 0 }}
                                            animate={{ height: Math.max(pct, 24) }}
                                            transition={{ delay: i * 0.08, duration: 0.4 }}
                                        />
                                        <span className="inst-funnel-label">{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Company breakdown */}
                        {companyBreakdown.length > 0 && (
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', margin: '0 0 0.75rem' }}>
                                    By Company
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {companyBreakdown.map(([company, count]) => (
                                        <span
                                            key={company}
                                            style={{ background: '#f1f5f9', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: 99, border: '1px solid #e2e8f0' }}
                                        >
                                            {company} <span style={{ color: '#64748b' }}>· {count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Toolbar */}
                <div className="inst-toolbar">
                    <div className="inst-search-bar">
                        <Search size={15} />
                        <input
                            placeholder="Search by student, company, or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="all">All Statuses</option>
                        {STATUS_ORDER.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {loading ? (
                    <div className="inst-loading"><Loader2 size={32} className="spin" /><p>Aggregating placement data...</p></div>
                ) : placements.length === 0 ? (
                    <div className="inst-empty">
                        <AlertCircle size={32} />
                        <h3>No Applications Yet</h3>
                        <p>Student applications will appear here once they start applying for roles.</p>
                    </div>
                ) : (
                    <div className="inst-table-container">
                        <table className="inst-table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Package</th>
                                    <th>Offer Letter</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <motion.tr
                                        key={p.applicationId || i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                    >
                                        <td>
                                            <div className="inst-student-cell">
                                                <div className="inst-avatar">{p.studentName.charAt(0).toUpperCase()}</div>
                                                <div className="inst-name">{p.studentName}</div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.companyName}</td>
                                        <td style={{ color: '#475569' }}>{p.roleTitle}</td>
                                        <td style={{ color: '#475569', fontWeight: 500 }}>
                                            {p.salaryPackage ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <IndianRupee size={12} /> {p.salaryPackage} LPA
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {p.status === 'Offer Extended' || p.status === 'Placed' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {p.offerLetterUrl ? (
                                                        <a href={p.offerLetterUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '13px', textDecoration: 'none' }}>
                                                            <FileText size={14} /> View
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Missing</span>
                                                    )}
                                                    
                                                    {p.offerVerified ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                                                            <CheckCircle2 size={12} /> Verified
                                                        </span>
                                                    ) : p.offerLetterUrl ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button onClick={() => handleVerify(p.roleId, p.applicationId, true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                                Verify
                                                            </button>
                                                            <button onClick={() => handleVerify(p.roleId, p.applicationId, false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`inst-badge inst-badge--${p.status.replace(/\s+/g, '')}`}
                                                style={{ background: STATUS_ORDER.find(s => s.key === p.status)?.color + '18' || undefined, color: STATUS_ORDER.find(s => s.key === p.status)?.color || undefined }}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
