/**
 * resumeParserService.ts
 * ──────────────────────
 * Uses Gemini to extract structured profile data from raw resume text.
 * Called when a new user uploads/pastes their resume during onboarding.
 */

import { callGeminiJSON } from '../lib/gemini';
import type { UserProfile, UserProject, UserCapability } from './profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedResume {
    profile: {
        name: string;
        headline?: string;
        bio?: string;
        location?: string;
        email?: string;
        githubUsername?: string;
        linkedinUrl?: string;
        portfolioUrl?: string;
    };
    skills: string[];           // detected technology names
    projects: {
        name: string;
        description: string;
        technologies: string[];
        url?: string;
    }[];
    education: {
        institution: string;
        degree: string;
        field?: string;
        year?: string;
    }[];
    experience: {
        company: string;
        role: string;
        duration?: string;
        description?: string;
    }[];
    certifications: string[];
}

export interface InferredCapability {
    skill: string;
    score: number;
    confidence: 'low' | 'medium' | 'high';
    evidenceSources: string[];
}

// ─── Resume Parser ────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a resume parser for CapAble, a career intelligence platform.
Extract structured information from the resume text provided.

Return a JSON object matching exactly this schema:
{
  "profile": {
    "name": "string",
    "headline": "string or null",
    "bio": "1-2 sentence professional summary or null",
    "location": "City, Country or null",
    "email": "string or null",
    "githubUsername": "just the username without URL, or null",
    "linkedinUrl": "full URL or null",
    "portfolioUrl": "full URL or null"
  },
  "skills": ["array of technology/skill names, max 20"],
  "projects": [
    {
      "name": "string",
      "description": "1-2 sentences",
      "technologies": ["array of tech used"],
      "url": "url or null"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "year": "graduation year or null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string or null",
      "description": "1-2 sentences or null"
    }
  ],
  "certifications": ["array of certification names"]
}

Extract only information that is explicitly stated in the resume. Do NOT invent or fabricate any data.`;

export async function parseResume(resumeText: string): Promise<ParsedResume | null> {
    if (!resumeText || resumeText.trim().length < 50) return null;

    // Simple hashing function for cache key
    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    };

    const cacheKey = `resume_parse_cache_${getHash(resumeText)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log('[Cache Hit] Returning instantaneous parsed resume.');
        return JSON.parse(cachedData).result;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/parse-resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: resumeText })
        });
        
        if (!response.ok) {
            throw new Error('Local Python parser failed');
        }

        const result = await response.json();
        
        if (!result || result.error) {
            throw new Error('AI could not parse the resume.');
        }

        localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
        return result;
    } catch (err) {
        console.error('Fast API failed, falling back to Gemini...', err);
        
        // Fallback to Gemini if the local python server is down
        const result = await callGeminiJSON<ParsedResume>(
            `Parse this resume:\n\n${resumeText}`,
            SYSTEM_INSTRUCTION
        );

        if (!result) {
            throw new Error('AI could not parse the resume. Please check the console for details or try again.');
        }

        localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
        return result;
    }
}

// ─── Capability Inference from Resume ─────────────────────────────────────────

const CAP_SYSTEM = `You are a capability estimation engine for CapAble.
Given a list of skills and projects from a resume, estimate capability scores.
Be conservative — do not inflate scores. A resume mention alone is worth 30-50%.
Evidence from projects raises the score. Multiple projects raise it more.

Return JSON array:
[
  {
    "skill": "Python",
    "score": 72,
    "confidence": "medium",
    "evidenceSources": ["Resume mention", "2 projects"]
  }
]

Score guidelines:
- Mentioned once with no evidence: 25-40
- Has at least 1 project using it: 45-60
- Multiple projects + described well: 60-75
- Strong descriptions, multiple evidence: 75-85
- Exceptional evidence (publications, contributions): 85-95

Return max 10 capabilities. Only include skills with actual evidence.`;

