import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, CheckSquare, User } from 'lucide-react';
import logo from '../../assets/sihlogo.png';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../../lib/firebase';
import { getAdditionalUserInfo } from 'firebase/auth';
import './LoginPage.css';

type AuthStep = 'select' | 'candidate-login' | 'employer-login' | 'candidate-signup' | 'employer-signup';

export default function LoginPage() {
    const [step, setStep] = useState<AuthStep>('select');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEmailAuth = async (e: React.FormEvent, type: 'candidate' | 'employer', isLogin: boolean) => {
        e.preventDefault();
        setError('');
        try {
            localStorage.setItem('userRole', type);
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                navigate(`/${type}`);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                navigate('/onboarding');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleAuth = async (type: 'candidate' | 'employer') => {
        setError('');
        try {
            localStorage.setItem('userRole', type);
            const res = await signInWithPopup(auth, googleProvider);
            const additionalInfo = getAdditionalUserInfo(res);

            if (additionalInfo?.isNewUser) {
                navigate('/onboarding');
            } else {
                navigate(`/${type}`);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const renderSelection = () => (
        <motion.div
            key="select"
            className="login-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <header className="login-select-header">
                <Link to="/" className="login-logo login-logo--dark">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </Link>
            </header>

            <div className="login-select-body">
                <div className="login-select-split">
                    {/* Companies */}
                    <div className="login-select-half">
                        <span className="login-badge login-badge--dark">BUSINESS</span>
                        <h2 className="login-select-title">For <em>Companies</em></h2>
                        <p className="login-select-desc">
                            Thousands of companies have embraced the new way to hire and upskill developers using verified capability intelligence.
                        </p>
                        <button className="login-btn-primary" onClick={() => setStep('employer-login')}>
                            Login
                        </button>
                        <p className="login-select-footer">
                            Don't have an account?<br />
                            <button className="login-text-link" onClick={() => setStep('employer-signup')}>Contact sales</button> or <button className="login-text-link" onClick={() => setStep('employer-signup')}>Get free trial</button>
                        </p>
                    </div>

                    <div className="login-select-divider" />

                    {/* Candidates */}
                    <div className="login-select-half">
                        <h2 className="login-select-title">For <em>Candidates</em></h2>
                        <p className="login-select-desc">
                            Join the capability-first network. Prove your skills, prepare for transitions, and get hired on evidence, not resumes.
                        </p>
                        <button className="login-btn-primary" onClick={() => setStep('candidate-login')}>
                            Login
                        </button>
                        <p className="login-select-footer">
                            Don't have an account?<br />
                            <button className="login-text-link login-text-link--green" onClick={() => setStep('candidate-signup')}>Sign up.</button>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const getFormDetails = () => {
        const isCandidate = step.startsWith('candidate');
        const isLogin = step.endsWith('login');
        const type = isCandidate ? 'candidate' : 'employer';

        return {
            isCandidate,
            isLogin,
            type,
            heading: isLogin ? 'Welcome back! Login to your account' : `Join us Create a CapAble? account`,
            subheading: isLogin ? (isCandidate ? "Ready to build your capability twin?" : "Ready to discover talent?") : "Be part of the evidence-based hiring revolution"
        };
    };

    const renderForm = () => {
        const { isCandidate, isLogin, type, subheading } = getFormDetails();

        return (
            <motion.div
                key="form"
                className="login-form-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Left Dark Side */}
                <div className="login-form-hero">
                    <div className="login-hero-bg">
                        <div className="login-hero-glow" />
                        <div className="login-hero-dots" />
                    </div>

                    <button className="login-back-btn" onClick={() => setStep('select')}>
                        ← Back
                    </button>

                    <div className="login-hero-content">
                        <Link to="/" className="login-logo">
                            <img src={logo} className="capable-logo capable-logo--light" alt="CapAble Logo" />
                        </Link>

                        <div className="login-hero-graphic">
                            {/* ID Card Graphic */}
                            <div className="id-lanyard" />
                            <div className="id-card">
                                <div className="id-card-top">
                                    <div className="id-card-punch" />
                                </div>
                                <div className="id-card-body">
                                    <div className="id-card-photo" />
                                    <div className="id-card-lines">
                                        <div className="id-card-line id-card-line--1" />
                                        <div className="id-card-line id-card-line--2" />
                                    </div>
                                    <div className="id-card-barcode" />
                                </div>
                            </div>
                        </div>

                        <div className="login-hero-text">
                            <p className="login-hero-sub">Welcome to</p>
                            <h2 className="login-hero-title">CapAble Community</h2>
                            <p className="login-hero-motto">
                                Capability Intelligence for {isCandidate ? 'visionary talent' : 'modern teams'}
                                <br /><a href="#">Know more</a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Light Side */}
                <div className="login-form-panel">
                    <div className="login-form-container">
                        <h2 className="login-form-title">
                            {isLogin ? (
                                <>Welcome back!<br />Login to your account</>
                            ) : (
                                <>Join us<br />Create a CapAble? account</>
                            )}
                        </h2>
                        <p className="login-form-sub">{subheading}</p>

                        <form className="login-form" onSubmit={(e) => handleEmailAuth(e, type as 'candidate' | 'employer', isLogin)}>
                            {error && <div className="login-error" style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fca5a5' }}>{error}</div>}

                            {!isLogin && (
                                <div className="login-input-group">
                                    <User size={16} className="login-input-icon" />
                                    <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                            )}

                            <div className="login-input-group">
                                <Mail size={16} className="login-input-icon" />
                                <input type="email" placeholder="Your username or email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            <div className="login-input-group">
                                <Lock size={16} className="login-input-icon" />
                                <input type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                                        I agree to CapAble's Terms of Service and Privacy Policy.
                                    </label>
                                </div>
                            )}

                            <button type="submit" className="login-submit-btn">
                                {isLogin ? 'Log In' : 'Sign up'}
                            </button>
                        </form>

                        <div className="login-divider">
                            <span>or</span>
                        </div>

                        <div className="login-socials">
                            <button type="button" className="login-social-btn login-social-btn--google" onClick={() => handleGoogleAuth(type as 'candidate' | 'employer')}>
                                <i>G</i> Continue with Google
                            </button>
                            <div className="login-socials-row">
                                <button type="button" className="login-social-btn" onClick={() => navigate(`/${type}`)}>
                                    <Briefcase size={16} /> LinkedIn
                                </button>
                                <button type="button" className="login-social-btn" onClick={() => navigate(`/${type}`)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg> GitHub
                                </button>
                            </div>
                        </div>

                        <p className="login-form-footer">
                            {isLogin ? (
                                <>Don't have an account? <button onClick={() => setStep(`${type}-signup` as any)}>Sign up</button></>
                            ) : (
                                <>Already have an account? <button onClick={() => setStep(`${type}-login` as any)}>Log in</button></>
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
