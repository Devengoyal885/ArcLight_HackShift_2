import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import AssessmentPage from './AssessmentPage';
import PracticePage from './PracticePage';
import CaseStudyPage from './CaseStudyPage';
import GDTopicsPage from './GDTopicsPage';
import CommunicationHubPage from './CommunicationHubPage';
import { Target, Code2, Briefcase, Users, MessageSquare, ChevronRight } from 'lucide-react';
import { LottieBackground } from '../../components/ui/LottieBackground';
import './PreparationHubPage.css';

const TABS = [
    {
        id: 'assessments',
        label: 'Assessments',
        icon: Target,
        description: 'Test your skills across 7 domains',
    },
    {
        id: 'practice',
        label: 'Practice',
        icon: Code2,
        description: 'LeetCode & coding challenges',
    },
    {
        id: 'case-study',
        label: 'Case Studies',
        icon: Briefcase,
        description: 'Consulting & guesstimate prep',
    },
    {
        id: 'gd-topics',
        label: 'GD Topics',
        icon: Users,
        description: 'Group discussion practice',
    },
    {
        id: 'communication',
        label: 'Comm & AI Interview',
        icon: MessageSquare,
        description: 'AI mock interviews & soft skills',
    },
];

export default function PreparationHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabQuery = searchParams.get('tab');
    const validTabs = TABS.map(t => t.id);
    const activeTab = validTabs.includes(tabQuery || '') ? tabQuery! : 'assessments';

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
                        <p className="hub-sidebar-label">PREPARATION</p>
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
                        <span>Preparation</span>
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
                            {activeTab === 'assessments' && <AssessmentPage isEmbedded />}
                            {activeTab === 'practice' && <PracticePage isEmbedded />}
                            {activeTab === 'case-study' && <CaseStudyPage isEmbedded />}
                            {activeTab === 'gd-topics' && <GDTopicsPage isEmbedded />}
                            {activeTab === 'communication' && <CommunicationHubPage isEmbedded />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
// Trigger HMR
