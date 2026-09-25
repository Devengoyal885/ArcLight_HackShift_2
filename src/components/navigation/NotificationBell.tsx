import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    type AppNotification,
} from '../../services/notificationService';
import './NotificationBell.css';

const TYPE_ICON: Record<string, string> = {
    oa_invite: '🎯',
    oa_passed: '✅',
    oa_rejected: '📋',
    interview_scheduled: '🎉',
    offer_extended: '🚀',
    placed: '🏆',
    application_rejected: '❌',
    general: '🔔',
};

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
        });
        return unsub;
    }, [user]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpen = () => setOpen(prev => !prev);

    const handleRead = async (notif: AppNotification) => {
        if (!user || notif.read || !notif.id) return;
        await markAsRead(user.uid, notif.id);
    };

    const handleMarkAll = async () => {
        if (!user) return;
        await markAllAsRead(user.uid);
    };

    return (
        <div className="nb-wrap" ref={panelRef}>
            <button className="nb-btn" onClick={handleOpen} aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                    <motion.span
                        className="nb-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={unreadCount}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="nb-panel"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="nb-panel-header">
                            <h3>Notifications</h3>
                            <div className="nb-panel-actions">
                                {unreadCount > 0 && (
                                    <button className="nb-mark-all" onClick={handleMarkAll} title="Mark all as read">
                                        <CheckCheck size={14} /> Mark all read
                                    </button>
                                )}
                                <button className="nb-close-btn" onClick={() => setOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="nb-list">
                            {notifications.length === 0 ? (
                                <div className="nb-empty">
                                    <AlertCircle size={28} opacity={0.3} />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notif, i) => (
                                    <motion.div
                                        key={notif.id || i}
                                        className={`nb-item ${notif.read ? 'nb-item--read' : ''}`}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => handleRead(notif)}
                                    >
                                        <span className="nb-item-icon">
                                            {TYPE_ICON[notif.type] || '🔔'}
                                        </span>
                                        <div className="nb-item-body">
                                            <p className="nb-item-title">{notif.title}</p>
                                            <p className="nb-item-msg">{notif.message}</p>
                                            <p className="nb-item-time">
                                                {notif.createdAt
                                                    ? new Date((notif.createdAt as any).seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                    : 'Just now'}
                                            </p>
                                        </div>
                                        {!notif.read && <span className="nb-unread-dot" />}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
