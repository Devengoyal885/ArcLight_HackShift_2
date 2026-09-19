import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { ArrowDown, Database, Cpu, Search, CheckCircle } from 'lucide-react';
import './TransparencyPage.css';

export default function TransparencyPage() {
    const steps = [
        { id: '1', title: 'DATA SOURCES', desc: 'Raw inputs from Git integrations, credentials, or structured assessments.', icon: Database },
        { id: '2', title: 'NORMALIZATION', desc: 'Parsing distinct formats into standard tokens without losing context.', icon: Search },
        { id: '3', title: 'AI CAPABILITY MAPPING', desc: 'LLM-powered alignment of evidence to the global capability ontology.', icon: Cpu },
        { id: '4', title: 'SCORING & CONFIDENCE', desc: 'Generation of quantitative capability scores (0-100%) and confidence brackets.', icon: CheckCircle },
    ];

    return (
        <div className="transparency-page">
            <FloatingNavbar variant="employer" />

            <main className="transparency-main">
                <motion.div className="transparency-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="transparency-eyebrow">HOW IT WORKS</p>
                    <h1 className="transparency-title">The Capability<br /><em>Pipeline.</em></h1>
                    <p className="transparency-sub">
                        CapAble? uses a transparent, deterministic data pipeline to convert unstructured evidence into structured capability intelligence.
                    </p>
                </motion.div>

                <div className="transparency-pipeline">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.id}
                                className="transparency-step"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <div className="transparency-card">
                                    <div className="transparency-num">{step.id}</div>
                                    <div className="transparency-icon"><Icon size={24} /></div>
                                    <div className="transparency-body">
                                        <h3 className="transparency-step-title">{step.title}</h3>
                                        <p className="transparency-step-desc">{step.desc}</p>
                                    </div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="transparency-arrow">
                                        <ArrowDown size={24} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div className="transparency-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <p>This deterministic model ensures hiring decisions are objective and auditable.</p>
                </motion.div>
            </main>
        </div>
    );
}
