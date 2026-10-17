'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Sparkles, LogIn, UserPlus, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth, UserRole } from '@/lib/auth-context';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    loginAsDeven,
    loginAsPriya,
    loginAsSunita,
    loginAsEmployer,
    loginCustom,
    signup,
    resetPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'demo' | 'login' | 'signup' | 'reset'>(authModalTab || 'demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    loginCustom(email, password, role);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in your name and email address');
      return;
    }
    setError('');
    signup(name, email, password, role);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address for password reset');
      return;
    }
    setError('');
    setSubmitting(true);
    await resetPassword(email);
    setSubmitting(false);
    setResetSent(true);
  };

  const handleGoogleSignIn = () => {
    // Google OAuth sign-in simulation
    loginAsDeven();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          padding: '1rem',
        }}
        onClick={closeAuthModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            maxWidth: 490,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(79,142,247,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(79,142,247,0.35)',
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  AccessHire Authentication
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                  Adaptive Capability Twin OS
                </div>
              </div>
            </div>
            <button
              onClick={closeAuthModal}
              className="btn-ghost"
              style={{ padding: '0.35rem', borderRadius: '50%' }}
              aria-label="Close authentication modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
          }}>
            {[
              { id: 'demo', label: 'Quick Personas', icon: <Sparkles size={13} /> },
              { id: 'login', label: 'Sign In', icon: <LogIn size={13} /> },
              { id: 'signup', label: 'Sign Up', icon: <UserPlus size={13} /> },
              { id: 'reset', label: 'Reset', icon: <KeyRound size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setError(''); setResetSent(false); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--blue-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--blue-primary)' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div style={{ padding: '1.5rem' }}>
            {error && (
              <div style={{
                padding: '0.625rem 0.875rem',
                marginBottom: '1rem',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--red)',
                fontSize: '0.775rem',
              }}>
                {error}
              </div>
            )}

            {/* Quick Demo Persona Login */}
            {activeTab === 'demo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Select a persona for instant one-click login &amp; presentation demo:
                </div>

                {/* Deven Goyal Seeded Account */}
                <div
                  className="card-flat"
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(16,185,129,0.35)',
                    background: 'rgba(16,185,129,0.06)',
                    borderRadius: 10,
                    transition: 'all 0.15s',
                  }}
                  onClick={loginAsDeven}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}>
                      D
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Deven Goyal (Seeded Account)
                        </span>
                        <span className="badge badge-green">Dual Access</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        goyaldeven4809@gmail.com · 3 Patents · CSE
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--green)' }} />
                  </div>
                </div>

                {/* Sunita Verma (Lucknow Caregiver Archetype) */}
                <div
                  className="card-flat"
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(245,158,11,0.35)',
                    background: 'rgba(245,158,11,0.06)',
                    borderRadius: 10,
                    transition: 'all 0.15s',
                  }}
                  onClick={loginAsSunita}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}>
                      S
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Sunita Verma (Finale Brief Persona)
                        </span>
                        <span className="badge badge-amber">Caregiver Archetype</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        sunita.verma@accesshire.ai · 3-Yr Caregiving Break · Lucknow
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--amber)' }} />
                  </div>
                </div>

                {/* Priya Candidate */}
                <div
                  className="card-flat"
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(79,142,247,0.3)',
                    background: 'rgba(79,142,247,0.06)',
                    borderRadius: 10,
                    transition: 'all 0.15s',
                  }}
                  onClick={loginAsPriya}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}>
                      P
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Priya Sharma
                        </span>
                        <span className="badge badge-blue">Candidate OS</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        AI Ops Candidate · Twin Score: 82% · Hubli, India
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--blue-primary)' }} />
                  </div>
                </div>

                {/* Recruiter Persona */}
                <div
                  className="card-flat"
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(139,92,246,0.3)',
                    background: 'rgba(139,92,246,0.06)',
                    borderRadius: 10,
                    transition: 'all 0.15s',
                  }}
                  onClick={loginAsEmployer}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}>
                      M
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Marcus Vance
                        </span>
                        <span className="badge badge-violet">Enterprise Console</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Lead Talent Partner · SAP Workforce Intelligence
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--violet)' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Sign In */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ padding: '0 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>OR EMAIL</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. goyaldeven4809@gmail.com"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reset')}
                      style={{ fontSize: '0.7rem', color: 'var(--blue-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    Select Access Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: `1px solid ${role === 'candidate' ? 'var(--blue-primary)' : 'var(--border)'}`,
                        background: role === 'candidate' ? 'rgba(79,142,247,0.1)' : 'var(--bg-surface)',
                        color: role === 'candidate' ? 'var(--blue-primary)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <User size={13} /> Candidate OS
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: `1px solid ${role === 'employer' ? 'var(--violet)' : 'var(--border)'}`,
                        background: role === 'employer' ? 'rgba(139,92,246,0.1)' : 'var(--bg-surface)',
                        color: role === 'employer' ? 'var(--violet)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Building2 size={13} /> Workforce Console
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  <LogIn size={15} /> Sign In
                </button>
              </form>
            )}

            {/* Custom Sign Up */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deven Goyal"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                    Account Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: `1px solid ${role === 'candidate' ? 'var(--blue-primary)' : 'var(--border)'}`,
                        background: role === 'candidate' ? 'rgba(79,142,247,0.1)' : 'var(--bg-surface)',
                        color: role === 'candidate' ? 'var(--blue-primary)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Candidate OS
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: `1px solid ${role === 'employer' ? 'var(--violet)' : 'var(--border)'}`,
                        background: role === 'employer' ? 'rgba(139,92,246,0.1)' : 'var(--bg-surface)',
                        color: role === 'employer' ? 'var(--violet)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Enterprise Console
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  <UserPlus size={15} /> Create Free Account
                </button>
              </form>
            )}

            {/* Password Reset */}
            {activeTab === 'reset' && (
              <div>
                {!resetSent ? (
                  <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Enter your account email to receive a password reset link:
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="goyaldeven4809@gmail.com"
                        className="input"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                      <KeyRound size={15} /> {submitting ? 'Sending Link...' : 'Send Password Reset Link'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <CheckCircle2 size={36} style={{ color: 'var(--green)', margin: '0 auto 0.75rem' }} />
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.25rem' }}>Reset Link Sent!</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      We sent a password reset email to <strong>{email}</strong>.
                    </div>
                    <button onClick={() => setActiveTab('login')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
