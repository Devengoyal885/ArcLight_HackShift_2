import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Briefcase, GraduationCap, Users, User,
    Settings, MessageSquare, LayoutDashboard, FileText,
    TrendingUp, ShieldAlert, Award, Building2, Loader2
} from 'lucide-react';
import { searchOpportunities, type OpportunityCard } from '../../services/opportunityService';
import './CommandPalette.css';

interface CommandPaletteProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function CommandPalette({ isOpen, setIsOpen }: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [jobs, setJobs] = useState<OpportunityCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('capable_recent_searches');
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)); } catch (e) { }
        }
    }, []);

    const addRecentSearch = (term: string) => {
        if (!term.trim()) return;
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('capable_recent_searches', JSON.stringify(updated));
    };

    useEffect(() => {
        if (search.length > 2) {
            setLoading(true);
            searchOpportunities({ query: search }).then(res => {
                setJobs(res);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setJobs([]);
        }
    }, [search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearch('');
        }
    }, [isOpen]);

    const navigateTo = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const commands = [
        { icon: <LayoutDashboard />, label: 'Candidate Dashboard', path: '/candidate', category: 'Navigation' },
        { icon: <Briefcase />, label: 'Opportunities & Jobs Hub', path: '/candidate/opportunities', category: 'Navigation' },
        { icon: <TrendingUp />, label: 'Preparation Hub', path: '/candidate/preparation', category: 'Navigation' },
        { icon: <GraduationCap />, label: 'Career & Learning Hub', path: '/candidate/career', category: 'Navigation' },
        { icon: <Users />, label: 'Community & Mentors', path: '/candidate/community', category: 'Navigation' },
        { icon: <FileText />, label: 'My Applications', path: '/candidate/applications', category: 'Navigation' },
        { icon: <User />, label: 'View My Profile', path: '/candidate/coding-profile', category: 'Navigation' },
        { icon: <FileText />, label: 'AI Resume Review', path: '/candidate/career?tab=resume', category: 'Actions' },
        { icon: <MessageSquare />, label: 'Start Mock Interview', path: '/candidate/communication/interview', category: 'Actions' },
        { icon: <Award />, label: 'View College Leaderboard', path: '/candidate/community?tab=leaderboard', category: 'Navigation' },
        { icon: <Settings />, label: 'Account Settings', path: '/settings', category: 'Preferences' }
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
    );

    const categories = Array.from(new Set(filteredCommands.map(c => c.category)));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="cmd-backdrop" onClick={() => setIsOpen(false)}>
                    <motion.div
                        className="cmd-palette"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="cmd-header">
                            <Search className="cmd-search-icon" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                className="cmd-input"
                                placeholder="Search CapAble or type a command..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="cmd-esc">ESC</div>
                        </div>

                        <div className="cmd-filters">
                            {['All', 'Jobs', 'Preparation', 'People'].map(f => (
                                <button
                                    key={f}
                                    className={`cmd-filter-chip ${f === 'All' ? 'active' : ''}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="cmd-content">
                            {search === '' ? (
                                <div className="cmd-empty-state">
                                    {recentSearches.length > 0 && (
                                        <div className="cmd-group">
                                            <div className="cmd-group-label">Recent Searches</div>
                                            {recentSearches.map((term, i) => (
                                                <div key={i} className="cmd-item" onClick={() => setSearch(term)}>
                                                    <div className="cmd-item-icon"><Search size={16} /></div>
                                                    <div className="cmd-item-label">{term}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="cmd-group" style={{ marginTop: recentSearches.length ? '16px' : '0' }}>
                                        <div className="cmd-group-label">Trending on CapAble</div>
                                        <div className="cmd-trending-tags">
                                            {['Google Off-Campus', 'React Interview Prep', 'TCS NQT 2026', 'System Design'].map(tag => (
                                                <span key={tag} className="cmd-tag" onClick={() => setSearch(tag)}>
                                                    <TrendingUp size={12} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : filteredCommands.length === 0 ? (
                                <div className="cmd-empty">
                                    <ShieldAlert size={32} color="#475569" />
                                    <p>No results found for "{search}"</p>
                                </div>
                            ) : (
                                <>
                                    {categories.map(cat => (
                                        <div key={cat} className="cmd-group">
                                            <div className="cmd-group-label">{cat}</div>
                                            {filteredCommands.filter(c => c.category === cat).map((cmd, i) => (
                                                <div
                                                    key={i}
                                                    className="cmd-item"
                                                    onClick={() => navigateTo(cmd.path)}
                                                >
                                                    <div className="cmd-item-icon">{cmd.icon}</div>
                                                    <div className="cmd-item-label">{cmd.label}</div>
                                                    <div className="cmd-item-action">Jump to</div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {loading ? (
                                        <div className="cmd-empty">
                                            <Loader2 className="spin" size={24} color="#64748b" />
                                            <p style={{ marginTop: '8px' }}>Searching jobs...</p>
                                        </div>
                                    ) : jobs.length > 0 && (
                                        <div className="cmd-group">
                                            <div className="cmd-group-label">Matching Jobs</div>
                                            {jobs.map(job => (
                                                <div
                                                    key={job.id}
                                                    className="cmd-item"
                                                    onClick={() => {
                                                        addRecentSearch(search);
                                                        navigateTo(`/candidate/opportunities?search=${encodeURIComponent(job.title)}`);
                                                    }}
                                                >
                                                    <div className="cmd-item-icon"><Building2 size={16} color="#3b82f6" /></div>
                                                    <div className="cmd-item-label">{job.title} <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>at {job.company}</span></div>
                                                    <div className="cmd-item-action">Apply</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
