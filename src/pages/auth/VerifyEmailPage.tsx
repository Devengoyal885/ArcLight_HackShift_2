import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth, sendEmailVerification, signOut } from '../../lib/firebase';
import { useState, useEffect } from 'react';

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sent, setSent] = useState(false);
    const [checking, setChecking] = useState(false);

    // Deep Implementation: Auto-poll every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    navigate(0); // Force reload to trigger auth state and routing
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const handleResend = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            setSent(true);
            setTimeout(() => setSent(false), 60000); // Allow resend after 60s
        }
    };

    const handleCheckVerification = async () => {
        setChecking(true);
        if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                navigate(0);
            } else {
                alert("Email not yet verified. Please check your inbox and spam folder.");
            }
        }
        setChecking(false);
    };

    const handleSignOut = async () => {
        localStorage.removeItem('capable_mock_login');
        await signOut(auth);
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#fff', textAlign: 'center' }}>
            <div style={{ maxWidth: '400px', padding: '2rem', background: '#111', borderRadius: '1rem', border: '1px solid #333' }}>
                <Mail size={48} color="#2563eb" style={{ margin: '0 auto 1rem' }} />
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Verify your email</h1>
                <p style={{ color: '#aaa', marginBottom: '2rem', lineHeight: '1.5' }}>
                    We sent a verification link to <strong>{user.email}</strong>. 
                    Please click the link to activate your account.
                </p>
                <button 
                    onClick={handleResend}
                    disabled={sent}
                    style={{ background: '#2563eb', color: '#fff', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: sent ? 'not-allowed' : 'pointer', marginBottom: '1rem', fontWeight: 600 }}
                >
                    {sent ? 'Email Sent (Check Inbox)!' : 'Resend Verification Email'}
                </button>
                <button 
                    onClick={handleCheckVerification}
                    disabled={checking}
                    style={{ background: '#333', color: '#fff', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: checking ? 'wait' : 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} className={checking ? "spin" : ""} />
                    {checking ? 'Checking...' : 'I have verified my email'}
                </button>
                <button 
                    onClick={handleSignOut}
                    style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                >
                    Back to login <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
