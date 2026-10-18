/**
 * opportunityService.ts
 * ──────────────────────
 * Fetches REAL job and internship listings from:
 *   1. Remotive API   — free, no key, remote tech jobs
 *   2. Serper API     — Google Jobs search (user's key)
 * 
 * Normalizes all results into a unified OpportunityCard shape.
 */

import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deduplicateJobs } from '../utils/jobDedup';
import { extractSkills, classifyWorkType } from '../utils/skillExtractor';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';


// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpportunityCard {
    id: string;
    source: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
    url: string;
    description?: string;
    tags: string[];
    salary?: string;
    postedAt?: string;
    companyLogo?: string;
    // Matching fields — computed later
    match?: number;
    matchState?: 'READY NOW' | 'NEAR MATCH' | 'SKILL-BUILDING';
    matchingSkills?: string[];
    missingSkills?: string[];
    // Rich match explanation shown on hover (§Task 3)
    matchReason?: string;
    // Internal platform postings (from employers)
    isInternalPosting?: boolean;
    internalRoleId?: string;
    applicantCount?: number;
    deadline?: string;
    // Map Coordinates
    latitude?: number;
    longitude?: number;
}

export interface OpportunitySearchParams {
    query?: string;
    location?: string;
    remote?: boolean;
    type?: 'placement' | 'internship' | 'all';
    skills?: string[];
}

// ─── Remotive API (Free, no key) ──────────────────────────────────────────────

interface RemotiveJob {
    id: number;
    url: string;
    title: string;
    company_name: string;
    company_logo?: string;
    category: string;
    tags: string[];
    job_type: string;
    publication_date: string;
    salary?: string;
    description: string;
}

async function fetchRemotiveJobs(query?: string): Promise<OpportunityCard[]> {
    try {
        const category = 'software-dev';
        const url = `https://remotive.com/api/remote-jobs?category=${category}&limit=30${query ? `&search=${encodeURIComponent(query)}` : ''}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Remotive ${res.status}`);

        const data = await res.json();
        const jobs: RemotiveJob[] = data.jobs ?? [];

        return jobs.map(j => ({
            id: `remotive-${j.id}`,
            source: 'remotive' as const,
            title: j.title,
            company: j.company_name,
            location: 'Remote',
            remote: true,
            type: normalizeJobType(j.job_type),
            url: j.url,
            description: stripHtml(j.description).slice(0, 400),
            tags: j.tags.slice(0, 6),
            salary: j.salary || undefined,
            postedAt: j.publication_date,
            companyLogo: j.company_logo,
        }));
    } catch (e) {
        console.error('Remotive fetch error:', e);
        return [];
    }
}

// ── Adzuna API (India jobs, key-based but has a free tier) ───────────────────────────

async function fetchAdzunaJobs(keywords?: string[], preferredLocation?: string): Promise<OpportunityCard[]> {
    const appId = import.meta.env.VITE_ADZUNA_APP_ID;
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;

    if (!appId || !appKey) {
        console.warn('[Adzuna] Skipped — VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY not set in .env');
        return [];
    }

    try {
        // Use top skill keywords to make results relevant to user preferences
        const searchQuery = keywords && keywords.length > 0
            ? keywords.slice(0, 3).join(' ')  // e.g. "React TypeScript Node.js"
            : 'software developer';

        const location = preferredLocation || 'india';
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=30&what=${encodeURIComponent(searchQuery)}&where=${encodeURIComponent(location)}&content-type=application/json&sort_by=date`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Adzuna ${res.status}`);
        const data = await res.json();
        const results: any[] = data.results ?? [];

        return results.map((j, idx) => ({
            id: `adzuna-${j.id || idx}`,
            source: 'adzuna',
            title: j.title,
            company: j.company?.display_name || 'Unknown Company',
            location: j.location?.display_name || location,
            remote: j.title?.toLowerCase().includes('remote') || false,
            type: normalizeJobType(j.contract_type || j.title || 'full-time'),
            url: j.redirect_url || '',
            description: (j.description || '').slice(0, 400),
            tags: extractTagsFromDescription(j.title + ' ' + (j.description || '')),
            salary: j.salary_min && j.salary_max
                ? `₹${Math.round(j.salary_min / 1000)}k – ₹${Math.round(j.salary_max / 1000)}k`
                : undefined,
            postedAt: j.created,
            latitude: j.latitude,
            longitude: j.longitude,
        }));
    } catch (e) {
        console.error('[Adzuna] Fetch error:', e);
        return [];
    }
}

