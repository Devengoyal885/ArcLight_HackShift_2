import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Shield, Lock, Eye, Database, Trash2, Download } from 'lucide-react';
import './PrivacyPage.css';

export default function PrivacyPage() {
    return (
        <div className="privacy-page">
            <FloatingNavbar variant="candidate" />
            <div className="privacy-bg" />

            <main className="privacy-main">
                <motion.div className="privacy-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="privacy-eyebrow">YOUR DATA, YOUR CONTROL</p>
                    <h1 className="privacy-title">Data Privacy<br /><em>& Control Center</em></h1>
                    <p className="privacy-sub">
                        CapAble? operates on verified evidence, and you control exactly who sees what.
                        No dark patterns, no hidden tracking.
                    </p>
                </motion.div>

                <div className="privacy-grid">
                    {/* Card 1 */}
                    <motion.div className="privacy-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="privacy-icon"><Eye size={20} /></div>
                        <div className="privacy-card-body">
                            <h3 className="privacy-card-title">Profile Visibility</h3>
                            <p className="privacy-card-desc">Control who can discover your capability fingerprint.</p>

                            <div className="privacy-toggles">
                                <label className="privacy-toggle">
                                    <span>Visible to all registered employers</span>
                                    <input type="checkbox" defaultChecked />
                                    <span className="privacy-slider"></span>
                                </label>
                                <label className="privacy-toggle">
                                    <span>Visible to specific industries only</span>
                                    <input type="checkbox" />
                                    <span className="privacy-slider"></span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div className="privacy-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="privacy-icon"><Lock size={20} /></div>
                        <div className="privacy-card-body">
                            <h3 className="privacy-card-title">Evidence Access</h3>
                            <p className="privacy-card-desc">Decide how your verified work is shared.</p>

                            <div className="privacy-toggles">
                                <label className="privacy-toggle">
                                    <span>Include GitHub repositories</span>
                                    <input type="checkbox" defaultChecked />
                                    <span className="privacy-slider"></span>
                                </label>
                                <label className="privacy-toggle">
                                    <span>Include verified assessments</span>
                                    <input type="checkbox" defaultChecked />
                                    <span className="privacy-slider"></span>
                                </label>
                                <label className="privacy-toggle">
                                    <span>Require request for actual code/docs</span>
                                    <input type="checkbox" />
                                    <span className="privacy-slider"></span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div className="privacy-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="privacy-icon"><Shield size={20} /></div>
                        <div className="privacy-card-body">
                            <h3 className="privacy-card-title">AI Processing</h3>
                            <p className="privacy-card-desc">How our AI interacts with your data.</p>

                            <div className="privacy-toggles">
                                <label className="privacy-toggle">
                                    <span>Allow AI inference for Capability Scores</span>
                                    <input type="checkbox" defaultChecked />
                                    <span className="privacy-slider"></span>
                                </label>
                                <label className="privacy-toggle">
                                    <span>Contribute to anonymized trending models</span>
                                    <input type="checkbox" />
                                    <span className="privacy-slider"></span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 4 (Danger Zone) */}
                    <motion.div className="privacy-card privacy-card--danger" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className="privacy-icon privacy-icon--danger"><Database size={20} /></div>
                        <div className="privacy-card-body">
                            <h3 className="privacy-card-title">Data Portability & Deletion</h3>
                            <p className="privacy-card-desc">Export your capability graph or delete your account entirely.</p>

                            <div className="privacy-actions">
                                <button className="privacy-btn">
                                    <Download size={14} /> Export My Data (JSON)
                                </button>
                                <button className="privacy-btn privacy-btn--danger">
                                    <Trash2 size={14} /> Delete Account & Data
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
