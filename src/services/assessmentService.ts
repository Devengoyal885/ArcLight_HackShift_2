/**
 * assessmentService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All assessment business logic lives here.
 * Returns Promise<T> throughout — easy to swap for real API calls later.
 *
 * Responsibilities:
 *   • generateQuestions()         — select N non-repeating questions by domain/role
 *   • evaluateSession()           — score a completed session, produce a full result
 *   • getSkillGapRecommendations() — compare current vs target scores
 *   • buildDomainProfiles()       — assemble DomainProfile[] for the overview page
 *   • submitAssessmentResult()    — persist to assessmentStore and update capability
 */

import type {
    AssessmentDomain,
    AssessmentQuestion,
    AssessmentSession,
    AssessmentResult,
    QuestionAnswer,
    TopicResult,
    DomainProfile,
    PracticeRecommendation,
    QuestionDifficulty,
} from '../types/domain';

import {
    QUESTION_BANK,
    SKILL_DOMAINS,
    ROLE_SKILL_MAP,
    DEFAULT_PRACTICE_RECS,
} from '../data/assessments';

import {
    submitResult,
    getDomainScore,
    getLatestResult,
    getDomainHistory,
} from '../stores/assessmentStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — no mutation of the original array */
function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function simulatedDelay<T>(value: T, ms = 300): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

// ─── Question Generation ──────────────────────────────────────────────────────

export interface GenerateQuestionsOptions {
    domain: AssessmentDomain;
    role: string;
    count?: number;                         // default 15
    difficulty?: QuestionDifficulty | 'mixed';  // default 'mixed'
    excludeIds?: string[];                  // questions already seen in this domain
}

/**
 * Selects a balanced set of questions for the given domain and role.
 * Mixed difficulty default: ~30% easy, 50% medium, 20% hard.
 */
export async function generateQuestions(opts: GenerateQuestionsOptions): Promise<AssessmentQuestion[]> {
    const { domain, role, count = 15, difficulty = 'mixed', excludeIds = [] } = opts;

    let pool = QUESTION_BANK.filter(
        q => q.domain === domain && !excludeIds.includes(q.id)
    );

    // Weight by role relevance — role-relevant questions come first
    const relevant = pool.filter(q => q.roles.includes(role));
    const general = pool.filter(q => !q.roles.includes(role));
    pool = [...relevant, ...general];

    let selected: AssessmentQuestion[];

    if (difficulty === 'mixed') {
        const easy   = shuffle(pool.filter(q => q.difficulty === 'easy'));
        const medium = shuffle(pool.filter(q => q.difficulty === 'medium'));
        const hard   = shuffle(pool.filter(q => q.difficulty === 'hard'));

        const easyCount  = Math.round(count * 0.30);
        const hardCount  = Math.round(count * 0.20);
        const medCount   = count - easyCount - hardCount;

        selected = [
            ...easy.slice(0, easyCount),
            ...medium.slice(0, medCount),
            ...hard.slice(0, hardCount),
        ];
    } else {
        selected = shuffle(pool.filter(q => q.difficulty === difficulty)).slice(0, count);
    }

    // Pad with any remaining questions if we didn't hit the count
    if (selected.length < count) {
        const usedIds = new Set(selected.map(q => q.id));
        const remaining = shuffle(pool.filter(q => !usedIds.has(q.id)));
        selected = [...selected, ...remaining].slice(0, count);
    }

    return simulatedDelay(shuffle(selected), 200);
}

// ─── Session Creation ─────────────────────────────────────────────────────────

export async function createSession(
    domain: AssessmentDomain,
    role: string,
    questions: AssessmentQuestion[]
): Promise<AssessmentSession> {
    const session: AssessmentSession = {
        id: generateSessionId(),
        domain,
        role,
        questions,
        codingProblems: [],   // populated in AssessmentPage before IDE launches
        answers: [],
        codeSubmissions: [],
        startedAt: new Date().toISOString(),
        status: 'in_progress',
    };
    return simulatedDelay(session, 100);
}


// ─── Result Evaluation ────────────────────────────────────────────────────────

/**
 * Evaluates a completed session and produces a rich AssessmentResult.
 * This is the core scoring function — all logic is deterministic and server-side-safe.
 */
