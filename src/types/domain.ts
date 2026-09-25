/**
 * CapAble Ecosystem Domain Models
 * These types dictate strictly how data is represented across the CapAble ecosystem.
 */

// ─── 0. Assessment System ────────────────────────────────────────────────────

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type AssessmentDomain =
    | 'dsa'
    | 'development'
    | 'aptitude'
    | 'devops'
    | 'computer_networks'
    | 'system_design'
    | 'dbms'
    | 'soft_skills';

export interface AssessmentQuestion {
    id: string;
    domain: AssessmentDomain;
    topic: string;              // sub-topic within the domain
    difficulty: QuestionDifficulty;
    question: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    roles: string[];            // role slugs this question is relevant for
    timeSeconds: number;        // expected time to answer
}

export interface QuestionAnswer {
    questionId: string;
    selectedIndex: number | null; // null = skipped
    timeTakenSeconds: number;
}

export type SupportedLanguage =
    | 'python'
    | 'javascript'
    | 'typescript'
    | 'java'
    | 'cpp'
    | 'c'
    | 'go'
    | 'rust'
    | 'kotlin'
    | 'csharp'
    | 'ruby'
    | 'php';

export interface TestCase {
    id: string;
    description?: string;
    stdin: string;          // raw stdin string fed to the program
    expectedOutput: string; // trimmed stdout the program must produce
    isHidden: boolean;      // hidden test cases not shown to candidate
}

export interface CodingExample {
    input: string;
    output: string;
    explanation?: string;
}

export interface CodingProblem {
    id: string;
    domain: AssessmentDomain;
    topic: string;
    difficulty: QuestionDifficulty;
    title: string;
    description: string;           // markdown-like problem statement
    constraints: string[];
    examples: CodingExample[];
    starterCode: Partial<Record<SupportedLanguage, string>>;
    testCases: TestCase[];
    roles: string[];
    timeSeconds: number;           // recommended solve time
}

export interface TestResult {
    testCaseId: string;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    isHidden: boolean;
    executionTimeMs?: number;
    error?: string;
}

export interface CodeSubmission {
    problemId: string;
    problemTitle?: string;
    domain?: AssessmentDomain;
    topic?: string;
    difficulty?: QuestionDifficulty;
    language: SupportedLanguage;
    code: string;
    testResults: TestResult[];
    passedCount: number;
    totalCount: number;
    score: number;              // 0–100 based on test cases passed
    timeTakenSeconds: number;
    submittedAt?: string;
    memoryUsedKb?: number;
}

// ─── Learning Pattern & Coding Stats ─────────────────────────────────────────

export interface MistakePattern {
    topic: string;
    domain: AssessmentDomain;
    errorType: 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compile_error';
    count: number;
    lastSeen: string;
}

export interface LearningPattern {
    uid: string;
    totalSolved: number;
    totalAttempted: number;
    byDifficulty: { easy: number; medium: number; hard: number };
    byDomain: Partial<Record<AssessmentDomain, number>>;
    byLanguage: Partial<Record<SupportedLanguage, number>>;
    mistakePatterns: MistakePattern[];
    weakTopics: string[];
    strongTopics: string[];
    averageSolveTimeSeconds: number;
    streakDays: number;
    lastActive: string;
    updatedAt: string;
}

export interface CodingStats {
    totalSolved: number;
    totalAttempted: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    byDomain: Partial<Record<AssessmentDomain, number>>;
    acceptanceRate: number;
    favoriteLanguage: SupportedLanguage | null;
    currentStreak: number;
    longestStreak: number;
    lastActive: string | null;
    recentSubmissions: CodeSubmission[];
    activityHeatmap: Record<string, number>; // date → submissions count
}

export interface AssessmentSession {
    id: string;
    uid?: string;               // candidate uid — used for proctoring snapshot paths
    domain: AssessmentDomain;
    role: string;
    questions: AssessmentQuestion[];
    codingProblems: CodingProblem[];    // NEW — coding problems in this session
    answers: QuestionAnswer[];
    codeSubmissions: CodeSubmission[];  // NEW — one per coding problem
    startedAt: string;
    status: 'in_progress' | 'submitted' | 'abandoned';
}

export interface TopicResult {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
}

export interface AssessmentResult {
    sessionId: string;
    domain: AssessmentDomain;
    role: string;
    score: number;              // 0–100
    correctCount: number;
    totalCount: number;
    timeTakenSeconds: number;
    topicBreakdown: TopicResult[];
    percentile: number;         // simulated percentile vs other users
    completedAt: string;        // ISO timestamp
    capabilityDelta: number;    // how much the capability score moved
    practiceRecommendations: PracticeRecommendation[];
}

