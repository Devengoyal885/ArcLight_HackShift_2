import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { 
    getCapabilities, getProjects, updateProfile, 
    addCapability, deleteCapability,
    getCertifications, addCertification, deleteCertification,
    getProfile, updateProject,
    getWorkExperiences, getAwards, getLanguages, getPublications, recordProfileView, computeProfileCompleteness,
} from '../../services/profileService';
import type { 
    UserCapability, UserProject, UserCertification, UserProfile,
    WorkExperience, Award, Language, Publication 
} from '../../services/profileService';
import { getEndorsements, endorseSkill, removeEndorsement, type SkillEndorsement } from '../../services/endorsementService';
import { claimUsername } from '../../services/publicProfileService';
import ProfileCompleteness from '../../components/profile/ProfileCompleteness';
import { CheckCircle, MapPin, Archive, Sparkles, Loader2, Edit3, X, 
    Plus, Trash2, Code, ExternalLink, Terminal, FolderDot, Award as AwardIcon, GraduationCap,
    ArrowLeft, Code2, BarChart3, CheckCircle2, AlertCircle, Trophy, Zap, FileText, Upload,
    Share2, Copy, Link2, User, Eye, EyeOff, QrCode, Heart, TrendingUp, Clock
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import SkillRadarChart from '../../components/profile/SkillRadarChart';
import { fetchLeetCodeStats, calculateCurrentStreak } from '../../services/leetcodeService';
import { LeetCodeWidget, GitHubWidget, LinkedInWidget } from '../../components/profile/PlatformWidgets';
import { getCodingStats, getResumeSkillVerification, saveProjects, saveCapabilities, addWorkExperience } from '../../services/profileService';
import { extractTextFromPDF } from '../../utils/pdfParser';
import { parseResume, inferCapabilitiesFromResume, parsedToProjects, inferencedToCapabilities } from '../../services/resumeParserService';
import './CodolioProfilePage.css';


export default function CodolioProfilePage() {
    const { user, dbUid, profile: ownProfile, role, refreshProfile } = useAuth();
    const { uid: viewUid } = useParams<{ uid?: string }>();

    // If viewUid is present, we're in READ-ONLY mode viewing someone else's profile
    const isReadOnly = !!viewUid;
    const targetUid = viewUid || dbUid;

    const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [certifications, setCertifications] = useState<UserCertification[]>([]);
    const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
    
    // New Data States
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);
    
    const [loading, setLoading] = useState(true);

    // Use own profile when in own view, or the fetched viewedProfile when in read-only
    const profile = isReadOnly ? viewedProfile : ownProfile;

    // Track profile view
    useEffect(() => {
        if (isReadOnly && viewUid && ownProfile?.uid && viewUid !== ownProfile.uid) {
            recordProfileView(viewUid, {
                viewerUid: ownProfile.uid,
                viewerName: ownProfile.name,
                viewerAvatar: ownProfile.avatar,
                viewerRole: ownProfile.role,
            });
        }
    }, [isReadOnly, viewUid, ownProfile]);

    // Institution code state (own profile only)
    const [editingInstCode, setEditingInstCode] = useState(false);
    const [instCodeInput, setInstCodeInput] = useState('');
    const [savingInstCode, setSavingInstCode] = useState(false);
    const [instCodeSaved, setInstCodeSaved] = useState(false);

    // Academic Details state
    const [editingAcademic, setEditingAcademic] = useState(false);
    const [cgpaInput, setCgpaInput] = useState<string>('');
    const [backlogsInput, setBacklogsInput] = useState<string>('');
    const [savingAcademic, setSavingAcademic] = useState(false);
    
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
    const [newCert, setNewCert] = useState({ name: '', issuer: '', issueDate: '', credentialUrl: '', badgeUrl: '', skills: '' });
    const [isSavingCert, setIsSavingCert] = useState(false);
    const [uploadingBadge, setUploadingBadge] = useState(false);
    
    // Resume Upload State
    const [uploadingResume, setUploadingResume] = useState(false);
    
    // Avatar Upload State
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Video Pitch Upload State
    const [uploadingVideo, setUploadingVideo] = useState(false);

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
            await refreshProfile();
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

    const handleEndorseSkill = async (skillName: string) => {
        if (!targetUid || !user || !ownProfile) return;
        try {
            await endorseSkill(targetUid, user.uid, ownProfile.name, skillName, {
                endorserAvatar: ownProfile.avatar,
                endorserRole: role || 'candidate'
            });
            // Reload endorsements
            const updatedEndorsements = await getEndorsements(targetUid);
            setEndorsements(updatedEndorsements);
        } catch (err: any) {
            alert(err.message || 'Failed to endorse skill');
        }
    };

    useEffect(() => {
        if (!targetUid) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const [caps, projs, certs, work, aw, langs, pubs, endors] = await Promise.all([
                    getCapabilities(targetUid),
                    getProjects(targetUid),
                    getCertifications(targetUid),
                    getWorkExperiences(targetUid),
                    getAwards(targetUid),
                    getLanguages(targetUid),
                    getPublications(targetUid),
                    getEndorsements(targetUid),
                ]);
                setCapabilities(caps);
                setProjects(projs);
                setCertifications(certs);
                setWorkExperiences(work);
                setAwards(aw);
                setLanguages(langs);
                setPublications(pubs);
                setEndorsements(endors);
                
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
            setNewCert({ name: '', issuer: '', issueDate: '', credentialUrl: '', badgeUrl: '', skills: '' });
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
            // Update local platform stats so widget re-renders without reload
            if (showPlatformModal === 'github') setGithubStats(null);
            if (showPlatformModal === 'leetcode') setLeetcodeStats(null);
            await refreshProfile();
            setShowPlatformModal(null);
            setPlatformUsername('');
        } catch (error) {
            console.error("Failed to connect platform", error);
        } finally {
            setIsSavingPlatform(false);
        }
    };

    const handleSaveAcademic = async () => {
        if (!dbUid) return;
        setSavingAcademic(true);
        try {
            await updateProfile(dbUid, { 
                cgpa: cgpaInput ? parseFloat(cgpaInput) : null as any,
                activeBacklogs: backlogsInput ? parseInt(backlogsInput) : null as any
            });
            setEditingAcademic(false);
            await refreshProfile();
        } catch (e) {
            console.error(e);
        } finally {
            setSavingAcademic(false);
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
            // Clear the relevant stats widget without reload
            if (platform === 'github') setGithubStats(null);
            if (platform === 'leetcode') setLeetcodeStats(null);
            await refreshProfile();
        } catch (error) {
            console.error("Failed to disconnect platform", error);
        }
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !dbUid) return;
        setUploadingResume(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads');
            
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                throw new Error('Cloudinary is not configured.');
            }
            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || 'Resume upload failed.');
            }

            const uploadData = await uploadRes.json();
            const url = uploadData.secure_url;

            // ── PARSE RESUME CONTENT & POPULATE PROFILE ──
            try {
                let text = '';
                if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
                    text = await extractTextFromPDF(file);
                } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
                    text = await file.text();
                }

                if (text && text.trim().length > 50) {
                    const parsed = await parseResume(text);
                    if (parsed) {
                        const updates: Partial<UserProfile> = { resumeUrl: url };
                        if (parsed.education && parsed.education.length > 0) updates.education = parsed.education;
                        if (parsed.profile.githubUsername && !profile?.githubUsername) updates.githubUsername = parsed.profile.githubUsername;
                        if (parsed.profile.linkedinUrl && !profile?.linkedinUrl) updates.linkedinUrl = parsed.profile.linkedinUrl;
                        if (parsed.profile.portfolioUrl && !profile?.portfolioUrl) updates.portfolioUrl = parsed.profile.portfolioUrl;
                        if (parsed.profile.headline && !profile?.headline) updates.headline = parsed.profile.headline;
                        if (parsed.profile.location && !profile?.location) updates.location = parsed.profile.location;

                        await updateProfile(dbUid, updates);

                        if (parsed.projects && parsed.projects.length > 0) {
                            const projectsData = parsedToProjects(parsed);
                            await saveProjects(dbUid, projectsData);
                        }

                        if (parsed.experience && parsed.experience.length > 0) {
                            for (const exp of parsed.experience) {
                                await addWorkExperience(dbUid, {
                                    role: exp.role || 'Contributor',
                                    company: exp.company,
                                    startDate: exp.duration || '',
                                    current: false,
                                    type: 'internship',
                                    description: exp.description || ''
                                });
                            }
                        }

                        const inferred = await inferCapabilitiesFromResume(parsed);
                        if (inferred && inferred.length > 0) {
                            const caps = inferencedToCapabilities(inferred);
                            await saveCapabilities(dbUid, caps);
                        }
                    } else {
                        await updateProfile(dbUid, { resumeUrl: url });
                    }
                } else {
                    await updateProfile(dbUid, { resumeUrl: url });
                }
            } catch (parseErr) {
                console.error("Resume uploaded but failed to parse:", parseErr);
                await updateProfile(dbUid, { resumeUrl: url });
            }
            
            await refreshProfile();
        } catch (err) {
            console.error("Failed to upload resume:", err);
            alert("Failed to upload resume. Please try again.");
        } finally {
            setUploadingResume(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !dbUid) return;
        setUploadingAvatar(true);
        try {
            // Compress image using canvas
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 512;
            let width = bitmap.width;
            let height = bitmap.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(bitmap, 0, 0, width, height);
            
            const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.8));
            
            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', blob, `profile_${Date.now()}.jpg`);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads');
            
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                throw new Error('Cloudinary is not configured. Please contact support.');
            }
            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || 'Photo upload failed. Please try again.');
            }

            const uploadData = await uploadRes.json();
            const url = uploadData.secure_url;

            await updateProfile(dbUid, { avatar: url });
            await refreshProfile();
        } catch (err) {
            console.error("Failed to upload avatar:", err);
            alert("Failed to upload photo. Please try again.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBadge(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads');
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) throw new Error('Cloudinary not configured.');

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || 'Badge upload failed.');
            }

            const uploadData = await uploadRes.json();
            setNewCert(prev => ({ ...prev, badgeUrl: uploadData.secure_url }));
        } catch (err) {
            console.error("Failed to upload badge:", err);
            alert("Failed to upload badge. Please try again.");
        } finally {
            setUploadingBadge(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !dbUid) return;

        // Validate file size (max 100MB for video)
        if (file.size > 100 * 1024 * 1024) {
            alert('Video must be under 100MB. Please trim or compress your video.');
            return;
        }

        setUploadingVideo(true);
        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads';
            if (!cloudName) {
                alert('Video upload is not configured. Please contact support.');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || 'Video upload failed. Please try again.');
            }

            const uploadData = await uploadRes.json();
            await updateProfile(dbUid, { videoPitchUrl: uploadData.secure_url });
            await refreshProfile();
        } catch (err: any) {
            console.error('Video upload failed:', err);
            alert(err?.message || 'Failed to upload video. Please try again.');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleProjectScreenshotUpload = async (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !dbUid) return;

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) throw new Error('Cloudinary not configured.');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads');

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Cloudinary upload failed');

            const uploadData = await uploadRes.json();
            
            await updateProject(dbUid, projectId, { screenshotUrl: uploadData.secure_url });
            // Update local state so thumbnail shows immediately
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, screenshotUrl: uploadData.secure_url } : p));
        } catch (err) {
            console.error(err);
            alert("Failed to upload screenshot.");
        }
    };

    // Task 2: Remove screenshot from a portfolio project
    const handleRemoveScreenshot = async (projectId: string) => {
        if (!dbUid) return;
        try {
            await updateProject(dbUid, projectId, { screenshotUrl: '' });
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, screenshotUrl: undefined } : p));
        } catch (err) {
            console.error(err);
            alert('Failed to remove screenshot.');
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
                        <ArrowLeft size={15} /> Back
                    </Link>
                    <span className="cp-readonly-label">Viewing profile (read-only)</span>
                </div>
            )}

            <div className="cp-content">
                {/* ─── SIDEBAR: Read-Only Identity ─── */}
                <aside className="cp-sidebar">
                    <div className="cp-card cp-profile-card">
                        <div className="cp-avatar-wrap" style={{ position: 'relative' }}>
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="cp-avatar-img" style={{ opacity: uploadingAvatar ? 0.5 : 1 }} />
                            ) : (
                                <div className="cp-avatar-placeholder" style={{ opacity: uploadingAvatar ? 0.5 : 1 }}>
                                    {initials}
                                </div>
                            )}
                            {!isReadOnly && (
                                <label style={{ position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', opacity: uploadingAvatar ? 1 : 0, borderRadius: '50%', transition: 'opacity 0.2s', width: '100%', height: '100%' }}
                                       onMouseEnter={(e) => { if (!uploadingAvatar) e.currentTarget.style.opacity = '1'; }}
                                       onMouseLeave={(e) => { if (!uploadingAvatar) e.currentTarget.style.opacity = '0'; }}>
                                    {uploadingAvatar ? <Loader2 className="spin" size={24} /> : <Upload size={24} />}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                </label>
                            )}
                        </div>
                        <h1 className="cp-profile-name">{profile?.name || 'Candidate'}</h1>
                        <p className="cp-username">
                            @{profile?.name?.replace(/\s+/g, '').toLowerCase() || 'user'} 
                            <CheckCircle size={14} className="cp-verified-icon" />
                        </p>
                        {profile?.headline && <p className="cp-bio">{profile.headline}</p>}

                        {Boolean(profile?.updatedAt) && (
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                Last updated: {
                                    typeof (profile!.updatedAt as any).toDate === 'function' 
                                    ? (profile!.updatedAt as any).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : new Date(profile!.updatedAt as any).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                }
                            </p>
                        )}

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
                                    
                                    {/* Visibility Toggle */}
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {profile?.visibility === 'private' ? <EyeOff size={14} color="#64748b" /> : <Eye size={14} color="#10b981" />}
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                {profile?.visibility === 'private' ? 'Private Profile' : 'Public Profile'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => updateProfile(dbUid!, { visibility: profile?.visibility === 'private' ? 'public' : 'private' }).then(() => refreshProfile())}
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Toggle
                                        </button>
                                    </div>
                                    
                                    {/* QR Code */}
                                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ background: 'white', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <QRCode value={shareUrl} size={100} level="L" />
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <QrCode size={12} /> Scan to view profile
                                        </p>
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
                        const completeness = computeProfileCompleteness(profile, {
                            hasCapabilities: capabilities.length > 0,
                            hasCertifications: certifications.length > 0,
                            hasProjects: projects.length > 0,
                            hasWorkExperience: workExperiences.length > 0,
                            hasEducation: (profile?.education && profile.education.length > 0) ? true : false,
                        });
                        return (
                            <ProfileCompleteness
                                score={completeness.score}
                                suggestions={completeness.suggestions}
                            />
                        );
                    })()}

                    <div className="cp-card">
                        <div className="cp-card-header">
                            <Archive size={16} />
                            <span>Ecosystem Vitality</span>
                        </div>
                        <div className="cp-footer-stats">
                            <span>Profile Views</span>
                            <span className="cp-stat-accent text-purple-600">
                                {profile?.profileViews || 0}
                            </span>
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

                    {/* Academic Details card */}
                    <div className="cp-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                        <div className="cp-card-header">
                            <AwardIcon size={16} style={{ color: '#f59e0b' }} />
                            <span style={{ fontWeight: 700 }}>Academic Details</span>
                        </div>
                        {editingAcademic ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                <label style={{ fontSize: '12px', color: '#475569' }}>CGPA (0 - 10)</label>
                                <input
                                    className="cp-input"
                                    type="number" step="0.01" min="0" max="10"
                                    style={{ fontSize: '13px', padding: '6px 10px' }}
                                    placeholder="e.g. 8.5"
                                    value={cgpaInput}
                                    onChange={e => setCgpaInput(e.target.value)}
                                />
                                <label style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Active Backlogs</label>
                                <input
                                    className="cp-input"
                                    type="number" min="0"
                                    style={{ fontSize: '13px', padding: '6px 10px' }}
                                    placeholder="e.g. 0"
                                    value={backlogsInput}
                                    onChange={e => setBacklogsInput(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                    <button
                                        className="cp-btn-save"
                                        style={{ flex: 1, padding: '6px 12px', fontSize: '12px', background: '#f59e0b', borderColor: '#f59e0b' }}
                                        onClick={handleSaveAcademic}
                                        disabled={savingAcademic}
                                    >
                                        {savingAcademic ? <Loader2 size={12} className="spin" /> : 'Save'}
                                    </button>
                                    <button
                                        className="cp-btn-cancel"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                        onClick={() => setEditingAcademic(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="cp-footer-stats">
                                    <span>CGPA</span>
                                    <span className="cp-stat-accent text-amber-600">
                                        {(profile as any)?.cgpa ?? 'Not set'}
                                    </span>
                                </div>
                                <div className="cp-footer-stats">
                                    <span>Active Backlogs</span>
                                    <span className="cp-stat-accent text-amber-600">
                                        {(profile as any)?.activeBacklogs ?? 'Not set'}
                                    </span>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        style={{ fontSize: '11px', color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', textDecoration: 'underline' }}
                                        onClick={() => { 
                                            setCgpaInput(((profile as any)?.cgpa || '') + ''); 
                                            setBacklogsInput(((profile as any)?.activeBacklogs || '') + '');
                                            setEditingAcademic(true); 
                                        }}
                                    >
                                        Edit Details
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ─── MAIN COLUMN: Capabilities & Proofs ─── */}
                <main className="cp-main">
                    
                    {/* ─── VIDEO INTRODUCTION ─── */}
                    {(profile?.videoPitchUrl || !isReadOnly) && (
                        <section className="cp-section">
                            <h2 className="cp-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                30-Second Self-Pitch
                            </h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                                A quick introduction to let recruiters know who you are and what you're passionate about.
                            </p>
                            
                            {profile?.videoPitchUrl ? (
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000', display: 'flex', justifyContent: 'center' }}>
                                    <video 
                                        src={profile.videoPitchUrl} 
                                        controls 
                                        style={{ maxHeight: '350px', width: '100%', objectFit: 'cover' }}
                                    />
                                    {!isReadOnly && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '8px' }}>
                                            <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                {uploadingVideo ? <Loader2 size={14} className="spin" /> : <Edit3 size={14} />} 
                                                Replace
                                                <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} disabled={uploadingVideo} />
                                            </label>
                                            <button 
                                                onClick={async () => {
                                                    if(!dbUid) return;
                                                    await updateProfile(dbUid, { videoPitchUrl: null as any });
                                                    await refreshProfile();
                                                }}
                                                style={{ background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                !isReadOnly && (
                                    <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500">
                                        <div style={{ background: '#f1f5f9', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                        </div>
                                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Stand out with a video intro</p>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Record a short 30s video introducing yourself, your goals, and what makes you unique.</p>
                                        <label className="cp-add-skill-btn mx-auto mt-4" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                                            {uploadingVideo ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} 
                                            {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                                            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} disabled={uploadingVideo} />
                                        </label>
                                    </div>
                                )
                            )}
                        </section>
                    )}

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
                            <>
                                <div className="cp-card mb-6 p-4">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h3 className="text-sm font-bold text-slate-700">Capability Profile vs Market Target</h3>
                                        <span style={{ fontSize: '11px', color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Skill Gap Analysis</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Visualizing your current proficiency against expected industry target requirements.</p>
                                    <SkillRadarChart capabilities={capabilities} targetRole={profile?.headline || 'Software Engineer'} />
                                </div>
                                <div className="cp-caps-grid">
                                    {[...capabilities].sort((a, b) => b.score - a.score).map((cap, idx) => {
                                        const capEndorsements = endorsements.filter(e => e.skill === cap.skill);
                                        const hasEndorsed = capEndorsements.some(e => e.endorserUid === user?.uid);

                                        return (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={cap.id || cap.skill} 
                                                className="cp-card cp-cap-card"
                                                style={{ position: 'relative' }}
                                            >
                                                <div className="cp-cap-header">
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {cap.skill}
                                                            {idx === 0 && (
                                                                <span style={{ fontSize: '10px', padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontWeight: 700 }}>
                                                                    Top Skill
                                                                </span>
                                                            )}
                                                        </h3>
                                                    </div>
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
                                                <div className="cp-cap-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>Confidence: <strong className="text-slate-800 capitalize">{cap.confidence}</strong></span>
                                                    <span style={{ display: 'flex', gap: '8px' }}>
                                                        <span style={{ color: '#6366f1', fontWeight: 600 }}>Top {Math.max(1, 100 - cap.score + 5)}%</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#10b981' }}>
                                                            <TrendingUp size={12} /> Rising Demand
                                                        </span>
                                                    </span>
                                                </div>
                                                
                                                {/* Endorsements Section */}
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <User size={14} color="#64748b" />
                                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                                            {capEndorsements.length} {capEndorsements.length === 1 ? 'Endorsement' : 'Endorsements'}
                                                        </span>
                                                    </div>
                                                    {isReadOnly && user?.uid !== targetUid && (
                                                        <button 
                                                            onClick={() => handleEndorseSkill(cap.skill)}
                                                            disabled={hasEndorsed}
                                                            style={{
                                                                fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px',
                                                                background: hasEndorsed ? '#e2e8f0' : '#eff6ff',
                                                                color: hasEndorsed ? '#94a3b8' : '#3b82f6',
                                                                border: `1px solid ${hasEndorsed ? '#cbd5e1' : '#bfdbfe'}`,
                                                                cursor: hasEndorsed ? 'default' : 'pointer'
                                                            }}
                                                        >
                                                            {hasEndorsed ? 'Endorsed' : '+ Endorse'}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </>
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
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {proj.url && (
                                                        <a href={proj.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                    {proj.repositoryUrl && (
                                                        <a href={proj.repositoryUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {proj.screenshotUrl && (
                                                <div style={{ width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', position: 'relative' }}>
                                                    <img src={proj.screenshotUrl} alt={proj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {!isReadOnly && proj.id && (
                                                        <button
                                                            onClick={() => handleRemoveScreenshot(proj.id!)}
                                                            title="Remove screenshot"
                                                            style={{
                                                                position: 'absolute', top: 6, right: 6,
                                                                background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)',
                                                                color: 'white', border: 'none', borderRadius: '6px',
                                                                padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                            }}
                                                        >
                                                            ✕ Remove
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <h3 className="cp-event-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {proj.name}
                                                {!isReadOnly && proj.id && (
                                                    <label style={{ cursor: 'pointer', fontSize: '11px', color: '#6366f1', background: '#eef2ff', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleProjectScreenshotUpload(proj.id!, e)} />
                                                        {proj.screenshotUrl ? '🖼️ Replace' : '+ Screenshot'}
                                                    </label>
                                                )}
                                            </h3>
                                            
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

                    {/* ─── WORK EXPERIENCE ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><User size={20} /> Work Experience</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn" onClick={() => { /* TODO: Modal */ }}>
                                    <Plus size={14} /> Add Experience
                                </button>
                            )}
                        </div>
                        
                        {workExperiences.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {workExperiences.map((exp, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={exp.id || idx} 
                                        className="cp-timeline-item"
                                    >
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <div className="cp-event-header">
                                                <span className="cp-event-type capitalize">{exp.type}</span>
                                            </div>
                                            <h3 className="cp-event-title">{exp.role} at {exp.company}</h3>
                                            <p className="cp-event-desc text-xs mt-1">
                                                {exp.startDate} - {exp.current ? 'Present' : exp.endDate} {exp.location && `• ${exp.location}`}
                                            </p>
                                            {exp.description && <p className="cp-event-desc mt-2">{exp.description}</p>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <User size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No work experience added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── EDUCATION ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><GraduationCap size={20} /> Education</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn" onClick={() => { /* TODO: Modal */ }}>
                                    <Plus size={14} /> Add Education
                                </button>
                            )}
                        </div>
                        
                        {profile?.education && profile.education.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {profile.education.map((edu, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx} 
                                        className="cp-timeline-item"
                                    >
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <h3 className="cp-event-title">{edu.school || edu.institution}</h3>
                                            <p className="cp-event-desc font-medium mt-1">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                                            <p className="cp-event-desc text-xs mt-1">
                                                {edu.startDate} - {edu.endDate || 'Present'} {edu.grade && `• Grade: ${edu.grade}`}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <GraduationCap size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No education added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── CERTIFICATIONS ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><AwardIcon size={20} /> Certifications</h2>
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
                                        <div className="cp-card cp-event-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                            {cert.badgeUrl && (
                                                <img src={cert.badgeUrl} alt={`${cert.name} badge`} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div className="cp-event-header">
                                                    <span className="cp-event-type">{cert.issuer}</span>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {cert.credentialUrl && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                padding: '3px 8px', borderRadius: '20px',
                                                                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                                                color: '#065f46', fontSize: '10px', fontWeight: 700,
                                                                border: '1px solid #6ee7b7', letterSpacing: '0.03em'
                                                            }}>
                                                                <CheckCircle2 size={10} /> VERIFIED
                                                            </span>
                                                        )}
                                                        {cert.credentialUrl && (
                                                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500" title="View Credential">
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                        {!isReadOnly && cert.id && (
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
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <AwardIcon size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No certifications added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── AWARDS & HONORS ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Trophy size={20} /> Awards & Honors</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn">
                                    <Plus size={14} /> Add Award
                                </button>
                            )}
                        </div>
                        {awards.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {awards.map((aw, idx) => (
                                    <motion.div key={idx} className="cp-timeline-item">
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <div className="cp-event-header">
                                                <span className="cp-event-type">{aw.issuer}</span>
                                            </div>
                                            <h3 className="cp-event-title">{aw.title}</h3>
                                            <p className="cp-event-desc text-xs mt-1">Issued: {aw.date}</p>
                                            {aw.description && <p className="cp-event-desc mt-2">{aw.description}</p>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <Trophy size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No awards added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── PUBLICATIONS ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><FileText size={20} /> Publications</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn">
                                    <Plus size={14} /> Add Publication
                                </button>
                            )}
                        </div>
                        {publications.length > 0 ? (
                            <div className="cp-timeline mt-6">
                                {publications.map((pub, idx) => (
                                    <motion.div key={idx} className="cp-timeline-item">
                                        <div className="cp-timeline-node"></div>
                                        <div className="cp-card cp-event-card">
                                            <div className="cp-event-header">
                                                <span className="cp-event-type">{pub.journal || 'Publication'}</span>
                                                {pub.url && (
                                                    <a href={pub.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            <h3 className="cp-event-title">{pub.title}</h3>
                                            <p className="cp-event-desc text-xs mt-1">Date: {pub.date} {pub.coAuthors && `• with ${pub.coAuthors}`}</p>
                                            {pub.description && <p className="cp-event-desc mt-2">{pub.description}</p>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <FileText size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No publications added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── LANGUAGES ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Terminal size={20} /> Languages</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn">
                                    <Plus size={14} /> Add Language
                                </button>
                            )}
                        </div>
                        {languages.length > 0 ? (
                            <div className="cp-caps-grid mt-4">
                                {languages.map((lang, idx) => (
                                    <div key={idx} className="cp-card cp-cap-card" style={{ padding: '12px 16px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{lang.language}</h3>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'capitalize' }}>
                                            {lang.proficiency} {lang.score && `• ${lang.score}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-8 border-dashed border-slate-300 text-slate-500 mt-4">
                                <Terminal size={32} className="mx-auto mb-4 opacity-50" />
                                <p>No languages added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ─── HOBBIES & EXTRACURRICULARS ─── */}
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title"><Heart size={20} /> Hobbies & Extracurriculars</h2>
                            {!isReadOnly && (
                                <button className="cp-add-skill-btn">
                                    <Plus size={14} /> Add Hobby
                                </button>
                            )}
                        </div>
                        {profile?.hobbies && profile.hobbies.length > 0 ? (
                            <div className="cp-event-tags mt-4">
                                {profile.hobbies.map((hobby, idx) => (
                                    <span key={idx} className="cp-event-tag" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', padding: '6px 12px', fontSize: '13px' }}>
                                        {hobby}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="cp-card text-center p-6 border-dashed border-slate-300 text-slate-500 mt-4">
                                <Heart size={24} className="mx-auto mb-3 opacity-50" />
                                <p style={{ fontSize: '13px' }}>No hobbies added yet. Show your personality beyond code!</p>
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
                                <label>Upload Badge Image (Optional)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleBadgeUpload}
                                        disabled={uploadingBadge}
                                        className="cp-input" 
                                        style={{ flex: 1, padding: '4px' }}
                                    />
                                    {uploadingBadge && <Loader2 className="spin" size={20} color="#6366f1" />}
                                    {newCert.badgeUrl && !uploadingBadge && (
                                        <img src={newCert.badgeUrl} alt="Badge Preview" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                    )}
                                </div>
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
