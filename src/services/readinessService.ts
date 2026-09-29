/**
 * readinessService.ts
 * ────────────────────
 * Computes a Career Readiness Score (0-100) from:
 *   - Profile completeness (20%)
 *   - Skill/capability strength (25%)
 *   - Assessment scores (20%)
 *   - Applications activity (15%)
 *   - Preparation activity (10%)
 *   - Learning progress (10%)
 */

import { getCapabilities, getAssessmentHistory, getLearningPath } from './profileService';
import type { UserProfile } from './profileService';
import { getCandidateApplications } from './employerService';

export interface ReadinessBreakdown {
    overall: number;          // 0-100
    profileScore: number;     // 0-100
    skillsScore: number;      // 0-100
    assessmentScore: number;  // 0-100
    applicationScore: number; // 0-100
    prepScore: number;        // 0-100
    learningScore: number;    // 0-100
    level: 'Beginner' | 'Developing' | 'Ready' | 'Strong' | 'Expert';
    levelColor: string;
    topGaps: string[];
    strengths: string[];
    nextActions: string[];
}

export async function computeCareerReadiness(
    uid: string,
    profile: UserProfile | null
): Promise<ReadinessBreakdown> {
    // Fetch all required data in parallel
    const [capabilities, assessments, learningPath, applications] = await Promise.all([
        getCapabilities(uid).catch(() => []),
        getAssessmentHistory(uid).catch(() => []),
        getLearningPath(uid).catch(() => []),
        getCandidateApplications(uid).catch(() => []),
    ]);

    // 1. Profile completeness (20%) — inline scoring
    let profileScore = 0;
    if (profile) {
        if (profile.avatar) profileScore += 10;
        if (profile.name?.trim()) profileScore += 5;
        if (profile.headline?.trim()) profileScore += 5;
        if (profile.bio?.trim()) profileScore += 5;
        if (profile.location?.trim()) profileScore += 5;
        if (profile.linkedinUrl?.trim()) profileScore += 5;
        if (profile.githubUsername?.trim()) profileScore += 10;
        if (profile.resumeUrl) profileScore += 10;
        if (capabilities.length >= 3) profileScore += 10;
        if ((profile as any).skills?.length > 0) profileScore += 5;
        profileScore = Math.min(100, profileScore);
    }

    // 2. Skills score (25%) — avg of top-5 skill scores
    const topCaps = [...capabilities].sort((a, b) => b.score - a.score).slice(0, 5);
    const skillsScore = topCaps.length > 0
        ? Math.round(topCaps.reduce((sum, c) => sum + c.score, 0) / topCaps.length)
        : 0;

    // 3. Assessment score (20%) — avg of recent assessment results
    const recentAssessments = assessments.slice(0, 5);
    const assessmentScore = recentAssessments.length > 0
        ? Math.round(recentAssessments.reduce((sum, a) => sum + a.score, 0) / recentAssessments.length)
        : 0;

    // 4. Application activity (15%)
    const totalApps = applications.length;
    const activeApps = applications.filter((a: any) =>
        !['Rejected', 'Placed', 'Withdrawn'].includes(a.status)
    ).length;
    const placedApps = applications.filter((a: any) => a.status === 'Placed').length;
    
    let applicationScore = 0;
    if (placedApps > 0) applicationScore = 100;
    else if (totalApps === 0) applicationScore = 0;
    else if (totalApps >= 10) applicationScore = 70;
    else if (totalApps >= 5) applicationScore = 50;
    else applicationScore = Math.min(totalApps * 15, 45);
    if (activeApps > 0) applicationScore = Math.min(applicationScore + 20, 100);

    // 5. Preparation score (10%) — based on assessment attempts
    const prepScore = Math.min(assessments.length * 5, 100);

    // 6. Learning progress (10%)
    const completedCourses = learningPath.filter(r => r.completed).length;
    const learningScore = learningPath.length > 0
        ? Math.min(Math.round((completedCourses / learningPath.length) * 100), 100)
        : 0;

    // Weighted overall
    const overall = Math.round(
        profileScore * 0.20 +
        skillsScore * 0.25 +
        assessmentScore * 0.20 +
        applicationScore * 0.15 +
        prepScore * 0.10 +
        learningScore * 0.10
    );

    // Determine level
    let level: ReadinessBreakdown['level'];
    let levelColor: string;
    if (overall >= 85) { level = 'Expert'; levelColor = '#7c3aed'; }
    else if (overall >= 70) { level = 'Strong'; levelColor = '#059669'; }
    else if (overall >= 50) { level = 'Ready'; levelColor = '#2563eb'; }
    else if (overall >= 30) { level = 'Developing'; levelColor = '#d97706'; }
    else { level = 'Beginner'; levelColor = '#ef4444'; }

    // Identify gaps and strengths
    const scores = {
        'Profile Completeness': profileScore,
        'Skills Strength': skillsScore,
        'Assessment Performance': assessmentScore,
        'Application Activity': applicationScore,
        'Interview Preparation': prepScore,
        'Learning Progress': learningScore,
    };
    
    const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const topGaps = sorted.filter(([, v]) => v < 50).slice(0, 3).map(([k]) => k);
    const strengths = sorted.filter(([, v]) => v >= 70).reverse().slice(0, 2).map(([k]) => k);

    // Next actions based on gaps
    const nextActions: string[] = [];
    if (profileScore < 70) nextActions.push('Complete your profile to increase visibility');
    if (skillsScore < 60) nextActions.push('Take a Capability Assessment to verify your skills');
    if (assessmentScore < 50) nextActions.push('Practice aptitude tests and coding challenges');
    if (applicationScore < 30) nextActions.push('Apply to at least 5 job opportunities');
    if (learningScore < 40) nextActions.push('Complete courses in your Learning Path');
    if (capabilities.length === 0) nextActions.push('Upload your resume to generate your AI capability profile');

    return {
        overall,
        profileScore,
        skillsScore,
        assessmentScore,
        applicationScore,
        prepScore,
        learningScore,
        level,
        levelColor,
        topGaps,
        strengths,
        nextActions: nextActions.slice(0, 3),
    };
}
