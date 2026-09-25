/**
 * interviewHistoryService.ts
 * ──────────────────────────
 * Persists AI mock interview sessions to Firestore.
 * Enables real stats on the Communication Hub (sessions done, avg fluency, etc.)
 * and performance trending over time.
 */

import {
    collection, addDoc, getDocs, query,
    orderBy, limit, serverTimestamp, doc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface InterviewSession {
    id?: string;
    uid: string;
    role?: string;
    durationSeconds: number;
    wordCount: number;
    fillerWords: number;
    fluencyScore: number;   // 0–100
    wpm: number;            // words per minute
    transcript: { role: 'user' | 'assistant'; text: string }[];
    completedAt?: unknown;
}

export interface InterviewStats {
    totalSessions: number;
    avgFluencyScore: number;
    avgWpm: number;
    totalFillerWords: number;
    lastSessionAt: string | null;
    trend: 'improving' | 'stable' | 'declining' | 'new';
}

// Save a completed session to Firestore
export async function saveInterviewSession(session: Omit<InterviewSession, 'id' | 'completedAt'>): Promise<string> {
    const ref = await addDoc(
        collection(db, 'users', session.uid, 'interviewSessions'),
        { ...session, completedAt: serverTimestamp() }
    );
    return ref.id;
}

// Get the last N sessions for a user
export async function getInterviewSessions(uid: string, maxCount = 20): Promise<InterviewSession[]> {
    const q = query(
        collection(db, 'users', uid, 'interviewSessions'),
        orderBy('completedAt', 'desc'),
        limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewSession));
}

// Compute aggregate stats from session history
export async function getInterviewStats(uid: string): Promise<InterviewStats> {
    const sessions = await getInterviewSessions(uid);

    if (sessions.length === 0) {
        return {
            totalSessions: 0,
            avgFluencyScore: 0,
            avgWpm: 0,
            totalFillerWords: 0,
            lastSessionAt: null,
            trend: 'new',
        };
    }

    const avgFluency = Math.round(sessions.reduce((s, r) => s + r.fluencyScore, 0) / sessions.length);
    const avgWpm = Math.round(sessions.reduce((s, r) => s + r.wpm, 0) / sessions.length);
    const totalFillers = sessions.reduce((s, r) => s + r.fillerWords, 0);

    // Trend: compare last 3 vs first 3 sessions
    let trend: InterviewStats['trend'] = 'stable';
    if (sessions.length >= 4) {
        const recent = sessions.slice(0, 3).reduce((s, r) => s + r.fluencyScore, 0) / 3;
        const older = sessions.slice(-3).reduce((s, r) => s + r.fluencyScore, 0) / 3;
        if (recent > older + 5) trend = 'improving';
        else if (recent < older - 5) trend = 'declining';
    } else {
        trend = 'new';
    }

    const lastSession = sessions[0];
    let lastSessionAt: string | null = null;
    try {
        // Firestore Timestamp or string
        const ts = (lastSession as any).completedAt;
        if (ts?.toDate) lastSessionAt = ts.toDate().toLocaleDateString();
        else if (ts) lastSessionAt = new Date(ts).toLocaleDateString();
    } catch { /* noop */ }

    return {
        totalSessions: sessions.length,
        avgFluencyScore: avgFluency,
        avgWpm,
        totalFillerWords: totalFillers,
        lastSessionAt,
        trend,
    };
}
