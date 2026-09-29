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

const SERPER_KEY = import.meta.env.VITE_SERPER_API_KEY as string;


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
    // Internal platform postings (from employers)
    isInternalPosting?: boolean;
    internalRoleId?: string;
    applicantCount?: number;
    deadline?: string;
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
        // Use Serper's Google Search API for jobs
        const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_KEY,
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
    try {
        // collectionGroup queries ALL 'postedRoles' subcollections across ALL employers
        // This bypasses the need for a global mirror collection entirely
        const groupSnap = await getDocs(collectionGroup(db, 'postedRoles'));
        
        // Also check the top-level postedRoles collection (the mirror) for any that were synced
        let globalDocs: any[] = [];
        try {
            const globalSnap = await getDocs(collection(db, 'postedRoles'));
            globalDocs = globalSnap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        } catch { /* non-critical */ }

        // Merge both sources, deduplicate by ID
        const allRaw = [
            ...groupSnap.docs.map(d => ({ _docId: d.id, ...d.data() } as any)),
            ...globalDocs,
        ];
        
        const seen = new Set<string>();
        const validDocs = allRaw
            .filter(r => {
                // Only active roles, deduplicated
                if (!r.title || r.status !== 'active') return false;
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

        console.log(`[opportunityService] Found ${validDocs.length} employer-posted active roles.`);

        return validDocs.map(r => ({
            id: `posted-${r._docId || r.id}`,
            source: r.companyName || 'CapAble Portal',
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
    } catch (e) {
        console.error('[opportunityService] Employer posted roles fetch failed:', e);
        return [];
    }
}

let globalJobsCache: { data: OpportunityCard[], timestamp: number } | null = null;

export async function getAllOpportunities(): Promise<OpportunityCard[]> {
    // Return cache if it's less than 2 minutes old (120,000 ms)
    if (globalJobsCache && (Date.now() - globalJobsCache.timestamp < 120000)) {
        console.log('[opportunityService] Returning 2-minute cached opportunities instantly.');
        return globalJobsCache.data;
    }

    const all: OpportunityCard[] = [];

    // Step 1: Always fetch internal platform roles first (fast Firestore read)
    try {
        const internal = await fetchEmployerPostedRoles();
        all.push(...internal);
        console.log(`[opportunityService] ${internal.length} platform-posted roles loaded.`);
    } catch (e) {
        console.error('[opportunityService] Internal roles fetch failed:', e);
    }

    // Step 2: Fetch global_jobs collection
    try {
        const globalSnap = await getDocs(collection(db, 'global_jobs'));
        if (!globalSnap.empty) {
            all.push(...globalSnap.docs.map(d => d.data() as OpportunityCard));
        }
    } catch (e) {
        console.warn('[opportunityService] global_jobs fetch failed:', e);
    }

    // Step 3: Live external jobs with 10s timeout so the page never hangs
    try {
        const liveJobs = await Promise.race([
            fetchLiveJobs(),
            new Promise<OpportunityCard[]>(resolve => setTimeout(() => resolve([]), 10_000))
        ]);
        all.push(...liveJobs);
    } catch (e) {
        console.warn('[opportunityService] Live jobs fetch failed:', e);
    }

    // Remove duplicates by ID
    const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
    console.log(`[opportunityService] Total: ${unique.length} opportunities.`);
    
    // Update memory cache
    globalJobsCache = { data: unique, timestamp: Date.now() };
    
    return unique;
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
    if (!SERPER_KEY || SERPER_KEY.trim() === '') return [];
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

export function matchOpportunityToSkills(
    opp: OpportunityCard,
    userSkills: string[]  // list of skill names the user has
): OpportunityCard {
    const descLower = `${opp.title} ${opp.description || ''} ${opp.tags.join(' ')}`.toLowerCase();
    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    const matchingSkills = userSkills.filter(s => descLower.includes(s.toLowerCase()));
    const commonTechTerms = ['javascript', 'python', 'react', 'node', 'java', 'c++', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'golang', 'rust'];
    const missingSkills = commonTechTerms.filter(t => descLower.includes(t) && !userSkillsLower.includes(t));

    const matchRatio = userSkillsLower.length > 0
        ? matchingSkills.length / Math.min(userSkillsLower.length, Math.max(1, matchingSkills.length + missingSkills.length))
        : 0;

    const match = Math.min(Math.round(40 + matchRatio * 55), 98);

    const matchState: OpportunityCard['matchState'] =
        match >= 80 ? 'READY NOW' :
        match >= 60 ? 'NEAR MATCH' : 'SKILL-BUILDING';

    return {
        ...opp,
        match,
        matchState,
        matchingSkills,
        missingSkills: missingSkills.slice(0, 3),
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
