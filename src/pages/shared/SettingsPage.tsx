import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Moon, Sun, Globe, Bell, Shield, Link as LinkIcon, 
    Download, Trash2, Smartphone, Type, Settings2, CheckCircle2,
    LogOut, AlertTriangle, QrCode, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { deleteUser } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import './SettingsPage.css';

export default function SettingsPage() {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('appearance');
    const [saved, setSaved] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);

    const tabs = [
        { id: 'appearance', label: 'Appearance & Accessibility', icon: <Sun size={18} /> },
        { id: 'account', label: 'Account Security', icon: <Shield size={18} /> },
        { id: 'connections', label: 'Connected Accounts', icon: <LinkIcon size={18} /> },
        { id: 'data', label: 'Data & Privacy', icon: <Download size={18} /> },
        { id: 'sessions', label: 'Active Sessions', icon: <Smartphone size={18} /> },
    ];

    const triggerSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExportData = () => {
        if (!profile) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `capable_export_${profile.name?.replace(/\s+/g, '_') || 'data'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        triggerSave();
    };

    const handleDeleteAccount = async () => {
        if (!auth.currentUser) return;
        const confirmDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
        if (confirmDelete) {
            try {
                await deleteUser(auth.currentUser);
                window.location.href = '/login'; // Force reload to clear everything
            } catch (error: any) {
                if (error.code === 'auth/requires-recent-login') {
                    alert("Please log out and log back in before deleting your account for security reasons.");
                } else {
                    alert("Failed to delete account. Please try again.");
                }
            }
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div className="settings-header-content">
                    <div className="settings-header-icon"><Settings2 size={24} color="#6366f1" /></div>
                    <div>
                        <h1>Platform Settings</h1>
                        <p>Manage your account, preferences, and privacy.</p>
                    </div>
                </div>
                {saved && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="settings-saved-toast">
                        <CheckCircle2 size={16} /> Preferences Saved
                    </motion.div>
                )}
            </div>

            <div className="settings-layout">
                <div className="settings-sidebar">
                    {tabs.map(t => (
                        <button 
                            key={t.id} 
                            className={`settings-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    <AnimatePresence mode="wait">
                        {activeTab === 'appearance' && (
                            <motion.div key="appearance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-section">
                                <h2>Appearance & Accessibility</h2>
                                
                                <div className="settings-card">
                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">Theme Mode</div>
                                            <div className="settings-desc">Switch between Dark and Light mode.</div>
                                        </div>
                                        <button className="settings-toggle-btn" onClick={() => { toggleTheme(); triggerSave(); }}>
                                            {theme === 'dark' ? <><Moon size={16} /> Dark</> : <><Sun size={16} /> Light</>}
                                        </button>
                                    </div>
                                    
                                    <div className="settings-divider" />
                                    
                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">Language</div>
                                            <div className="settings-desc">Choose your preferred platform language.</div>
                                        </div>
                                        <select className="settings-select" onChange={triggerSave}>
                                            <option value="en">English (US)</option>
                                            <option value="en-in">English (India)</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>

                                    <div className="settings-divider" />
                                    
                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">High Contrast Mode</div>
                                            <div className="settings-desc">Increase contrast for better readability.</div>
                                        </div>
                                        <div className="settings-switch">
                                            <input type="checkbox" id="contrast" onChange={triggerSave} />
                                            <label htmlFor="contrast"></label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'account' && (
                            <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-section">
                                <h2>Account Security</h2>
                                
                                <div className="settings-card">
                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">Two-Factor Authentication (2FA)</div>
                                            <div className="settings-desc">Add an extra layer of security using an authenticator app.</div>
                                        </div>
                                        {is2FAEnabled ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Enabled</span>
                                                <button className="settings-btn-secondary" onClick={() => { setIs2FAEnabled(false); triggerSave(); }}>Disable</button>
                                            </div>
                                        ) : (
                                            <button className="settings-btn-primary" onClick={() => setShow2FAModal(true)}>Enable 2FA</button>
                                        )}
                                    </div>

                                    <div className="settings-divider" />

                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">Change Password</div>
                                            <div className="settings-desc">Ensure you are using a strong, unique password.</div>
                                        </div>
                                        <button className="settings-btn-secondary">Update</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'connections' && (
                            <motion.div key="connections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-section">
                                <h2>Connected Accounts</h2>
                                
                                <div className="settings-card">
                                    <div className="settings-row">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="conn-icon github"><Globe size={20} /></div>
                                            <div>
                                                <div className="settings-title">GitHub</div>
                                                <div className="settings-desc">{profile?.githubUsername ? `@${profile.githubUsername}` : 'Not connected'}</div>
                                            </div>
                                        </div>
                                        {profile?.githubUsername ? (
                                            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Connected</span>
                                        ) : (
                                            <button className="settings-btn-secondary">Connect</button>
                                        )}
                                    </div>

                                    <div className="settings-divider" />

                                    <div className="settings-row">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="conn-icon linkedin" style={{ background: '#0077b5' }}><LinkIcon size={20} color="white" /></div>
                                            <div>
                                                <div className="settings-title">LinkedIn</div>
                                                <div className="settings-desc">Sync your professional history automatically.</div>
                                            </div>
                                        </div>
                                        <button className="settings-btn-secondary">Connect</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'data' && (
                            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-section">
                                <h2>Data & Privacy</h2>
                                
                                <div className="settings-card">
                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title">Export My Data</div>
                                            <div className="settings-desc">Download a copy of your personal data, resumes, and results (GDPR compliant).</div>
                                        </div>
                                        <button className="settings-btn-secondary" onClick={handleExportData}><Download size={16} /> Request Export</button>
                                    </div>

                                    <div className="settings-divider" />

                                    <div className="settings-row">
                                        <div>
                                            <div className="settings-title" style={{ color: '#ef4444' }}>Delete Account</div>
                                            <div className="settings-desc">Permanently delete your account and all associated data.</div>
                                        </div>
                                        <button className="settings-btn-danger" onClick={handleDeleteAccount}><Trash2 size={16} /> Delete Account</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'sessions' && (
                            <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-section">
                                <h2>Active Sessions</h2>
                                
                                <div className="settings-card">
                                    <div className="settings-row">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="conn-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}><Smartphone size={20} /></div>
                                            <div>
                                                <div className="settings-title">Current Session (Windows)</div>
                                                <div className="settings-desc">New Delhi, India • Active now</div>
                                            </div>
                                        </div>
                                        <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Active</span>
                                    </div>

                                    <div className="settings-divider" />

                                    <div className="settings-row">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="conn-icon" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#64748b' }}><Smartphone size={20} /></div>
                                            <div>
                                                <div className="settings-title">Mobile App (iOS)</div>
                                                <div className="settings-desc">Mumbai, India • Last active 2 hours ago</div>
                                            </div>
                                        </div>
                                        <button className="settings-btn-secondary">Log Out</button>
                                    </div>
                                    
                                    <div style={{ marginTop: '24px', textAlign: 'right' }}>
                                        <button className="settings-btn-danger" style={{ width: 'auto' }}>
                                            <LogOut size={16} /> Log Out of All Other Devices
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 2FA Setup Modal */}
            <AnimatePresence>
                {show2FAModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShow2FAModal(false)}>
                        <motion.div className="modal-content" style={{ maxWidth: '450px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} color="#2563eb" /> Setup 2FA</h3>
                                <button onClick={() => setShow2FAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                                Open your authenticator app (like Google Authenticator or Authy) and scan the QR code below.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <QrCode size={160} color="#0f172a" strokeWidth={1} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Enter 6-digit code</label>
                                <input type="text" placeholder="000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'center', letterSpacing: '4px' }} />
                            </div>
                            <button 
                                style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => { setIs2FAEnabled(true); setShow2FAModal(false); triggerSave(); }}
                            >
                                Verify & Enable
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
