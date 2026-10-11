/**
 * jobDedup.ts
 * ───────────
 * Ported from job-find's `backend/internal/ingestion/dedup.go`
 *
 * Generates a stable fingerprint for a job posting so that the same
 * role appearing on multiple job boards (Remotive, LinkedIn, etc.)
 * produces exactly the same hash and can be deduplicated.
 *
 * Uses Web Crypto API (available in all modern browsers + Node 18+).
 */

/**
 * Compute a SHA-256 dedup fingerprint for a job posting.
 * Mirrors the Go: DedupHash(companyName, title, city, country)
 *
 * Usage:
 *   const hash = await jobDedupHash('Google', 'Software Engineer', 'Bengaluru', 'India');
 *   // → '3f8a2c...' (deterministic hex string)
 */
export async function jobDedupHash(
    company: string,
    title: string,
    city: string,
    country: string,
): Promise<string> {
    const key = [company, title, city, country]
        .map(s => s.trim().toLowerCase())
        .join('|');

    return sha256Hex(key);
}

/**
 * Synchronous dedup key (no hashing, just a normalized string).
 * Use this when you need a fast lookup key without async.
 * Not as collision-resistant as the hash but fine for in-memory dedup.
 */
export function jobDedupKey(
    company: string,
    title: string,
    city: string,
    country: string,
): string {
    return [company, title, city, country]
        .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
        .join('||');
}

/**
 * Dedup an array of items in a single pass.
 * Items with the same key (from `getKey`) are collapsed to the first occurrence.
 *
 * Usage:
 *   const deduped = dedupBatch(jobs, j => jobDedupKey(j.company, j.title, j.city, j.country));
 */
export function dedupBatch<T>(items: T[], getKey: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
        const k = getKey(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

// ─── Internal ──────────────────────────────────────────────────────────────────

async function sha256Hex(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Deduplicates an array of opportunity/job objects.
 * Uses the synchronous jobDedupKey internally.
 */
export function deduplicateJobs<T extends { title?: string; company?: string; location?: string }>(jobs: T[]): T[] {
    return dedupBatch(jobs, j => jobDedupKey(j.company || '', j.title || '', j.location || '', ''));
}
