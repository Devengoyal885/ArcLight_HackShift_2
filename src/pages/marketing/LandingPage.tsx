import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings, Briefcase, MessageSquare, Camera, ChevronRight } from 'lucide-react';

import logo from '../../assets/sihlogo.png';
import dashboardImg from '../../assets/dashboard.png';
import './LandingPage.css';

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-logo">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </div>
                <div className="landing-nav-links">
                    <a href="#features">Capability Match</a>
                    <a href="#features">Career Tracker</a>
                    <a href="#features">Role Insights</a>
                    <div className="landing-nav-divider" />
                    <button className="landing-theme-toggle">
                        <Settings size={20} />
                    </button>
                    <Link to="/login" className="landing-btn-login">Login</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <motion.h1
                    className="landing-hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Track, analyze & prove
                </motion.h1>
                <motion.p
                    className="landing-hero-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <span className="capable-brand">CapAble</span> helps you navigate and prove your <br /> true capabilities for success
                </motion.p>

                <motion.div
                    className="landing-hero-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link to="/login" className="landing-btn-secondary">Capability Twin</Link>
                    <Link to="/login" className="landing-btn-primary">
                        For Employers <ChevronRight size={16} />
                    </Link>
                </motion.div>

                {/* Hero Visuals */}
                <motion.div
                    className="landing-hero-visuals"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="landing-dashboard-wrapper">
                        <img src={dashboardImg} alt="Dashboard UI" className="landing-dashboard-image" />

                        {/* Overlay the ID Card slightly offset to recreate the overlapping feel */}
                        <div className="landing-hero-card-layer">
                            <img src="/src/assets/idcard.png" alt="ID Card Mockup" className="hero-idcard-float" />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Share Section */}
            <section className="landing-share section-spacing" id="features">
                <div className="landing-share-content">
                    <h2 className="landing-section-title">
                        Share your <span className="hashtag">#CapAbleCard</span><br />
                        <span>Wherever you want</span>
                    </h2>

                    <div className="landing-share-visual">
                        <div className="landing-card-stack">
                            <img src="/src/assets/idcard.png" alt="ID Card Mockup" className="share-idcard-image" />

                            <div className="landing-share-tooltip">
                                <div className="tooltip-avatar" />
                                <div className="tooltip-text">
                                    <strong>Sarah</strong> <span>2d</span>
                                    <p><span className="tag">@alexmorgan</span> Your verified problem solving capabilities are incredible.</p>
                                </div>
                            </div>

                            <div className="social-floating-icons">
                                <div className="social-icon li-icon"><Briefcase size={24} /></div>
                                <div className="social-icon tw-icon"><MessageSquare size={24} /></div>
                                <div className="social-icon ig-icon"><Camera size={24} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta section-spacing">
                <h2 className="landing-cta-title">
                    Ready to <span className="highlight">unlock</span><br />
                    your Capability Portfolio?
                </h2>
                <p className="landing-cta-subtitle">Unlock your CapAble profile now</p>
                <Link to="/login" className="landing-btn-cta">
                    Login / Signup <ChevronRight size={18} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-links">
                    <a href="#">FAQ</a>
                    <a href="#">Contact Us</a>
                    <a href="#">Privacy</a>
                    <a href="#">Timeline</a>
                    <a href="#">Terms</a>
                    <a href="#">Refund Policy</a>
                </div>
                <div className="footer-socials">
                    <a href="#"><Briefcase size={22} /></a>
                    <a href="#"><MessageSquare size={22} /></a>
                    <a href="#"><Camera size={22} /></a>
                </div>
                <p className="footer-copyright">© 2026 CapAble, Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
