/**
 * publicProfileService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Manages public-facing profile data:
 *   • username slug (stored in users/{uid} + usernames/{slug} lookup)
 *   • resolves slug → uid for the public route
 *   • computes profile completeness score
 */

import {
    doc, getDoc, setDoc, getDocs, collection, serverTimestamp,
    query, where, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from './profileService';

// ─── Username ─────────────────────────────────────────────────────────────────

/**
 * Check if a username slug is available.
 */
export async function isUsernameAvailable(slug: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'usernames', slug));
    return !snap.exists();
}

/**
 * Claim a username for a user. Stores:
 *   usernames/{slug} → { uid, claimedAt }
 *   users/{uid}.username = slug
 */
export async function claimUsername(uid: string, slug: string): Promise<void> {
    const clean = slug.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 30);
    if (!clean) throw new Error('Invalid username');

    const snap = await getDoc(doc(db, 'usernames', clean));
    if (snap.exists() && snap.data().uid !== uid) {
        throw new Error('Username already taken');
    }

    // Write lookup doc
    await setDoc(doc(db, 'usernames', clean), { uid, claimedAt: serverTimestamp() });

    // Write back to user profile
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', uid), { username: clean });
}

/**
 * Resolve a username slug to a UID.
 * Returns null if not found.
 */
export async function resolveUsername(slug: string): Promise<string | null> {
    const snap = await getDoc(doc(db, 'usernames', slug.toLowerCase()));
    if (!snap.exists()) return null;
    return snap.data().uid as string;
}

/**
 * Get public profile data for a UID (no auth required — reads public Firestore).
 */
export async function getPublicProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { ...snap.data(), uid } as UserProfile;
}

// ─── Profile Completeness ─────────────────────────────────────────────────────

export interface CompletenessScore {
    score: number;        // 0–100
    level: 'Starter' | 'Rising' | 'Strong' | 'Expert';
    missing: string[];
    breakdown: { label: string; done: boolean; points: number }[];
}

export function computeCompleteness(
    profile: Partial<UserProfile> | null,
    capabilityCount: number,
    projectCount: number,
    certCount: number,
): CompletenessScore {
    const checks: { label: string; done: boolean; points: number }[] = [
        { label: 'Name & headline',         done: !!(profile?.name && (profile as any)?.headline),       points: 10 },
        { label: 'Profile photo',           done: !!(profile?.avatar),                                   points: 8  },
        { label: 'Location',                done: !!(profile as any)?.location,                          points: 5  },
        { label: 'About / Bio',             done: !!((profile as any)?.bio?.length > 30),                points: 10 },
        { label: 'GitHub linked',           done: !!(profile?.githubUsername),                           points: 8  },
        { label: 'LeetCode linked',         done: !!(profile?.leetcodeUsername),                         points: 8  },
        { label: 'LinkedIn linked',         done: !!(profile?.linkedinUrl),                              points: 5  },
        { label: '3+ skills assessed',      done: capabilityCount >= 3,                                  points: 15 },
        { label: '1+ project added',        done: projectCount >= 1,                                     points: 12 },
        { label: '1+ certification',        done: certCount >= 1,                                        points: 10 },
        { label: 'Resume uploaded',         done: !!(profile as any)?.resumeUrl,                         points: 9  },
    ];

    const score = checks.reduce((s, c) => s + (c.done ? c.points : 0), 0);
    const missing = checks.filter(c => !c.done).map(c => c.label);

    let level: CompletenessScore['level'] = 'Starter';
    if (score >= 80) level = 'Expert';
    else if (score >= 60) level = 'Strong';
    else if (score >= 35) level = 'Rising';

    return { score, level, missing, breakdown: checks };
}
