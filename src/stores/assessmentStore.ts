/**
 * assessmentStore.ts
 * ──────────────────
 * Lightweight in-memory reactive store for assessment results.
 * All dashboard tabs (Capability, Career, Learning, DigitalProfile, Dashboard)
 * subscribe here so a completed assessment propagates immediately across the app.
 *
 * Architecture note: Promise-based API mirrors what a real REST/WebSocket backend
 * would expose. Replace the module-level arrays with API calls to swap to a real backend.
 */

import type {
    AssessmentResult,
    AssessmentDomain,
} from '../types/domain';

import { auth } from '../lib/firebase';
import { saveAssessmentResult } from '../services/profileService';

// ─── Module-level state (single source of truth) ──────────────────────────────

/** Starts empty — real results come from Firestore on page load */
const _results: AssessmentResult[] = [];

// ─── Stub: placeholder so code below compiles — will be removed ───
const _STUB_REMOVED = {
        sessionId: 'seed-dev-01',
        domain: 'development',
        role: 'ai-engineer',
        score: 74,
        correctCount: 11,
        totalCount: 15,
        timeTakenSeconds: 920,
        topicBreakdown: [
            { topic: 'React & Frontend', correct: 4, total: 5, percentage: 80 },
            { topic: 'REST APIs', correct: 3, total: 4, percentage: 75 },
            { topic: 'Design Patterns', correct: 2, total: 3, percentage: 67 },
            { topic: 'Testing', correct: 2, total: 3, percentage: 67 },
        ],
        percentile: 72,
        completedAt: '2026-02-08T10:05:00.000Z',
        capabilityDelta: 2,
        practiceRecommendations: [
            {
                domain: 'development',
                topic: 'Design Patterns',
                reason: 'Only 67% on structural patterns',
                resourceTitle: 'Design Patterns in TypeScript',
                resourceType: 'article',
            },
        ],
}; // end stub
void _STUB_REMOVED;

/** Domain → current score map (starts at 0 — populated from real assessments) */
const _domainScores: Record<AssessmentDomain, number> = {
    dsa: 0,
    development: 0,
    aptitude: 0,
    devops: 0,
    computer_networks: 0,
    system_design: 0,
    dbms: 0,
    soft_skills: 0,
};

// ─── Listeners ────────────────────────────────────────────────────────────────

type Listener = (results: AssessmentResult[]) => void;
const _listeners: Set<Listener> = new Set();

function _notify() {
    const snapshot = [..._results];
    _listeners.forEach(fn => fn(snapshot));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribeToAssessments(listener: Listener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
}

/** Get a snapshot of all completed results (most recent first) */
export function getResults(): AssessmentResult[] {
    return [..._results].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
}

/** Get the most recent result for a specific domain */
export function getLatestResult(domain: AssessmentDomain): AssessmentResult | null {
    return (
        [..._results]
            .filter(r => r.domain === domain)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null
    );
}

/** Get current score for a domain (0 if never assessed) */
export function getDomainScore(domain: AssessmentDomain): number {
    return _domainScores[domain];
}

/** Get all domain scores */
export function getAllDomainScores(): Record<AssessmentDomain, number> {
    return { ..._domainScores };
}

/** Get count of completed assessments */
export function getAssessmentCount(): number {
    return _results.length;
}

/** Get history for a specific domain */
export function getDomainHistory(domain: AssessmentDomain): AssessmentResult[] {
    return _results
        .filter(r => r.domain === domain)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

/**
 * Submit a completed assessment result.
 * Updates the domain score, appends to history, and notifies all subscribers.
 */
export function submitResult(result: AssessmentResult): void {
    _results.push(result);

    // Update the domain score — weighted blend: 70% new result, 30% historical
    const prevScore = _domainScores[result.domain];
    if (prevScore === 0) {
        _domainScores[result.domain] = result.score;
    } else {
        _domainScores[result.domain] = Math.round(result.score * 0.7 + prevScore * 0.3);
    }

    // Also persist to Firestore if user is signed in
    const uid = auth.currentUser?.uid;
    if (uid) {
        saveAssessmentResult(uid, {
            domain: result.domain,
            score: result.score,
            correctCount: result.correctCount,
            totalCount: result.totalCount,
            timeTakenSeconds: result.timeTakenSeconds,
            topicBreakdown: result.topicBreakdown,
        }).catch(err => console.error('Firestore assessment write failed:', err));
    }

    _notify();
}

/**
 * Derive a capability score delta suitable for feeding candidateCapabilities[].
 * Maps each assessment domain to the closest capability label.
 */
export const DOMAIN_TO_CAPABILITY_ID: Record<AssessmentDomain, string> = {
    dsa: 'dsa',
    development: 'react',
    aptitude: 'research',
    devops: 'cloud',
    computer_networks: 'cloud',
    system_design: 'react',
    dbms: 'python',
    soft_skills: 'communication',
};
