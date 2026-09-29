/**
 * offCampusService.ts
 * ────────────────────
 * Off-campus opportunity tracking — candidates can manually add
 * opportunities they find externally (LinkedIn, Glassdoor, etc.)
 * and track their application status.
 *
 * Firestore:
 *   users/{uid}/offCampusTracker/{trackerId}
 */

import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
    serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type TrackStatus =
    | 'saved'
    | 'applied'
    | 'screening'
    | 'assessment'
    | 'interview'
    | 'offer'
    | 'rejected'
    | 'withdrawn';

export interface OffCampusTracker {
    id?: string;
    company: string;
    role: string;
    location?: string;
    workType: 'remote' | 'hybrid' | 'onsite';
    source: string;             // 'LinkedIn' | 'Indeed' | 'company website' | etc.
    sourceUrl?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    status: TrackStatus;
    deadline?: string;          // ISO date
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    appliedDate?: string;       // ISO date
    nextActionDate?: string;    // ISO date — reminder
    nextActionNote?: string;
    tags: string[];
    isFavorite: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

const COLLECTION = (uid: string) => collection(db, 'users', uid, 'offCampusTracker');
const DOC = (uid: string, id: string) => doc(db, 'users', uid, 'offCampusTracker', id);

export async function getOffCampusTracker(uid: string): Promise<OffCampusTracker[]> {
    try {
        const snap = await getDocs(query(COLLECTION(uid), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as OffCampusTracker));
    } catch (e) {
        console.error('[offCampusService]', e);
        return [];
    }
}

export async function addOffCampusEntry(
    uid: string,
    entry: Omit<OffCampusTracker, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const ref = await addDoc(COLLECTION(uid), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateOffCampusEntry(
    uid: string,
    id: string,
    data: Partial<OffCampusTracker>
): Promise<void> {
    await updateDoc(DOC(uid, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteOffCampusEntry(uid: string, id: string): Promise<void> {
    await deleteDoc(DOC(uid, id));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function computeTrackerStats(entries: OffCampusTracker[]): {
    total: number;
    applied: number;
    inProgress: number;
    offers: number;
    rejected: number;
    conversionRate: number;
    byStatus: Record<string, number>;
    upcomingActions: OffCampusTracker[];
} {
    const applied = entries.filter(e => e.status !== 'saved').length;
    const inProgress = entries.filter(e =>
        ['screening', 'assessment', 'interview'].includes(e.status)
    ).length;
    const offers = entries.filter(e => e.status === 'offer').length;
    const rejected = entries.filter(e => e.status === 'rejected').length;
    const conversionRate = applied > 0 ? Math.round((offers / applied) * 100) : 0;

    const byStatus: Record<string, number> = {};
    for (const e of entries) {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    }

    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingActions = entries.filter(e =>
        e.nextActionDate && new Date(e.nextActionDate) <= threeDays
    ).sort((a, b) =>
        new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime()
    );

    return { total: entries.length, applied, inProgress, offers, rejected, conversionRate, byStatus, upcomingActions };
}