export async function inferCapabilitiesFromResume(parsed: ParsedResume): Promise<InferredCapability[]> {
    const prompt = `Skills found: ${parsed.skills.join(', ')}
Projects: ${parsed.projects.map(p => `${p.name} (${p.technologies.join(', ')})`).join('\n')}
Experience: ${parsed.experience.map(e => `${e.role} at ${e.company}`).join('\n')}

Estimate capability scores for the most important skills found.`;

    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    };

    const cacheKey = `capability_inference_cache_${getHash(prompt)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log('[Cache Hit] Returning instantaneous capability inference.');
        return JSON.parse(cachedData).result;
    }

    const result = await callGeminiJSON<InferredCapability[]>(prompt, CAP_SYSTEM);
    
    if (result) {
        localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
    }
    
    return result ?? [];
}

// ─── Convert parsed data to Firestore-ready formats ───────────────────────────

export function parsedToProjects(parsed: ParsedResume): Omit<UserProject, 'id'>[] {
    return parsed.projects.map(p => ({
        name: p.name,
        description: p.description,
        url: p.url,
        technologies: p.technologies,
        source: 'manual' as const,
    }));
}

export function inferencedToCapabilities(inferred: InferredCapability[]): Omit<UserCapability, 'id'>[] {
    return inferred.map(i => ({
        skill: i.skill,
        score: i.score,
        confidence: i.confidence,
        evidenceSources: i.evidenceSources,
    }));
}

// ─── Tailored Resume Generator ────────────────────────────────────────────────


export interface TailoredResumeResult {
    htmlResume: string;
    atsScore: number;
    keywordsMatched: string[];
    keywordsMissing: string[];
}

export async function* generateTailoredResumeHTMLStream(
    profileDetails: { name: string; headline?: string; email?: string; location?: string; resumeText?: string },
    capabilities: UserCapability[],
    projects: UserProject[],
    jobDescription?: string,
    options?: { template?: string; pages?: string }
): AsyncGenerator<string, void, unknown> {
    const template = options?.template || 'latex';
    const pages = options?.pages || '1';
    
    let styleRule = 'DO NOT USE INLINE CSS. The web application has a highly polished, pure black-and-white LaTeX Overleaf CSS theme that will automatically style your HTML.';
    if (template === 'modern') styleRule = 'DO NOT USE INLINE CSS. The web application uses a Modern CSS theme. Use semantic HTML (h1, h2, h3).';
    if (template === 'creative') styleRule = 'DO NOT USE INLINE CSS. The web application uses a Creative Bold CSS theme. Use semantic HTML (h1, h2, h3).';

    let lengthRule = 'LENGTH REQUIREMENT: The resume MUST strictly fit on exactly ONE 8.5x11 page. Be extremely concise. Use ONLY 2 short bullet points per project/experience. Do NOT write long paragraphs. Keep the entire output under 400 words total.';
    if (pages === '2') lengthRule = 'LENGTH REQUIREMENT: The resume MUST fill exactly TWO 8.5x11 pages. Expand on the projects heavily. Create 5-6 highly detailed, multi-sentence bullet points for EVERY project/experience. Include every minor detail to ensure the resume is deeply comprehensive.';

    const RESUME_HTML_SYSTEM = `You are an expert ATS-friendly resume writer for CapAble.
Your task is to take a candidate's real capabilities and project data, and write a highly detailed, professional HTML resume optimized for a specific Job Description (JD).

RULES:
1. ONLY use the skills and capabilities provided. Do NOT fabricate experience, degrees, or skills.
2. Return ONLY the raw HTML. Do not wrap it in markdown blockquotes like \`\`\`html.
3. ${styleRule}
4. ONLY use semantic HTML tags: <h1> for name, <h2> for contact info, <h3> for sections (SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION), <h4> for roles/projects, <p>, <ul>, <li>, and <strong>.
5. WEAVE in the JD keywords elegantly into the summary and project descriptions. Ensure every bullet point uses strong action verbs.
6. ${lengthRule}`;

    const profileStr = JSON.stringify(profileDetails, null, 2);
    const capsStr = capabilities.map(c => `${c.skill} (Score: ${c.score}%)`).join('\n');
    const projsStr = projects.map(p => `${p.name} - ${p.description}`).join('\n');

    const prompt = `CANDIDATE PROFILE:
${profileStr}

VERIFIED CAPABILITIES:
${capsStr || 'None provided'}

PROJECTS:
${projsStr || 'None provided'}

ORIGINAL RESUME TEXT (Use this for Education, Internships, Hackathons, Experience, etc):
${profileDetails.resumeText || 'None provided'}

TARGET JOB DESCRIPTION:
${jobDescription || 'Make it a strong general resume.'}

Generate ONLY the tailored HTML resume now.`;

    // Note: Local caching is removed for the streaming version because caching a stream requires custom logic
    // and the user specifically wants the "typing out" real-time effect for the web app to feel super fast.
    
    // We import callGeminiStream here dynamically or ensure it is exported in lib/gemini
    const { callGeminiStream } = await import('../lib/gemini');
    
    const stream = callGeminiStream(prompt, RESUME_HTML_SYSTEM);
    for await (const chunk of stream) {
        yield chunk;
    }
}

export function calculateATSMetricsFast(capabilities: UserCapability[], jdText: string) {
    if (!jdText.trim()) return { atsScore: 75, keywordsMatched: [], keywordsMissing: [] };
    
    const jdLower = jdText.toLowerCase();
    const allSkills = capabilities.map(c => c.skill);
    
    const matchingSkills = allSkills.filter(s => jdLower.includes(s.toLowerCase()));
    
    // Naive common tech terms to guess missing keywords
    const commonTechTerms = ['javascript', 'python', 'react', 'node', 'java', 'c++', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'agile', 'rest api', 'machine learning', 'ci/cd', 'git', 'linux'];
    const missingSkills = commonTechTerms.filter(t => jdLower.includes(t) && !allSkills.map(s=>s.toLowerCase()).includes(t));

    const matchRatio = allSkills.length > 0 
        ? matchingSkills.length / Math.max(1, matchingSkills.length + missingSkills.length)
        : 0;

    const atsScore = Math.min(Math.round(40 + matchRatio * 55), 98);

    return {
        atsScore,
        keywordsMatched: matchingSkills,
        keywordsMissing: missingSkills.slice(0, 5)
    };
}
