/**
 * ToastNotifications.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Real-time toast overlay — subscribes to Firestore notifications and
 * pops a dismissible toast for every new unread notification.
 *
 * Usage: Mount once inside AuthProvider in App.tsx.
 * <ToastNotifications />
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToNotifications, markAsRead, type AppNotification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import './ToastNotifications.css';

const TYPE_EMOJI: Record<string, string> = {
    oa_invite:            '🎯',
    oa_passed:            '✅',
    oa_rejected:          '📋',
    interview_scheduled:  '🗓️',
    offer_extended:       '🚀',
    placed:               '🏆',
    application_rejected: '❌',
    general:              '🔔',
};

const TYPE_COLOR: Record<string, string> = {
    oa_invite:            '#6366f1',
    oa_passed:            '#10b981',
    oa_rejected:          '#f59e0b',
    interview_scheduled:  '#2563eb',
    offer_extended:       '#10b981',
    placed:               '#059669',
    application_rejected: '#ef4444',
    general:              '#64748b',
};

interface ToastItem extends AppNotification {
    toastId: string;
}

export function ToastNotifications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const seenIds = useRef<Set<string>>(new Set());
    const initialLoad = useRef(true);

    useEffect(() => {
        if (!user) return;

        const unsub = subscribeToNotifications(user.uid, (notifications) => {
            // Skip the first batch (already-existing notifications on page load)
            if (initialLoad.current) {
                notifications.forEach(n => { if (n.id) seenIds.current.add(n.id); });
                initialLoad.current = false;
                return;
            }

            // Show toasts only for new unread ones we haven't seen
            const newOnes = notifications.filter(
                n => !n.read && n.id && !seenIds.current.has(n.id)
            );

            newOnes.forEach(n => {
                seenIds.current.add(n.id!);
                const toastId = `${n.id}-${Date.now()}`;
                setToasts(prev => [
                    { ...n, toastId },
                    ...prev.slice(0, 4),   // keep max 5 toasts at once
                ]);

                // Auto-dismiss after 6 seconds
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.toastId !== toastId));
                }, 6000);
            });
        });

        return unsub;
    }, [user]);

    const dismiss = (toastId: string) => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
    };

    const handleClick = async (toast: ToastItem) => {
        dismiss(toast.toastId);
        if (user && toast.id) await markAsRead(user.uid, toast.id);
        if (toast.link) navigate(toast.link);
    };

    return (
        <div className="tn-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.toastId}
                        className="tn-toast"
                        style={{ '--accent': TYPE_COLOR[toast.type] || '#6366f1' } as React.CSSProperties}
                        initial={{ opacity: 0, x: 80, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                        onClick={() => handleClick(toast)}
                    >
                        <div className="tn-toast-accent" />
                        <div className="tn-toast-emoji">{TYPE_EMOJI[toast.type] || '🔔'}</div>
                        <div className="tn-toast-body">
                            <p className="tn-toast-title">{toast.title}</p>
                            <p className="tn-toast-msg">{toast.message}</p>
                        </div>
                        <button
                            className="tn-toast-close"
                            onClick={e => { e.stopPropagation(); dismiss(toast.toastId); }}
                        >
                            <X size={14} />
                        </button>
                        {/* Progress bar (auto-dismiss timer) */}
                        <motion.div
                            className="tn-toast-progress"
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 6, ease: 'linear' }}
                            style={{ transformOrigin: 'left' }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