// ─── Serper Jobs API (Google Jobs) ────────────────────────────────────────────

interface SerperJobResult {
    title: string;
    companyName: string;
    location: string;
    via: string;
    description?: string;
    highlights?: { items: string[] }[];
    salary?: string;
    date?: string;
    applyLink?: { link: string };
    jobId?: string;
}

async function fetchSerperJobs(query: string, location?: string, platform?: string): Promise<OpportunityCard[]> {
    try {
        // Use backend proxy for Serper API
        const res = await fetch(`${SERVER_URL}/api/jobs/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: location ? `${query} ${location}` : query,
                num: 10,
                gl: 'in',     // country: India
                hl: 'en',
            }),
        });

        if (!res.ok) throw new Error(`Serper ${res.status}`);
        const data = await res.json();

        // /search returns organic results — parse those
        interface OrganicResult { title: string; link: string; snippet?: string; displayedLink?: string; }
        const organicResults: OrganicResult[] = data.organic ?? [];

        return organicResults
            .filter(r => !/^\d+\s+/.test(r.title)) // Filter out aggregate pages starting with a number like "23 Internships..."
            .slice(0, 10)
            .map((r, i) => {
            // Extract company from displayedLink domain
            const company = r.displayedLink?.split('›')[0]?.trim() || 'Unknown Company';
            return {
                id: `serper-${Date.now()}-${i}`,
                source: platform || 'serper',
                title: r.title.replace(/\s*-\s*.+$/, '').trim(),  // Clean job title
                company,
                location: location || 'India',
                remote: r.snippet?.toLowerCase().includes('remote') ?? false,
                type: inferType(r.title),
                url: r.link,
                description: r.snippet?.slice(0, 400),
                tags: extractTagsFromDescription(r.snippet || r.title),
                salary: undefined,
                postedAt: undefined,
            };
        });
    } catch (e) {
        console.error('Serper fetch error:', e);
        return [];
    }
}

/** Fetch all active employer-posted roles using collectionGroup to search ALL employer subcollections */
async function fetchEmployerPostedRoles(): Promise<OpportunityCard[]> {
    let groupDocs: any[] = [];
    let globalDocs: any[] = [];

    // Strategy 1: collectionGroup across all employers/{uid}/postedRoles subcollections
    // Requires the /{path=**}/postedRoles/{roleId} collectionGroup rule in firestore.rules
    try {
        const groupSnap = await getDocs(collectionGroup(db, 'postedRoles'));
        groupDocs = groupSnap.docs.map(d => ({ _docId: d.id, ...d.data() } as any));
        console.log(`[opportunityService] collectionGroup found ${groupDocs.length} docs.`);
    } catch (e) {
        console.error('[opportunityService] collectionGroup(postedRoles) FAILED — check firestore.rules for /{path=**}/postedRoles/{roleId} rule:', e);
    }

    // Strategy 2: Top-level mirror collection (postedRoles/{roleId}) — always try this independently
    try {
        const globalSnap = await getDocs(collection(db, 'postedRoles'));
        globalDocs = globalSnap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        console.log(`[opportunityService] Top-level postedRoles found ${globalDocs.length} docs.`);
    } catch (e) {
        console.error('[opportunityService] Top-level postedRoles read FAILED:', e);
    }

    // Merge both sources, deduplicate by _docId
    const allRaw = [...groupDocs, ...globalDocs];

    if (allRaw.length === 0) {
        console.warn('[opportunityService] No employer-posted roles found from any source. Is the employer account logged in and has posted roles?');
        return [];
    }

    const seen = new Set<string>();
    const validDocs = allRaw
        .filter(r => {
            // Keep active roles + roles with no status field (treat as active for backwards compat)
            if (!r.title) return false;
            const status = r.status ?? 'active'; // default missing status to 'active'
            if (status === 'closed' || status === 'draft') return false;
            const key = r._docId || r.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => {
            const dateA = a.postedAt?.toMillis ? a.postedAt.toMillis() : 0;
            const dateB = b.postedAt?.toMillis ? b.postedAt.toMillis() : 0;
            return dateB - dateA;
        });

    console.log(`[opportunityService] ✅ ${validDocs.length} active employer-posted roles available to candidates.`);

    return validDocs.map(r => ({
        id: `posted-${r._docId || r.id}`,
        source: 'CapAble Portal',
        title: r.title,
        company: r.companyName || 'Company',
        location: r.location || 'India',
        remote: r.remote || false,
        type: r.type === 'internship' ? 'internship' : 'full-time',
        url: '',
        description: r.description,
        tags: r.tags || r.requiredSkills || [],
        salary: r.salary || r.stipend,
        isInternalPosting: true,
        internalRoleId: r._docId || r.id,
        applicantCount: r.applicantCount || r.applicants || 0,
        deadline: r.deadline,
    } as OpportunityCard));
}

let globalJobsCache: { data: OpportunityCard[], timestamp: number } | null = null;
// Internal jobs are always fresh (no cache) so employer posts show up immediately
let externalJobsCache: { data: OpportunityCard[], timestamp: number } | null = null;

export async function getAllOpportunities(userSkillKeywords?: string[], userLocation?: string): Promise<OpportunityCard[]> {
    const all: OpportunityCard[] = [];

    // Step 1: ALWAYS fetch internal platform roles fresh (fast Firestore read, no cache)
    // This ensures employer-posted jobs show up immediately for candidates
    try {
        const internal = await fetchEmployerPostedRoles();
        all.push(...internal);
        console.log(`[opportunityService] ${internal.length} platform-posted roles loaded (fresh).`);
    } catch (e) {
        console.error('[opportunityService] Internal roles fetch failed:', e);
    }

    // Step 2: Check external jobs cache (2-minute cache for rate-limited APIs)
    const externalCacheValid = externalJobsCache && (Date.now() - externalJobsCache.timestamp < 120000);
    
    if (externalCacheValid && externalJobsCache) {
        console.log('[opportunityService] Returning cached external opportunities.');
        all.push(...externalJobsCache.data);
    } else {
        const externalJobs: OpportunityCard[] = [];

        // Step 2a: Fetch global_jobs collection (from ingestion script)
        try {
            const globalJobsData = (await import('../data/global_jobs.json')).default as OpportunityCard[];
            externalJobs.push(...globalJobsData);
        } catch (e) {
            console.warn('[opportunityService] Failed to load global_jobs.json:', e);
        }

        // Step 2b: Adzuna API — preference-aware, fresh India jobs
        try {
            const adzunaJobs = await fetchAdzunaJobs(userSkillKeywords, userLocation);
            externalJobs.push(...adzunaJobs);
            console.log(`[opportunityService] Adzuna: ${adzunaJobs.length} jobs loaded.`);
        } catch (e) {
            console.warn('[opportunityService] Adzuna fetch failed:', e);
        }

        // Update external cache
        externalJobsCache = { data: externalJobs, timestamp: Date.now() };
        all.push(...externalJobs);
    }

    // Remove duplicates by ID
    const uniqueById = Array.from(new Map(all.map(item => [item.id, item])).values());
    
    // Deep semantic deduplication
    const semanticUnique = deduplicateJobs(uniqueById);
    
    // Enrich with Skill Mining
    const enriched = semanticUnique.map(job => {
        const text = `${job.title} ${job.description || ''} ${job.tags.join(' ')}`;
        const minedSkills = extractSkills(job.title, job.description || '');
        
        // Ensure remote flags are accurate if our AI detects "wfh/remote"
        const workType = classifyWorkType(text + ' ' + job.location);
        const isRemote = job.remote || workType === 'remote';

        return {
            ...job,
            remote: isRemote,
            tags: Array.from(new Set([...job.tags, ...minedSkills]))
        };
    });

    console.log(`[opportunityService] Total: ${enriched.length} opportunities (after deduplication).`);
    
    return enriched;
}


async function fetchLiveJobs(): Promise<OpportunityCard[]> {
    try {
        const [remotiveJobs, premiumJobs] = await Promise.allSettled([
            fetchLiveRemotive(),
            fetchPremiumJobs()
        ]);

        const all: OpportunityCard[] = [];
        if (remotiveJobs.status === 'fulfilled') all.push(...remotiveJobs.value);
        if (premiumJobs.status === 'fulfilled') all.push(...premiumJobs.value);

        return all;
    } catch(e) {
        console.error('[opportunityService] Live fetch failed:', e);
        return [];
    }
}

async function fetchPremiumJobs(): Promise<OpportunityCard[]> {
    try {
        const queries = [
            { q: 'software engineer site:naukri.com/job-listings', platform: 'Naukri.com' },
            { q: 'software internship site:internshala.com/internship/detail', platform: 'Internshala' },
            { q: 'developer jobs site:linkedin.com/jobs/view', platform: 'LinkedIn' },
            { q: 'software developer internship site:unstop.com/internships', platform: 'Unstop' }
        ];
        
        // Run ALL queries in parallel instead of sequentially
        const results = await Promise.allSettled(
            queries.map(item => fetchSerperJobs(item.q, 'India', item.platform))
        );
        
        return results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => (r as PromiseFulfilledResult<OpportunityCard[]>).value);
    } catch(e) {
        console.error('Premium jobs fetch error:', e);
        return [];
    }
}

/** Fetches jobs directly from Remotive (parallel across 3 categories) */
async function fetchLiveRemotive(): Promise<OpportunityCard[]> {
    try {
        const categories = ['software-dev', 'data', 'devops-sysadmin'];
        
        // Fetch all 3 categories in parallel
        const responses = await Promise.allSettled(
            categories.map(cat => fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=30`))
        );

        const all: OpportunityCard[] = [];

        for (const res of responses) {
            if (res.status !== 'fulfilled' || !res.value.ok) continue;
            const data = await res.value.json();
            const jobs = (data.jobs ?? []).map((j: {
                id: number; url: string; title: string; company_name: string;
                candidate_required_location?: string; job_type?: string;
                description?: string; tags?: string[]; salary?: string; publication_date?: string;
            }) => ({
                id: `remotive-${j.id}`,
                source: 'remotive' as const,
                title: j.title,
                company: j.company_name,
                location: j.candidate_required_location || 'Remote',
                remote: true,
                type: normalizeJobType(j.job_type || j.title),
                url: j.url,
                description: stripHtml(j.description || '').slice(0, 400),
                tags: (j.tags || []).slice(0, 6),
                salary: j.salary || undefined,
                postedAt: j.publication_date,
            }));
            all.push(...jobs);
        }

        console.log(`[opportunityService] Remotive fetched ${all.length} live jobs`);
        return all;
    } catch (e) {
        console.error('[opportunityService] Remotive fetch failed:', e);
        return [];
    }
}


