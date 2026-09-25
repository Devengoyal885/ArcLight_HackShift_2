import { useState, useEffect, useCallback } from 'react';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Handshake, Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getEmployerLinkRequests, updateLinkRequestStatus } from '../../services/institutionService';
import './EmployerDashboard.css';

export default function PartnersPage() {
    const { dbUid } = useAuth();
    const [linkRequests, setLinkRequests] = useState<{ id: string; institutionCode: string; companyName: string; status: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!dbUid) return;
        try {
            const requests = await getEmployerLinkRequests(dbUid);
            setLinkRequests(requests);
        } catch (e) {
            console.error("Failed to load link requests", e);
        } finally {
            setLoading(false);
        }
    }, [dbUid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleUpdateLinkRequest = async (reqId: string, instCode: string, newStatus: 'approved' | 'rejected') => {
        try {
            await updateLinkRequestStatus(instCode, reqId, newStatus);
            setLinkRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
        } catch (e) {
            console.error("Failed to update link request status", e);
        }
    };

    const pendingRequests = linkRequests.filter(r => r.status === 'pending');
    const approvedPartners = linkRequests.filter(r => r.status === 'approved');

    return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />
            <main className="emp-dash-main">
                <motion.div className="emp-dash-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Handshake size={28} color="#4f46e5" />
                        <h1 className="emp-dash-org">Institution Partners</h1>
                    </div>
                    <p className="emp-dash-sub">Manage your university and institution partnerships.</p>
                </motion.div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginTop: '2rem' }}>
                        <Loader2 className="spin" size={20} /> Loading partners...
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        
                        {/* Pending Requests Section */}
                        <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="emp-card-header">
                                <h2 className="emp-card-title">Pending Requests ({pendingRequests.length})</h2>
                            </div>
                            <div className="emp-card-body">
                                {pendingRequests.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No pending requests from institutions.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                        {pendingRequests.map(req => (
                                            <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
                                                        <Building2 size={20} color="#4f46e5" />
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>{req.institutionCode}</span>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                                                    Requested to add you as a partner for campus hiring and engagement.
                                                </p>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => handleUpdateLinkRequest(req.id, req.institutionCode, 'approved')}
                                                        style={{ flex: 1, padding: '0.6rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                    >
                                                        <CheckCircle2 size={16} /> Accept
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateLinkRequest(req.id, req.institutionCode, 'rejected')}
                                                        style={{ flex: 1, padding: '0.6rem', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                    >
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Approved Partners Section */}
                        <motion.div className="emp-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="emp-card-header">
                                <h2 className="emp-card-title">Active Partners ({approvedPartners.length})</h2>
                            </div>
                            <div className="emp-card-body">
                                {approvedPartners.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>You don't have any active institution partners yet.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                        {approvedPartners.map(partner => (
                                            <div key={partner.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '8px' }}>
                                                    <Handshake size={20} color="#16a34a" />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', margin: '0 0 4px 0', color: '#0f172a' }}>{partner.institutionCode}</h3>
                                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '12px' }}>Approved</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                    </div>
                )}
            </main>
        </div>
    );
}