export interface PracticeRecommendation {
    domain: AssessmentDomain;
    topic: string;
    reason: string;             // e.g. "Only 40% correct in Graph Traversal"
    resourceTitle: string;
    resourceType: 'article' | 'video' | 'practice_set' | 'mini_project';
    estimatedMinutes: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DomainProfile {
    domain: AssessmentDomain;
    label: string;
    description: string;
    icon: string;               // lucide icon name
    color: string;
    topics: string[];
    currentScore: number;       // derived from assessments + capability engine
    lastAssessed: string | null; // ISO timestamp or null
    assessmentCount: number;
    status: 'unassessed' | 'assessed' | 'gap' | 'proficient';
    requiredByRoles: string[];
}

// ─── 1. Identity (User Editable) ──────────────────────────────────────────

export interface Candidate {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    headline: string;
    bio: string;
    location: string;
    education: string[];
    experience: string[];
    careerGoal: string;
    preferredRoles: string[];
    socialLinks: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        portfolio?: string;
    };
    createdAt: string;
}

// ─── 2. Core Ecosystem Entities ───────────────────────────────────────────

export type CapabilityStatus = 'predicted' | 'practised' | 'assessed' | 'verified';

export interface Capability {
    id: string;
    name: string;
    category: string;
    score: number;
    confidence: number;
    targetScore: number;
    status: CapabilityStatus;
    evidenceIds: string[];
    lastUpdated: string;
}

export type EvidenceType =
    | 'project'
    | 'assessment'
    | 'practical_trial'
    | 'learning'
    | 'experience'
    | 'publication'
    | 'certificate'
    | 'achievement';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Evidence {
    id: string;
    title: string;
    type: EvidenceType;
    description: string;
    capabilityIds: string[];
    sourceId: string; // The ID of the Project, Assessment, Trial, etc.
    verificationStatus: VerificationStatus;
    strength: number; // 0 to 100
    createdAt: string;
    updatedAt: string;
}

// ─── 3. Ecosystem Activities ─────────────────────────────────────────────

export interface Project {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    capabilityIds: string[];
    evidenceIds: string[];
    status: 'draft' | 'in_progress' | 'completed';
    demoUrl?: string;
    repositoryUrl?: string;
    image?: string;
    createdAt: string;
}

export interface LearningActivity {
    id: string;
    title: string;
    capabilityId: string;
    progress: number;
    completed: boolean;
    completedAt?: string;
    createdAt: string;
}

export interface Assessment {
    id: string;
    title: string;
    capabilityIds: string[];
    score: number;
    status: 'pending' | 'passed' | 'failed';
    completedAt: string;
}

export interface PracticalTrial {
    id: string;
    title: string;
    capabilityIds: string[];
    status: 'assigned' | 'in_progress' | 'submitted' | 'completed';
    score: number;
    verificationStatus: VerificationStatus;
    completedAt?: string;
}

// ─── 4. Pipeline & Events ────────────────────────────────────────────────

export type EventType =
    | 'learning_started'
    | 'learning_completed'
    | 'project_created'
    | 'project_updated'
    | 'assessment_completed'
    | 'trial_completed'
    | 'evidence_added'
    | 'evidence_verified'
    | 'application_created'
    | 'profile_updated';

export interface ActivityEvent {
    id: string;
    type: EventType;
    timestamp: string;
    entityId: string;
    capabilityIds: string[];
    metadata?: Record<string, any>;
}

// ─── 5. Achievements ─────────────────────────────────────────────────────

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
}

export interface UserAchievement {
    achievementId: string;
    earnedAt: string;
}

// ─── 6. Career & Opportunities ──────────────────────────────────────────

export interface Opportunity {
    id: string;
    title: string;
    company: string;
    requiredCapabilities: Array<{ capabilityId: string; minScore: number }>;
    capabilityMatch: number;
    evidenceMatch: number;
    experienceMatch: number;
    learningAlignment: number;
    status: 'open' | 'closed';
}

export interface Application {
    id: string;
    opportunityId: string;
    candidateId: string;
    status: 'applied' | 'reviewing' | 'interviewing' | 'rejected' | 'accepted';
    appliedAt: string;
    events: ActivityEvent[];
}

// ─── 7. Derived Profile State (The ultimate output of the engine) ────────

export interface SkillGap {
    capabilityName: string;
    currentScore: number;
    targetScore: number;
    gap: number;
}

export interface CareerDirection {
    currentRole: string;
    targetRole: string;
    transitionProgress: number; // 0 to 100
    gaps: SkillGap[];
}

export interface GrowthMetrics {
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    heatmap: Array<{ date: string; active: boolean; intensity: number }>;
    capabilityHistory: Array<{ date: string; capabilities: Record<string, number> }>;
}

export interface CandidateProfileState {
    identity: Candidate;
    capabilities: Capability[];
    evidence: Evidence[];
    projects: Project[];
    learning: LearningActivity[];
    activity: ActivityEvent[];
    growth: GrowthMetrics;
    achievements: UserAchievement[];
    career: CareerDirection;
    opportunities: Opportunity[];
    metrics: {
        completeness: number;
        verifiedEvidenceCount: number;
        projectCount: number;
        practicalTrialCount: number;
        overallConfidence: number;
        topCapabilities: Capability[];
    };
}
