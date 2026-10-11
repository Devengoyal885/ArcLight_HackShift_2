/**
 * fetchJobsCron.ts  (Admin SDK version)
 * ──────────────────────────────────────
 * Uses Firebase Admin SDK to bypass security rules.
 * Requires serviceAccountKey.json in the project root.
 *
 * Run: npm run cron:fetch-jobs
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Load service account — Admin SDK bypasses all Firestore security rules
const require = createRequire(import.meta.url);
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

let serviceAccount: ServiceAccount;
try {
    serviceAccount = require(serviceAccountPath) as ServiceAccount;
} catch {
    console.error('❌ serviceAccountKey.json not found at:', serviceAccountPath);
    console.error('   Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
    process.exit(1);
}

const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'wardrobe-app-adf6e',
});

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

const SERPER_KEY = process.env.VITE_SERPER_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpportunityCard {
    id: string;
    source: 'remotive' | 'serper' | 'employer';
    title: string;
    company: string;
    location: string;
    remote: boolean;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
    url: string;
    description?: string;
    tags: string[];
    salary?: string;
    postedAt?: string;
    fetchedAt?: string;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchRemotiveJobs(category: string): Promise<OpportunityCard[]> {
    try {
        const res = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=40`);
        if (!res.ok) throw new Error(`Remotive ${res.status}`);
        const data = await res.json() as { jobs: any[] };
        return (data.jobs || []).map((j: any) => ({
            id: `remotive-${j.id}`,
            source: 'remotive' as const,
            title: j.title,
            company: j.company_name,
            location: j.candidate_required_location || 'Remote',
            remote: true,
            type: inferType(j.job_type || j.title),
            url: j.url,
            description: stripHtml(j.description || '').slice(0, 400),
            tags: (j.tags || []).slice(0, 6),
            salary: j.salary || undefined,
            postedAt: j.publication_date,
        }));
    } catch (e) {
        console.error(`  ✗ Remotive error (${category}):`, e);
        return [];
    }
}

async function fetchSerperJobs(query: string): Promise<OpportunityCard[]> {
    if (!SERPER_KEY) { console.warn('  ✗ Serper skipped — no API key'); return []; }
    try {
        const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, num: 30, gl: 'in', hl: 'en' }),
        });
        if (!res.ok) throw new Error(`Serper ${res.status}`);
        const data = await res.json() as { organic: any[] };
        return (data.organic ?? []).map((r: any, i: number) => ({
            id: `serper-${query.replace(/\s+/g, '-')}-${i}`,
            source: 'serper' as const,
            title: r.title.replace(/\s*-\s*.+$/, '').trim(),
            company: r.displayedLink?.split('›')[0]?.trim() || 'Unknown',
            location: 'India',
            remote: (r.snippet || '').toLowerCase().includes('remote'),
            type: inferType(r.title),
            url: r.link,
            description: (r.snippet || '').slice(0, 400),
            tags: extractTags(r.snippet || r.title),
        }));
    } catch (e) {
        console.error(`  ✗ Serper error (${query}):`, e);
        return [];
    }
}

async function fetchAdzunaCronJobs(country: string = 'in'): Promise<OpportunityCard[]> {
    const appId = process.env.VITE_ADZUNA_APP_ID;
    const appKey = process.env.VITE_ADZUNA_APP_KEY;
    if (!appId || !appKey) {
        console.warn('  ✗ Adzuna skipped — no API key');
        return [];
    }
    
    try {
        const queries = ['software developer', 'frontend', 'backend', 'data analyst', 'intern'];
        const allFetched: OpportunityCard[] = [];
        
        for (const query of queries) {
            const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(query)}&content-type=application/json`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Adzuna ${res.status}`);
            
            const data = await res.json() as any;
            const results = data.results || [];
            
            const mapped = results.map((j: any) => ({
                id: `adzuna-${j.id}`,
                source: 'adzuna' as const,
                title: j.title,
                company: j.company?.display_name || 'Unknown',
                location: j.location?.display_name || 'India',
                remote: j.title?.toLowerCase().includes('remote') || false,
                type: inferType(j.contract_type || j.title),
                url: j.redirect_url,
                description: stripHtml(j.description || '').slice(0, 400),
                tags: extractTags(j.description || j.title),
                salary: j.salary_min ? `$${j.salary_min}+` : undefined,
                postedAt: j.created,
                latitude: j.latitude,
                longitude: j.longitude
            }));
            
            allFetched.push(...mapped);
        }
        return allFetched;
    } catch (e) {
        console.error(`  ✗ Adzuna error:`, e);
        return [];
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferType(s: string): OpportunityCard['type'] {
    const t = s.toLowerCase();
    if (t.includes('intern')) return 'internship';
    if (t.includes('contract')) return 'contract';
    if (t.includes('part')) return 'part-time';
    return 'full-time';
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTags(desc: string): string[] {
    const tech = ['React', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Node.js', 'SQL',
        'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'AI', 'GraphQL',
        'MongoDB', 'PostgreSQL', 'Git', 'Linux', 'C++', 'Go', 'Rust', 'Flutter', 'Django', 'FastAPI'];
    return tech.filter(t => desc.toLowerCase().includes(t.toLowerCase())).slice(0, 6);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runCron() {
    console.log('═══════════════════════════════════════');
    console.log('  CapAble Job Fetch Cron  (Admin SDK)');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    const allJobs: OpportunityCard[] = [];

    // 1. Remotive (free, no key needed)
    console.log('\n📡 Fetching Remotive Jobs...');
    const remotiveCategories = ['software-dev', 'data', 'devops-sysadmin', 'design'];
    for (const cat of remotiveCategories) {
        const jobs = await fetchRemotiveJobs(cat);
        console.log(`  ✓ ${cat}: ${jobs.length} jobs`);
        allJobs.push(...jobs);
    }

    // 2. Serper (Google Jobs)
    console.log('\n🔍 Fetching Serper (Google Jobs)...');
    const serperQueries = [
        'software engineer internship india 2026',
        'frontend developer jobs india',
        'backend developer jobs india',
        'machine learning engineer jobs india',
        'full stack developer internship india',
        'data scientist jobs india',
    ];
    for (const q of serperQueries) {
        const jobs = await fetchSerperJobs(q);
        console.log(`  ✓ "${q}": ${jobs.length} jobs`);
        allJobs.push(...jobs);
    }

    // 3. Adzuna Job Board
    console.log('\n💼 Fetching Adzuna Jobs...');
    const adzunaJobs = await fetchAdzunaCronJobs('in');
    console.log(`  ✓ Adzuna: ${adzunaJobs.length} jobs`);
    allJobs.push(...adzunaJobs);

    // 3. Deduplicate by title+company
    const seen = new Set<string>();
    const deduplicated = allJobs.filter(j => {
        const key = `${j.title.toLowerCase().trim()}|${j.company.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`\n📊 Raw: ${allJobs.length} → Deduplicated: ${deduplicated.length}`);

    // 4. Write to Firestore (Admin SDK — no security rules apply)
    const colRef = db.collection('global_jobs');

    console.log('\n🗑  Clearing old pool...');
    const oldDocs = await colRef.get();
    const deleteBatch = db.batch();
    oldDocs.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
    console.log(`  ✓ Deleted ${oldDocs.size} old jobs`);

    console.log('\n💾 Writing new jobs...');
    const now = new Date().toISOString();
    const chunks: OpportunityCard[][] = [];
    for (let i = 0; i < deduplicated.length; i += 400) {
        chunks.push(deduplicated.slice(i, i + 400));
    }

    let total = 0;
    for (const chunk of chunks) {
        const writeBatch = db.batch();
        chunk.forEach(job => {
            const docRef = colRef.doc(job.id);
            // Strip undefined values — Firestore Admin SDK rejects them
            const clean = Object.fromEntries(
                Object.entries({ ...job, fetchedAt: now }).filter(([, v]) => v !== undefined)
            );
            writeBatch.set(docRef, clean);
        });
        await writeBatch.commit();
        total += chunk.length;
    }

    console.log(`\n✅ Successfully stored ${total} jobs in global_jobs`);
    console.log('═══════════════════════════════════════\n');
    process.exit(0);
}

runCron().catch(err => {
    console.error('\n💥 Fatal Cron Error:', err);
    process.exit(1);
});
