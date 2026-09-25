/**
 * notificationService.ts
 * ──────────────────────
 * Firestore-backed in-app notification system for CapAble.
 *
 * Collection: notifications/{uid}/items/{notifId}
 *
 * Notifications are created automatically when:
 *   - Employer approves candidate for OA (status → 'OA Pending')
 *   - OA result is determined (pass → 'Interview Scheduled', fail → 'OA Rejected')
 *   - Employer extends an offer (status → 'Offer Extended')
 *   - Employer marks placement complete (status → 'Placed')
 */

import {
    collection, addDoc, getDocs, updateDoc, doc,
    serverTimestamp, query, orderBy, where,
    onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'oa_invite'
    | 'oa_passed'
    | 'oa_rejected'
    | 'interview_scheduled'
    | 'offer_extended'
    | 'placed'
    | 'application_rejected'
    | 'general';

export interface AppNotification {
    id?: string;
    uid: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    link?: string;          // e.g. '/candidate/applications'
    createdAt?: unknown;
    updatedAt?: unknown;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNotification(
    uid: string,
    payload: Omit<AppNotification, 'id' | 'uid' | 'read' | 'createdAt' | 'updatedAt'>
): Promise<void> {
    try {
        await addDoc(collection(db, 'notifications', uid, 'items'), {
            ...payload,
            uid,
            read: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (e) {
        console.error('[notificationService] Failed to create notification:', e);
    }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getNotifications(uid: string): Promise<AppNotification[]> {
    try {
        const col = collection(db, 'notifications', uid, 'items');
        const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    } catch (e) {
        console.error('[notificationService] Failed to fetch notifications:', e);
        return [];
    }
}

export async function getUnreadCount(uid: string): Promise<number> {
    try {
        const col = collection(db, 'notifications', uid, 'items');
        const snap = await getDocs(query(col, where('read', '==', false)));
        return snap.size;
    } catch {
        return 0;
    }
}

/** Subscribe to real-time unread count. Returns unsubscribe fn. */
export function subscribeToNotifications(
    uid: string,
    onChange: (notifications: AppNotification[]) => void
): Unsubscribe {
    const col = collection(db, 'notifications', uid, 'items');
    return onSnapshot(
        query(col, orderBy('createdAt', 'desc')),
        (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            onChange(items);
        },
        (err) => console.error('[notificationService] Snapshot error:', err)
    );
}

// ─── Mark read ────────────────────────────────────────────────────────────────

export async function markAsRead(uid: string, notifId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'notifications', uid, 'items', notifId), {
            read: true,
            updatedAt: serverTimestamp(),
        });
    } catch (e) {
        console.error('[notificationService] Failed to mark read:', e);
    }
}

export async function markAllAsRead(uid: string): Promise<void> {
    try {
        const col = collection(db, 'notifications', uid, 'items');
        const snap = await getDocs(query(col, where('read', '==', false)));
        await Promise.all(
            snap.docs.map(d =>
                updateDoc(d.ref, { read: true, updatedAt: serverTimestamp() })
            )
        );
    } catch (e) {
        console.error('[notificationService] Failed to mark all read:', e);
    }
}

// ─── Convenience helpers (called by employerService) ─────────────────────────

export async function notifyOAInvite(candidateUid: string, roleTitle: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'oa_invite',
        title: '🎯 Online Assessment Invited',
        message: `You have been shortlisted for an Online Assessment for "${roleTitle}". Head to My Applications to begin.`,
        link: '/candidate/applications',
    });
}

export async function notifyOAPassed(candidateUid: string, roleTitle: string, venue: string, date: string, time: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'interview_scheduled',
        title: '🎉 Interview Scheduled!',
        message: `You passed the OA for "${roleTitle}"! Your interview is on ${date} at ${time} — ${venue}.`,
        link: '/candidate/applications',
    });
}

export async function notifyOARejected(candidateUid: string, roleTitle: string, reason?: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'oa_rejected',
        title: '📋 Assessment Result',
        message: reason || `Thank you for taking the OA for "${roleTitle}". Unfortunately you did not meet the threshold this time.`,
        link: '/candidate/applications',
    });
}

export async function notifyRejected(candidateUid: string, roleTitle: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'application_rejected',
        title: 'Application Update',
        message: `Your application for "${roleTitle}" was not progressed at this time.`,
        link: '/candidate/applications',
    });
}

export async function notifyOfferExtended(candidateUid: string, roleTitle: string, companyName: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'offer_extended',
        title: '🚀 Offer Letter Extended!',
        message: `${companyName} has extended an offer for "${roleTitle}". Please check your Applications page for details.`,
        link: '/candidate/applications',
    });
}

export async function notifyPlaced(candidateUid: string, roleTitle: string, companyName: string): Promise<void> {
    await createNotification(candidateUid, {
        type: 'placed',
        title: '🏆 Placement Confirmed!',
        message: `Congratulations! Your placement at ${companyName} as "${roleTitle}" has been confirmed.`,
        link: '/candidate/applications',
    });
}
