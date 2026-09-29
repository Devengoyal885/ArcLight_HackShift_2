import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { CapabilityFingerprint } from '../../components/capability/CapabilityFingerprint';
import { ConfidenceIndicator } from '../../components/capability/ConfidenceIndicator';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import {
    getCandidateProfile, updateApplicationStatus, scheduleAssessment,
    addRecruiterNote, getRecruiterNotes, deleteRecruiterNote,
    type RecruiterNote
} from '../../services/employerService';
import {
    getCapabilities, getProjects, getCertifications,
    type UserCapability, type UserProject, type UserCertification
} from '../../services/profileService';
import { Code, FolderOpen, ClipboardCheck, ArrowLeft, Loader2, UserX, CheckCircle, XCircle, FileText, Award, Trash2, Send, Code2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CandidateProfilePage.css';

const iconMap: Record<string, any> = { GitHub: Code, Project: FolderOpen, Assessment: ClipboardCheck };

export default function CandidateProfilePage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { user, dbUid } = useAuth();
    const appState = location.state as { applicationId?: string, roleId?: string, status?: string } | null;
    
    const [actionLoading, setActionLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(appState?.status || 'Applied');
    
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [interviewForm, setInterviewForm] = useState({ venue: '', date: '', time: '' });
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerForm, setOfferForm] = useState({ salary: '', startDate: '' });
    const [showOAModal, setShowOAModal] = useState(false);
    const [oaForm, setOaForm] = useState<{type: 'ai_interview'|'coding_assessment', domain: string}>({ type: 'ai_interview', domain: 'React' });
    
    const [profile, setProfile]           = useState<any>(null);
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects]         = useState<UserProject[]>([]);
    const [certifications, setCerts]      = useState<UserCertification[]>([]);
    const [loading, setLoading]           = useState(true);

    // Recruiter-private notes
    const [notes, setNotes]           = useState<RecruiterNote[]>([]);
    const [noteInput, setNoteInput]   = useState('');
    const [noteSaving, setNoteSaving] = useState(false);

    useEffect(() => {
        if (!id || !user) return;
        (async () => {
            try {
                const [prof, caps, projs, certs, nts] = await Promise.all([
                    getCandidateProfile(id),
                    getCapabilities(id).catch(() => []),
                    getProjects(id).catch(() => []),
                    getCertifications(id).catch(() => []),
                    getRecruiterNotes(dbUid!, id).catch(() => []),
                ]);
                setProfile(prof);
                setCapabilities(caps);
                setProjects(projs);
                setCerts(certs);
                setNotes(nts);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, user]);

    if (loading) {
        return (
            <div className="cprof-page">
                <FloatingNavbar variant="employer" />
                <main className="cprof-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#64748b' }}>
                        <Loader2 size={32} className="spin" />
                        <p>Loading candidate profile...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="cprof-page">
                <FloatingNavbar variant="employer" />
                <main className="cprof-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#64748b' }}>
                        <UserX size={48} />
                        <p>Candidate not found or profile is private.</p>
                        <Link to="/employer/talent" className="cprof-action-primary">Return to Talent Directory</Link>
                    </div>
                </main>
            </div>
        );
    }

    // Convert UserCapability[] to the map expected by CapabilityFingerprint
    const capMap = capabilities.reduce((acc, cap) => {
        acc[cap.skill] = cap.score;
        return acc;
    }, {} as Record<string, number>);

    // Overall Confidence
    const avgConfidenceScore = capabilities.reduce((acc, c) => {
        if (c.confidence === 'high') return acc + 3;
        if (c.confidence === 'medium') return acc + 2;
        return acc + 1;
    }, 0) / (capabilities.length || 1);
    
    const overallConfidence = avgConfidenceScore > 2.2 ? 'HIGH' : avgConfidenceScore > 1.5 ? 'MEDIUM' : 'LOW';
    const averageScore = capabilities.length ? Math.round(capabilities.reduce((a, b) => a + b.score, 0) / capabilities.length) : 0;

    return (
        <div className="cprof-page">
            <FloatingNavbar variant="employer" />

            <main className="cprof-main">
                <Link to="/employer/talent" className="cprof-back">
                    <ArrowLeft size={14} /> Back to Talent Discovery
                </Link>

                {/* Application Action Bar */}
                {appState && appState.applicationId && appState.roleId && (
                    <div className="emp-action-bar" style={{ background: '#fff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', color: '#1e293b', fontWeight: 600, marginBottom: '4px' }}>Application Review</h3>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>Current Status: <strong style={{ textTransform: 'capitalize', color: '#2563eb' }}>{currentStatus}</strong></p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {/* Reject */}
                                {!['Rejected', 'OA Rejected', 'Placed'].includes(currentStatus) && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            if (!id || !user) return;
                                            const feedbackStr = window.prompt('Provide feedback to the candidate (optional):');
                                            if (feedbackStr === null) return; // User cancelled
                                            
                                            setActionLoading(true);
                                            try {
                                                await updateApplicationStatus(appState.roleId!, appState.applicationId!, id, 'Rejected', undefined, undefined, undefined, feedbackStr);
                                                setCurrentStatus('Rejected');
                                            } catch(e) { console.error(e); }
                                            finally { setActionLoading(false); }
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                        <XCircle size={15} /> Reject
                                    </button>
                                )}

                                {/* Schedule OA Modal Trigger */}
                                {currentStatus === 'Applied' && (
                                    <button
                                        onClick={() => setShowOAModal(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                        <CheckCircle size={15} /> Schedule Assessment
                                    </button>
                                )}

                                {/* Schedule Interview (after OA passed) */}
                                {currentStatus === 'OA Pending' && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => setShowInterviewModal(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                        <CheckCircle size={15} /> Schedule Interview
                                    </button>
                                )}

                                {/* Extend Offer (after Interview Scheduled) */}
                                {currentStatus === 'Interview Scheduled' && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => setShowOfferModal(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f3e8ff', color: '#7c3aed', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                        <CheckCircle size={15} /> Extend Offer
                                    </button>
                                )}

                                {/* Mark as Placed */}
                                {currentStatus === 'Offer Extended' && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            if (!id || !user) return;
                                            if (!confirm('Confirm placement for this candidate?')) return;
                                            setActionLoading(true);
                                            try {
                                                await updateApplicationStatus(appState.roleId!, appState.applicationId!, id, 'Placed');
                                                setCurrentStatus('Placed');
                                            } catch(e) { console.error(e); }
                                            finally { setActionLoading(false); }
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                        <CheckCircle size={15} /> Confirm Placement
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status is final */}
                        {(currentStatus === 'Placed') && (
                            <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={16} /> This candidate has been successfully placed! 🎉
                            </div>
                        )}
                    </div>
                )}

                {/* Interview Scheduling Modal */}
                {showInterviewModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '400px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Schedule Interview</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>The candidate will receive an in-app notification with these details.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    placeholder="Venue / Meeting Link (e.g. Google Meet, Office Address)"
                                    value={interviewForm.venue}
                                    onChange={e => setInterviewForm(f => ({ ...f, venue: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                                <input
                                    type="date"
                                    value={interviewForm.date}
                                    onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                                <input
                                    type="time"
                                    value={interviewForm.time}
                                    onChange={e => setInterviewForm(f => ({ ...f, time: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowInterviewModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button
                                    disabled={actionLoading || !interviewForm.venue || !interviewForm.date || !interviewForm.time}
                                    onClick={async () => {
                                        if (!id) return;
                                        setActionLoading(true);
                                        try {
                                            await updateApplicationStatus(
                                                appState!.roleId!, appState!.applicationId!, id,
                                                'Interview Scheduled',
                                                'Congratulations! You passed the OA. Your interview has been scheduled.',
                                                interviewForm
                                            );
                                            setCurrentStatus('Interview Scheduled');
                                            setShowInterviewModal(false);
                                        } catch(e) { console.error(e); }
                                        finally { setActionLoading(false); }
                                    }}
                                    style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {actionLoading ? 'Scheduling...' : 'Confirm Schedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Offer Modal */}
                {showOfferModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '400px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Extend Offer</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>The candidate will be notified of the offer via in-app notification.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    placeholder="CTC / Stipend (e.g. ₹12 LPA, ₹25,000/month)"
                                    value={offerForm.salary}
                                    onChange={e => setOfferForm(f => ({ ...f, salary: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                                <input
                                    type="date"
                                    placeholder="Expected Start Date"
                                    value={offerForm.startDate}
                                    onChange={e => setOfferForm(f => ({ ...f, startDate: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowOfferModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button
                                    disabled={actionLoading || !offerForm.salary}
                                    onClick={async () => {
                                        if (!id) return;
                                        setActionLoading(true);
                                        try {
                                            await updateApplicationStatus(
                                                appState!.roleId!, appState!.applicationId!, id,
                                                'Offer Extended',
                                                `An offer has been extended to you! CTC: ${offerForm.salary}. Start date: ${offerForm.startDate || 'TBD'}.`,
                                                undefined,
                                                { salary: offerForm.salary, startDate: offerForm.startDate }
                                            );
                                            setCurrentStatus('Offer Extended');
                                            setShowOfferModal(false);
                                        } catch(e) { console.error(e); }
                                        finally { setActionLoading(false); }
                                    }}
                                    style={{ padding: '8px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {actionLoading ? 'Sending...' : 'Extend Offer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="cprof-layout">
                    {/* Left: Identity + Fingerprint */}
                    <motion.div className="cprof-left" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="cprof-identity-card">
                            <div className="cprof-avatar">{(profile.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                            <div>
                                <h1 className="cprof-name">{profile.name}</h1>
                                <p className="cprof-headline">{profile.headline || profile.email}</p>
                                <p className="cprof-available">Joined Platform: {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</p>
                            </div>
                        </div>

                        {capabilities.length > 0 ? (
                            <>
                                <div className="cprof-section">
                                    <p className="cprof-section-label">CAPABILITY FINGERPRINT</p>
                                    <CapabilityFingerprint capabilities={capMap} size={240} accentColor="#2563eb" />
                                </div>

                                <div className="cprof-section">
                                    <p className="cprof-section-label">CAPABILITY SCORES</p>
                                    {capabilities.map((cap) => (
                                        <div key={cap.id} className="cprof-cap-row">
                                            <span className="cprof-cap-name">{cap.skill}</span>
                                            <div className="cprof-cap-track">
                                                <div className="cprof-cap-fill" style={{ width: `${cap.score}%` }} />
                                            </div>
                                            <span className="cprof-cap-pct">{cap.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="cprof-section" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                <p>Candidate has not generated a capability fingerprint yet.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Match + Evidence */}
                    <motion.div className="cprof-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <div className="cprof-match-card">
                            <div className="cprof-match-hero">
                                <span className="cprof-match-score">{averageScore}%</span>
                                <div>
                                    <p className="cprof-match-label">Average Verified Score</p>
                                    <p className="cprof-match-role">Across {capabilities.length} Capabilities</p>
                                </div>
                            </div>
                            <div className="cprof-match-indicators">
                                <div className="cprof-indicator">
                                    <span>Evidence Confidence</span>
                                    <ConfidenceIndicator level={overallConfidence} />
                                </div>
                            </div>
                            <div className="cprof-ai-warning">
                                <span>◈ REAL DATA VERIFICATION</span>
                                <p>All capabilities shown are extracted directly from the candidate's real uploaded evidence and assessments.</p>
                            </div>
                        </div>

                        {/* Evidence */}
                        {capabilities.length > 0 && (
                            <div className="cprof-section">
                                <p className="cprof-section-label">CAPABILITY EVIDENCE SOURCES</p>
                                <div className="cprof-evidence-list">
                                    {capabilities.map((cap, i) => (
                                        <motion.div key={cap.id} className="cprof-evidence-item" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <div className={`cprof-ev-icon cprof-ev-icon--project`}><FolderOpen size={13} /></div>
                                            <div className="cprof-ev-body">
                                                <p className="cprof-ev-label">{cap.skill} Verification</p>
                                                <p className="cprof-ev-date">Sources: {(cap.evidenceSources || []).join(', ') || 'Assessment'}</p>
                                            </div>
                                            <VerificationBadge state="VERIFIED" size="sm" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <div className="cprof-section">
                                <p className="cprof-section-label">PROJECTS &amp; PORTFOLIO</p>
                                <div className="cprof-projects-list">
                                    {projects.map(proj => (
                                        <div key={proj.id} className="cprof-project-card">
                                            <div className="cprof-project-top">
                                                <FolderOpen size={14} color="#7c3aed" />
                                                <span className="cprof-project-name">{proj.name}</span>
                                                {proj.url && (
                                                    <a href={proj.url} target="_blank" rel="noreferrer" className="cprof-project-link">
                                                        {proj.source === 'github' ? <Code2 size={12}/> : <ExternalLink size={12}/>}
                                                    </a>
                                                )}
                                            </div>
                                            {proj.description && <p className="cprof-project-desc">{proj.description}</p>}
                                            {proj.technologies.length > 0 && (
                                                <div className="cprof-project-techs">
                                                    {proj.technologies.slice(0,6).map(t => <span key={t} className="cprof-tech-tag">{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div className="cprof-section">
                                <p className="cprof-section-label">CERTIFICATIONS</p>
                                <div className="cprof-certs-list">
                                    {certifications.map(cert => (
                                        <div key={cert.id} className="cprof-cert-card">
                                            <Award size={14} color="#d97706" />
                                            <div className="cprof-cert-info">
                                                <p className="cprof-cert-name">{cert.name}</p>
                                                <p className="cprof-cert-issuer">{cert.issuer} · {cert.issueDate}</p>
                                            </div>
                                            {cert.credentialUrl && (
                                                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="cprof-cert-link"><ExternalLink size={12}/></a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume */}
                        {profile?.resumeUrl && (
                            <div className="cprof-section">
                                <p className="cprof-section-label">RESUME</p>
                                <div className="cprof-resume-card">
                                    <FileText size={18} color="#2563eb"/>
                                    <div>
                                        <p style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>Resume on File</p>
                                        <p style={{ fontSize:12, color:'#64748b' }}>Uploaded by candidate</p>
                                    </div>
                                    <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                                        <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="cprof-action-primary" style={{ fontSize:12, padding:'6px 12px' }}>View</a>
                                        <a href={profile.resumeUrl} download className="cprof-action-secondary" style={{ fontSize:12, padding:'6px 12px' }}>Download</a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recruiter Notes — PRIVATE TO EMPLOYER */}
                        {appState && user && (
                            <div className="cprof-section">
                                <p className="cprof-section-label">🔒 RECRUITER NOTES <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500, textTransform:'none' }}>(private — never shown to candidate)</span></p>
                                <div className="cprof-notes-input-row">
                                    <input
                                        type="text"
                                        placeholder="Add a private note about this candidate..."
                                        value={noteInput}
                                        onChange={e => setNoteInput(e.target.value)}
                                        onKeyDown={async e => {
                                            if (e.key === 'Enter' && noteInput.trim()) {
                                                setNoteSaving(true);
                                                try {
                                                    await addRecruiterNote(dbUid!, id!, noteInput.trim());
                                                    const updated = await getRecruiterNotes(dbUid!, id!);
                                                    setNotes(updated);
                                                    setNoteInput('');
                                                } catch(e) { console.error(e); }
                                                finally { setNoteSaving(false); }
                                            }
                                        }}
                                        className="cprof-notes-input"
                                    />
                                    <button
                                        className="cprof-notes-send"
                                        disabled={noteSaving || !noteInput.trim()}
                                        onClick={async () => {
                                            if (!noteInput.trim()) return;
                                            setNoteSaving(true);
                                            try {
                                                await addRecruiterNote(dbUid!, id!, noteInput.trim());
                                                const updated = await getRecruiterNotes(dbUid!, id!);
                                                setNotes(updated);
                                                setNoteInput('');
                                            } catch(e) { console.error(e); }
                                            finally { setNoteSaving(false); }
                                        }}
                                    >
                                        {noteSaving ? <Loader2 size={14} className="spin"/> : <Send size={14}/>}
                                    </button>
                                </div>
                                {notes.length > 0 ? (
                                    <div className="cprof-notes-list">
                                        {notes.map(n => (
                                            <div key={n.id} className="cprof-note-item">
                                                <p className="cprof-note-text">{n.note}</p>
                                                <button
                                                    className="cprof-note-delete"
                                                    title="Delete note"
                                                    onClick={async () => {
                                                        await deleteRecruiterNote(dbUid!, id!, n.id!);
                                                        setNotes(prev => prev.filter(x => x.id !== n.id));
                                                    }}
                                                >
                                                    <Trash2 size={12}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize:12, color:'#94a3b8', padding:'8px 0' }}>No notes yet. Notes are only visible to your organisation.</p>
                                )}
                            </div>
                        )}

                        <div className="cprof-actions">
                            <Link to="/employer/talent" className="cprof-action-primary">
                                <ArrowLeft size={14} /> Back to Talent
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* OA Modal */}
            {showOAModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Schedule Assessment</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Assessment Type</label>
                            <select 
                                value={oaForm.type} 
                                onChange={e => setOaForm({...oaForm, type: e.target.value as any})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="ai_interview">AI Interview Simulator</option>
                                <option value="coding_assessment">Coding Sandbox</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Domain / Topic</label>
                            <input 
                                type="text"
                                value={oaForm.domain}
                                onChange={e => setOaForm({...oaForm, domain: e.target.value})}
                                placeholder="e.g., React, Algorithms, Python..."
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowOAModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button 
                                disabled={actionLoading}
                                onClick={async () => {
                                    if (!id || !user || !appState?.roleId || !appState?.applicationId) return;
                                    setActionLoading(true);
                                    try {
                                        await scheduleAssessment(appState.roleId, appState.applicationId, id, oaForm.type, oaForm.domain);
                                        setCurrentStatus('OA Pending');
                                        setShowOAModal(false);
                                    } catch(e) { console.error(e); }
                                    finally { setActionLoading(false); }
                                }}
                                style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {actionLoading ? 'Scheduling...' : 'Send Assessment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
