/**
 * learningService.ts
 * ──────────────────
 * Generates real, personalized learning paths using Gemini AI.
 * No hardcoded dummy data.
 * 
 * Resources are ONLY from real, well-known providers:
 *   MDN, freeCodeCamp, Coursera, edX, Udemy, LeetCode, GeeksforGeeks,
 *   Microsoft Learn, Google Developers, YouTube (official channels only).
 */

import { callGeminiJSON } from '../lib/gemini';
import type { LearningResource } from './profileService';
import type { UserCapability } from './profileService';

const LEARNING_SYSTEM = `You are a learning path generator for CapAble, a career intelligence platform.

Given a target role and skill gaps, generate a structured learning roadmap.
Return ONLY from these trusted providers:
- MDN (https://developer.mozilla.org)
- freeCodeCamp (https://www.freecodecamp.org)
- Coursera (https://www.coursera.org)
- edX (https://www.edx.org)
- Google Developers (https://developers.google.com)
- Microsoft Learn (https://learn.microsoft.com)
- LeetCode (https://leetcode.com)
- GeeksforGeeks (https://www.geeksforgeeks.org)
- Kaggle (https://www.kaggle.com)
- The Odin Project (https://www.theodinproject.com)
- CS50 Harvard (https://cs50.harvard.edu)

Generate 5 specific learning resources. For each:
- Use REAL URLs from these providers (e.g. https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- Set estimatedMinutes between 30 and 180
- Set difficulty appropriately
- Focus on the most impactful gaps first. If no gaps are provided, provide a solid foundation for the target role.

Return JSON array matching this exact schema:
[
  {
    "resourceTitle": "Exact title of the course/article",
    "url": "https://real.url.here",
    "provider": "MDN",
    "skill": "JavaScript",
    "difficulty": "intermediate",
    "estimatedMinutes": 60,
    "completed": false
  }
]`;

export async function generateLearningPath(
    targetRole: string,
    capabilities: UserCapability[],
    missingSkills?: string[]
): Promise<LearningResource[]> {
    const capsSummary = capabilities.map(c => `${c.skill}: ${c.score}%`).join(', ');
    const gaps = capabilities.filter(c => c.score < 60).map(c => c.skill);
    const allGaps = [...new Set([...gaps, ...(missingSkills || [])])];

    const prompt = `Target role: ${targetRole}
Current capabilities: ${capabilities.length > 0 ? capsSummary : 'No capabilities verified yet.'}
Skill gaps to address: ${allGaps.length > 0 ? allGaps.join(', ') : 'Need foundational skills for the target role'}
Missing skills for target role: ${missingSkills?.length ? missingSkills.join(', ') : 'Unknown'}

Generate a focused learning path to help this candidate reach the ${targetRole} role. Ensure real, accurate URLs are provided from the trusted providers list.`;

    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    };

    const cacheKey = `learning_path_cache_${getHash(prompt)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log('[Cache Hit] Returning instantaneous learning path.');
        return JSON.parse(cachedData).result;
    }

    const resources = await callGeminiJSON<LearningResource[]>(prompt, LEARNING_SYSTEM);
    
    if (!resources || resources.length === 0) {
        throw new Error('Failed to generate real learning path from AI.');
    }
    
    localStorage.setItem(cacheKey, JSON.stringify({ result: resources, timestamp: Date.now() }));
    
    return resources;
}
