import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, CheckSquare, User, GraduationCap, Building2, Sparkles } from 'lucide-react';
import logo from '../../assets/sihlogo.png';
import {
    auth, googleProvider, signInWithRedirect, getRedirectResult,
    signInWithEmailAndPassword, createUserWithEmailAndPassword
} from '../../lib/firebase';
import { getAdditionalUserInfo } from 'firebase/auth';
import { getProfile } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

// All possible auth steps for 4 roles
type RoleType = 'candidate' | 'employer' | 'academician' | 'institution';
type AuthStep =
    | 'select'
    | 'candidate-login'   | 'candidate-signup'
    | 'employer-login'    | 'employer-signup'
    | 'academician-login' | 'academician-signup'
    | 'institution-login' | 'institution-signup';

interface RolePanel {
    role: RoleType;
    badge: string;
    title: string;
    titleEm: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    signupLabel: string;
}

const PANELS: RolePanel[] = [
    {
        role: 'employer',
        badge: 'BUSINESS',
        title: 'For ',
        titleEm: 'Companies',
        desc: 'Post opportunities, discover talent verified by real capability evidence, and build your workforce intelligence.',
        icon: <Briefcase size={20} />,
        color: '#6B6A68',
        signupLabel: 'Register your company',
    },
    {
        role: 'institution',
        badge: 'INSTITUTION',
        title: 'For ',
        titleEm: 'Admins',
        desc: 'Monitor student placements, manage industry engagement, and track institution-wide capability growth.',
        icon: <Building2 size={20} />,
        color: '#6B6A68',
        signupLabel: 'Register your institution',
    },
    {
        role: 'candidate',
        badge: 'STUDENT',
        title: 'For ',
        titleEm: 'Candidates',
        desc: 'Build your capability profile, prove your skills with evidence, and get hired on merit — not just a resume.',
        icon: <User size={20} />,
        color: '#6B6A68',
        signupLabel: 'Create free account',
    },
    {
        role: 'academician',
        badge: 'FACULTY',
        title: 'For ',
        titleEm: 'Faculty',
        desc: 'Explore FDPs, faculty internships, and research collaborations. Monitor your students\' progress in one place.',
        icon: <GraduationCap size={20} />,
        color: '#6B6A68',
        signupLabel: 'Join as faculty',
    },
];

function getHeroText(role: RoleType, isLogin: boolean): { title: string; sub: string } {
    const map: Record<RoleType, { title: string; sub: string }> = {
        candidate: {
            title: 'CapAble Community',
            sub: isLogin ? 'Ready to build your capability twin?' : 'Be part of evidence-based hiring.',
        },
        employer: {
            title: 'CapAble for Business',
            sub: isLogin ? 'Ready to discover real talent?' : 'Find candidates who prove their skills.',
        },
        academician: {
            title: 'CapAble for Faculty',
            sub: isLogin ? 'Welcome back, educator.' : 'Grow professionally with industry.',
        },
        institution: {
            title: 'CapAble Admin',
            sub: isLogin ? 'Manage your institution\'s ecosystem.' : 'Join the capability-first network.',
        },
    };
    return map[role];
}

