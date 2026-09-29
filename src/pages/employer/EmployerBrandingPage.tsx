import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { 
    Image, Video, Quote, Users, Save, LayoutTemplate, 
    Plus, Upload, Globe, CheckCircle2 
} from 'lucide-react';
import './EmployerDashboard.css';

export default function EmployerBrandingPage() {
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'page' | 'media' | 'testimonials' | 'di'>('page');

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="emp-dash">
            <FloatingNavbar variant="employer" />
            <main className="emp-dash-main">
                <motion.div className="emp-dash-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Globe size={28} color="#4f46e5" />
                                <h1 className="emp-dash-org">Employer Branding</h1>
                            </div>
                            <p className="emp-dash-sub">Customize your public career page, showcase culture, and diversity metrics.</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {saved ? 'Saved' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    {[
                        { id: 'page', label: 'Career Page', icon: <LayoutTemplate size={16}/> },
                        { id: 'media', label: 'Gallery', icon: <Image size={16}/> },
                        { id: 'testimonials', label: 'Testimonials', icon: <Quote size={16}/> },
                        { id: 'di', label: 'D&I Metrics', icon: <Users size={16}/> },
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            style={{ 
                                padding: '12px 16px', 
                                background: 'none', 
                                border: 'none', 
                                borderBottom: activeTab === t.id ? '2px solid #4f46e5' : '2px solid transparent',
                                color: activeTab === t.id ? '#4f46e5' : '#64748b',
                                fontWeight: activeTab === t.id ? 600 : 400,
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                            }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'page' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="emp-card" style={{ marginBottom: '1.5rem' }}>
                            <div className="emp-card-header">
                                <h2 className="emp-card-title">White-label Career Page Settings</h2>
                            </div>
                            <div className="emp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 500 }}>Company Name</label>
                                        <input type="text" defaultValue="TechNova Inc." style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 500 }}>Custom Domain / Slug</label>
                                        <input type="text" defaultValue="technova.capable.app" style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Primary Brand Color</label>
                                    <input type="color" defaultValue="#4f46e5" style={{ padding: '2px', border: '1px solid #e2e8f0', borderRadius: '6px', height: '40px', width: '100px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Hero Banner Text</label>
                                    <input type="text" defaultValue="Build the future with us." style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'media' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="emp-card">
                            <div className="emp-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h2 className="emp-card-title">Company Photo/Video Gallery</h2>
                                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    <Upload size={14} /> Upload Media
                                </button>
                            </div>
                            <div className="emp-card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[1,2,3].map(i => (
                                        <div key={i} style={{ height: '150px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                            <Image size={32} />
                                        </div>
                                    ))}
                                    <div style={{ height: '150px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                                        <Plus size={24} />
                                        <span style={{ fontSize: '13px', marginTop: '8px' }}>Add Photo/Video</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'testimonials' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="emp-card">
                            <div className="emp-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h2 className="emp-card-title">Employee Stories</h2>
                                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    <Plus size={14} /> Add Story
                                </button>
                            </div>
                            <div className="emp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 8px 0' }}>Sarah J. - Software Engineer</h4>
                                    <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>"Joining this company was the best career decision. The culture is incredibly supportive and I get to work on cutting-edge problems."</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'di' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="emp-card">
                            <div className="emp-card-header">
                                <h2 className="emp-card-title">Diversity & Inclusion Metrics</h2>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Display these metrics publicly on your career page to show your commitment to D&I.</p>
                            </div>
                            <div className="emp-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Women in Leadership (%)</label>
                                    <input type="number" defaultValue={42} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Underrepresented Minorities (%)</label>
                                    <input type="number" defaultValue={35} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Show D&I Report on public profile</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
