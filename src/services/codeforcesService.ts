/**
 * codeforcesService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the full Codeforces problemset (10,000+ problems, free public API).
 * Maps CF ratings to easy/medium/hard and CF tags to our domain system.
 */

export interface CFProblem {
    contestId: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
    type: string;
}

export type PracticeDifficulty = 'easy' | 'medium' | 'hard' | 'all';

const CF_API = 'https://codeforces.com/api/problemset.problems';

// Map rating bands → difficulty
export function ratingToDifficulty(rating?: number): 'easy' | 'medium' | 'hard' {
    if (!rating) return 'medium';
    if (rating <= 1300) return 'easy';
    if (rating <= 2000) return 'medium';
    return 'hard';
}

// Map CF tags → readable topic groups
export const TAG_GROUPS: Record<string, string[]> = {
    'Arrays & Sorting': ['sortings', 'two pointers', 'brute force'],
    'Strings':           ['strings', 'hashing'],
    'Dynamic Programming': ['dp'],
    'Graphs & Trees':    ['graphs', 'dfs and similar', 'trees', 'dsu', 'shortest paths'],
    'Math & Number Theory': ['math', 'number theory', 'combinatorics', 'probabilities'],
    'Greedy':            ['greedy', 'constructive algorithms'],
    'Data Structures':   ['data structures', 'binary search', 'bitmasks'],
    'Geometry':          ['geometry'],
    'Games':             ['games'],
};

// All unique tag values (for filter pills)
export const ALL_TAGS = [
    'implementation', 'sortings', 'two pointers', 'brute force',
    'math', 'number theory', 'combinatorics', 'greedy', 'constructive algorithms',
    'dp', 'strings', 'hashing', 'graphs', 'dfs and similar', 'trees', 'dsu',
    'binary search', 'data structures', 'bitmasks', 'geometry', 'games',
    'shortest paths', 'probabilities', 'divide and conquer', 'interactive',
    'matrices', 'schedules', 'graph matchings', 'flows', 'fft',
];

let _cache: CFProblem[] | null = null;
let _fetchPromise: Promise<CFProblem[]> | null = null;

export async function fetchAllProblems(): Promise<CFProblem[]> {
    if (_cache) return _cache;
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
        const res = await fetch(CF_API);
        if (!res.ok) throw new Error('Codeforces API unreachable');
        const json = await res.json();
        if (json.status !== 'OK') throw new Error('Codeforces API error: ' + json.comment);
        const problems: CFProblem[] = json.result.problems
            .filter((p: any) => p.type === 'PROGRAMMING' && !p.tags?.includes('*special'))
            .map((p: any) => ({
                contestId: p.contestId,
                index: p.index,
                name: p.name,
                rating: p.rating,
                tags: p.tags || [],
                type: p.type,
            }));
        _cache = problems;
        return problems;
    })();

    return _fetchPromise;
}

// Unique stable key for a CF problem
export function cfKey(p: CFProblem) {
    return `${p.contestId}${p.index}`;
}

// CF problem URL
export function cfUrl(p: CFProblem) {
    return `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
}
