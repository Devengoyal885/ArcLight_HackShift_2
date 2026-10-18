/**
 * OnboardingPage.tsx
 * ──────────────────
 * Multi-step onboarding for new CapAble users.
 * 
 * Step 1: Role selection (Candidate / Employer)
 * Step 2: Paste or upload resume → Gemini parses it → creates real profile
 * Step 3: Confirm profile details + optionally add GitHub username
 * Step 4: Done → navigate to dashboard
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../lib/firebase';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import {
    ArrowRight, ArrowLeft, User as UserIcon, Briefcase,
    CheckCircle, Upload, FileText, Loader2, GitBranch,
    Sparkles, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    getProfile, createProfile, updateProfile, saveProjects, saveCapabilities, addWorkExperience
} from '../../services/profileService';
import { saveEmployerProfile, getEmployerProfile } from '../../services/employerService';
import type { OrgType, EmployerProfile } from '../../services/employerService';
import {
    parseResume, inferCapabilitiesFromResume,
    parsedToProjects, inferencedToCapabilities
} from '../../services/resumeParserService';
import type { ParsedResume } from '../../services/resumeParserService';
import { extractTextFromPDF } from '../../utils/pdfParser';
import { GraduationCap } from 'lucide-react';
import logo from '../../assets/sihlogo.png';
import './OnboardingPage.css';

type Role = 'candidate' | 'employer' | 'academician' | 'institution';

export default function OnboardingPage() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // Pre-read role from localStorage (set during login panel selection)
    const preselectedRole = (localStorage.getItem('userRole') as Role | null) || null;
    // If role was pre-selected on the login page, skip Step 1 (role picker)
    const [step, setStep] = useState(preselectedRole ? 2 : 1);
    const [role, setRole] = useState<Role>(preselectedRole || 'candidate');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If user is already authenticated and has an existing completed profile, redirect them immediately to their dashboard
    useEffect(() => {
        if (!user) return;
        let isCancelled = false;
        const checkAlreadyOnboarded = async () => {
            try {
                // Check employer first
                const empProf = await getEmployerProfile(`${user.uid}_employer`);
                if (empProf?.companyName) {
                    if (!isCancelled) {
                        localStorage.setItem('userRole', 'employer');
                        navigate('/employer', { replace: true });
                    }
                    return;
                }

                // Check candidate
                const candProf = await getProfile(`${user.uid}_candidate`);
                if (candProf?.profileComplete) {
                    if (!isCancelled) {
                        localStorage.setItem('userRole', 'candidate');
                        navigate('/candidate', { replace: true });
                    }
                    return;
                }

                // Check faculty/academician
                const acadProf = await getProfile(`${user.uid}_academician`);
                if (acadProf?.profileComplete) {
                    if (!isCancelled) {
                        localStorage.setItem('userRole', 'academician');
                        navigate('/faculty', { replace: true });
                    }
                    return;
                }

                // Check institution
                const instProf = await getProfile(`${user.uid}_institution`);
                if (instProf?.profileComplete) {
                    if (!isCancelled) {
                        localStorage.setItem('userRole', 'institution');
                        navigate('/institution', { replace: true });
                    }
                    return;
                }
            } catch (err) {
                console.warn('[OnboardingPage] checkAlreadyOnboarded error:', err);
            }
        };
        checkAlreadyOnboarded();
        return () => { isCancelled = true; };
    }, [user, navigate]);

    // Resume step state
    const [resumeText, setResumeText] = useState('');
    const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile confirmation step
    const [githubUsername, setGithubUsername] = useState('');
    const [headline, setHeadline] = useState('');
    const [location, setLocation] = useState('');

    // Employer profile step state
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [companySize, setCompanySize] = useState('');
    const [orgType, setOrgType] = useState<OrgType>('enterprise');
    const [startupStage, setStartupStage] = useState<string>('');
    const [foundingYear, setFoundingYear] = useState<string>('');

    // Faculty / Institution
    const [institutionCode, setInstitutionCode] = useState('');
    const [department, setDepartment] = useState('');

    const totalSteps = role === 'candidate' ? 4 : role === 'employer' ? 2 : 1;

    // ─── Step 2: Parse Resume ────────────────────────────────────────────────

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResumeFile(file);
        setParseError('');
        
        if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
            try {
                const text = await extractTextFromPDF(file);
                setResumeText(text);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to parse PDF.';
                setParseError(msg);
            }
        } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = () => setResumeText(reader.result as string);
            reader.readAsText(file);
        } else {
            setParseError('Unsupported file type. Please upload a .pdf or .txt file.');
        }
    }, []);

    const handleParseResume = async () => {
        if (!resumeText.trim() || resumeText.trim().length < 50) {
            setParseError('Please paste more resume content (at least 50 characters).');
            return;
        }
        setParsing(true);
        setParseError('');
        try {
            const parsed = await parseResume(resumeText);
            if (!parsed) {
                setParseError('AI parsing failed — the result was empty. Please try again, or use the skip option to fill your profile manually.');
                return;
            }
            setParsedResume(parsed);
            // Pre-fill confirmation fields
            if (parsed.profile.githubUsername) setGithubUsername(parsed.profile.githubUsername);
            if (parsed.profile.headline) setHeadline(parsed.profile.headline);
            if (parsed.profile.location) setLocation(parsed.profile.location);
            setStep(3);
        } catch (err: any) {
            const isNetworkErr = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.message?.includes('ERR_CONNECTION_REFUSED');
            if (isNetworkErr) {
                setParseError('AI server is unreachable. You can skip this step and fill in your profile manually from your dashboard.');
            } else {
                setParseError(err?.message || 'Failed to parse resume. Please try again or skip.');
            }
            console.error('[parseResume]', err);
        } finally {
            setParsing(false);
        }
    };

    const skipResume = () => {
        setStep(3);
    };

    // ─── Step 4: Finish Onboarding ───────────────────────────────────────────

    const handleFinish = async () => {
        // Employer / Academician: no profile creation needed — just set role and navigate
        if (role === 'employer') {
            setLoading(true);
            try {
                if (user) {
                    const profileId = `${user.uid}_employer`;
                    const resolvedName = companyName.trim() || user.displayName || 'My Company';
                    await saveEmployerProfile(profileId, {
                        uid: profileId,
                        companyName: resolvedName,
                        industry: industry || 'Technology',
                        website: website || undefined,
                        size: companySize || undefined,
                        orgType,
                        startupStage: orgType === 'startup' && startupStage ? startupStage as EmployerProfile['startupStage'] : undefined,
                        foundingYear: foundingYear || undefined,
                    });
                    localStorage.setItem('employer_companyName', resolvedName);
                    // Persist role to Firestore user profile
                    await updateProfile(profileId, { 
                        role: 'employer', 
                        profileComplete: true,
                        companyName: resolvedName 
                    } as any);
                }
            } catch (e) {
                console.warn('[onboarding] saveEmployerProfile failed (non-critical):', e);
            } finally {
                setLoading(false);
            }
            localStorage.setItem('userRole', 'employer');
            await refreshProfile();
            navigate('/employer');
            return;
        }
        if (role === 'academician') {
            setLoading(true);
            try {
                if (user) {
                    const profileId = `${user.uid}_academician`;
                    await updateProfile(profileId, {
                        role: 'academician',
                        name: user.displayName || '',
                        email: user.email || '',
                        avatar: user.photoURL || undefined,
                        profileComplete: true,
                        institutionCode: institutionCode.trim().toUpperCase() || undefined,
                        department: department.trim() || undefined,
                    } as any);
                }
            } catch (e) {
                console.warn('[onboarding] academician profile save failed (non-critical):', e);
            } finally {
                setLoading(false);
            }
            localStorage.setItem('userRole', 'academician');
            await refreshProfile();
            navigate('/faculty');
            return;
        }
        if (role === 'institution') {
            setLoading(true);
            try {
                if (user) {
                    const profileId = `${user.uid}_institution`;
                    await updateProfile(profileId, {
                        role: 'institution',
                        name: user.displayName || '',
                        email: user.email || '',
                        avatar: user.photoURL || undefined,
                        profileComplete: true,
                        institutionCode: institutionCode.trim().toUpperCase() || undefined,
                    } as any);
                }
            } catch (e) {
                console.warn('[onboarding] institution profile save failed (non-critical):', e);
            } finally {
                setLoading(false);
            }
            localStorage.setItem('userRole', 'institution');
            await refreshProfile();
            navigate('/institution');
            return;
        }

        // Candidate: requires user object for Firestore profile creation
        if (!user) return;
        setLoading(true);
        setError('');

        try {

            localStorage.setItem('userRole', 'candidate');
            // Role will be persisted to Firestore below in profileData

            // ── 1. Update Firebase Auth display name ─────────────────────────
            const name = parsedResume?.profile.name || user.displayName || '';
            if (name && name !== user.displayName) {
                try {
                    await updateFirebaseProfile(user, { displayName: name });
                } catch (e) {
                    console.warn('[onboarding] Firebase displayName update failed (non-critical):', e);
                }
            }

            // ── 2. Upload resume to Cloudinary (non-critical) ─────────────────
            let uploadedResumeUrl: string | undefined;
            if (resumeFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', resumeFile);
                    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'capable_uploads');
                    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                    if (cloudName) {
                        const res = await fetch(
                            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                            { method: 'POST', body: formData }
                        );
                        const data = await res.json();
                        if (data.secure_url) uploadedResumeUrl = data.secure_url;
                    }
                } catch (e) {
                    console.warn('[onboarding] Cloudinary upload failed (non-critical):', e);
                }
            }

            // ── 3. Save profile to Firestore (CRITICAL) ───────────────────────
            const profileId = `${user.uid}_candidate`;
            const profileData = {
                uid: profileId,
                name,
                email: user.email || parsedResume?.profile.email || '',
                role: 'candidate' as const,
                avatar: user.photoURL || undefined,
                headline: headline || parsedResume?.profile.headline || undefined,
                bio: parsedResume?.profile.bio || undefined,
                location: location || parsedResume?.profile.location || undefined,
                githubUsername: githubUsername || parsedResume?.profile.githubUsername || undefined,
                linkedinUrl: parsedResume?.profile.linkedinUrl || undefined,
                portfolioUrl: parsedResume?.profile.portfolioUrl || undefined,
                resumeText: resumeText || undefined,
                resumeUrl: uploadedResumeUrl,
                profileComplete: true,
                // Link candidate to their institution so faculty/admin can discover them
                institutionCode: institutionCode.trim().toUpperCase() || undefined,
                education: parsedResume?.education || undefined,
            };

            console.log('[onboarding] Saving profile for uid:', profileId);
            await updateProfile(profileId, profileData);
            console.log('[onboarding] Profile saved ✓');

            // ── 4. Save projects (non-critical) ───────────────────────────────
            if (parsedResume?.projects?.length) {
                try {
                    const projects = parsedToProjects(parsedResume);
                    await saveProjects(profileId, projects);
                    console.log('[onboarding] Projects saved ✓');
                } catch (e) {
                    console.warn('[onboarding] saveProjects failed (non-critical):', e);
                }
            }

            if (parsedResume?.experience?.length) {
                try {
                    for (const exp of parsedResume.experience) {
                        await addWorkExperience(profileId, {
                            role: exp.role || 'Contributor',
                            company: exp.company,
                            startDate: exp.duration || '',
                            current: false,
                            type: 'internship',
                            description: exp.description || ''
                        });
                    }
                    console.log('[onboarding] Work Experiences saved ✓');
                } catch (e) {
                    console.warn('[onboarding] addWorkExperience failed (non-critical):', e);
                }
            }

            // ── 5. Infer & save capabilities (non-critical) ───────────────────
            if (parsedResume) {
                try {
                    const inferred = await inferCapabilitiesFromResume(parsedResume);
                    if (inferred.length > 0) {
                        const caps = inferencedToCapabilities(inferred);
                        await saveCapabilities(profileId, caps);
                        console.log('[onboarding] Capabilities saved ✓', caps.length);
                    }
                } catch (e) {
                    console.warn('[onboarding] inferCapabilities failed (non-critical):', e);
                }
            }

            // ── 6. Refresh context & navigate ─────────────────────────────────
            try {
                await refreshProfile();
            } catch (e) {
                console.warn('[onboarding] refreshProfile failed (non-critical):', e);
            }

            navigate('/candidate');

        } catch (err) {
            // Only the critical profile save reaches here
            console.error('[onboarding] CRITICAL error saving profile:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="onb-root">
            <div className="onb-bg">
                <div className="onb-orb onb-orb--1" />
                <div className="onb-orb onb-orb--2" />
            </div>

            <div className="onb-container">
                {/* Logo */}
                <div className="onb-logo">
                    <img src={logo} alt="CapAble" className="onb-logo-img" />
                    <span className="onb-logo-text">CapAble</span>
                </div>

                {/* Progress */}
                {role === 'candidate' && (
                    <div className="onb-progress">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`onb-progress-dot ${step >= s ? 'active' : ''}`} />
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* ── Step 1: Role ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            className="onb-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h1 className="onb-title">Welcome to CapAble</h1>
                            <p className="onb-sub">Tell us how you'll use CapAble.</p>

                            <div className="onb-role-grid">
                                <button
                                    className={`onb-role-card ${role === 'candidate' ? 'active' : ''}`}
                                    onClick={() => setRole('candidate')}
                                >
                                    <UserIcon size={32} />
                                    <span>I'm a Candidate</span>
                                    <small>Build my evidence-driven profile and find opportunities</small>
                                </button>
                                <button
                                    className={`onb-role-card ${role === 'employer' ? 'active' : ''}`}
                                    onClick={() => setRole('employer')}
                                >
                                    <Briefcase size={32} />
                                    <span>I'm an Employer / Industry</span>
                                    <small>Post roles, find candidates verified by real capability evidence</small>
                                </button>
                                <button
                                    className={`onb-role-card ${role === 'academician' ? 'active' : ''}`}
                                    onClick={() => setRole('academician')}
                                >
                                    <GraduationCap size={32} />
                                    <span>I'm an Academician / Faculty</span>
                                    <small>Explore FDPs, faculty internships, research & industry collaboration</small>
                                </button>
                                <button
                                    className={`onb-role-card ${role === 'institution' ? 'active' : ''}`}
                                    onClick={() => setRole('institution')}
                                >
                                    <Sparkles size={32} />
                                    <span>I'm an Institution Admin</span>
                                    <small>Monitor students, track placements, manage industry engagement</small>
                                </button>
                            </div>

                            <button
                                className="onb-btn-primary"
                                onClick={() => {
                                    if (role === 'candidate') {
                                        setStep(2);
                                    } else if (role === 'employer') {
                                        setStep(2); // goes to company profile form
                                    } else {
                                        // Academician / Institution: no extra step needed
                                        handleFinish();
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading
                                    ? <><Loader2 size={16} className="spin" /> Setting up…</>
                                    : <>Continue <ArrowRight size={16} /></>
                                }
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step 2: Academician / Institution Profile ── */}
                    {step === 2 && (role === 'academician' || role === 'institution') && (
                        <motion.div
                            key={`step2-${role}`}
                            className="onb-card"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                        >
                            {!preselectedRole && (
                                <button className="onb-back" onClick={() => setStep(1)}>
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}

                            <div className="onb-resume-header">
                                {role === 'academician'
                                    ? <GraduationCap size={28} className="onb-sparkle" />
                                    : <Sparkles size={28} className="onb-sparkle" />
                                }
                                <h2 className="onb-title">
                                    {role === 'academician' ? 'Set up your faculty profile' : 'Set up your institution'}
                                </h2>
                                <p className="onb-sub">This links you to your institution and your students.</p>
                            </div>

                            <div className="onb-confirm-fields">
                                <div className="onb-field">
                                    <label className="onb-label">Institution Code *</label>
                                    <input
                                        className="onb-input"
                                        placeholder="e.g. VJTI, IITB, MIT-WPU (short unique code)"
                                        value={institutionCode}
                                        onChange={e => setInstitutionCode(e.target.value)}
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: 12 }}>
                                        Students must use this code to be linked to your institution.
                                    </small>
                                </div>
                                {role === 'academician' && (
                                    <div className="onb-field">
                                        <label className="onb-label">Department</label>
                                        <input
                                            className="onb-input"
                                            placeholder="e.g. Computer Engineering, Electronics"
                                            value={department}
                                            onChange={e => setDepartment(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                className="onb-btn-primary"
                                onClick={handleFinish}
                                disabled={loading || !institutionCode.trim()}
                            >
                                {loading
                                    ? <><Loader2 size={16} className="spin" /> Setting up…</>
                                    : <>Launch Dashboard <ArrowRight size={16} /></>
                                }
                            </button>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>You can update these later from your profile.</p>
                        </motion.div>
                    )}

                    {/* ── Step 2: Company Profile (Employers only) ── */}
                    {step === 2 && role === 'employer' && (
                        <motion.div
                            key="step2-employer"
                            className="onb-card"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                        >
                            <button className="onb-back" onClick={() => setStep(1)}>
                                <ArrowLeft size={16} /> Back
                            </button>

                            <div className="onb-resume-header">
                                <Briefcase size={28} className="onb-sparkle" />
                                <h2 className="onb-title">Set up your company profile</h2>
                                <p className="onb-sub">This helps students and academicians discover your opportunities.</p>
                            </div>

                            <div className="onb-confirm-fields">
                                {/* ── Org type selector ─────────────────────────────── */}
                                <div className="onb-field">
                                    <label className="onb-label">Organisation Type *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                        {([
                                            { id: 'startup',    icon: '🚀', label: 'Startup',        desc: 'Early-stage / founder-led' },
                                            { id: 'smb',        icon: '🏢', label: 'SMB',             desc: 'Small / mid-size business' },
                                            { id: 'enterprise', icon: '🌐', label: 'Enterprise / MNC', desc: 'Established large company' },
                                            { id: 'nonprofit',  icon: '💚', label: 'Non-profit / NGO', desc: 'Social enterprise' },
                                        ] as { id: OrgType; icon: string; label: string; desc: string }[]).map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setOrgType(opt.id)}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: '10px',
                                                    border: `2px solid ${orgType === opt.id ? 'var(--color-accent-blue, #6366f1)' : 'var(--color-border, #e2e8f0)'}`,
                                                    background: orgType === opt.id ? 'var(--color-accent-blue-10, #eef2ff)' : 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'border 0.15s',
                                                }}
                                            >
                                                <div style={{ fontSize: '18px', lineHeight: 1 }}>{opt.icon}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--color-ink-900, #0f172a)' }}>{opt.label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-ink-400, #94a3b8)', marginTop: '2px' }}>{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Startup-specific fields (conditional) ─────── */}
                                {orgType === 'startup' && (
                                    <>
                                        <div className="onb-field">
                                            <label className="onb-label">Current Stage</label>
                                            <select
                                                className="onb-input"
                                                value={startupStage}
                                                onChange={e => setStartupStage(e.target.value)}
                                            >
                                                <option value="">Select stage</option>
                                                <option value="Idea">💡 Idea — Concept stage</option>
                                                <option value="Prototype">🔧 Prototype — Building MVP</option>
                                                <option value="MVP">🚀 MVP — First users</option>
                                                <option value="Early Traction">📈 Early Traction — Revenue / users</option>
                                                <option value="Growth">⚡ Growth — Scaling</option>
                                                <option value="Funded">💰 Funded — Raised investment</option>
                                            </select>
                                        </div>
                                        <div className="onb-field">
                                            <label className="onb-label">Founding Year</label>
                                            <input
                                                className="onb-input"
                                                type="number"
                                                placeholder="e.g. 2023"
                                                min="2000"
                                                max={new Date().getFullYear()}
                                                value={foundingYear}
                                                onChange={e => setFoundingYear(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="onb-field">
                                    <label className="onb-label">Company / Organisation Name *</label>
                                    <input
                                        className="onb-input"
                                        placeholder="e.g. TechCorp Pvt. Ltd."
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                    />
                                </div>
                                <div className="onb-field">
                                    <label className="onb-label">Industry / Sector</label>
                                    <input
                                        className="onb-input"
                                        placeholder="e.g. Software, Manufacturing, Healthcare"
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                    />
                                </div>
                                <div className="onb-field">
                                    <label className="onb-label">Company Website</label>
                                    <input
                                        className="onb-input"
                                        placeholder="https://yourcompany.com"
                                        value={website}
                                        onChange={e => setWebsite(e.target.value)}
                                    />
                                </div>
                                <div className="onb-field">
                                    <label className="onb-label">Team Size</label>
                                    <select
                                        className="onb-input"
                                        value={companySize}
                                        onChange={e => setCompanySize(e.target.value)}
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10">1–10 employees (Startup)</option>
                                        <option value="11-50">11–50 employees (Small)</option>
                                        <option value="51-200">51–200 employees (Mid-size)</option>
                                        <option value="201-1000">201–1000 employees (Large)</option>
                                        <option value="1000+">1000+ employees (Enterprise)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                className="onb-btn-primary"
                                onClick={handleFinish}
                                disabled={loading || !companyName.trim()}
                            >
                                {loading
                                    ? <><Loader2 size={16} className="spin" /> Creating account…</>
                                    : <>Launch Dashboard <ArrowRight size={16} /></>
                                }
                            </button>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>You can update these details from your employer dashboard.</p>
                        </motion.div>
                    )}

                    {/* ── Step 2: Resume Upload (Candidates only) ── */}
                    {step === 2 && role === 'candidate' && (
                        <motion.div
                            key="step2"
                            className="onb-card onb-card--wide"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                        >
                            <button className="onb-back" onClick={() => setStep(1)}>
                                <ArrowLeft size={16} /> Back
                            </button>

                            <div className="onb-resume-header">
                                <Sparkles size={28} className="onb-sparkle" />
                                <h2 className="onb-title">Build your profile instantly</h2>
                                <p className="onb-sub">
                                    Paste your resume below. Our AI will extract your skills, projects, and education to build your CapAble profile — no manual entry required.
                                </p>
                            </div>

                            <div className="onb-resume-area">
                                <textarea
                                    className="onb-resume-textarea"
                                    placeholder="Paste your resume text here...&#10;&#10;Include your skills, experience, projects, and education.&#10;The more detail, the better your capability profile will be."
                                    value={resumeText}
                                    onChange={e => setResumeText(e.target.value)}
                                    rows={14}
                                />

                                <div className="onb-resume-or">
                                    <span>or</span>
                                </div>

                                <button
                                    className="onb-upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={16} />
                                    Upload Resume (.pdf, .txt)
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.pdf"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {resumeText.length > 0 && (
                                <p className="onb-char-count">
                                    <FileText size={12} /> {resumeText.length} characters
                                </p>
                            )}

                            {parseError && (
                                <div className="onb-error">
                                    <AlertCircle size={14} /> {parseError}
                                </div>
                            )}

                            <div className="onb-resume-actions">
                                <button
                                    className="onb-btn-primary"
                                    onClick={handleParseResume}
                                    disabled={parsing || resumeText.trim().length < 50}
                                >
                                    {parsing ? (
                                        <><Loader2 size={16} className="spin" /> Analysing resume...</>
                                    ) : (
                                        <><Sparkles size={16} /> Build Profile from Resume</>
                                    )}
                                </button>

                                <button className="onb-btn-ghost" onClick={skipResume}>
                                    Skip — I'll fill it in later
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 3: Confirm & Add Details ── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            className="onb-card onb-card--wide"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                        >
                            <button className="onb-back" onClick={() => setStep(2)}>
                                <ArrowLeft size={16} /> Back
                            </button>

                            <h2 className="onb-title">
                                {parsedResume ? (
                                    <><CheckCircle size={22} className="text-green" /> Profile extracted successfully</>
                                ) : 'Complete your profile'}
                            </h2>

                            {parsedResume && (
                                <div className="onb-parsed-summary">
                                    <div className="onb-parsed-chips">
                                        {parsedResume.skills.slice(0, 8).map(s => (
                                            <span key={s} className="onb-chip">{s}</span>
                                        ))}
                                        {parsedResume.skills.length > 8 && (
                                            <span className="onb-chip onb-chip--more">+{parsedResume.skills.length - 8} more</span>
                                        )}
                                    </div>
                                    <p className="onb-parsed-info">
                                        Found {parsedResume.projects.length} projects, {parsedResume.experience.length} experience entries, {parsedResume.education.length} education records.
                                    </p>
                                </div>
                            )}

                            <div className="onb-field-group">
                                <label className="onb-label">
                                    <GitBranch size={14} /> GitHub Username (optional)
                                </label>
                                <input
                                    type="text"
                                    className="onb-input"
                                    placeholder="e.g. johndoe (without @)"
                                    value={githubUsername}
                                    onChange={e => setGithubUsername(e.target.value.replace('@', ''))}
                                />
                                <small className="onb-hint">We'll sync your real repositories to build your capability profile.</small>
                            </div>

                            <div className="onb-field-group">
                                <label className="onb-label">Professional Headline</label>
                                <input
                                    type="text"
                                    className="onb-input"
                                    placeholder="e.g. Final-year CS student | React & Python"
                                    value={headline}
                                    onChange={e => setHeadline(e.target.value)}
                                />
                            </div>

                            <div className="onb-field-group">
                                <label className="onb-label">Location</label>
                                <input
                                    type="text"
                                    className="onb-input"
                                    placeholder="e.g. Mumbai, India"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                />
                            </div>

                            <div className="onb-field-group">
                                <label className="onb-label">
                                    <GraduationCap size={14} /> Institution Code (optional)
                                </label>
                                <input
                                    type="text"
                                    className="onb-input"
                                    placeholder="e.g. CU, VJTI, IITB — ask your faculty"
                                    value={institutionCode}
                                    onChange={e => setInstitutionCode(e.target.value.toUpperCase())}
                                />
                                <small className="onb-hint">Enter the code given by your college / faculty so they can track your progress.</small>
                            </div>

                            {error && <div className="onb-error"><AlertCircle size={14} /> {error}</div>}

                            <button
                                className="onb-btn-primary"
                                onClick={() => setStep(4)}
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step 4: Done ── */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            className="onb-card onb-card--center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="onb-done-icon">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="onb-title">You're all set!</h2>
                            <p className="onb-sub">
                                Your capability profile is being built from your resume. Head to your dashboard to explore real opportunities matched to your skills.
                            </p>

                            {parsedResume && (
                                <div className="onb-done-stats">
                                    <div className="onb-done-stat">
                                        <span className="onb-done-val">{parsedResume.skills.length}</span>
                                        <span className="onb-done-lbl">Skills detected</span>
                                    </div>
                                    <div className="onb-done-stat">
                                        <span className="onb-done-val">{parsedResume.projects.length}</span>
                                        <span className="onb-done-lbl">Projects found</span>
                                    </div>
                                    <div className="onb-done-stat">
                                        <span className="onb-done-val">{parsedResume.experience.length}</span>
                                        <span className="onb-done-lbl">Experience entries</span>
                                    </div>
                                </div>
                            )}

                            {error && <div className="onb-error"><AlertCircle size={14} /> {error}</div>}

                            <button
                                className="onb-btn-primary"
                                onClick={handleFinish}
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="spin" /> Saving profile...</>
                                ) : (
                                    <>Go to Dashboard <ArrowRight size={16} /></>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
