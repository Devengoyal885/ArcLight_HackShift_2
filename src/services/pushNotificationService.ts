/**
 * pushNotificationService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Browser Push Notification service for CapAble.
 *
 * Flow:
 *   1. Register the service worker (already at /service-worker.js)
 *   2. Request notification permission from the user
 *   3. Subscribe to push using VAPID public key from backend
 *   4. Store the PushSubscription in Firestore under users/{uid}/pushSubscriptions
 *   5. Backend (or Cloud Function) sends push via Web Push protocol
 *
 * For local testing without a VAPID key, falls back to native
 * Notification API (no background push, but works on the tab).
 */

import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (SERVER_URL && !SERVER_URL.startsWith('http')) SERVER_URL = 'https://' + SERVER_URL;
if (SERVER_URL.includes('up.railway.app')) SERVER_URL = SERVER_URL.replace('http://', 'https://');

// ── Helpers ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ── Service Worker Registration ───────────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
        console.log('[SW] Service worker registered:', reg.scope);
        return reg;
    } catch (err) {
        console.error('[SW] Registration failed:', err);
        return null;
    }
}

// ── Permission & Subscription ─────────────────────────────────────────────────

export async function requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
}

export async function subscribeToPush(uid: string): Promise<PushSubscription | null> {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
        console.warn('[Push] Notification permission denied.');
        return null;
    }

    const reg = await registerServiceWorker();
    if (!reg) return null;

    try {
        // Try to get VAPID key from backend
        let applicationServerKey: Uint8Array | undefined;
        try {
            const resp = await fetch(`${SERVER_URL}/api/push/vapid-key`);
            if (resp.ok) {
                const { publicKey } = await resp.json() as { publicKey: string };
                applicationServerKey = urlBase64ToUint8Array(publicKey);
            }
        } catch {
            console.warn('[Push] Could not fetch VAPID key, attempting subscription without it.');
        }

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
            await saveSubscriptionToFirestore(uid, existing);
            return existing;
        }

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            ...(applicationServerKey ? { applicationServerKey: applicationServerKey as any } : {}),
        });

        await saveSubscriptionToFirestore(uid, subscription);
        console.log('[Push] Subscribed:', subscription.endpoint);
        return subscription;
    } catch (err) {
        console.error('[Push] Subscribe failed:', err);
        return null;
    }
}

export async function unsubscribeFromPush(uid: string): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
        await sub.unsubscribe();
        await deleteDoc(doc(db, 'users', uid, 'pushSubscriptions', 'main'));
        console.log('[Push] Unsubscribed.');
    }
}

async function saveSubscriptionToFirestore(uid: string, sub: PushSubscription): Promise<void> {
    const subJson = sub.toJSON();
    await setDoc(doc(db, 'users', uid, 'pushSubscriptions', 'main'), {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        updatedAt: serverTimestamp(),
    });
}

// ── In-Tab Notification (fallback, no push required) ─────────────────────────

export function showLocalNotification(title: string, body: string, url?: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'capable-local',
    });

    if (url) {
        notification.onclick = () => {
            window.focus();
            window.location.href = url;
        };
    }
}

// ── Convenience: notify about a new placement drive ───────────────────────────

export async function notifyNewDrive(uid: string, driveName: string, company: string): Promise<void> {
    await subscribeToPush(uid); // ensure subscribed
    showLocalNotification(
        `🚀 New Drive: ${company}`,
        `${driveName} — Check your eligibility now!`,
        '/candidate/placement-drives'
    );
}

// ── Convenience: notify about interview scheduled ─────────────────────────────

export async function notifyInterviewScheduled(uid: string, role: string, date: string): Promise<void> {
    await subscribeToPush(uid);
    showLocalNotification(
        `🗓️ Interview Scheduled!`,
        `${role} — ${date}. Check your applications for details.`,
        '/candidate/applications'
    );
}

// ── Convenience: notify about offer ──────────────────────────────────────────

export async function notifyOfferReceived(uid: string, role: string, company: string): Promise<void> {
    await subscribeToPush(uid);
    showLocalNotification(
        `🎉 Offer Received!`,
        `${company} has extended an offer for ${role}!`,
        '/candidate/applications'
    );
}
