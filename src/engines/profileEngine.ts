import {
    candidateRepository,
    projectRepository,
    evidenceRepository,
    activityEventRepository,
    learningRepository,
    trialRepository,
    opportunityRepository,
    capabilityRepository
} from '../repositories';
import type { CandidateProfileState } from '../types/domain';
import { recalculateCapabilities } from './capabilityEngine';
import { calculateActivityStreak } from './streakEngine';
import { calculateSkillGaps } from './skillGapEngine';

/**
 * Builds the pure read-only state for CandidateProfilePage
 * Does not mutate records, acts as a strict getter.
 */
export function buildCandidateProfileState(): CandidateProfileState | null {
    const candidates = candidateRepository.getAll();
    if (candidates.length === 0) return null;

    // For demo architecture, get the first one
    const candidate = candidates[0];

    const projects = projectRepository.getAll();
    const learning = learningRepository.getAll();
    const evidence = evidenceRepository.getAll();
    const activities = activityEventRepository.getAll();
    const opportunities = opportunityRepository.getAll();
    const baseCapabilities = capabilityRepository.getAll();

    // Engine Calculations
    const derivedCapabilities = recalculateCapabilities(baseCapabilities, evidence);
    const growthMetrics = calculateActivityStreak(activities);
    const skillGaps = calculateSkillGaps(candidate, derivedCapabilities);

    // Extra derived UI metrics
    const verifiedEvidenceCount = evidence.filter(e => e.verificationStatus === 'verified').length;
    const avgConfidence = derivedCapabilities.length
        ? Math.round(derivedCapabilities.reduce((s, c) => s + c.confidence, 0) / derivedCapabilities.length)
        : 0;

    // Build the final read-only schema
    return {
        identity: candidate,
        capabilities: derivedCapabilities,
        evidence: evidence,
        projects: projects,
        learning: learning,
        activity: activities,
        growth: {
            ...growthMetrics,
            capabilityHistory: [] // Added for TS capabilityHistory requirement
        },
        achievements: [], // Implement achievements separately if required
        career: {
            currentRole: candidate.experience[0] || 'Unassigned',
            targetRole: candidate.careerGoal,
            transitionProgress: Math.min(Math.round(evidence.length * 10), 100),
            gaps: skillGaps
        },
        opportunities: opportunities,
        metrics: {
            completeness: candidate.avatar ? 90 : 60,
            verifiedEvidenceCount,
            projectCount: projects.length,
            practicalTrialCount: trialRepository.getAll().length,
            overallConfidence: avgConfidence,
            topCapabilities: [...derivedCapabilities].sort((a, b) => b.score - a.score).slice(0, 3)
        }
    };
}