/**
 * Filtered search against the cron pool.
 * Applies keyword query, type, remote, and optionally skills.
 */
export async function searchOpportunities(params: OpportunitySearchParams): Promise<OpportunityCard[]> {
    const { query, location, remote, type, skills } = params;

    try {
        const all = await getAllOpportunities();
        let results = [...all];

        // Remote filter
        if (remote === true) results = results.filter(j => j.remote);

        // Type filter
        if (type === 'internship') results = results.filter(j => j.type === 'internship' || j.title.toLowerCase().includes('intern'));
        if (type === 'placement')  results = results.filter(j => j.type !== 'internship' && !j.title.toLowerCase().includes('intern'));

        // Keyword query filter
        if (query && query.trim()) {
            const qLower = query.toLowerCase();
            results = results.filter(j =>
                j.title.toLowerCase().includes(qLower) ||
                j.company.toLowerCase().includes(qLower) ||
                (j.tags || []).some((t: string) => t.toLowerCase().includes(qLower)) ||
                (j.description && j.description.toLowerCase().includes(qLower))
            );
        }

        // Location filter
        if (location && !remote) {
            const locLower = location.toLowerCase();
            results = results.filter(j => j.location.toLowerCase().includes(locLower));
        }

        // Skill-boost: sort results that match skills to top (no hard filter)
        if (skills && skills.length > 0) {
            const topSkills = skills.map(s => s.toLowerCase());
            results.sort((a, b) => {
                const scoreA = topSkills.filter(s => `${a.title} ${a.description} ${(a.tags || []).join(' ')}`.toLowerCase().includes(s)).length;
                const scoreB = topSkills.filter(s => `${b.title} ${b.description} ${(b.tags || []).join(' ')}`.toLowerCase().includes(s)).length;
                return scoreB - scoreA;
            });
        }

        return results;
    } catch (e) {
        console.error('[opportunityService] searchOpportunities failed:', e);
        return [];
    }
}

