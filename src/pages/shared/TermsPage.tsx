import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div style={{ background: '#0a0a0f', color: '#DCDAD6', minHeight: '100vh', padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '2.5rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}
                >
                    Terms of Service
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ color: '#aaa', marginBottom: '3rem' }}
                >
                    Last Updated: {new Date().toLocaleDateString()}
                </motion.p>

                <div style={{ lineHeight: '1.7', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p>
                        Welcome to CapAble! These Terms of Service ("Terms") govern your use of our platform, including our website, mobile application, and AI-driven placement services. By accessing or using CapAble, you agree to be bound by these Terms.
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>1. Use of the Platform</h2>
                    <p>
                        CapAble provides campus placement intelligence and skill assessment tools. You agree to use the platform only for lawful purposes. You must not use the platform in any way that violates applicable federal, state, local, or international law.
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>2. Account Responsibilities</h2>
                    <p>
                        If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>3. User Content</h2>
                    <p>
                        You retain ownership of the content you submit (such as resumes, portfolios, and assessment answers). By submitting content, you grant CapAble a non-exclusive license to use, reproduce, and process the content solely for the purpose of providing and improving our services (e.g., matching you with employers).
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>4. Limitation of Liability</h2>
                    <p>
                        CapAble makes no guarantee of employment or placement. The services are provided "as is" without warranty of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform.
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>5. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that harms the platform or its users. You may terminate your account at any time via your account settings.
                    </p>

                    <h2 style={{ color: '#fff', marginTop: '1rem' }}>6. Changes to Terms</h2>
                    <p>
                        We may update these Terms from time to time. We will notify you of any material changes by posting the new Terms on this page. Your continued use of the platform after changes constitutes acceptance of the modified Terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