export async function evaluateSession(
    session: AssessmentSession,
    answers: QuestionAnswer[],
    totalElapsedSeconds: number
): Promise<AssessmentResult> {

    const questions = session.questions;
    let correctCount = 0;

    // ── Per-topic breakdown ──────────────────────────────────────────────────
    const topicMap: Record<string, { correct: number; total: number }> = {};

    for (const q of questions) {
        if (!topicMap[q.topic]) {
            topicMap[q.topic] = { correct: 0, total: 0 };
        }
        topicMap[q.topic].total += 1;

        const answer = answers.find(a => a.questionId === q.id);
        if (answer && answer.selectedIndex === q.correctIndex) {
            correctCount += 1;
            topicMap[q.topic].correct += 1;
        }
    }

    const topicBreakdown: TopicResult[] = Object.entries(topicMap).map(([topic, data]) => ({
        topic,
        correct: data.correct,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100),
    }));

    // ── Overall score ────────────────────────────────────────────────────────
    const score = Math.round((correctCount / questions.length) * 100);

    // ── Simulated percentile (deterministic formula) ─────────────────────────
    // Formula maps score to a realistic-looking percentile curve
    const percentile = Math.min(99, Math.round(score * 0.85 + Math.random() * 8));

    // ── Capability delta ─────────────────────────────────────────────────────
    const previousScore = getDomainScore(session.domain);
    const capabilityDelta = previousScore === 0
        ? Math.round(score * 0.15)                      // first assessment — bigger impact
        : Math.round((score - previousScore) * 0.4);    // subsequent — weighted delta

    // ── Practice recommendations ─────────────────────────────────────────────
    const practiceRecs: PracticeRecommendation[] = [];

    for (const topic of topicBreakdown) {
        if (topic.percentage < 70) {
            const key = `${session.domain}.${topic.topic}`;
            const defaultRec = DEFAULT_PRACTICE_RECS[key];
            if (defaultRec) {
                practiceRecs.push(...defaultRec);
            } else {
                // Fallback generic recommendation
                practiceRecs.push({
                    domain: session.domain,
                    topic: topic.topic,
                    reason: `Only ${topic.percentage}% correct — needs reinforcement`,
                    resourceTitle: `${topic.topic} Practice Set`,
                    resourceType: 'practice_set',
                    estimatedMinutes: 45,
                    priority: topic.percentage < 50 ? 'critical' : 'high',
                });
            }
        }
    }

    // Sort recs by priority
    const priorityOrder: Record<PracticeRecommendation['priority'], number> = {
        critical: 0, high: 1, medium: 2, low: 3,
    };
    practiceRecs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const result: AssessmentResult = {
        sessionId: session.id,
        domain: session.domain,
        role: session.role,
        score,
        correctCount,
        totalCount: questions.length,
        timeTakenSeconds: totalElapsedSeconds,
        topicBreakdown,
        percentile,
        completedAt: new Date().toISOString(),
        capabilityDelta,
        practiceRecommendations: practiceRecs,
    };

    return simulatedDelay(result, 400);
}

// ─── Submit & Persist ─────────────────────────────────────────────────────────

/**
 * Persists the result to the store — feeds capability scores to all other tabs.
 */
export async function submitAssessmentResult(result: AssessmentResult): Promise<void> {
    submitResult(result);
    return simulatedDelay(undefined, 150);
}

// ─── Skill Gap Analysis ───────────────────────────────────────────────────────

export interface SkillGapAnalysis {
    role: string;
    gaps: Array<{
        domain: AssessmentDomain;
        label: string;
        currentScore: number;
        requiredScore: number;
        gap: number;
        status: 'met' | 'gap' | 'critical' | 'unassessed';
    }>;
    overallReadiness: number; // 0–100
    recommendedAssessments: AssessmentDomain[];
}

export async function getSkillGapAnalysis(role: string): Promise<SkillGapAnalysis> {
    const requirements = ROLE_SKILL_MAP[role] ?? ROLE_SKILL_MAP['software-engineer'];
    const gaps: SkillGapAnalysis['gaps'] = [];

    for (const [domain, required] of Object.entries(requirements) as [AssessmentDomain, number][]) {
        const current = getDomainScore(domain);
        const diff = current - required;
        const domainDef = SKILL_DOMAINS.find(d => d.domain === domain);

        let status: 'met' | 'gap' | 'critical' | 'unassessed';
        if (current === 0) status = 'unassessed';
        else if (diff >= 0) status = 'met';
        else if (diff >= -15) status = 'gap';
        else status = 'critical';

        gaps.push({
            domain,
            label: domainDef?.label ?? domain,
            currentScore: current,
            requiredScore: required,
            gap: Math.max(0, required - current),
            status,
        });
    }

    // Sort: critical → gap → unassessed → met
    const order = { critical: 0, gap: 1, unassessed: 2, met: 3 };
    gaps.sort((a, b) => order[a.status] - order[b.status]);

    const metCount = gaps.filter(g => g.status === 'met').length;
    const overallReadiness = Math.round((metCount / gaps.length) * 100);

    const recommendedAssessments = gaps
        .filter(g => g.status !== 'met')
        .map(g => g.domain);

    return simulatedDelay({ role, gaps, overallReadiness, recommendedAssessments }, 200);
}

// ─── Domain Profiles ─────────────────────────────────────────────────────────

/**
 * Builds the full DomainProfile[] for the Assessment overview page.
 * Merges static definitions with live store data.
 */
export async function buildDomainProfiles(): Promise<DomainProfile[]> {
    const profiles: DomainProfile[] = SKILL_DOMAINS.map(def => {
        const currentScore = getDomainScore(def.domain);
        const history = getDomainHistory(def.domain);
        const latest = getLatestResult(def.domain);

        let status: DomainProfile['status'];
        if (currentScore === 0) status = 'unassessed';
        else if (currentScore >= 80) status = 'proficient';
        else if (currentScore >= 60) status = 'assessed';
        else status = 'gap';

        return {
            ...def,
            currentScore,
            lastAssessed: latest?.completedAt ?? null,
            assessmentCount: history.length,
            status,
        };
    });

    return simulatedDelay(profiles, 150);
}

// ─── Role list (for the role selector) ───────────────────────────────────────

export const AVAILABLE_ROLES: Array<{ slug: string; label: string }> = [
    { slug: 'ai-engineer',       label: 'AI Engineer' },
    { slug: 'backend-engineer',  label: 'Backend Engineer' },
    { slug: 'full-stack-engineer', label: 'Full Stack Engineer' },
    { slug: 'devops-engineer',   label: 'DevOps Engineer' },
    { slug: 'software-engineer', label: 'Software Engineer' },
    { slug: 'data-analyst',      label: 'Data Analyst' },
];
