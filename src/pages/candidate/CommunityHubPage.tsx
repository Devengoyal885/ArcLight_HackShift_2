import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import ForumPage from './ForumPage';
import EventsPage from './EventsPage';
import LeaderboardPage from './LeaderboardPage';
import AlumniNetworkPage from './AlumniNetworkPage';
import { MessageSquare, Calendar, ChevronRight, Trophy, Users } from 'lucide-react';
import { LottieBackground } from '../../components/ui/LottieBackground';
import './PreparationHubPage.css'; // reuse shared hub styles

const TABS = [
    {
        id: 'leaderboard',
        label: 'Leaderboard',
        icon: Trophy,
        description: 'Global & Campus Ranking',
    },
    {
        id: 'forum',
        label: 'Discussion Forum',
        icon: MessageSquare,
        description: 'Placement experiences & advice',
    },
    {
        id: 'events',
        label: 'Events & Webinars',
        icon: Calendar,
        description: 'Upcoming career events',
    },
    {
        id: 'mentors',
        label: 'Mentors & Alumni',
        icon: Users,
        description: 'Direct 1-on-1 alumni mentorship',
    },
];

export default function CommunityHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabQuery = searchParams.get('tab');
    const validTabs = TABS.map(t => t.id);
    const activeTab = validTabs.includes(tabQuery || '') ? tabQuery! : 'leaderboard';

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const activeTabInfo = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="hub-page">
            <FloatingNavbar variant="candidate" />
            <LottieBackground />

            <div className="hub-layout">
                {/* Sidebar */}
                <aside className="hub-sidebar">
                    <div className="hub-sidebar-header">
                        <p className="hub-sidebar-label">COMMUNITY</p>
                    </div>

                    <nav className="hub-sidebar-nav">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`hub-sidebar-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    <div className="hub-sidebar-icon-wrap">
                                        <Icon size={16} />
                                    </div>
                                    <div className="hub-sidebar-item-text">
                                        <span className="hub-sidebar-item-label">{tab.label}</span>
                                        <span className="hub-sidebar-item-desc">{tab.description}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14} className="hub-sidebar-arrow" />}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="hub-main">
                    <div className="hub-breadcrumb">
                        <span>Community</span>
                        <ChevronRight size={13} />
                        <span className="hub-breadcrumb-active">{activeTabInfo.label}</span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="hub-content"
                        >
                            {activeTab === 'leaderboard' && <LeaderboardPage isEmbedded />}
                            {activeTab === 'forum' && <ForumPage isEmbedded />}
                            {activeTab === 'events' && <EventsPage isEmbedded />}
                            {activeTab === 'mentors' && <AlumniNetworkPage isEmbedded />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
