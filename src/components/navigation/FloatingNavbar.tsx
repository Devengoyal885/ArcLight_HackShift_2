import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Building2, ArrowRight, LogOut, Search, BadgeCheck, Sun, Moon, Settings2, Home, Compass, Users, BarChart2, FileText } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { LiquidMetalButton } from '../ui/LiquidMetalButton';
import logo from '../../assets/sihlogo.png';
import './FloatingNavbar.css';

interface FloatingNavbarProps {
    variant: 'candidate' | 'employer' | 'academician' | 'institution';
}

type NavLink = {
    to: string;
    label: string;
    icon?: React.ReactNode;
};

const candidateLinks: NavLink[] = [
    { to: '/candidate', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/candidate/opportunities', label: 'Opportunities', icon: <Briefcase size={18} /> },
    { to: '/candidate/preparation', label: 'Preparation', icon: <GraduationCap size={18} /> },
    { to: '/candidate/career', label: 'Career & Learning', icon: <Compass size={18} /> },
    { to: '/candidate/community', label: 'Community & Mentors', icon: <Users size={18} /> },
    { to: '/candidate/applications', label: 'My Applications', icon: <FileText size={18} /> },
];
const employerLinks: NavLink[] = [
    { to: '/employer', label: 'Home' },
    { to: '/employer/talent', label: 'Talent' },
    { to: '/employer/roles', label: 'Roles' },
    { to: '/employer/founders', label: 'Founders' },
    { to: '/employer/pipeline', label: 'Pipeline' },
    { to: '/employer/schedule', label: 'Schedule' },
    { to: '/employer/workforce', label: 'Workforce' },
    { to: '/employer/insights', label: 'Insights' },
    { to: '/employer/branding', label: 'Branding' },
    { to: '/employer/partners', label: 'Partners' },
];

const academicianLinks: NavLink[] = [
    { to: '/faculty', label: 'Students' },
    { to: '/academician', label: 'My Dashboard' },
    { to: '/academician/mentorship', label: 'Mentorship' },
    { to: '/academician/workshops', label: 'Workshops' },
];

const institutionLinks: NavLink[] = [
    { to: '/institution', label: 'Dashboard' },
    { to: '/institution/students', label: 'Students' },
    { to: '/institution/placements', label: 'Placements' },
    { to: '/institution/incubation', label: 'E-Cell' },
    { to: '/institution/drives', label: 'Drives' },
    { to: '/institution/analytics', label: 'Analytics' },
    { to: '/institution/communications', label: 'Comms' },
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
    const { theme, toggleTheme } = useTheme();
    const links = linkMap[variant] || candidateLinks;
    const initials = user?.displayName?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const handleSignOut = async () => {
        try {
            localStorage.removeItem('capable_mock_login');
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const userControls = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="navbar-avatar" title={user?.displayName || 'User'}>{initials}</div>
            <Link
                to="/settings"
                className="navbar-profile-btn"
                style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Settings"
            >
                <Settings2 size={16} color="var(--color-ink-400)" />
            </Link>
            <button
                onClick={toggleTheme}
                className="navbar-profile-btn"
                style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={16} color="#e2e8f0" /> : <Moon size={16} color="#475569" />}
            </button>
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

    const rightAction = () => {
        switch (variant) {
            case 'employer':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        {userControls}
                    </div>
                );
            case 'academician':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/academician" className="navbar-cta-link">
                            <LiquidMetalButton
                                variant="primary"
                                size="sm"
                                leftIcon={<GraduationCap size={13} />}
                            >
                                Faculty
                            </LiquidMetalButton>
                        </Link>
                        {userControls}
                    </div>
                );
            case 'institution':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/institution" className="navbar-cta-link">
                            <LiquidMetalButton
                                variant="primary"
                                size="sm"
                                leftIcon={<Building2 size={13} />}
                            >
                                Admin
                            </LiquidMetalButton>
                        </Link>
                        {userControls}
                    </div>
                );
            default:
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/candidate/coding-profile" className="navbar-profile-btn" style={{ gap: '6px' }}>
                            <div className="navbar-avatar">{initials}</div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Profile <BadgeCheck size={14} color="#3b82f6" fill="#eff6ff" />
                            </span>
                        </Link>
                        <Link
                            to="/settings"
                            className="navbar-profile-btn"
                            style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Settings"
                        >
                            <Settings2 size={16} color="var(--color-ink-400)" />
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="navbar-profile-btn"
                            style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={16} color="#e2e8f0" /> : <Moon size={16} color="#475569" />}
                        </button>
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
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
            <div className="navbar-inner">
                {/* Logo */}
                <Link to={homeMap[variant] || '/candidate'} className="navbar-logo">
                    <img src={logo} className="capable-logo" alt="CapAble Logo" />
                </Link>

                {/* Nav Links with animated active pill */}
                <div className="navbar-links">
                    {links.map((link) => {
                        const isCandidateLinkActive = (linkTo: string, currentPath: string) => {
                            if (linkTo === '/candidate') return currentPath === '/candidate';
                            if (linkTo === '/candidate/opportunities') {
                                return currentPath === '/candidate/opportunities' || currentPath.startsWith('/candidate/opportunities/') ||
                                       currentPath === '/candidate/jobs' || currentPath.startsWith('/candidate/jobs/') ||
                                       currentPath === '/candidate/placement-drives' || currentPath === '/candidate/off-campus';
                            }
                            if (linkTo === '/candidate/preparation') {
                                return currentPath === '/candidate/preparation' || currentPath.startsWith('/candidate/preparation/') ||
                                       currentPath === '/candidate/practice' || currentPath.startsWith('/candidate/practice/') ||
                                       currentPath === '/candidate/case-study' || currentPath === '/candidate/gd-topics' ||
                                       currentPath === '/candidate/communication' || currentPath.startsWith('/candidate/communication/') ||
                                       currentPath === '/candidate/aptitude' || currentPath.startsWith('/candidate/aptitude/');
                            }
                            if (linkTo === '/candidate/career') {
                                return currentPath === '/candidate/career' || currentPath.startsWith('/candidate/career/') ||
                                       currentPath === '/candidate/learning' || currentPath === '/candidate/resume' ||
                                       currentPath === '/candidate/portfolio' || currentPath === '/candidate/goals' ||
                                       currentPath === '/candidate/resume-builder' || currentPath === '/candidate/insights' ||
                                       currentPath === '/candidate/capability';
                            }
                            if (linkTo === '/candidate/community') {
                                return currentPath === '/candidate/community' || currentPath.startsWith('/candidate/community/') ||
                                       currentPath === '/candidate/forum' || currentPath === '/candidate/events' ||
                                       currentPath === '/candidate/alumni';
                            }
                            if (linkTo === '/candidate/applications') {
                                return currentPath === '/candidate/applications' || currentPath.startsWith('/candidate/applications/');
                            }
                            return currentPath === linkTo || currentPath.startsWith(linkTo + '/');
                        };

                        const isActive = variant === 'candidate'
                            ? isCandidateLinkActive(link.to, location.pathname)
                            : (location.pathname === link.to || location.pathname.startsWith(link.to + '/'));
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
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} /* Slight momentum bounce for navigation tabs */
                                    />
                                )}
                                <div className="navbar-link-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    {link.icon && <div className="navbar-link-icon mobile-only" style={{ display: 'none' }}>{link.icon}</div>}
                                    <span className="navbar-link-text">{link.label}</span>
                                </div>
                                {isActive && (
                                    <motion.span
                                        className="navbar-link-dot"
                                        layoutId={`nav-dot-${variant}`}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Action */}
                <div className="navbar-action">
                    <button className="navbar-search-hint" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
                        <Search size={14} />
                        <span>Cmd+K</span>
                    </button>
                    <NotificationBell />
                    {rightAction()}
                </div>
            </div>
        </motion.nav>
    );
}
