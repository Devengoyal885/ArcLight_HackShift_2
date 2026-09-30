import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, X, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './ProfileNudgeBanner.css';

export default function ProfileNudgeBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(40); // Simulated progress

    useEffect(() => {
        // Only show if not dismissed recently
        const dismissed = localStorage.getItem('capAble_profile_nudge_dismissed');
        if (!dismissed) {
            // slight delay for animation
            setTimeout(() => setIsVisible(true), 500);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('capAble_profile_nudge_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    className="profile-nudge-wrapper"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                    <div className="profile-nudge-container">
                        <div className="profile-nudge-content">
                            <div className="profile-nudge-icon">
                                <Sparkles size={24} color="#a5b4fc" />
                            </div>
                            <div className="profile-nudge-text">
                                <h3>Complete your CapAble Profile</h3>
                                <p>Candidates with complete profiles are <strong>3x more likely</strong> to be shortlisted by top recruiters.</p>
                                
                                <div className="profile-nudge-progress">
                                    <div className="nudge-progress-bar">
                                        <div className="nudge-progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span>{progress}% Complete</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-nudge-actions">
                            <Link to="/candidate/coding-profile" className="profile-nudge-btn">
                                Complete Now <ChevronRight size={16} />
                            </Link>
                            <button className="profile-nudge-close" onClick={dismiss}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
