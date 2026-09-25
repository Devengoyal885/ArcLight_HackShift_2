import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { 
    getCapabilities, getProjects, updateProfile, 
    addCapability, deleteCapability,
    getCertifications, addCertification, deleteCertification,
    getProfile,
} from '../../services/profileService';
import { computeCompleteness, claimUsername } from '../../services/publicProfileService';
import type { UserCapability, UserProject, UserCertification, UserProfile } from '../../services/profileService';
import { CheckCircle, MapPin, Archive, Sparkles, Loader2, Edit3, X, 
    Plus, Trash2, Code, ExternalLink, Terminal, FolderDot, Award, GraduationCap,
    ArrowLeft, Code2, BarChart3, CheckCircle2, AlertCircle, Trophy, Zap, FileText, Upload,
    Share2, Copy, Link2, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { fetchLeetCodeStats, calculateCurrentStreak } from '../../services/leetcodeService';
import { LeetCodeWidget, GitHubWidget, LinkedInWidget } from '../../components/profile/PlatformWidgets';
import { getCodingStats, getResumeSkillVerification } from '../../services/profileService';
import './CodolioProfilePage.css';


export default function CodolioProfilePage() {
    const { user, dbUid, profile: ownProfile, role } = useAuth();
    const { uid: viewUid } = useParams<{ uid?: string }>();

    // If viewUid is present, we're in READ-ONLY mode viewing someone else's profile
    const isReadOnly = !!viewUid;
    const targetUid = viewUid || dbUid;

    const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [certifications, setCertifications] = useState<UserCertification[]>([]);
    const [loading, setLoading] = useState(true);

    // Use own profile when in own view, or the fetched viewedProfile when in read-only
    const profile = isReadOnly ? viewedProfile : ownProfile;

    // Institution code state (own profile only)
    const [editingInstCode, setEditingInstCode] = useState(false);
    const [instCodeInput, setInstCodeInput] = useState('');
    const [savingInstCode, setSavingInstCode] = useState(false);
    const [instCodeSaved, setInstCodeSaved] = useState(false);

    // Platform Stats State
    const [githubStats, setGithubStats] = useState<any>(null);
    const [leetcodeStats, setLeetcodeStats] = useState<any>(null);

    // CapAble Coding Stats
    const [codingStats, setCodingStats] = useState<any>(null);
    const [codingStatsLoading, setCodingStatsLoading] = useState(false);
    const [resumeSkillVerification, setResumeSkillVerification] = useState<any[]>([]);


    // Modals State (own profile only)
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [newSkill, setNewSkill] = useState({ skill: '', score: 50, confidence: 'medium' as const });
    const [isSavingSkill, setIsSavingSkill] = useState(false);

    const [showPlatformModal, setShowPlatformModal] = useState<string | null>(null);
    const [platformUsername, setPlatformUsername] = useState('');
    const [isSavingPlatform, setIsSavingPlatform] = useState(false);

    // Certifications Modal State
    const [showCertModal, setShowCertModal] = useState(false);
    const [newCert, setNewCert] = useState({ name: '', issuer: '', issueDate: '', credentialUrl: '', skills: '' });
    const [isSavingCert, setIsSavingCert] = useState(false);
    
    // Resume Upload State
    const [uploadingResume, setUploadingResume] = useState(false);

    // Share / Username State
    const [usernameInput, setUsernameInput] = useState('');
    const [claimingUsername, setClaimingUsername] = useState(false);
    const [usernameClaimed, setUsernameClaimed] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const existingUsername = (profile as any)?.username || '';
    const shareUrl = existingUsername
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${existingUsername}`
        : '';

    const handleClaimUsername = async () => {
        if (!dbUid || !usernameInput.trim()) return;
        setClaimingUsername(true);
        setUsernameError('');
        try {
            await claimUsername(dbUid, usernameInput.trim());
            setUsernameClaimed(true);
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setUsernameError(err.message || 'Failed to claim username');
        } finally {
            setClaimingUsername(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    useEffect(() => {
        if (!targetUid) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const [caps, projs, certs] = await Promise.all([
                    getCapabilities(targetUid),
                    getProjects(targetUid),
                    getCertifications(targetUid),
                ]);
                setCapabilities(caps);
                setProjects(projs);
                setCertifications(certs);
                // If read-only, also fetch the target's profile
                if (isReadOnly) {
                    const p = await getProfile(targetUid);
                    setViewedProfile(p);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [targetUid, isReadOnly]);

    // Fetch Platform Stats for whoever's profile is shown
    useEffect(() => {
        if (!profile) return;
        if (profile.githubUsername) {
            fetch(`https://api.github.com/users/${profile.githubUsername}`)
                .then(res => res.json())
                .then(data => {
                    if (data.message === "Not Found") setGithubStats({ error: true });
                    else setGithubStats(data);
                })
                .catch(() => setGithubStats({ error: true }));
        }
        if (profile.leetcodeUsername) {
            fetchLeetCodeStats(profile.leetcodeUsername)
                .then(data => {
                    if (data) setLeetcodeStats(data);
                    else setLeetcodeStats({ error: true });
                })
                .catch(() => setLeetcodeStats({ error: true }));
        }

        // Load CapAble coding stats
        if (targetUid) {
            setCodingStatsLoading(true);
            getCodingStats(targetUid)
                .then(stats => {
                    setCodingStats(stats);
                    // Verify resume skills if user has skills listed
                    const resumeSkills = (profile as any)?.skills || [];
                    if (resumeSkills.length > 0) {
                        return getResumeSkillVerification(targetUid, resumeSkills);
                    }
                    return [];
                })
                .then(verification => setResumeSkillVerification(verification))
                .catch(console.error)
                .finally(() => setCodingStatsLoading(false));
        }
    }, [profile, targetUid]);


    const avgConfidence = capabilities.length > 0 
        ? Math.round(capabilities.reduce((acc, c) => acc + c.score, 0) / capabilities.length) 
        : 0;

    const initials = profile?.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    // Derive navbar variant from own role
    const navbarVariant = (role === 'academician' ? 'academician' : role === 'employer' ? 'employer' : role === 'institution' ? 'institution' : 'candidate') as any;

    const handleAddSkill = async () => {
        if (!user || !newSkill.skill.trim()) return;
        setIsSavingSkill(true);
        try {
            const capId = await addCapability(dbUid!, { ...newSkill, evidenceSources: ['Manual Entry'] });
            setCapabilities(prev => [...prev, { ...newSkill, evidenceSources: ['Manual Entry'], id: capId }]);
            setShowSkillModal(false);
            setNewSkill({ skill: '', score: 50, confidence: 'medium' });
        } catch (error) {
            console.error("Failed to add skill", error);
        } finally {
            setIsSavingSkill(false);
        }
    };

    const handleDeleteSkill = async (id: string) => {
        if (!user) return;
        try {
            await deleteCapability(dbUid!, id);
            setCapabilities(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete skill", error);
        }
    };

    const handleAddCert = async () => {
        if (!user || !newCert.name.trim() || !newCert.issuer.trim()) return;
        setIsSavingCert(true);
        try {
            const skillsArray = newCert.skills.split(',').map(s => s.trim()).filter(Boolean);
            const certData = { ...newCert, skills: skillsArray };
            const certId = await addCertification(dbUid!, certData);
            setCertifications(prev => [{ ...certData, id: certId }, ...prev]);
            setShowCertModal(false);
            setNewCert({ name: '', issuer: '', issueDate: '', credentialUrl: '', skills: '' });
        } catch (error) {
            console.error("Failed to add certification", error);
        } finally {
            setIsSavingCert(false);
        }
    };

    const handleDeleteCert = async (id: string) => {
        if (!user) return;
        try {
            await deleteCertification(dbUid!, id);
            setCertifications(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete certification", error);
        }
    };

    const handleConnectPlatform = async () => {
        if (!user || !showPlatformModal || !platformUsername.trim()) return;
        setIsSavingPlatform(true);
        try {
            const key = showPlatformModal === 'github' ? 'githubUsername' : 
                        showPlatformModal === 'leetcode' ? 'leetcodeUsername' : 
                        showPlatformModal === 'linkedin' ? 'linkedinUrl' : 'hackerrankUsername';
            
            await updateProfile(dbUid!, { [key]: platformUsername });
            
            // Reload page to fetch new stats (quickest way for hackathon)
            window.location.reload();
        } catch (error) {
            console.error("Failed to connect platform", error);
        } finally {
            setIsSavingPlatform(false);
        }
    };

    const handleSaveInstCode = async () => {
        if (!user || !instCodeInput.trim()) return;
        setSavingInstCode(true);
        try {
            await updateProfile(dbUid!, { institutionCode: instCodeInput.trim().toUpperCase() });
            setInstCodeSaved(true);
            setEditingInstCode(false);
            setTimeout(() => setInstCodeSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save institution code", error);
        } finally {
            setSavingInstCode(false);
        }
    };

    const handleDisconnectPlatform = async (platform: string) => {
        if (!user) return;
        try {
            const key = platform === 'github' ? 'githubUsername' : 
                        platform === 'leetcode' ? 'leetcodeUsername' : 
                        'linkedinUrl';
            await updateProfile(dbUid!, { [key]: null });
            window.location.reload();
        } catch (error) {
            console.error("Failed to disconnect platform", error);
        }
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !dbUid) return;
        setUploadingResume(true);
        try {
            const storageRef = ref(storage, `resumes/${dbUid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            await updateProfile(dbUid, { resumeUrl: url });
            window.location.reload();
        } catch (err) {
            console.error("Failed to upload resume:", err);
            alert("Failed to upload resume. Please try again.");
        } finally {
            setUploadingResume(false);
        }
    };

    if (loading) {
        return (
            <div className="cp-page flex-center h-screen items-center justify-center">
                <FloatingNavbar variant={navbarVariant} />
                <Loader2 className="spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="cp-page">
            <FloatingNavbar variant={navbarVariant} />

            {/* Back button for read-only view */}
            {isReadOnly && (
                <div className="cp-readonly-bar">
                    <Link to={-1 as any} className="cp-back-btn">
                        <ArrowLeft size={15} /> Back to Students
                    </Link>
                    <span className="cp-readonly-label">Viewing student profile (read-only)</span>
                </div>
            )}

            <div className="cp-content">
                {/* ─── SIDEBAR: Read-Only Identity ─── */}
                <aside className="cp-sidebar">
                    <div className="cp-card cp-profile-card">
                        <div className="cp-avatar-wrap">
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="cp-avatar-img" />
                            ) : (
                                <div className="cp-avatar-placeholder">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <h1 className="cp-profile-name">{profile?.name || 'Candidate'}</h1>
                        <p className="cp-username">
                            @{profile?.name?.replace(/\s+/g, '').toLowerCase() || 'user'} 
                            <CheckCircle size={14} className="cp-verified-icon" />
                        </p>
                        <p className="cp-bio">{profile?.headline || 'Software Engineer'}</p>

                        {profile?.endorsements && profile.endorsements.length > 0 && (
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                                }} title={`Endorsed by ${profile.endorsements[0].facultyName}`}>
                                    <CheckCircle size={14} /> Faculty Verified
                                </span>
                            </div>
                        )}

                        <div className="cp-meta-row" style={{ marginTop: '16px' }}>
                            <MapPin size={14} /><span>{profile?.location || 'Global (Remote)'}</span>
                        </div>

                        {/* Base Resume Section */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Base Resume</span>
                            </div>
                            {profile?.resumeUrl ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="cp-platform-action" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={14} /> View Resume
                                    </a>
                                    {!isReadOnly && (
                                        <label className="cp-platform-action" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: 0 }} title="Update Resume">
                                            {uploadingResume ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                                            <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} disabled={uploadingResume} />
                                        </label>
                                    )}
                                </div>
                            ) : (
                                !isReadOnly ? (
                                    <label className="cp-platform-action" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer', background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
                                        {uploadingResume ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} 
                                        {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} disabled={uploadingResume} />
                                    </label>
                                ) : (
                                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>No resume uploaded.</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* ── Share Profile Card (own profile only) ────────────── */}
                    {!isReadOnly && (
                        <div className="cp-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Share2 size={16} color="#6366f1" />
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Your Public Profile</span>
                            </div>

                            {existingUsername ? (
                                <>
                                    <div style={{
                                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                                        padding: '10px 12px', fontSize: '12px', color: '#334155',
                                        fontFamily: 'monospace', marginBottom: '10px', wordBreak: 'break-all'
                                    }}>
                                        capable.ai/u/<strong>{existingUsername}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleCopyLink}
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                background: linkCopied ? '#dcfce7' : '#eff6ff',
                                                color: linkCopied ? '#059669' : '#2563eb',
                                                border: '1px solid currentColor', borderRadius: '8px',
                                                padding: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >
                                            <Copy size={13} /> {linkCopied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                        <a
                                            href={shareUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: '#6366f1', color: 'white',
                                                border: 'none', borderRadius: '8px',
                                                padding: '8px 12px', fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                                            }}
                                        >
                                            <ExternalLink size={13} /> Preview
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>
                                        Claim a username to get a shareable link like <code>capable.ai/u/yourname</code>
                                    </p>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 10px', fontSize: '12px', color: '#94a3b8' }}>
                                            <span>@</span>
                                            <input
                                                value={usernameInput}
                                                onChange={e => { setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, '')); setUsernameError(''); }}
                                                placeholder="yourname"
                                                maxLength={30}
                                                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px 4px', fontSize: '12px', color: '#0f172a' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleClaimUsername}
                                            disabled={claimingUsername || !usernameInput.trim()}
                                            style={{
                                                background: '#6366f1', color: 'white', border: 'none',
                                                borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700,
                                                cursor: claimingUsername ? 'not-allowed' : 'pointer', opacity: claimingUsername ? 0.7 : 1
                                            }}
                                        >
                                            {claimingUsername ? <Loader2 size={13} className="spin" /> : 'Claim'}
                                        </button>
                                    </div>
                                    {usernameError && <p style={{ fontSize: '11px', color: '#ef4444', margin: 0 }}>{usernameError}</p>}
                                    {usernameClaimed && <p style={{ fontSize: '11px', color: '#10b981', margin: 0 }}>✓ Username claimed! Refreshing...</p>}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Profile Completeness (own profile only) ───────────── */}
                    {!isReadOnly && (() => {
                        const completeness = computeCompleteness(profile, capabilities.length, projects.length, certifications.length);
                        const levelColors = { Starter: '#f59e0b', Rising: '#3b82f6', Strong: '#6366f1', Expert: '#10b981' };
                        const lvlColor = levelColors[completeness.level];
                        return (
                            <div className="cp-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Profile Strength</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: lvlColor, background: `${lvlColor}15`, borderRadius: '20px', padding: '2px 10px' }}>
                                        {completeness.level}
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completeness.score}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ height: '100%', background: lvlColor, borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                    {completeness.score}%
                                </div>
                                {completeness.missing.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To improve:</div>
                                        {completeness.missing.slice(0, 3).map(m => (
                                            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="cp-card">
                        <div className="cp-card-header">
                            <Archive size={16} />
                            <span>Ecosystem Vitality</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Capability Confidence</span>
                            <span className="cp-stat-accent text-green">{avgConfidence}%</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Verified Capabilities</span>
                            <span className="cp-stat-accent text-blue">{capabilities.length}</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Portfolio Projects</span>
                            <span className="cp-stat-accent">{projects.length}</span>
                        </div>
                    </div>

                    {/* Institution Code card */}
                    <div className="cp-card" style={{ borderLeft: '3px solid #7c3aed' }}>
                        <div className="cp-card-header">
                            <GraduationCap size={16} style={{ color: '#7c3aed' }} />
                            <span style={{ fontWeight: 700 }}>Institution</span>
                        </div>
                        {profile?.institutionCode ? (
                            <div>
                                <div className="cp-footer-stats">
                                    <span>Code</span>
                                    <span className="cp-stat-accent" style={{ color: '#7c3aed', fontSize: '1rem' }}>
                                        {profile.institutionCode}
                                    </span>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        style={{ fontSize: '11px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', textDecoration: 'underline' }}
                                        onClick={() => { setInstCodeInput(profile.institutionCode || ''); setEditingInstCode(true); }}
                                    >
                                        Change code
                                    </button>
                                )}
                            </div>
                        ) : (
                            !isReadOnly ? (
                                <div>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                                        Link to your college so faculty can see your progress.
                                    </p>
                                    {!editingInstCode ? (
                                        <button
                                            className="cp-platform-action"
                                            style={{ background: '#7c3aed', borderColor: '#7c3aed', width: '100%', justifyContent: 'center' }}
                                            onClick={() => setEditingInstCode(true)}
                                        >
                                            + Add Code
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Not set</p>
                            )
                        )}
                        {editingInstCode && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                <input
                                    className="cp-input"
                                    style={{ flex: 1, fontSize: '13px', padding: '6px 10px' }}
                                    placeholder="e.g. CU, VJTI"
                                    value={instCodeInput}
                                    onChange={e => setInstCodeInput(e.target.value.toUpperCase())}
                                    autoFocus
                                />
                                <button
                                    className="cp-btn-save"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    onClick={handleSaveInstCode}
                                    disabled={savingInstCode || !instCodeInput.trim()}
                                >
                                    {savingInstCode ? <Loader2 size={12} className="spin" /> : 'Save'}
                                </button>
                            </div>
                        )}
                        {instCodeSaved && (
                            <p style={{ fontSize: '11px', color: '#10b981', marginTop: '6px' }}>✓ Saved! Faculty can now find you.</p>
                        )}
                    </div>
                </aside>

                {/* ─── MAIN COLUMN: Capabilities & Proofs ─── */}
                <main className="cp-main">
                    
                    {/* ─── CONNECTED PLATFORMS ─── */}
                    <section className="cp-section">
                        <h2 className="cp-section-title"><Terminal size={20} /> Connected Platforms</h2>
                        <div className="cp-platforms-grid mt-4">
                            
                            {/* GitHub */}
                            {profile?.githubUsername ? (
                                githubStats && !githubStats.error ? (
                                    <GitHubWidget stats={githubStats} username={profile.githubUsername} onDisconnect={!isReadOnly ? () => handleDisconnectPlatform('github') : undefined} />
                                ) : (
                                    <div className="cp-platform-card">
                                        <div className="cp-platform-icon github">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                        </div>
                                        <div className="cp-platform-info">
                                            <h4>GitHub</h4>
                                            <p className="cp-platform-stats" style={{ color: githubStats?.error ? '#ef4444' : '#8c8c8c' }}>
                                                {githubStats?.error ? 'Invalid username' : 'Fetching stats...'}
                                            </p>
                                        </div>
                                        {!isReadOnly && (
                                            <button className="text-slate-400 hover:text-red-500" onClick={() => handleDisconnectPlatform('github')} title="Disconnect">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="cp-platform-card">
                                    <div className="cp-platform-icon github">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                    </div>
                                    <div className="cp-platform-info">
                                        <h4>GitHub</h4>
                                        <p className="cp-platform-stats">Not connected</p>
                                    </div>
                                    {!isReadOnly && (
                                        <button className="cp-platform-action" onClick={() => setShowPlatformModal('github')}>Connect</button>
                                    )}
                                </div>
                            )}

                            {/* LeetCode */}
                            {profile?.leetcodeUsername ? (
                                leetcodeStats && !leetcodeStats.error && leetcodeStats.totalSolved !== undefined ? (
                                    <LeetCodeWidget stats={leetcodeStats} onDisconnect={!isReadOnly ? () => handleDisconnectPlatform('leetcode') : undefined} />
                                ) : (
                                    <div className="cp-platform-card">
                                        <div className="cp-platform-icon leetcode"><Code size={24} /></div>
                                        <div className="cp-platform-info">
                                            <h4>LeetCode</h4>
                                            <p className="cp-platform-stats" style={{ color: leetcodeStats?.error ? '#ef4444' : '#8c8c8c' }}>
                                                {leetcodeStats?.error ? 'Invalid username' : 'Fetching stats...'}
                                            </p>
                                        </div>
                                        {!isReadOnly && (
                                            <button className="text-slate-400 hover:text-red-500" onClick={() => handleDisconnectPlatform('leetcode')} title="Disconnect">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="cp-platform-card">
                                    <div className="cp-platform-icon leetcode"><Code size={24} /></div>
                                    <div className="cp-platform-info">
                                        <h4>LeetCode</h4>
                                        <p className="cp-platform-stats">Not connected</p>
                                    </div>
                                    {!isReadOnly && (
                                        <button className="cp-platform-action" onClick={() => setShowPlatformModal('leetcode')}>Connect</button>
                                    )}
                                </div>
                            )}

                            {/* LinkedIn */}
                            {profile?.linkedinUrl ? (
                                <LinkedInWidget url={profile.linkedinUrl} onDisconnect={!isReadOnly ? () => handleDisconnectPlatform('linkedin') : undefined} />
                            ) : (
                                <div className="cp-platform-card">
                                    <div className="cp-platform-icon linkedin">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                    </div>
                                    <div className="cp-platform-info">
                                        <h4>LinkedIn</h4>
                                        <p className="cp-platform-stats">Not connected</p>
                                    </div>
                                    {!isReadOnly && (
                                        <button className="cp-platform-action" onClick={() => setShowPlatformModal('linkedin')}>Connect</button>
                                    )}
                                </div>
                            )}

                        </div>
                    </section>

                    {/* ─── CAPABLE CODING PROFILE ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Code2 size={20} /> CapAble Coding Profile</h2>
                            {!isReadOnly && (
                                <a href="/candidate/assessments" className="cp-add-skill-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Zap size={14} /> Practice Now
                                </a>
                            )}
                        </div>

                        {codingStatsLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#64748b', fontSize: 13 }}>
                                <Loader2 size={16} className="spin" /> Loading coding stats…
                            </div>
                        ) : codingStats && codingStats.totalAttempted > 0 ? (
                            <div>
                                {/* Stats Grid */}
                                <div className="cp-coding-stats-grid">
                                    <div className="cp-coding-stat-card">
                                        <Trophy size={18} color="#f59e0b" />
                                        <span className="cp-coding-stat-num">{codingStats.totalSolved}</span>
                                        <span className="cp-coding-stat-label">Solved</span>
                                    </div>
                                    <div className="cp-coding-stat-card">
                                        <BarChart3 size={18} color="#2563eb" />
                                        <span className="cp-coding-stat-num">{codingStats.acceptanceRate}%</span>
                                        <span className="cp-coding-stat-label">Acceptance</span>
                                    </div>
                                    <div className="cp-coding-stat-card">
                                        <CheckCircle2 size={18} color="#16a34a" />
                                        <span className="cp-coding-stat-num">{codingStats.easySolved}<span style={{ fontSize: 11, color: '#94a3b8' }}>/{codingStats.totalAttempted}</span></span>
                                        <span className="cp-coding-stat-label">Easy</span>
                                    </div>
                                    <div className="cp-coding-stat-card">
                                        <AlertCircle size={18} color="#d97706" />
                                        <span className="cp-coding-stat-num">{codingStats.mediumSolved}</span>
                                        <span className="cp-coding-stat-label">Medium</span>
                                    </div>
                                    <div className="cp-coding-stat-card">
                                        <Zap size={18} color="#dc2626" />
                                        <span className="cp-coding-stat-num">{codingStats.hardSolved}</span>
                                        <span className="cp-coding-stat-label">Hard</span>
                                    </div>
                                    {codingStats.favoriteLanguage && (
                                        <div className="cp-coding-stat-card">
                                            <Code2 size={18} color="#7c3aed" />
                                            <span className="cp-coding-stat-num" style={{ fontSize: 14 }}>{codingStats.favoriteLanguage}</span>
                                            <span className="cp-coding-stat-label">Fav. Language</span>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Submissions */}
                                {codingStats.recentSubmissions?.length > 0 && (
                                    <div className="cp-card" style={{ marginTop: 14 }}>
                                        <p className="cp-coding-section-label">Recent Submissions</p>
                                        <div className="cp-recent-subs">
                                            {codingStats.recentSubmissions.slice(0, 5).map((sub: any, i: number) => (
                                                <div key={i} className="cp-recent-sub-row">
                                                    <span
                                                        className="cp-sub-status-dot"
                                                        style={{ background: sub.status === 'accepted' ? '#16a34a' : sub.status === 'partial' ? '#d97706' : '#dc2626' }}
                                                    />
                                                    <span className="cp-sub-title">{sub.problemTitle}</span>
                                                    <span className="cp-sub-lang" style={{ color: '#64748b' }}>{sub.language}</span>
                                                    <span className="cp-sub-score" style={{ color: sub.score >= 70 ? '#16a34a' : '#dc2626' }}>{sub.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resume Skill Verification */}
                                {resumeSkillVerification.length > 0 && (
                                    <div className="cp-card" style={{ marginTop: 14 }}>
                                        <p className="cp-coding-section-label">Resume Skill Verification</p>
                                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>We verify your resume skills against your actual coding performance.</p>
                                        <div className="cp-skill-verification-grid">
                                            {resumeSkillVerification.map((item: any, i: number) => (
                                                <div key={i} className="cp-skill-verify-item">
                                                    <div className="cp-skill-verify-header">
                                                        <span className="cp-skill-verify-name">{item.skill}</span>
                                                        <span
                                                            className="cp-skill-verify-badge"
                                                            style={{
                                                                background: item.status === 'verified' ? '#f0fdf4' : item.status === 'mismatch' ? '#fef2f2' : '#fffbeb',
                                                                color: item.status === 'verified' ? '#16a34a' : item.status === 'mismatch' ? '#dc2626' : '#d97706',
                                                                border: `1px solid ${item.status === 'verified' ? '#bbf7d0' : item.status === 'mismatch' ? '#fecaca' : '#fde68a'}`,
                                                            }}
                                                        >
                                                            {item.status === 'verified' ? '✓ Verified' : item.status === 'mismatch' ? '✗ Mismatch' : '? Unverified'}
                                                        </span>
                                                    </div>
                                                    <p className="cp-skill-verify-evidence">{item.evidence}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="cp-coding-empty">
                                <Code2 size={28} strokeWidth={1.5} />
                                <p><strong>No coding activity yet.</strong></p>
                                <p>Solve coding problems in assessments to build your profile.</p>
                                {!isReadOnly && (
                                    <a href="/candidate/assessments" className="cp-coding-start-btn">Start Coding →</a>
                                )}
                            </div>
                        )}
                    </section>


                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Sparkles size={20} /> Verified Capabilities</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn" onClick={() => setShowSkillModal(true)}>
                                    <Plus size={14} /> Add Skill
                                </button>
                            )}
                        </div>
                        
                        {capabilities.length > 0 ? (
                            <div className="cp-caps-grid">
                                {capabilities.map((cap, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={cap.id || cap.skill} 
                                        className="cp-card cp-cap-card"
                                    >
                                        <div className="cp-cap-header">
                                            <h3>{cap.skill}</h3>
                                            <div className="flex gap-2 items-center">
                                                <span className="cp-cap-score">{cap.score}</span>
                                                {cap.id && !isReadOnly && (
                                                    <button className="cp-cap-delete-btn" onClick={() => handleDeleteSkill(cap.id!)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="cp-cap-bar-wrap">
                                            <motion.div 
                                                className={`cp-cap-bar ${cap.score >= 80 ? 'high' : cap.score >= 40 ? 'medium' : 'low'}`} 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cap.score}%` }}
                                                transition={{ duration: 1, delay: 0.2 + (idx * 0.05) }}
                                            />
                                        </div>
                                        <div className="cp-cap-meta">
                                            <span>Confidence: <strong className="text-slate-800 capitalize">{cap.confidence}</strong></span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 text-slate-500">
                                <Sparkles size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No capabilities verified yet.</p>
                                {!isReadOnly && (
                                    <button className="cp-add-skill-btn mx-auto mt-4" onClick={() => setShowSkillModal(true)}>
                                        <Plus size={14} /> Add your first skill
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* ─── PORTFOLIO TIMELINE ─── */}
                    <section className="cp-section">
                        <h2 className="cp-section-title"><FolderDot size={20} /> Portfolio Projects</h2>
                        
                        {projects.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {projects.map((proj, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={proj.id || proj.name} 
                                        className="cp-timeline-item"
                                    >
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <div className="cp-event-header">
                                                <span className="cp-event-type">
                                                    {proj.source === 'github' ? 'GitHub Sync' : 'Manual Portfolio'}
                                                </span>
                                                {proj.url && (
                                                    <a href={proj.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            <h3 className="cp-event-title">{proj.name}</h3>
                                            {proj.description && <p className="cp-event-desc">{proj.description}</p>}
                                            {proj.technologies && proj.technologies.length > 0 && (
                                                <div className="cp-event-tags">
                                                    {proj.technologies.slice(0, 5).map(tech => (
                                                        <span key={tech} className="cp-event-tag">{tech}</span>
                                                    ))}
                                                    {proj.technologies.length > 5 && (
                                                        <span className="cp-event-tag">+{proj.technologies.length - 5}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <Archive size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No projects synced to portfolio.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── CERTIFICATIONS ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Award size={20} /> Certifications</h2>
                            <button className="cp-add-skill-btn" onClick={() => setShowCertModal(true)}>
                                <Plus size={14} /> Add Certification
                            </button>
                        </div>
                        
                        {certifications.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {certifications.map((cert, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={cert.id || cert.name} 
                                        className="cp-timeline-item"
                                    >
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <div className="cp-event-header">
                                                <span className="cp-event-type">{cert.issuer}</span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {cert.credentialUrl && (
                                                        <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                    {cert.id && (
                                                        <button onClick={() => handleDeleteCert(cert.id!)} className="text-slate-400 hover:text-red-500">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="cp-event-title">{cert.name}</h3>
                                            {cert.issueDate && <p className="cp-event-desc text-xs mt-1">Issued: {cert.issueDate}</p>}
                                            {cert.skills && cert.skills.length > 0 && (
                                                <div className="cp-event-tags mt-3">
                                                    {cert.skills.map(skill => (
                                                        <span key={skill} className="cp-event-tag">{skill}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <Award size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No certifications added yet.</p>
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* ─── ADD SKILL MODAL ─── */}
            <AnimatePresence>
                {showSkillModal && (
                    <motion.div 
                        className="cp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="cp-modal"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            <div className="cp-modal-header">
                                <h2>Add Capability</h2>
                                <button className="cp-modal-close" onClick={() => setShowSkillModal(false)}><X size={20}/></button>
                            </div>
                            
                            <div className="cp-input-group">
                                <label>Skill Name</label>
                                <input 
                                    type="text" 
                                    className="cp-input" 
                                    placeholder="e.g. React, Python, AWS"
                                    value={newSkill.skill}
                                    onChange={e => setNewSkill({...newSkill, skill: e.target.value})}
                                />
                            </div>
                            
                            <div className="cp-input-group">
                                <label>Proficiency Score ({newSkill.score}/100)</label>
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    className="w-full mt-2" 
                                    value={newSkill.score}
                                    onChange={e => setNewSkill({...newSkill, score: parseInt(e.target.value)})}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Confidence Level</label>
                                <select 
                                    className="cp-select"
                                    value={newSkill.confidence}
                                    onChange={e => setNewSkill({...newSkill, confidence: e.target.value as any})}
                                >
                                    <option value="low">Low (Self-Taught)</option>
                                    <option value="medium">Medium (Professional Experience)</option>
                                    <option value="high">High (Expert/Certified)</option>
                                </select>
                            </div>

                            <div className="cp-modal-footer">
                                <button className="cp-btn-cancel" onClick={() => setShowSkillModal(false)}>Cancel</button>
                                <button 
                                    className="cp-btn-save" 
                                    onClick={handleAddSkill}
                                    disabled={!newSkill.skill.trim() || isSavingSkill}
                                >
                                    {isSavingSkill ? <Loader2 className="spin" size={16}/> : 'Save Skill'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── CONNECT PLATFORM MODAL ─── */}
            <AnimatePresence>
                {showPlatformModal && (
                    <motion.div 
                        className="cp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="cp-modal"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            <div className="cp-modal-header">
                                <h2>Connect {
                                    showPlatformModal === 'github' ? 'GitHub' : 
                                    showPlatformModal === 'leetcode' ? 'LeetCode' : 
                                    showPlatformModal === 'linkedin' ? 'LinkedIn' : 'HackerRank'
                                }</h2>
                                <button className="cp-modal-close" onClick={() => setShowPlatformModal(null)}><X size={20}/></button>
                            </div>
                            
                            <div className="cp-input-group">
                                <label>
                                    {showPlatformModal === 'linkedin' ? 'LinkedIn Profile URL' : `${showPlatformModal === 'github' ? 'GitHub' : showPlatformModal === 'leetcode' ? 'LeetCode' : 'HackerRank'} Username`}
                                </label>
                                <input 
                                    type="text" 
                                    className="cp-input" 
                                    placeholder={showPlatformModal === 'linkedin' ? 'https://linkedin.com/in/username' : 'e.g. johndoe'}
                                    value={platformUsername}
                                    onChange={e => setPlatformUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="cp-modal-footer">
                                <button className="cp-btn-cancel" onClick={() => setShowPlatformModal(null)}>Cancel</button>
                                <button 
                                    className="cp-btn-save" 
                                    onClick={handleConnectPlatform}
                                    disabled={!platformUsername.trim() || isSavingPlatform}
                                >
                                    {isSavingPlatform ? <Loader2 className="spin" size={16}/> : 'Connect'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── ADD CERTIFICATION MODAL ─── */}
            <AnimatePresence>
                {showCertModal && (
                    <motion.div 
                        className="cp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="cp-modal"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            <div className="cp-modal-header">
                                <h2>Add Certification</h2>
                                <button className="cp-modal-close" onClick={() => setShowCertModal(false)}><X size={20}/></button>
                            </div>
                            
                            <div className="cp-input-group">
                                <label>Certification Name</label>
                                <input 
                                    type="text" 
                                    className="cp-input" 
                                    placeholder="e.g. AWS Certified Solutions Architect"
                                    value={newCert.name}
                                    onChange={e => setNewCert({...newCert, name: e.target.value})}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Issuing Organization</label>
                                <input 
                                    type="text" 
                                    className="cp-input" 
                                    placeholder="e.g. Amazon Web Services"
                                    value={newCert.issuer}
                                    onChange={e => setNewCert({...newCert, issuer: e.target.value})}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Issue Date</label>
                                <input 
                                    type="date" 
                                    className="cp-input" 
                                    value={newCert.issueDate}
                                    onChange={e => setNewCert({...newCert, issueDate: e.target.value})}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Credential URL (Optional)</label>
                                <input 
                                    type="url" 
                                    className="cp-input" 
                                    placeholder="https://..."
                                    value={newCert.credentialUrl}
                                    onChange={e => setNewCert({...newCert, credentialUrl: e.target.value})}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Skills Acquired (Comma separated)</label>
                                <input 
                                    type="text" 
                                    className="cp-input" 
                                    placeholder="e.g. Cloud Computing, AWS, Security"
                                    value={newCert.skills}
                                    onChange={e => setNewCert({...newCert, skills: e.target.value})}
                                />
                            </div>

                            <div className="cp-modal-footer">
                                <button className="cp-btn-cancel" onClick={() => setShowCertModal(false)}>Cancel</button>
                                <button 
                                    className="cp-btn-save" 
                                    onClick={handleAddCert}
                                    disabled={!newCert.name.trim() || !newCert.issuer.trim() || isSavingCert}
                                >
                                    {isSavingCert ? <Loader2 className="spin" size={16}/> : 'Save Certification'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
