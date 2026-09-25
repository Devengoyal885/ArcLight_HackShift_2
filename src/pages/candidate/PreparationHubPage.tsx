import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import AssessmentPage from './AssessmentPage';
import PracticePage from './PracticePage';
import { Target, Code2 } from 'lucide-react';
import './PreparationHubPage.css';

export default function PreparationHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'practice' ? 'practice' : 'assessments';

    const handleTabChange = (tab: 'assessments' | 'practice') => {
        setSearchParams({ tab });
    };

    return (
        <div className="prep-hub-page">
            <FloatingNavbar variant="candidate" />
            
            <div className="prep-hub-bg" />

            <main className="prep-hub-main">
                <div className="prep-hub-header">
                    <h1 className="prep-hub-title">Preparation Hub</h1>
                    <p className="prep-hub-subtitle">Sharpen your skills with structured assessments and open-ended coding challenges.</p>

                    <div className="prep-hub-tabs">
                        <button
                            className={`prep-hub-tab ${activeTab === 'assessments' ? 'active' : ''}`}
                            onClick={() => handleTabChange('assessments')}
                        >
                            <Target size={16} />
                            <span>Skill Assessments</span>
                            {activeTab === 'assessments' && <motion.div layoutId="prep-tab-indicator" className="prep-hub-indicator" />}
                        </button>
                        <button
                            className={`prep-hub-tab ${activeTab === 'practice' ? 'active' : ''}`}
                            onClick={() => handleTabChange('practice')}
                        >
                            <Code2 size={16} />
                            <span>Practice Arena</span>
                            {activeTab === 'practice' && <motion.div layoutId="prep-tab-indicator" className="prep-hub-indicator" />}
                        </button>
                    </div>
                </div>

                <div className="prep-hub-content">
                    <AnimatePresence mode="wait">
                        {activeTab === 'assessments' && (
                            <motion.div
                                key="assessments"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="prep-hub-view"
                            >
                                <AssessmentPage />
                            </motion.div>
                        )}
                        {activeTab === 'practice' && (
                            <motion.div
                                key="practice"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="prep-hub-view"
                            >
                                <PracticePage />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
