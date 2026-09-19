/**
 * CapAble Ecosystem Domain Models
 * These types dictate strictly how data is represented across the CapAble ecosystem.
 */

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
