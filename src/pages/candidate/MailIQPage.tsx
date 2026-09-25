import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { mailItems as defaultMailItems } from '../../data/candidate';
import { Mail, Calendar, Bell, FileText, Briefcase, Clock, Tag, Loader2 } from 'lucide-react';
import './MailIQPage.css';

type Category = 'Priority' | 'Opportunities' | 'Deadlines' | 'Applications' | 'Meetings' | 'Other' | 'All';

const categoryIcons: Record<string, React.ReactNode> = {
    Priority: <Bell size={14} />,
    Opportunities: <Briefcase size={14} />,
    Deadlines: <Clock size={14} />,
    Applications: <FileText size={14} />,
    Meetings: <Calendar size={14} />,
    Other: <Tag size={14} />,
};

const priorityColors: Record<string, string> = {
    high: '#f4845f', medium: '#f59e0b', low: '#9aa0b0',
};

export default function MailIQPage() {
    const { dbUid } = useAuth();
    const [category, setCategory] = useState<Category>('All');
    const [emails, setEmails] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dbUid) return;
        const fetchEmails = async () => {
            try {
                const colRef = collection(db, 'users', dbUid, 'mailiq');
                const snap = await getDocs(colRef);
                if (snap.empty) {
                    // Seed defaults
                    const batch = writeBatch(db);
                    defaultMailItems.forEach(m => {
                        const newRef = doc(colRef);
                        batch.set(newRef, m);
                    });
                    await batch.commit();
                    setEmails(defaultMailItems);
                    setSelected(defaultMailItems[0]);
                } else {
                    const loaded = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
                    setEmails(loaded);
                    setSelected(loaded[0]);
                }
            } catch (err) {
                console.error("Failed to load MailIQ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [dbUid]);

    const filtered = category === 'All' ? emails : emails.filter(m => m.category === category);

    return (
        <div className="mailiq-page">
            <FloatingNavbar variant="candidate" />

            <main className="mailiq-main">
                <motion.div className="mailiq-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="mailiq-eyebrow">MAILIQ</p>
                    <h1 className="mailiq-title">Smart triage for your career inbox.</h1>
                    <p className="mailiq-sub">CapAble? reads your emails and surfaces what matters most to your capability journey.</p>
                </motion.div>

                <div className="mailiq-layout">
                    {/* Sidebar */}
                    <div className="mailiq-sidebar">
                        <div className="mailiq-categories">
                            {(['All', 'Priority', 'Opportunities', 'Deadlines', 'Applications', 'Meetings', 'Other'] as Category[]).map((cat) => (
                                <button
                                    key={cat}
                                    className={`mailiq-cat-btn ${category === cat ? 'mailiq-cat-btn--active' : ''}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {categoryIcons[cat] ?? <Mail size={14} />}
                                    <span>{cat}</span>
                                    {cat !== 'All' && emails.filter(m => m.category === cat).length > 0 && (
                                        <span className="mailiq-cat-count">{emails.filter(m => m.category === cat).length}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mailiq-list">
                            {filtered.map((mail, i) => (
                                <motion.div
                                    key={mail.docId || mail.id}
                                    className={`mailiq-item ${selected?.id === mail.id ? 'mailiq-item--selected' : ''} ${!mail.read ? 'mailiq-item--unread' : ''}`}
                                    onClick={() => setSelected(mail)}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="mailiq-item-dot" style={{ background: priorityColors[mail.priority] }} />
                                    <div className="mailiq-item-body">
                                        <p className="mailiq-item-subject">{mail.subject}</p>
                                        <p className="mailiq-item-org">{mail.org}</p>
                                    </div>
                                    <span className="mailiq-item-cat-badge">{mail.category}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Detail panel */}
                    {selected ? (
                        <motion.div
                            className="mailiq-detail"
                            key={selected.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mailiq-detail-header">
                                <div className="mailiq-detail-priority" style={{ background: priorityColors[selected.priority] + '22', color: priorityColors[selected.priority] }}>
                                    {selected.priority.toUpperCase()} PRIORITY
                                </div>
                                <span className="mailiq-detail-category">{selected.category}</span>
                            </div>

                            <h2 className="mailiq-detail-subject">{selected.subject}</h2>
                            <p className="mailiq-detail-org">{selected.org}</p>

                            <div className="mailiq-detail-deadline">
                                <Clock size={14} />
                                <span>{selected.deadline}</span>
                            </div>

                            <div className="mailiq-detail-actions">
                                <p className="mailiq-actions-label">AI-suggested actions</p>
                                <div className="mailiq-action-buttons">
                                    <button className="mailiq-action-btn mailiq-action-btn--primary">
                                        <FileText size={14} /> Generate Resume
                                    </button>
                                    <button className="mailiq-action-btn">
                                        <Calendar size={14} /> Add to Calendar
                                    </button>
                                    <button className="mailiq-action-btn">
                                        <Bell size={14} /> Remind Me
                                    </button>
                                    <button className="mailiq-action-btn">
                                        <Mail size={14} /> Open Original
                                    </button>
                                </div>
                            </div>

                            <div className="mailiq-ai-insight">
                                <p className="mailiq-ai-label">CapAble? Insight</p>
                                <p className="mailiq-ai-text">
                                    Your capability alignment with this opportunity is <strong>96%</strong>.
                                    You have {selected.deadline !== 'No deadline' ? `until ${selected.deadline}` : 'no hard deadline'}.
                                    A role-specific resume can be generated in 30 seconds.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="mailiq-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {loading ? <Loader2 className="spin" size={24} /> : <p style={{ color: '#94a3b8' }}>Select an email</p>}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
