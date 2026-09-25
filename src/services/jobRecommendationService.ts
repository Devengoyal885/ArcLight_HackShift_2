/**
 * jobRecommendationService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * AI-powered job matching engine — purely client-side, no extra API needed.
 *
 * Algorithm:
 *   1. Skill overlap score  (50 pts)  — candidate skills vs JD keywords
 *   2. Headline match       (20 pts)  — semantic keyword match
 *   3. Experience match     (15 pts)  — years of experience if provided
 *   4. Location preference  (10 pts)  — city/remote match
 *   5. Project keywords     ( 5 pts)  — project tech keywords overlap
 *
 * Returns a sorted list of RoleRecommendation with scores and match reasons.
 */

import type { PostedRole } from './employerService';
import type { UserCapability, UserProject } from './profileService';

export interface RoleRecommendation {
    role: PostedRole;
    score: number;          // 0–100
    matchReasons: string[];
    missingSkills: string[];
    matchTag: 'Best Match' | 'Good Fit' | 'Partial Match' | 'Low Match';
}

// ── Token extraction helpers ──────────────────────────────────────────────────

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9+#./\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function overlap(setA: string[], setB: string[]): string[] {
    const b = new Set(setB);
    return setA.filter(a => b.has(a));
}

const STOP_WORDS = new Set([
    'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'experience', 'good', 'strong', 'years', 'year', 'required',
    'skills', 'skill', 'preferred', 'knowledge', 'ability', 'understanding',
]);

function extractKeywords(text: string): string[] {
    return [...new Set(tokenize(text).filter(t => !STOP_WORDS.has(t)))];
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function scoreRole(
    role: PostedRole,
    candidateSkills: UserCapability[],
    candidateProjects: UserProject[],
    candidateHeadline?: string,
    candidateLocation?: string,
): { score: number; matchReasons: string[]; missingSkills: string[] } {
    const reasons: string[] = [];
    let totalScore = 0;

    // JD text pool
    const jdText = [
        role.title, role.description,
        ...((role as any).skills || role.requiredSkills || []),
        ...((role as any).requirements || role.tags || []),
    ].join(' ');
    const jdKeywords = extractKeywords(jdText);

    // Candidate skill tokens
    const candidateSkillTokens = candidateSkills.map(c => c.skill.toLowerCase());

    // ── 1. Skill overlap (50 pts) ─────────────────────────────────────────────
    const matchedSkills = overlap(candidateSkillTokens, jdKeywords);
    const roleSkillsRaw = (role as any).skills || role.requiredSkills || [];
    const roleSkills = roleSkillsRaw.map((s: string) => s.toLowerCase());
    const matchedRoleSkills = overlap(candidateSkillTokens, roleSkills);
    const missingSkills = roleSkills.filter((s: string) => !candidateSkillTokens.some(c => c.includes(s)));

    const skillPct = roleSkills.length > 0
        ? matchedRoleSkills.length / roleSkills.length
        : matchedSkills.length / Math.max(jdKeywords.length * 0.3, 1);

    const skillScore = Math.round(Math.min(skillPct, 1) * 50);
    totalScore += skillScore;

    if (matchedRoleSkills.length > 0) {
        reasons.push(`Matches ${matchedRoleSkills.length} required skill${matchedRoleSkills.length > 1 ? 's' : ''}: ${matchedRoleSkills.slice(0, 3).join(', ')}`);
    }

    // ── 2. Headline match (20 pts) ────────────────────────────────────────────
    if (candidateHeadline) {
        const headlineTokens = extractKeywords(candidateHeadline);
        const headlineOverlap = overlap(headlineTokens, jdKeywords);
        const headlineScore = Math.round(Math.min(headlineOverlap.length / Math.max(headlineTokens.length, 1), 1) * 20);
        totalScore += headlineScore;
        if (headlineScore >= 10) {
            reasons.push(`Profile headline aligns with role keywords`);
        }
    }

    // ── 3. Experience signal (15 pts) ─────────────────────────────────────────
    const seniorityWords = { junior: ['junior', 'entry', 'fresher', '0-2', '0-1', '1-2'], senior: ['senior', 'lead', 'principal', '5+', '7+', '3+'] };
    const titleLower = (role.title || '').toLowerCase();
    const headlineLower = (candidateHeadline || '').toLowerCase();
    if (seniorityWords.junior.some(w => titleLower.includes(w)) && headlineLower.includes('fresher') || headlineLower.includes('intern')) {
        totalScore += 15;
        reasons.push(`Experience level matches role seniority`);
    } else if (seniorityWords.senior.some(w => titleLower.includes(w)) && !headlineLower.includes('fresher')) {
        totalScore += 10;
    } else {
        totalScore += 8; // neutral
    }

    // ── 4. Location preference (10 pts) ──────────────────────────────────────
    if (candidateLocation && role.location) {
        const candLoc = candidateLocation.toLowerCase();
        const roleLoc = role.location.toLowerCase();
        if (roleLoc.includes('remote') || candLoc.includes('remote')) {
            totalScore += 10;
            reasons.push(`Remote friendly`);
        } else if (roleLoc.includes(candLoc) || candLoc.includes(roleLoc.split(',')[0])) {
            totalScore += 10;
            reasons.push(`Location match: ${role.location}`);
        } else {
            totalScore += 3;
        }
    } else {
        totalScore += 5; // assume ok if no location data
    }

    // ── 5. Project keyword overlap (5 pts) ────────────────────────────────────
    const projectText = candidateProjects.map(p =>
        [p.name, p.description, ...((p as any).techStack || p.technologies || [])].join(' ')
    ).join(' ');
    const projectTokens = extractKeywords(projectText);
    const projOverlap = overlap(projectTokens, jdKeywords);
    if (projOverlap.length > 0) {
        totalScore += Math.min(5, projOverlap.length);
        reasons.push(`Projects use relevant technologies`);
    }

    return {
        score: Math.min(Math.round(totalScore), 100),
        matchReasons: reasons,
        missingSkills: missingSkills.slice(0, 5),
    };
}

function getMatchTag(score: number): RoleRecommendation['matchTag'] {
    if (score >= 75) return 'Best Match';
    if (score >= 55) return 'Good Fit';
    if (score >= 35) return 'Partial Match';
    return 'Low Match';
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getRoleRecommendations(
    roles: PostedRole[],
    candidateSkills: UserCapability[],
    candidateProjects: UserProject[],
    headline?: string,
    location?: string,
    limit = 20,
): RoleRecommendation[] {
    return roles
        .map(role => {
            const { score, matchReasons, missingSkills } = scoreRole(
                role, candidateSkills, candidateProjects, headline, location
            );
            return {
                role,
                score,
                matchReasons,
                missingSkills,
                matchTag: getMatchTag(score),
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
