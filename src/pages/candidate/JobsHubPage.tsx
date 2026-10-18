import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import OpportunitiesPage from './OpportunitiesPage';
import ApplicationsPage from './ApplicationsPage';
import PlacementDrivesPage from './PlacementDrivesPage';
import OffCampusPage from './OffCampusPage';
import StartupVenturesView from '../../components/opportunities/StartupVenturesView';
import IncubationHubView from '../../components/opportunities/IncubationHubView';
import { Search, Rocket, Building2, Zap, Globe, FileText, ChevronRight } from 'lucide-react';
import { LottieBackground } from '../../components/ui/LottieBackground';
import './PreparationHubPage.css'; // reuse shared hub styles

const TABS = [
    {
        id: 'jobs',
        label: 'All Jobs & Roles',
        icon: Search,
        description: 'AI-matched jobs & internships',
    },
    {
        id: 'startups',
        label: 'Startups & Co-Founders',
        icon: Rocket,
        description: 'Early ventures, founding teams & equity roles',
    },
    {
        id: 'incubation',
        label: 'Incubation & E-Cells',
        icon: Building2,
        description: 'Grants, prototyping labs & cohorts',
    },
    {
        id: 'drives',
        label: 'Placement Drives',
        icon: Zap,
        description: 'Campus drives from your institution',
    },
    {
        id: 'off-campus',
        label: 'Off-Campus Tracker',
        icon: Globe,
        description: 'Track external job applications',
    },
    {
        id: 'applications',
        label: 'Applications Pipeline',
        icon: FileText,
        description: 'Track your submitted applications',
    },
];

export default function JobsHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabQuery = searchParams.get('tab');
    const validTabs = TABS.map(t => t.id);
    const activeTab = validTabs.includes(tabQuery || '') ? tabQuery! : 'jobs';

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const activeTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];

    return (
        <div className="hub-page">
            <FloatingNavbar variant="candidate" />
            <LottieBackground />

            <div className="hub-layout">
                {/* Sidebar */}
                <aside className="hub-sidebar">
                    <div className="hub-sidebar-header">
                        <p className="hub-sidebar-label">OPPORTUNITIES & VENTURES</p>
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
                        <span>Opportunities</span>
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
                            {activeTab === 'jobs' && <OpportunitiesPage isEmbedded />}
                            {activeTab === 'startups' && <StartupVenturesView />}
                            {activeTab === 'incubation' && <IncubationHubView />}
                            {activeTab === 'drives' && <PlacementDrivesPage isEmbedded />}
                            {activeTab === 'off-campus' && <OffCampusPage isEmbedded />}
                            {activeTab === 'applications' && <ApplicationsPage isEmbedded />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
