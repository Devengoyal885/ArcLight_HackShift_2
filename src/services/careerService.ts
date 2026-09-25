/**
 * careerService.ts
 * ────────────────
 * Generates personalized target career roles based on a user's verified capabilities.
 * Replaces hardcoded default roles with dynamic AI-generated career paths.
 */

import { callGeminiJSON } from '../lib/gemini';
import type { UserCapability } from './profileService';

export interface TargetRoleRequirement {
    skill: string;
    required: number;
}

export interface TargetRole {
    id: string;
    role: string;
    tags: string[];
    requirements: TargetRoleRequirement[];
}

const CAREER_SYSTEM = `You are an expert career counselor AI for CapAble.
Your job is to recommend 4 realistic career target roles for a candidate based on their current headline and verified capabilities.

Rules:
1. Provide a mix of roles: one similar to their current role, two step-up roles, and one ambitious/pivot role.
2. For each role, provide 3 to 4 required skills and the minimum score (0-100) needed for that skill to be competitive.
3. Provide 3 short tags for each role (e.g., ["React", "Architecture", "Mentorship"]).
4. Be realistic. If the user only knows Python, don't recommend a pure React role without acknowledging Python in some way, or make it a clear pivot.

Return a JSON array of exactly 4 objects matching this schema:
[
  {
    "id": "role_1",
    "role": "Frontend Lead",
    "tags": ["Architecture", "React", "Mentorship"],
    "requirements": [
      { "skill": "React", "required": 90 },
      { "skill": "System Design", "required": 85 },
      { "skill": "TypeScript", "required": 80 }
    ]
  }
]`;

export async function generateTargetRoles(
    headline: string,
    capabilities: UserCapability[]
): Promise<TargetRole[]> {
    const capsStr = capabilities.map(c => `${c.skill}: ${c.score}%`).join(', ');
    
    const prompt = `Candidate Headline: ${headline || 'Software Engineer'}
Current Verified Capabilities: ${capsStr || 'None provided'}

Generate 4 realistic target roles and their requirements based on this profile.`;

    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    };

    const cacheKey = `career_target_roles_cache_${getHash(prompt)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log('[Cache Hit] Returning instantaneous career target roles.');
        return JSON.parse(cachedData).result;
    }

    const result = await callGeminiJSON<TargetRole[]>(prompt, CAREER_SYSTEM);
    
    if (result) {
        localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
    }

    return result || [];
}
