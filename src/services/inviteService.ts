/**
 * inviteService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Handles bulk student invites for institutions.
 * Parses a CSV, creates pending invite records in Firestore.
 * Students who sign up with their email get auto-linked to the institution.
 */

import {
    collection, addDoc, getDocs, query, where, serverTimestamp,
    writeBatch, doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PendingInvite {
    id?: string;
    institutionCode: string;
    institutionName: string;
    email: string;
    name?: string;
    department?: string;
    batch?: string;        // e.g. "2025"
    rollNo?: string;
    status: 'pending' | 'accepted';
    invitedAt?: unknown;
}

/**
 * Parse CSV text into invite rows.
 * Expected columns (any order, case-insensitive):
 * email, name, department, batch, rollno
 */
export function parseInviteCSV(csvText: string): Omit<PendingInvite, 'institutionCode' | 'institutionName' | 'status' | 'invitedAt'>[] {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));

    const emailIdx = headers.findIndex(h => h.includes('email'));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department') || h.includes('branch'));
    const batchIdx = headers.findIndex(h => h.includes('batch') || h.includes('year'));
    const rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('usn') || h.includes('prn'));

    const results: Omit<PendingInvite, 'institutionCode' | 'institutionName' | 'status' | 'invitedAt'>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const email = emailIdx >= 0 ? cols[emailIdx] : '';
        if (!email || !email.includes('@')) continue;

        results.push({
            email: email.toLowerCase(),
            name: nameIdx >= 0 ? cols[nameIdx] : undefined,
            department: deptIdx >= 0 ? cols[deptIdx] : undefined,
            batch: batchIdx >= 0 ? cols[batchIdx] : undefined,
            rollNo: rollIdx >= 0 ? cols[rollIdx] : undefined,
        });
    }

    return results;
}

/**
 * Bulk-write invite records to Firestore (max 500/batch).
 */
export async function bulkCreateInvites(
    institutionCode: string,
    institutionName: string,
    invites: Omit<PendingInvite, 'institutionCode' | 'institutionName' | 'status' | 'invitedAt'>[]
): Promise<{ success: number; skipped: number }> {
    // Check for existing invites to avoid duplicates
    const existingSnap = await getDocs(
        query(collection(db, 'invites'), where('institutionCode', '==', institutionCode))
    );
    const existingEmails = new Set(existingSnap.docs.map(d => d.data().email));

    const newInvites = invites.filter(inv => !existingEmails.has(inv.email));
    let success = 0;

    // Firestore batch limit is 500
    for (let i = 0; i < newInvites.length; i += 499) {
        const batch = writeBatch(db);
        const slice = newInvites.slice(i, i + 499);
        for (const inv of slice) {
            const ref = doc(collection(db, 'invites'));
            batch.set(ref, {
                ...inv,
                institutionCode,
                institutionName,
                status: 'pending',
                invitedAt: serverTimestamp(),
            });
        }
        await batch.commit();
        success += slice.length;
    }

    return { success, skipped: invites.length - newInvites.length };
}

export async function getInvitesByInstitution(institutionCode: string): Promise<PendingInvite[]> {
    const q = query(collection(db, 'invites'), where('institutionCode', '==', institutionCode));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingInvite));
}

/**
 * Called during sign-up: checks if this email has a pending invite,
 * returns the invite data so the new user can be auto-linked to institution.
 */
export async function checkPendingInvite(email: string): Promise<PendingInvite | null> {
    const q = query(
        collection(db, 'invites'),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as PendingInvite;
}
