import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import CareerPage from './CareerPage';
import GoalsPage from './GoalsPage';
import LearningPage from './LearningPage';
import PortfolioPage from './PortfolioPage';
import ResumeAIPage from './ResumeAIPage';
import ArcLightPage from './ArcLightPage';
import { Map, Target, BookOpen, FolderDot, FileText, ChevronRight, BarChart2 } from 'lucide-react';
import { LottieBackground } from '../../components/ui/LottieBackground';
import './PreparationHubPage.css'; // reuse shared hub styles

const TABS = [
    {
        id: 'career',
        label: 'Career Map',
        icon: Map,
        description: 'Capability matching & career trajectories',
    },
    {
        id: 'goals',
        label: 'Goals',
        icon: Target,
        description: 'Track milestones and targets',
    },
    {
        id: 'learning',
        label: 'Learning Path',
        icon: BookOpen,
        description: 'Close skill gaps with AI courses',
    },
    {
        id: 'portfolio',
        label: 'Portfolio',
        icon: FolderDot,
        description: 'Showcase verified capabilities',
    },
    {
        id: 'resume',
        label: 'Resume AI',
        icon: FileText,
        description: 'Tailor your resume for any role',
    },
    {
        id: 'insights',
        label: 'ArcLight ML Insights',
        icon: BarChart2,
        description: 'Predictive salary & career analytics',
    }
];

export default function CareerHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabQuery = searchParams.get('tab');
    const validTabs = TABS.map(t => t.id);
    const activeTab = validTabs.includes(tabQuery || '') ? tabQuery! : 'career';

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
                        <p className="hub-sidebar-label">CAREER & DEVELOPMENT</p>
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
                    {/* Breadcrumb */}
                    <div className="hub-breadcrumb">
                        <span>Career</span>
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
                            {activeTab === 'career' && <CareerPage isEmbedded={true} />}
                            {activeTab === 'goals' && <GoalsPage isEmbedded={true} />}
                            {activeTab === 'learning' && <LearningPage isEmbedded={true} />}
                            {activeTab === 'portfolio' && <PortfolioPage isEmbedded={true} />}
                            {activeTab === 'resume' && <ResumeAIPage isEmbedded={true} />}
                            {activeTab === 'insights' && <ArcLightPage isEmbedded={true} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
