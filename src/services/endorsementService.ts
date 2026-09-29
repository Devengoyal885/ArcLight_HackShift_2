/**
 * endorsementService.ts
 * ─────────────────────
 * Skill endorsement system — peers/faculty can endorse specific skills
 * on a candidate's profile.
 *
 * Firestore:
 *   endorsements/{candidateUid}/received/{endorsementId}
 */

import {
    collection, addDoc, getDocs, deleteDoc, doc,
    serverTimestamp, query, orderBy, where, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SkillEndorsement {
    id?: string;
    candidateUid: string;
    endorserUid: string;
    endorserName: string;
    endorserAvatar?: string;
    endorserRole?: string;   // 'academician' | 'employer' | 'candidate'
    skill: string;
    message?: string;        // Optional endorsement message
    endorsedAt?: unknown;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function endorseSkill(
    candidateUid: string,
    endorserUid: string,
    endorserName: string,
    skill: string,
    opts?: { endorserAvatar?: string; endorserRole?: string; message?: string }
): Promise<string> {
    // Prevent self-endorsement
    if (candidateUid === endorserUid) throw new Error('Cannot endorse yourself');

    // Check if already endorsed this skill
    const existing = await getEndorsementsForSkill(candidateUid, skill);
    if (existing.some(e => e.endorserUid === endorserUid)) {
        throw new Error('Already endorsed this skill');
    }

    const col = collection(db, 'endorsements', candidateUid, 'received');
    const ref = await addDoc(col, {
        candidateUid,
        endorserUid,
        endorserName,
        endorserAvatar: opts?.endorserAvatar || null,
        endorserRole: opts?.endorserRole || 'candidate',
        skill,
        message: opts?.message || null,
        endorsedAt: serverTimestamp(),
    });
    return ref.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getEndorsements(candidateUid: string): Promise<SkillEndorsement[]> {
    try {
        const col = collection(db, 'endorsements', candidateUid, 'received');
        const snap = await getDocs(query(col, orderBy('endorsedAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SkillEndorsement));
    } catch {
        return [];
    }
}

export async function getEndorsementsForSkill(
    candidateUid: string,
    skill: string
): Promise<SkillEndorsement[]> {
    try {
        const col = collection(db, 'endorsements', candidateUid, 'received');
        const snap = await getDocs(query(col, where('skill', '==', skill)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SkillEndorsement));
    } catch {
        return [];
    }
}

export async function hasEndorsed(
    candidateUid: string,
    endorserUid: string,
    skill: string
): Promise<boolean> {
    const endorsements = await getEndorsementsForSkill(candidateUid, skill);
    return endorsements.some(e => e.endorserUid === endorserUid);
}

/** Group endorsements by skill with count */
export function groupEndorsementsBySkill(
    endorsements: SkillEndorsement[]
): Record<string, { count: number; endorsers: SkillEndorsement[] }> {
    const grouped: Record<string, { count: number; endorsers: SkillEndorsement[] }> = {};
    for (const e of endorsements) {
        if (!grouped[e.skill]) grouped[e.skill] = { count: 0, endorsers: [] };
        grouped[e.skill].count++;
        grouped[e.skill].endorsers.push(e);
    }
    return grouped;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function removeEndorsement(candidateUid: string, endorsementId: string): Promise<void> {
    await deleteDoc(doc(db, 'endorsements', candidateUid, 'received', endorsementId));
}
