import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { deduplicateJobs } from '../src/utils/jobDedup';
import { extractSkills, classifyWorkType, buildLocationKey } from '../src/utils/skillExtractor';
import type { OpportunityCard } from '../src/services/opportunityService';

const GEO_CACHE_PATH = resolve(process.cwd(), 'scripts', 'geocache.json');
const GLOBAL_JOBS_PATH = resolve(process.cwd(), 'src', 'data', 'global_jobs.json');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchRemotive() {
    console.log('[Ingest] Fetching Remotive...');
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=50');
    if (!res.ok) throw new Error('Remotive fetch failed');
    const data = await res.json();
    return data.jobs || [];
}

function normalizeRemotive(job: any): OpportunityCard {
    const text = `${job.title} ${job.description || ''} ${job.tags.join(' ')}`;
    const minedSkills = extractSkills(text);
    const workType = classifyWorkType(text + ' Remote'); // Remotive is mostly remote
    const type = job.job_type === 'internship' ? 'internship' : 'full-time';

    // We keep location string clean
    let locationStr = job.candidate_required_location || 'Remote';
    if (locationStr.toLowerCase() === 'worldwide') locationStr = 'Remote';

    return {
        id: `remotive-${job.id}`,
        source: 'remotive',
        title: job.title,
        company: job.company_name,
        location: locationStr,
        remote: true, // remotive is always remote
        type,
        url: job.url,
        description: (job.description || '').replace(/<[^>]*>?/gm, '').slice(0, 400),
        tags: Array.from(new Set([...job.tags.slice(0, 4), ...minedSkills])),
        salary: job.salary || undefined,
        postedAt: job.publication_date,
        companyLogo: job.company_logo,
    };
}

async function geocode(locationStr: string): Promise<{ latitude: number, longitude: number } | null> {
    if (!locationStr || locationStr.toLowerCase() === 'remote') return null;

    // Use Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&limit=1`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'job-find-clone/1.0' } });
        const data = await res.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.error(`[Ingest] Geocode failed for ${locationStr}:`, e);
    }
    return null;
}

async function runIngestion() {
    console.log('--- Starting Job Ingestion Pipeline ---');

    // 1. Fetch
    const rawRemotive = await fetchRemotive();
    console.log(`Fetched ${rawRemotive.length} raw jobs from Remotive`);

    // 2. Normalize
    const normalized = rawRemotive.map(normalizeRemotive);

    // 3. Deduplicate (locally)
    const deduped = deduplicateJobs(normalized);
    console.log(`After Deduplication: ${deduped.length} unique jobs`);

    // Load local geocache
    let geoCache: Record<string, { latitude: number, longitude: number }> = {};
    if (existsSync(GEO_CACHE_PATH)) {
        geoCache = JSON.parse(readFileSync(GEO_CACHE_PATH, 'utf-8'));
    }

    // 4. Geocode (with Local Cache)
    let geocodedCount = 0;
    for (const job of deduped) {
        const parts = job.location.split(',');
        const city = parts[0] || '';
        const country = parts.length > 1 ? parts[parts.length - 1] : '';
        const locKey = buildLocationKey(city, country);

        if (locKey === 'remote') continue;

        if (geoCache[locKey]) {
            const coords = geoCache[locKey];
            (job as any).latitude = coords.latitude;
            (job as any).longitude = coords.longitude;
        } else {
            console.log(`[Geocode Miss] Fetching coords for: ${job.location}`);
            await sleep(1200); // 1 req/sec Nominatim limit
            const coords = await geocode(job.location);
            if (coords) {
                (job as any).latitude = coords.latitude;
                (job as any).longitude = coords.longitude;
                geoCache[locKey] = coords;
                geocodedCount++;
                // Save cache progressively
                writeFileSync(GEO_CACHE_PATH, JSON.stringify(geoCache, null, 2));
            }
        }
    }
    console.log(`Successfully Geocoded new locations: ${geocodedCount}`);

    // 5. Output to Local Data File
    console.log('[Ingest] Saving to src/data/global_jobs.json...');
    writeFileSync(GLOBAL_JOBS_PATH, JSON.stringify(deduped, null, 2));

    console.log('--- Ingestion Complete ---');
    process.exit(0);
}

runIngestion().catch(e => {
    console.error(e);
    process.exit(1);
});
