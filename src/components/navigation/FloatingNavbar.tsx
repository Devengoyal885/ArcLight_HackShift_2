import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Building2, ArrowRight, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { LiquidMetalButton } from '../ui/LiquidMetalButton';
import logo from '../../assets/sihlogo.png';
import './FloatingNavbar.css';

interface FloatingNavbarProps {
    variant: 'candidate' | 'employer' | 'academician' | 'institution';
}

const candidateLinks = [
    { to: '/candidate', label: 'Home' },
    { to: '/candidate/resume', label: 'Resume Builder' },
    { to: '/candidate/career', label: 'Career' },
    { to: '/candidate/learning', label: 'Learning' },
    { to: '/candidate/opportunities', label: 'Opportunities' },
    { to: '/candidate/placement-drives', label: 'Drives' },
    { to: '/candidate/applications', label: 'Applications' },
    { to: '/candidate/portfolio', label: 'Projects' },
    { to: '/candidate/preparation', label: 'Prep Hub' },
    { to: '/candidate/communication', label: 'Comm Hub' },
    { to: '/candidate/coding-profile', label: 'Digital Profile' },
];

const employerLinks = [
    { to: '/employer', label: 'Home' },
    { to: '/employer/talent', label: 'Talent' },
    { to: '/employer/roles', label: 'Roles' },
    { to: '/employer/pipeline', label: 'Pipeline' },
    { to: '/employer/schedule', label: 'Schedule' },
    { to: '/employer/workforce', label: 'Workforce' },
    { to: '/employer/insights', label: 'Insights' },
    { to: '/employer/partners', label: 'Partners' },
];

const academicianLinks = [
    { to: '/faculty', label: 'Students' },
    { to: '/academician', label: 'My Dashboard' },
    { to: '/academician/mentorship', label: 'Mentorship' },
    { to: '/academician/workshops', label: 'Workshops' },
];

const institutionLinks = [
    { to: '/institution', label: 'Dashboard' },
    { to: '/institution/students', label: 'Students' },
    { to: '/institution/placements', label: 'Placements' },
    { to: '/institution/drives', label: 'Drives' },
    { to: '/institution/analytics', label: 'Analytics' },
    { to: '/institution/naac', label: 'NAAC' },
];

const linkMap = {
    candidate: candidateLinks,
    employer: employerLinks,
    academician: academicianLinks,
    institution: institutionLinks,
};

const homeMap = {
    candidate: '/candidate',
    employer: '/employer',
    academician: '/faculty',
    institution: '/institution',
};

export function FloatingNavbar({ variant }: FloatingNavbarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const links = linkMap[variant] || candidateLinks;
    const initials = user?.displayName?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const rightAction = () => {
        switch (variant) {
            case 'employer':
                return (
                    <Link to="/employer/talent" className="navbar-cta-link">
                        <LiquidMetalButton
                            variant="primary"
                            size="sm"
                            leftIcon={<Briefcase size={13} />}
                            rightIcon={<ArrowRight size={12} />}
                        >
                            Employer Console
                        </LiquidMetalButton>
                    </Link>
                );
            case 'academician':
                return (
                    <Link to="/academician" className="navbar-cta-link">
                        <LiquidMetalButton
                            variant="primary"
                            size="sm"
                            leftIcon={<GraduationCap size={13} />}
                        >
                            Faculty
                        </LiquidMetalButton>
                    </Link>
                );
            case 'institution':
                return (
                    <Link to="/institution" className="navbar-cta-link">
                        <LiquidMetalButton
                            variant="primary"
                            size="sm"
                            leftIcon={<Building2 size={13} />}
                        >
                            Admin
                        </LiquidMetalButton>
                    </Link>
                );
            default:
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/candidate/coding-profile" className="navbar-profile-btn">
                            <div className="navbar-avatar">{initials}</div>
                            <span>Profile</span>
                        </Link>
                        <button 
                            onClick={handleSignOut}
                            className="navbar-profile-btn"
                            style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Sign Out"
                        >
                            <LogOut size={16} color="#ef4444" />
                        </button>
                    </div>
                );
        }
    };

    return (
        <motion.nav
            className={`floating-navbar floating-navbar--${variant}`}
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="navbar-inner">
                {/* Logo */}
                <Link to={homeMap[variant] || '/candidate'} className="navbar-logo">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </Link>

                {/* Nav Links with animated active pill */}
                <div className="navbar-links">
                    {links.map((link) => {
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`navbar-link ${isActive ? 'navbar-link--active' : ''}`}
                            >
                                {isActive && (
                                    <motion.span
                                        className="navbar-active-pill"
                                        layoutId={`nav-pill-${variant}`}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="navbar-link-text">{link.label}</span>
                                {isActive && (
                                    <motion.span
                                        className="navbar-link-dot"
                                        layoutId={`nav-dot-${variant}`}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Action */}
                <div className="navbar-action">
                    <NotificationBell />
                    {rightAction()}
                </div>
            </div>
        </motion.nav>
    );
}
