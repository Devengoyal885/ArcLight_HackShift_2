import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { MessageSquare, Send, Mail, Bell, Paperclip, Loader2, CheckCircle2 } from 'lucide-react';
import './InstitutionSubPages.css';

export default function CommunicationsPage() {
    const [activeTab, setActiveTab] = useState<'announcements' | 'emails' | 'faculty'>('announcements');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSend = () => {
        setSending(true);
        setTimeout(() => {
            setSending(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }, 1500);
    };

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <MessageSquare size={28} className="inst-header-icon" />
                    <div>
                        <h1>Communications</h1>
                        <p>Send announcements, emails, and notices to students and faculty.</p>
                    </div>
                </motion.header>

                <div className="inst-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <button 
                        onClick={() => setActiveTab('announcements')}
                        style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'announcements' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'announcements' ? '#2563eb' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Bell size={16} /> Notice Board
                    </button>
                    <button 
                        onClick={() => setActiveTab('emails')}
                        style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'emails' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'emails' ? '#2563eb' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Mail size={16} /> Email Blasts
                    </button>
                    <button 
                        onClick={() => setActiveTab('faculty')}
                        style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'faculty' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'faculty' ? '#2563eb' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <MessageSquare size={16} /> Faculty Channel
                    </button>
                </div>

                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}>
                    {activeTab === 'announcements' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bell size={20} color="#f59e0b" /> Create New Announcement
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Target Audience</label>
                                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                        <option>All Students</option>
                                        <option>Batch 2025</option>
                                        <option>Batch 2026</option>
                                        <option>Computer Science Dept</option>
                                        <option>Placed Students</option>
                                        <option>Unplaced Students</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Title</label>
                                    <input type="text" placeholder="e.g. Important: Pre-placement talk for TCS" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Message Body</label>
                                    <textarea rows={5} placeholder="Write your announcement..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
                                </div>
                                <div>
                                    <button style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Paperclip size={14} /> Attach Files (PDF, Image)
                                    </button>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <button 
                                        onClick={handleSend}
                                        disabled={sending}
                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {sending ? <Loader2 size={16} className="spin" /> : (success ? <CheckCircle2 size={16} /> : <Send size={16} />)}
                                        {sending ? 'Posting...' : (success ? 'Posted Successfully!' : 'Post Announcement')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'emails' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={20} color="#10b981" /> Send Mass Email
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>To</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                            <option>All Unplaced Students (Batch 2025)</option>
                                            <option>All Faculty Members</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Subject</label>
                                    <input type="text" placeholder="Subject line" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Content</label>
                                    <textarea rows={8} placeholder="Dear students," style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <button 
                                        onClick={handleSend}
                                        disabled={sending}
                                        style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {sending ? <Loader2 size={16} className="spin" /> : (success ? <CheckCircle2 size={16} /> : <Send size={16} />)}
                                        {sending ? 'Sending...' : (success ? 'Emails Sent!' : 'Send Email Blast')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'faculty' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={20} color="#8b5cf6" /> Faculty-TPO Communication Channel
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ alignSelf: 'flex-start', background: '#e0e7ff', padding: '10px 14px', borderRadius: '12px 12px 12px 0', maxWidth: '80%' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#4338ca', marginBottom: '4px' }}>Dr. Sharma (CSE HOD)</div>
                                        <div style={{ fontSize: '13px', color: '#1e1b4b' }}>Can we schedule the Amazon pre-placement talk for next Tuesday? The lab will be free.</div>
                                    </div>
                                    <div style={{ alignSelf: 'flex-end', background: '#2563eb', padding: '10px 14px', borderRadius: '12px 12px 0 12px', maxWidth: '80%' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#bfdbfe', marginBottom: '4px' }}>TPO Admin (You)</div>
                                        <div style={{ fontSize: '13px', color: 'white' }}>Yes, that works! I will update the drive schedule.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input type="text" placeholder="Type a message to the faculty group..." style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    <button 
                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Send size={16} /> Send
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div />
                    )}
                </div>
            </div>
        </div>
    );
}