// ─── Capability-based Opportunity Matching ────────────────────────────────────
//
// Produces an EXPLAINED match score — not a random number.
// Each point of the score is backed by a concrete reason:
//  - Skill matches: specific skills in the job description that match yours
//  - Title boost: job title aligns with your strongest skill area
//  - Penalty: required tech detected in the job that you haven't listed
//
// The matchReason string is displayed in a tooltip on hover (§Task 3).

export function matchOpportunityToSkills(
    opp: OpportunityCard,
    userSkills: string[],
    userCapabilities?: { skill: string; score: number }[]
): OpportunityCard {
    const descLower = `${opp.title} ${opp.description || ''} ${opp.tags.join(' ')}`.toLowerCase();
    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    // Skills from user profile that appear in this job
    const matchingSkills = userSkills.filter(s => descLower.includes(s.toLowerCase()));

    // Common tech skills the job requires but the user doesn't have
    const commonTechTerms = [
        'javascript', 'python', 'react', 'node', 'java', 'c++', 'sql', 'aws',
        'docker', 'kubernetes', 'typescript', 'golang', 'rust', 'flutter', 'swift',
        'graphql', 'redis', 'kafka', 'terraform', 'pytorch', 'tensorflow'
    ];
    const missingSkills = commonTechTerms.filter(t =>
        descLower.includes(t) && !userSkillsLower.includes(t)
    );

    // — Score calculation —
    // Base 30 pts for having a profile; skill matches add up to 55 pts; missing skills penalise
    const totalRequired = Math.max(1, matchingSkills.length + missingSkills.length);
    const skillScore = matchingSkills.length / totalRequired;
    const matchPts = Math.round(30 + skillScore * 55);
    const penalty = Math.min(missingSkills.length * 4, 20);
    const match = Math.max(20, Math.min(matchPts - penalty, 98));

    const matchState: OpportunityCard['matchState'] =
        match >= 80 ? 'READY NOW' :
        match >= 60 ? 'NEAR MATCH' : 'SKILL-BUILDING';

    // — Build human-readable breakdown for tooltip —
    const reasons: string[] = [];

    if (matchingSkills.length > 0) {
        const topMatches = matchingSkills.slice(0, 3);
        const strongMatches = topMatches.filter(skill => {
            const cap = userCapabilities?.find(c => c.skill.toLowerCase() === skill.toLowerCase());
            return cap && cap.score >= 70;
        });
        if (strongMatches.length > 0)
            reasons.push(`✓ Strong in ${strongMatches.join(', ')} — a core requirement here`);
        const otherMatches = topMatches.filter(s => !strongMatches.includes(s));
        if (otherMatches.length > 0)
            reasons.push(`✓ ${otherMatches.join(', ')} found in your profile & this job`);
    } else {
        reasons.push('⚠ No listed skills matched this job description');
    }

    if (missingSkills.length > 0)
        reasons.push(`✗ Missing: ${missingSkills.slice(0, 2).join(', ')} (required by role)`);

    if (matchState === 'READY NOW')
        reasons.push('★ Your profile closely aligns with this role\'s requirements');
    else if (matchState === 'NEAR MATCH')
        reasons.push('○ You can likely qualify with minor upskilling');
    else
        reasons.push('△ Use Learning Path to close the skill gaps');

    return {
        ...opp,
        match,
        matchState,
        matchingSkills,
        missingSkills: missingSkills.slice(0, 3),
        matchReason: reasons.join('\n'),
    };
}


// ─── Utilities ────────────────────────────────────────────────────────────────

function normalizeJobType(raw: string): OpportunityCard['type'] {
    const r = raw.toLowerCase();
    if (r.includes('intern')) return 'internship';
    if (r.includes('contract')) return 'contract';
    if (r.includes('part')) return 'part-time';
    if (r.includes('freelance')) return 'freelance';
    return 'full-time';
}

function inferType(title: string): OpportunityCard['type'] {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 'internship';
    if (t.includes('contract')) return 'contract';
    return 'full-time';
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTagsFromDescription(desc: string): string[] {
    const tech = ['React', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Node.js', 'SQL',
        'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'AI', 'REST API', 'GraphQL',
        'MongoDB', 'PostgreSQL', 'Git', 'Linux', 'C++', 'Go', 'Rust', 'Flutter'];
    return tech.filter(t => desc.toLowerCase().includes(t.toLowerCase())).slice(0, 5);
}
