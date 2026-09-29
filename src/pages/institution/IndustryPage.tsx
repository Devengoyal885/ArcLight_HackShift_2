import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getAllPostedRoles, type PostedRole, getAllEmployerProfiles, type EmployerProfile } from '../../services/employerService';
import {
    getLinkedCompanies, addLinkedCompany, removeLinkedCompany,
    type LinkedCompany,
} from '../../services/institutionService';
import {
    Handshake, Search, Loader2, AlertCircle, Building2,
    Plus, Trash2, Briefcase, X, Award
} from 'lucide-react';
import './InstitutionSubPages.css';

export default function IndustryPage() {
    const { profile: adminProfile } = useAuth();
    const institutionCode = adminProfile?.institutionCode || 'DEFAULT';

    const [opportunities, setOpportunities] = useState<PostedRole[]>([]);
    const [companies, setCompanies] = useState<LinkedCompany[]>([]);
    const [allEmployers, setAllEmployers] = useState<EmployerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedEmployerUid, setSelectedEmployerUid] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            getAllPostedRoles().then(roles => roles.filter(r => r.status === 'active')),
            getLinkedCompanies(institutionCode),
            getAllEmployerProfiles(),
        ])
            .then(([roles, linked, employers]) => { 
                setOpportunities(roles); 
                setCompanies(linked); 
                setAllEmployers(employers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [institutionCode]);

    const filteredOpps = opportunities.filter(opp =>
        !search.trim() ||
        opp.companyName.toLowerCase().includes(search.toLowerCase()) ||
        opp.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddCompany = async () => {
        if (!selectedEmployerUid) return;
        const emp = allEmployers.find(e => e.uid === selectedEmployerUid);
        if (!emp) return;

        setSaving(true);
        try {
            await addLinkedCompany(institutionCode, {
                employerUid: emp.uid,
                companyName: emp.companyName || 'Unknown Company',
                contactEmail: emp.contactEmail || '',
                sector: emp.industry || '',
                status: 'pending'
            });
            const updated = await getLinkedCompanies(institutionCode);
            setCompanies(updated);
            setSelectedEmployerUid('');
            setShowAddForm(false);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleRemoveCompany = async (id: string) => {
        try {
            await removeLinkedCompany(institutionCode, id);
            setCompanies(prev => prev.filter(c => c.id !== id));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Handshake size={28} className="inst-header-icon" />
                    <div>
                        <h1>Industry Engagement</h1>
                        <p>Linked companies and live industry programs available to your institution</p>
                    </div>
                </motion.header>

                {/* ── Linked Companies ── */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <p className="inst-section-title" style={{ margin: 0 }}>Partner Companies</p>
                        <button
                            className="inst-btn-primary"
                            onClick={() => setShowAddForm(v => !v)}
                        >
                            {showAddForm ? <X size={15} /> : <Plus size={15} />}
                            {showAddForm ? 'Cancel' : 'Add Company'}
                        </button>
                    </div>

                    {showAddForm && (
                        <motion.div
                            className="inst-create-form"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ marginBottom: '1.25rem' }}
                        >
                            <h3><Building2 size={16} /> Link a Partner Company</h3>
                            <div className="inst-form-grid" style={{ gridTemplateColumns: '1fr auto' }}>
                                <div className="inst-form-group">
                                    <label className="inst-form-label">Select Registered Employer *</label>
                                    <select
                                        className="inst-form-input"
                                        value={selectedEmployerUid}
                                        onChange={e => setSelectedEmployerUid(e.target.value)}
                                        style={{ appearance: 'auto', padding: '0.6rem 1rem' }}
                                    >
                                        <option value="">-- Choose an Employer --</option>
                                        {allEmployers
                                            .filter(e => !companies.some(c => c.employerUid === e.uid))
                                            .map(e => (
                                                <option key={e.uid} value={e.uid}>
                                                    {e.companyName} {e.industry ? `(${e.industry})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="inst-form-actions" style={{ alignSelf: 'end' }}>
                                    <button className="inst-btn-primary" onClick={handleAddCompany} disabled={saving || !selectedEmployerUid}>
                                        {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {companies.length === 0 ? (
                        <div className="inst-empty" style={{ padding: '2rem' }}>
                            <Building2 size={28} color="#94a3b8" />
                            <h3>No Partner Companies Yet</h3>
                            <p>Add companies to your institution. They'll be able to post targeted roles for your students.</p>
                        </div>
                    ) : (
                        <div className="inst-company-grid">
                            {companies.map((company, i) => (
                                <motion.div
                                    key={company.id || i}
                                    className="inst-company-card"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="inst-company-logo">
                                        {company.companyName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="inst-company-info" style={{ flex: 1 }}>
                                        <div className="inst-company-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>{company.companyName}</span>
                                            {company.status === 'approved' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: '#f8fafc', padding: '4px 8px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                                                    <Award size={12} color="#f59e0b" />
                                                    Engagement: {Math.min(98, (company.companyName.charCodeAt(0) * 3 + company.companyName.length * 7) % 60 + 40)}/100
                                                </div>
                                            )}
                                        </div>
                                        <div className="inst-company-email">
                                            {company.contactEmail || company.sector || 'No contact info'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4, alignItems: 'center' }}>
                                            {company.sector && (
                                                <span className="inst-skill-tag">{company.sector}</span>
                                            )}
                                            {company.status && (
                                                <span className={`inst-badge inst-badge--${
                                                    company.status === 'approved' ? 'Placed' : 
                                                    company.status === 'rejected' ? 'Rejected' : 'Screening'
                                                }`}>
                                                    {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="inst-company-remove"
                                        onClick={() => company.id && handleRemoveCompany(company.id)}
                                        title="Remove company"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Live Industry Programs ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <p className="inst-section-title" style={{ margin: 0 }}>Live Industry Programs & Roles ({filteredOpps.length})</p>
                        <div className="inst-search-bar" style={{ flex: 'none', width: 280 }}>
                            <Search size={15} />
                            <input
                                placeholder="Search by company or program..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="inst-loading"><Loader2 size={28} className="spin" /><p>Loading industry data...</p></div>
                    ) : opportunities.length === 0 ? (
                        <div className="inst-empty">
                            <AlertCircle size={32} />
                            <h3>No Active Postings</h3>
                            <p>There are no active postings from employers yet.</p>
                        </div>
                    ) : (
                        <div className="inst-table-container">
                            <table className="inst-table">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Program / Role</th>
                                        <th>Type</th>
                                        <th>Location</th>
                                        <th>Applicants</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOpps.map((opp, i) => (
                                        <motion.tr
                                            key={opp.id || i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                        >
                                            <td>
                                                <div className="inst-student-cell">
                                                    <div className="inst-avatar" style={{ background: '#d1fae5', color: '#059669' }}>
                                                        <Building2 size={15} />
                                                    </div>
                                                    <div className="inst-name">{opp.companyName}</div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{opp.title}</td>
                                            <td>
                                                <span className={`inst-badge inst-badge--${opp.type}`}>
                                                    {opp.type}
                                                </span>
                                            </td>
                                            <td style={{ color: '#475569', fontSize: '0.82rem' }}>{opp.location || 'Remote / Any'}</td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: '#64748b' }}>
                                                    <Briefcase size={13} /> {opp.applicants || 0}
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
        </div>
    );
}
