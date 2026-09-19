import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/sihlogo.png';
import './FloatingNavbar.css';

interface FloatingNavbarProps {
    variant: 'candidate' | 'employer';
}

const candidateLinks = [
    { to: '/candidate', label: 'Home' },
    { to: '/candidate/capability', label: 'Capability' },
    { to: '/candidate/career', label: 'Career' },
    { to: '/candidate/learning', label: 'Learning' },
    { to: '/candidate/opportunities', label: 'Opportunities' },
    { to: '/candidate/portfolio', label: 'Portfolio' },
    { to: '/candidate/coding-profile', label: 'Coding Profile' },
];

const employerLinks = [
    { to: '/employer', label: 'Home' },
    { to: '/employer/talent', label: 'Talent' },
    { to: '/employer/roles', label: 'Roles' },
    { to: '/employer/workforce', label: 'Workforce' },
    { to: '/employer/insights', label: 'Insights' },
];

export function FloatingNavbar({ variant }: FloatingNavbarProps) {
    const location = useLocation();
    const { user } = useAuth();
    const links = variant === 'candidate' ? candidateLinks : employerLinks;
    const isEmployer = variant === 'employer';
    const initials = user?.displayName?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    return (
        <motion.nav
            className={`floating-navbar floating-navbar--${variant}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="navbar-inner">
                {/* Logo */}
                <Link to={isEmployer ? '/employer' : '/candidate'} className="navbar-logo">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </Link>

                {/* Nav Links */}
                <div className="navbar-links">
                    {links.map((link) => {
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`navbar-link ${isActive ? 'navbar-link--active' : ''}`}
                            >
                                {link.label}
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
                    {isEmployer ? (
                        <Link to="/employer/talent" className="navbar-profile-btn navbar-console-btn">
                            <Briefcase size={14} />
                            <span>Employer Console</span>
                        </Link>
                    ) : (
                        <Link to="/candidate/coding-profile" className="navbar-profile-btn">
                            <div className="navbar-avatar">{initials}</div>
                            <span>Profile</span>
                        </Link>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