export default function LoginPage() {
    const [step, setStep] = useState<AuthStep>('select');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();

    // Already logged in — redirect to dashboard immediately
    useEffect(() => {
        if (!loading && user && profile?.profileComplete) {
            const savedRole = (localStorage.getItem('userRole') as RoleType) || 'candidate';
            navigate(dashboardFor(savedRole), { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, profile, loading]);

    const currentRole: RoleType = step === 'select'
        ? 'candidate'
        : (step.split('-')[0] as RoleType);
    const isLogin = step.endsWith('-login');

    const goToStep = (s: AuthStep) => {
        setError('');
        setInfoMsg('');
        setStep(s);
    };

    const dashboardFor = (role: RoleType) => {
        const map: Record<RoleType, string> = {
            candidate: '/candidate',
            employer: '/employer',
            academician: '/faculty',
            institution: '/institution',
        };
        return map[role];
    };

    // ─── Smart Email Auth ──────────────────────────────────────────────────────
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');
        const role = currentRole;

        try {
            localStorage.setItem('userRole', role);

            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                navigate(dashboardFor(role));
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                navigate('/onboarding');
            }
        } catch (err: any) {
            const code: string = err?.code || '';

            // ── Silently ignored errors ──────────────────────────────────────
            const silentCodes = [
                'auth/popup-closed-by-user',
                'auth/cancelled-popup-request',
                'auth/user-cancelled',
            ];
            if (silentCodes.includes(code)) return;

            if (isLogin) {
                if (code === 'auth/user-not-found') {
                    // Genuine: no account with this email
                    setInfoMsg('No account found with this email. Let\'s create one!');
                    goToStep(`${role}-signup` as AuthStep);
                } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                    // Wrong password entered
                    setError('Incorrect password. Please try again.');
                } else if (code === 'auth/invalid-email') {
                    setError('Please enter a valid email address.');
                } else if (code === 'auth/too-many-requests') {
                    setError('Too many attempts. Please wait a moment and try again.');
                } else {
                    setError('Sign in failed. Please check your credentials.');
                }
            } else {
                // Signup branch
                if (code === 'auth/email-already-in-use') {
                    setInfoMsg('You already have an account! Please log in.');
                    goToStep(`${role}-login` as AuthStep);
                } else if (code === 'auth/weak-password') {
                    setError('Password must be at least 6 characters.');
                } else if (code === 'auth/invalid-email') {
                    setError('Please enter a valid email address.');
                } else {
                    setError('Could not create account. Please try again.');
                }
            }
        }
    };

    // ─── Google Auth (redirect-based — works on Edge & popup-blocking browsers) ───
    useEffect(() => {
        getRedirectResult(auth).then(async (res) => {
            if (!res) return; // No pending redirect result
            const savedRole = (localStorage.getItem('userRole') as RoleType) || 'candidate';
            const additionalInfo = getAdditionalUserInfo(res);
            if (additionalInfo?.isNewUser) {
                // New user — go to onboarding
                navigate('/onboarding', { replace: true });
            } else {
                // Existing user — check if profile is complete before navigating
                try {
                    const uid = res.user.uid;
                    const dbUid = `${uid}_${savedRole}`;
                    const p = await getProfile(dbUid);
                    if (p?.profileComplete) {
                        navigate(dashboardFor(savedRole), { replace: true });
                    } else {
                        navigate('/onboarding', { replace: true });
                    }
                } catch {
                    navigate(dashboardFor(savedRole), { replace: true });
                }
            }
        }).catch((err: any) => {
            const code: string = err?.code || '';
            if (code === 'auth/account-exists-with-different-credential') {
                setError('An account with this email already exists. Please use email/password to sign in.');
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleAuth = async () => {
        setError('');
        localStorage.setItem('userRole', currentRole);
        // Use redirect instead of popup — works in Edge and all browsers without popup permission
        await signInWithRedirect(auth, googleProvider);
    };

    // ─── Selection Screen ─────────────────────────────────────────────────────
    const renderSelection = () => (
        <motion.div
            key="select"
            className="login-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Ambient Background Elements */}
            <div className="login-select-bg">
                <div className="login-ambient-orb orb-1" />
                <div className="login-ambient-orb orb-2" />
                <div className="login-ambient-orb orb-3" />
                <div className="login-select-grid-bg" />
            </div>

            <header className="login-select-header">
                <Link to="/" className="login-logo login-logo--dark">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </Link>
                <div className="login-select-header-actions">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="login-header-link">Help</a>
                </div>
            </header>

            <div className="login-select-body">
                <div className="login-select-intro">
                    <span className="login-select-eyebrow">Welcome to CapAble</span>
                    <h1 className="login-select-main-title">Who are you?</h1>
                    <p className="login-select-main-sub">Select your role to join the capability-first career ecosystem.</p>
                </div>

                <div className="login-select-grid">
                    {PANELS.map((panel) => (
                        <div
                            key={panel.role}
                            className="login-role-card"
                        >
                            <div className="login-role-card-inner">
                                <div className="login-role-card-top">
                                    <span className="login-badge">
                                        {panel.badge}
                                    </span>
                                    <div className="login-role-icon">
                                        {panel.icon}
                                    </div>
                                </div>
                                <h2 className="login-select-title">
                                    {panel.title}<em>{panel.titleEm}</em>
                                </h2>
                                <p className="login-select-desc">{panel.desc}</p>
                                <button
                                    className="login-btn-primary"
                                    onClick={() => goToStep(`${panel.role}-login` as AuthStep)}
                                >
                                    Login
                                </button>
                                <p className="login-select-footer">
                                    Don't have an account?{' '}
                                    <button
                                        className="login-text-link"
                                        onClick={() => goToStep(`${panel.role}-signup` as AuthStep)}
                                    >
                                        {panel.signupLabel}
                                    </button>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    // ─── Auth Form ────────────────────────────────────────────────────────────
    const renderHeroGraphic = (role: RoleType, color: string) => {
        const getPhotoShape = () => {
            if (role === 'candidate') return 'circle';
            if (role === 'institution') return 'rect-tall';
            return 'rect';
        };

        return (
            <>
                <div className="id-lanyard" style={{ background: `linear-gradient(to bottom, ${color}, ${color}88)` }} />
                <div className="id-card">
                    <div className="id-card-top">
                        <div className="id-card-punch" />
                    </div>
                    <div className="id-card-body">
                        <div className="id-card-role-label">{role}</div>
                        <div 
                            className={`id-card-photo ${getPhotoShape()}`} 
                            style={{ 
                                background: `${color}22`, 
                                borderColor: `${color}44`,
                                borderRadius: role === 'candidate' ? '50%' : '6px',
                                width: role === 'candidate' ? '100px' : '100%'
                            }} 
                        />
                        <div className="id-card-lines">
                            <div className="id-card-line id-card-line--1" />
                            <div className="id-card-line id-card-line--2" />
                            {role === 'candidate' && <div className="id-card-line id-card-line--3" />}
                        </div>
                        {role !== 'institution' && <div className="id-card-barcode" />}
                    </div>
                </div>
            </>
        );
    };

    const renderForm = () => {
        const panel = PANELS.find(p => p.role === currentRole)!;
        const hero = getHeroText(currentRole, isLogin);

        return (
            <motion.div
                key={step}
                className="login-form-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Left Dark Hero */}
                <div className="login-form-hero">
                    <div className="login-hero-bg">
                        <div className="login-hero-glow" style={{ background: `radial-gradient(circle, ${panel.color}22, transparent 70%)` }} />
                        <div className="login-hero-dots" />
                    </div>

                    <button className="login-back-btn" onClick={() => goToStep('select')}>
                        ← Back
                    </button>

                    <div className="login-hero-content">
                        <Link to="/" className="login-logo">
                            <img src={logo} className="capable-logo capable-logo--light" alt="CapAble Logo" />
                        </Link>

                        {/* Role badge on hero */}
                        <div className="login-hero-role-badge" style={{ background: `${panel.color}22`, borderColor: `${panel.color}44` }}>
                            <span style={{ color: panel.color }}>{panel.icon}</span>
                            <span style={{ color: panel.color, fontWeight: 700, fontSize: 13 }}>{panel.badge}</span>
                        </div>

                        <div className="login-hero-graphic">
                            {renderHeroGraphic(currentRole, panel.color)}
                        </div>

                        <div className="login-hero-text">
                            <p className="login-hero-sub">Welcome to</p>
                            <h2 className="login-hero-title">{hero.title}</h2>
                            <p className="login-hero-motto">{hero.sub}</p>
                        </div>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="login-form-panel">
                    <div className="login-form-container">
                        <h2 className="login-form-title">
                            {isLogin ? (
                                <>Welcome back!<br />Login to your account</>
                            ) : (
                                <>Join CapAble<br />Create your account</>
                            )}
                        </h2>
                        <p className="login-form-sub">
                            {isLogin
                                ? `Signing in as ${panel.badge.toLowerCase()}`
                                : `Registering as ${panel.badge.toLowerCase()}`}
                        </p>

                        {/* Info message (auto-redirect feedback) */}
                        {infoMsg && (
                            <div className="login-info-banner">
                                <Sparkles size={14} /> {infoMsg}
                            </div>
                        )}

                        <form className="login-form" onSubmit={handleEmailAuth}>
                            {error && (
                                <div className="login-error-banner">{error}</div>
                            )}

                            {!isLogin && (
                                <div className="login-input-group">
                                    <User size={16} className="login-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="login-input-group">
                                <Mail size={16} className="login-input-icon" />
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="login-input-group">
                                <Lock size={16} className="login-input-icon" />
                                <input
                                    type="password"
                                    placeholder="Your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {isLogin ? (
                                <div className="login-form-options">
                                    <label className="login-checkbox">
                                        <input type="checkbox" />
                                        <span className="login-box"><CheckSquare size={14} /></span>
                                        Remember me
                                    </label>
                                    <a href="#" className="login-forgot">Forgot password?</a>
                                </div>
                            ) : (
                                <div className="login-form-options">
                                    <label className="login-checkbox">
                                        <input type="checkbox" required />
                                        <span className="login-box"><CheckSquare size={14} /></span>
                                        I agree to CapAble's Terms &amp; Privacy Policy.
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-submit-btn"
                            >
                                {isLogin ? 'Log In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="login-divider"><span>or continue with</span></div>

                        <div className="login-socials">
                            <button
                                type="button"
                                className="login-social-btn login-social-btn--google"
                                onClick={handleGoogleAuth}
                            >
                                <i>G</i> Continue with Google
                            </button>
                        </div>

                        <p className="login-form-footer">
                            {isLogin ? (
                                <>Don't have an account?{' '}
                                    <button onClick={() => goToStep(`${currentRole}-signup` as AuthStep)}>
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>Already have an account?{' '}
                                    <button onClick={() => goToStep(`${currentRole}-login` as AuthStep)}>
                                        Log in
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="login-page">
            <AnimatePresence mode="wait">
                {step === 'select' ? renderSelection() : renderForm()}
            </AnimatePresence>
        </div>
    );
}
