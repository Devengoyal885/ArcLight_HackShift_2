/**
 * NotificationSettingsPage.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Lets candidates manage their notification preferences:
 *   â€¢ Enable/disable browser push notifications
 *   â€¢ Enable WhatsApp notifications (enter phone number)
 *   â€¢ Choose which events to get notified about
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateProfile } from '../../services/profileService';
import {
    Bell, BellOff, MessageSquare, CheckCircle2, AlertCircle, Loader2,
    Smartphone, Briefcase, Calendar, Award, ChevronRight, Phone, Clock, Send, ShieldCheck,
} from 'lucide-react';
import {
    subscribeToPush,
    unsubscribeFromPush,
    showLocalNotification,
} from '../../services/pushNotificationService';
import { getTwilioStatus, triggerVoiceCall, sendSMS, type TwilioStatusResponse } from '../../services/twilioService';

interface NotifPrefs {
    pushEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappPhone: string;
    events: {
        newDrive: boolean;
        interviewScheduled: boolean;
        offerReceived: boolean;
        applicationUpdate: boolean;
        assessmentReminder: boolean;
    };
}

const DEFAULT_PREFS: NotifPrefs = {
    pushEnabled: false,
    whatsappEnabled: false,
    whatsappPhone: '',
    events: {
        newDrive: true,
        interviewScheduled: true,
        offerReceived: true,
        applicationUpdate: true,
        assessmentReminder: true,
    },
};

export default function NotificationSettingsPage() {
    const { user, dbUid } = useAuth();
    const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [twilioInfo, setTwilioInfo] = useState<TwilioStatusResponse | null>(null);
    const [callingTest, setCallingTest] = useState(false);
    const [smsTest, setSmsTest] = useState(false);
    const [testAlert, setTestAlert] = useState<{ text: string; type: 'success' | 'error' | 'info'; sid?: string } | null>(null);

    useEffect(() => {
        getTwilioStatus().then(status => {
            if (status.configured) setTwilioInfo(status);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!dbUid) return;
        // Load saved prefs
        getDoc(doc(db, 'users', dbUid, 'settings', 'notifications')).then(snap => {
            if (snap.exists()) setPrefs({ ...DEFAULT_PREFS, ...(snap.data() as Partial<NotifPrefs>) });
        }).finally(() => setLoading(false));

        // Check push permission state
        if ('Notification' in window) setPushStatus(Notification.permission);
    }, [dbUid]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleTriggerTestVoiceCall = async () => {
        setCallingTest(true);
        setTestAlert(null);
        try {
            const targetPhone = prefs.whatsappPhone || twilioInfo?.primaryVerifiedNumber || '+918299565476';
            const res = await triggerVoiceCall({
                to: targetPhone,
                jobTitle: 'Senior Placement & Innovation Role',
                company: 'CapAble Enterprise Network',
            });
            if (res.success) {
                const notice = res.redirected
                    ? ` (Dispatched to verified trial phone ${res.routedTo})`
                    : ` to ${res.routedTo || targetPhone}`;
                setTestAlert({
                    type: 'success',
                    text: `Voice call initiated successfully${notice}! Your phone will ring shortly.`,
                    sid: res.sid,
                });
                showToast('Voice call dispatched!');
            } else {
                setTestAlert({
                    type: 'error',
                    text: res.error || 'Failed to trigger voice call.',
                });
                showToast('Call trigger failed.', 'error');
            }
        } catch (err: any) {
            setTestAlert({ type: 'error', text: err.message || 'Error triggering call.' });
        } finally {
            setCallingTest(false);
        }
    };

    const handleTriggerTestSMS = async () => {
        setSmsTest(true);
        setTestAlert(null);
        try {
            const targetPhone = prefs.whatsappPhone || twilioInfo?.primaryVerifiedNumber || '+918299565476';
            const res = await sendSMS(
                targetPhone,
                '⏰ CapAble Test Alert: Your application reminder system is active and verified!'
            );
            if (res.success) {
                setTestAlert({
                    type: 'success',
                    text: `SMS dispatched successfully to ${targetPhone}! Check your phone messages.`,
                });
                showToast('SMS dispatched!');
            } else {
                setTestAlert({
                    type: 'error',
                    text: res.error || 'Failed to dispatch SMS.',
                });
                showToast('SMS trigger failed.', 'error');
            }
        } catch (err: any) {
            setTestAlert({ type: 'error', text: err.message || 'Error triggering SMS.' });
        } finally {
            setSmsTest(false);
        }
    };

    const savePrefs = async (newPrefs: NotifPrefs) => {
        if (!dbUid) return;
        setSaving(true);
        try {
            await setDoc(doc(db, 'users', dbUid, 'settings', 'notifications'), newPrefs);
            if (newPrefs.whatsappPhone) {
                const formatted = newPrefs.whatsappPhone.trim();
                localStorage.setItem('capable_candidate_phone', formatted);
                await updateProfile(dbUid, { phone: formatted }).catch(() => {});
            }
            setPrefs(newPrefs);
            showToast('Preferences saved!');
        } catch {
            showToast('Failed to save. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const togglePush = async () => {
        if (!dbUid) return;
        if (prefs.pushEnabled) {
            await unsubscribeFromPush(dbUid);
            setPushStatus(Notification.permission);
            await savePrefs({ ...prefs, pushEnabled: false });
            showToast('Push notifications disabled.');
        } else {
            const sub = await subscribeToPush(dbUid);
            if (sub) {
                setPushStatus('granted');
                await savePrefs({ ...prefs, pushEnabled: true });
                showLocalNotification('ðŸ”” Notifications Enabled!', 'You\'ll now receive real-time alerts from CapAble.');
            } else {
                showToast(
                    Notification.permission === 'denied'
                        ? 'Please allow notifications in your browser settings.'
                        : 'Could not enable notifications. Try again.',
                    'error'
                );
            }
        }
    };

    const toggleEvent = (key: keyof NotifPrefs['events']) => {
        const newPrefs = { ...prefs, events: { ...prefs.events, [key]: !prefs.events[key] } };
        savePrefs(newPrefs);
    };

    const EVENTS: { key: keyof NotifPrefs['events']; label: string; icon: React.ReactNode; desc: string }[] = [
        { key: 'newDrive', label: 'New Placement Drive', icon: <Calendar size={16} />, desc: 'When a new drive opens that matches your profile' },
        { key: 'interviewScheduled', label: 'Interview Scheduled', icon: <Briefcase size={16} />, desc: 'When an interview is confirmed for you' },
        { key: 'offerReceived', label: 'Offer Received', icon: <Award size={16} />, desc: 'When a company extends an offer' },
        { key: 'applicationUpdate', label: 'Application Updates', icon: <ChevronRight size={16} />, desc: 'When your application moves to a new stage' },
        { key: 'assessmentReminder', label: 'Assessment Reminders', icon: <Bell size={16} />, desc: 'Reminders for pending aptitude tests' },
    ];

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <FloatingNavbar variant="candidate" />

            {/* Toast */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', top: 80, right: 24, zIndex: 9999,
                        background: toast.type === 'success' ? '#10b981' : '#ef4444',
                        color: '#fff', padding: '12px 20px', borderRadius: 12,
                        fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </motion.div>
            )}

            <main style={{ paddingTop: 96, maxWidth: 680, margin: '0 auto', padding: '96px 24px 64px' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8 }}>
                        PREFERENCES
                    </p>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 8, lineHeight: 1.1 }}>
                        Notification Settings
                    </h1>
                    <p style={{ fontSize: 16, color: '#64748b', marginBottom: 40 }}>
                        Choose how and when CapAble alerts you about opportunities and updates.
                    </p>
                </motion.div>

                {/* Push Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Bell size={22} color="#2563eb" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Browser Push Notifications</h2>
                                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                    Get real-time alerts in your browser, even when CapAble is in the background.
                                    {pushStatus === 'denied' && (
                                        <span style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                                            âš ï¸ Notifications blocked. Enable them in your browser's site settings.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={togglePush}
                            disabled={saving || pushStatus === 'denied'}
                            style={{
                                padding: '8px 20px', borderRadius: 10,
                                background: prefs.pushEnabled ? '#10b981' : '#2563eb',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                border: 'none', cursor: pushStatus === 'denied' ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                                opacity: pushStatus === 'denied' ? 0.5 : 1,
                            }}
                        >
                            {prefs.pushEnabled ? <><BellOff size={14} /> Disable</> : <><Bell size={14} /> Enable</>}
                        </button>
                    </div>
                </motion.div>

                {/* WhatsApp */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={22} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>WhatsApp Notifications</h2>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Receive placement alerts, interview schedules, and offers via WhatsApp.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                Phone Number (with country code)
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={prefs.whatsappPhone}
                                    onChange={e => setPrefs(p => ({ ...p, whatsappPhone: e.target.value }))}
                                    style={{
                                        flex: 1, padding: '10px 14px', borderRadius: 10,
                                        border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={() => savePrefs({ ...prefs, whatsappEnabled: !!prefs.whatsappPhone })}
                                    disabled={saving || !prefs.whatsappPhone}
                                    style={{
                                        padding: '10px 18px', borderRadius: 10,
                                        background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13,
                                        border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {prefs.whatsappEnabled && prefs.whatsappPhone && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669' }}>
                            <CheckCircle2 size={14} /> WhatsApp enabled for {prefs.whatsappPhone}
                        </div>
                    )}
                </motion.div>

                {/* Twilio Voice Call Deadline Reminder & Live Diagnostics */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Phone size={22} color="#2563eb" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    📞 AI Voice Call Deadline Reminder (Twilio Voice)
                                </h2>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: 9999,
                                    background: twilioInfo?.configured ? '#dcfce7' : '#fee2e2',
                                    color: twilioInfo?.configured ? '#15803d' : '#b91c1c',
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: twilioInfo?.configured ? '#22c55e' : '#ef4444' }} />
                                    {twilioInfo?.configured ? `Twilio ${twilioInfo.accountType || 'Active'}` : 'Twilio Offline'}
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 0 }}>
                                CapAble automatically <strong>calls your phone</strong> exactly <strong>3 hours before</strong> a saved job's application deadline using natural AI speech, and dispatches a concurrent SMS backup.
                            </p>
                            <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                                    <Clock size={13} /> Auto-triggered 3h before deadline
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                                    <CheckCircle2 size={13} /> SMS backup dispatched simultaneously
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
                                    <ShieldCheck size={13} /> Inline TwiML Cloud Speech
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Twilio Free Trial Account Telemetry & Explanation */}
                    <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #bfdbfe', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Smartphone size={15} color="#2563eb" /> Twilio Telemetry & Verified Numbers
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                Caller ID: <strong>{twilioInfo?.activeNumber || '+1 (517) 300-0357'}</strong>
                            </span>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>
                            💡 <strong>Twilio Trial Rule:</strong> On a Twilio Free Trial account, voice calls and SMS are only permitted to <strong>Verified Outgoing Caller IDs</strong>. To ensure testing and live evaluation always succeed, CapAble automatically detects unverified candidate numbers and safely delivers calls to your verified test recipient.
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>Verified Trial Recipient Numbers:</span>
                            {(twilioInfo?.verifiedNumbers || ['+918299565476', '+918294854966']).map(num => (
                                <span key={num} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 6, fontWeight: 700, color: '#0f172a' }}>
                                    {num}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Live Testing Actions */}
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            ⚡ Test Live Twilio Integration Now
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>
                            Trigger a real-time call or SMS right now to experience the deadline notification pipeline firsthand:
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                id="btn-test-voice-call"
                                onClick={handleTriggerTestVoiceCall}
                                disabled={callingTest || smsTest}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '9px 16px',
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    border: 'none',
                                    cursor: (callingTest || smsTest) ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                                }}
                            >
                                {callingTest ? (
                                    <><Loader2 size={14} className="spin" /> Dispatching Call...</>
                                ) : (
                                    <><Phone size={14} /> Trigger Live Voice Call</>
                                )}
                            </button>

                            <button
                                id="btn-test-sms"
                                onClick={handleTriggerTestSMS}
                                disabled={callingTest || smsTest}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '9px 16px',
                                    borderRadius: 10,
                                    background: '#ffffff',
                                    color: '#0f172a',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    border: '1.5px solid #cbd5e1',
                                    cursor: (callingTest || smsTest) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {smsTest ? (
                                    <><Loader2 size={14} className="spin" /> Sending SMS...</>
                                ) : (
                                    <><Send size={14} /> Trigger Live SMS</>
                                )}
                            </button>
                        </div>

                        {/* Live Test Feedback Banner */}
                        {testAlert && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: 12,
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    background: testAlert.type === 'error' ? '#fef2f2' : '#f0fdf4',
                                    border: `1px solid ${testAlert.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                                    color: testAlert.type === 'error' ? '#991b1b' : '#166534',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                }}
                            >
                                {testAlert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                <div>
                                    <div style={{ fontWeight: 600 }}>{testAlert.text}</div>
                                    {testAlert.sid && (
                                        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, fontFamily: 'monospace' }}>
                                            Twilio SID: {testAlert.sid}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Event toggles */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Notification Events</h2>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Choose which events trigger notifications.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {EVENTS.map(ev => (
                            <div
                                key={ev.key}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ color: '#7c3aed' }}>{ev.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{ev.label}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{ev.desc}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleEvent(ev.key)}
                                    style={{
                                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: prefs.events[ev.key] ? '#2563eb' : '#e2e8f0',
                                        transition: 'background 0.2s', position: 'relative', flexShrink: 0,
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute', top: 2, left: prefs.events[ev.key] ? 22 : 2,
                                        width: 20, height: 20, borderRadius: 10, background: '#fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                                    }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
