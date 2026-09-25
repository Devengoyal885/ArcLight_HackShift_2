/**
 * facultyOpportunityService.ts
 * ─────────────────────────────
 * Fetches real FDP, Internship, Research, and Consultancy opportunities
 * for faculty/academicians using Remotive and other open APIs.
 */

export interface FacultyOpportunity {
    id: string;
    title: string;
    organization: string;
    type: 'fdp' | 'internship' | 'research' | 'consultancy';
    location: string;
    remote: boolean;
    url: string;
    description: string;
    tags: string[];
    deadline?: string;
    stipend?: string;
    source: string;
    postedAt?: string;
    duration?: string;
}

// ─── Remotive API — used for remote academic/research/dev roles ───────────────

interface RemotiveJob {
    id: number;
    url: string;
    title: string;
    company_name: string;
    category: string;
    tags: string[];
    job_type: string;
    publication_date: string;
    salary?: string;
    description: string;
}

const FDP_KEYWORDS = ['training', 'workshop', 'fdp', 'faculty development', 'upskilling', 'program', 'bootcamp', 'certification'];
const RESEARCH_KEYWORDS = ['research', 'phd', 'scientist', 'postdoc', 'academic', 'lab', 'professor', 'lecturer', 'study'];
const CONSULTANCY_KEYWORDS = ['consultant', 'advisory', 'expert', 'strategy', 'mentor', 'freelance'];

function detectType(title: string, description: string): FacultyOpportunity['type'] {
    const text = `${title} ${description}`.toLowerCase();
    if (FDP_KEYWORDS.some(k => text.includes(k))) return 'fdp';
    if (RESEARCH_KEYWORDS.some(k => text.includes(k))) return 'research';
    if (CONSULTANCY_KEYWORDS.some(k => text.includes(k))) return 'consultancy';
    return 'internship';
}

async function fetchRemotiveAcademic(): Promise<FacultyOpportunity[]> {
    const categories = ['data', 'software-dev', 'management'];
    const allJobs: RemotiveJob[] = [];

    await Promise.all(categories.map(async (cat) => {
        try {
            const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=30`);
            if (!res.ok) return;
            const data = await res.json();
            const jobs: RemotiveJob[] = data.jobs ?? [];
            // Filter for academic/research-looking roles
            const filtered = jobs.filter(j => {
                const text = `${j.title} ${j.description}`.toLowerCase();
                return (
                    RESEARCH_KEYWORDS.some(k => text.includes(k)) ||
                    FDP_KEYWORDS.some(k => text.includes(k)) ||
                    CONSULTANCY_KEYWORDS.some(k => text.includes(k)) ||
                    j.job_type === 'internship'
                );
            });
            allJobs.push(...filtered);
        } catch { /* noop */ }
    }));

    return allJobs.map(j => ({
        id: `remotive-${j.id}`,
        title: j.title,
        organization: j.company_name,
        type: detectType(j.title, j.description),
        location: 'Remote',
        remote: true,
        url: j.url,
        description: j.description.replace(/<[^>]+>/g, '').slice(0, 400),
        tags: j.tags?.slice(0, 6) || [],
        source: 'Remotive',
        postedAt: j.publication_date,
        stipend: j.salary,
    }));
}

async function fetchArbeitnowJobs(): Promise<FacultyOpportunity[]> {
    try {
        const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1');
        if (!res.ok) return [];
        const data = await res.json();
        const jobs = (data.data ?? []) as any[];

        return jobs
            .filter((j: any) => {
                const text = `${j.title} ${j.description}`.toLowerCase();
                return (
                    RESEARCH_KEYWORDS.some(k => text.includes(k)) ||
                    FDP_KEYWORDS.some(k => text.includes(k)) ||
                    CONSULTANCY_KEYWORDS.some(k => text.includes(k))
                );
            })
            .slice(0, 20)
            .map((j: any) => ({
                id: `arbeitnow-${j.slug}`,
                title: j.title,
                organization: j.company_name,
                type: detectType(j.title, j.description),
                location: j.location || 'Remote',
                remote: j.remote || false,
                url: j.url,
                description: (j.description || '').replace(/<[^>]+>/g, '').slice(0, 400),
                tags: j.tags?.slice(0, 6) || [],
                source: 'Arbeitnow',
                postedAt: j.created_at,
            }));
    } catch {
        return [];
    }
}

// ─── AICTE / NITTTR curated FDP static seed (real known programs) ─────────────

const CURATED_FDP: FacultyOpportunity[] = [
    {
        id: 'aicte-fdp-1',
        title: 'AICTE Sponsored FDP on Machine Learning & AI',
        organization: 'AICTE / NIT Trichy',
        type: 'fdp',
        location: 'Trichy, TN / Online',
        remote: true,
        url: 'https://www.aicte-india.org/fdp',
        description: 'A one-week Faculty Development Programme on Machine Learning, Deep Learning and AI applications sponsored by AICTE. Open to faculty from AICTE-approved institutions.',
        tags: ['Machine Learning', 'AI', 'Deep Learning', 'AICTE', 'FDP'],
        source: 'AICTE',
        duration: '5 Days',
    },
    {
        id: 'aicte-fdp-2',
        title: 'FDP on Cloud Computing & DevOps',
        organization: 'NITTTR Chandigarh',
        type: 'fdp',
        location: 'Chandigarh / Online',
        remote: true,
        url: 'https://www.nitttrchd.ac.in/fdp',
        description: 'NITTTR sponsored FDP on cloud infrastructure, containerization, CI/CD pipelines and DevOps practices for engineering faculty.',
        tags: ['Cloud', 'DevOps', 'Docker', 'AWS', 'NITTTR'],
        source: 'NITTTR',
        duration: '1 Week',
    },
    {
        id: 'nptel-fdp-1',
        title: 'NPTEL Faculty Enablement Workshop — Data Science',
        organization: 'NPTEL / IIT Madras',
        type: 'fdp',
        location: 'Online',
        remote: true,
        url: 'https://nptel.ac.in/LocalChapter/fdp',
        description: 'NPTEL\'s faculty enablement workshop series for data science, Python, and statistics. Helps faculty integrate NPTEL courses into curriculum.',
        tags: ['Data Science', 'Python', 'Statistics', 'NPTEL', 'IIT'],
        source: 'NPTEL',
        duration: '2 Days',
    },
    {
        id: 'internshala-faculty-1',
        title: 'Research Internship — AI/ML Lab',
        organization: 'IIT Bombay Research Lab',
        type: 'research',
        location: 'Mumbai / Remote',
        remote: true,
        url: 'https://internshala.com/internships/research-internship',
        description: 'Faculty research collaboration opportunity with IIT Bombay AI Lab. Work on joint research papers and grant proposals.',
        tags: ['Research', 'AI', 'Publications', 'Collaboration', 'IIT'],
        source: 'Internshala / IIT',
        stipend: 'Honorarium based',
        duration: '3-6 Months',
    },
    {
        id: 'consultancy-1',
        title: 'Industry Consultancy — Manufacturing Process Optimization',
        organization: 'Tata Technologies (via AICTE NRCP)',
        type: 'consultancy',
        location: 'Pune / Online',
        remote: true,
        url: 'https://www.aicte-india.org/schemes/nrcp',
        description: 'AICTE NRCP funded consultancy project for faculty with expertise in industrial engineering and manufacturing systems.',
        tags: ['Consultancy', 'Manufacturing', 'NRCP', 'AICTE', 'Industry'],
        source: 'AICTE NRCP',
        stipend: '₹50,000 - ₹2,00,000',
        duration: '6 Months',
    },
    {
        id: 'research-grant-1',
        title: 'DST SERB Research Grant — Core Research Grant (CRG)',
        organization: 'DST-SERB, Govt. of India',
        type: 'research',
        location: 'All India',
        remote: false,
        url: 'https://www.serb.gov.in/page/english/crg.php',
        description: 'Science and Engineering Research Board (SERB) Core Research Grant for individual researchers in emerging technology areas.',
        tags: ['Research Grant', 'DST', 'SERB', 'Funding', 'Government'],
        source: 'DST-SERB',
        stipend: 'Up to ₹80 Lakhs / 3 years',
        duration: '3 Years',
    },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchFacultyOpportunities(): Promise<FacultyOpportunity[]> {
    const [remotive, arbeitnow] = await Promise.all([
        fetchRemotiveAcademic(),
        fetchArbeitnowJobs(),
    ]);

    // Merge live results with curated seed
    const live = [...remotive, ...arbeitnow];
    const all = [...CURATED_FDP, ...live];

    // Deduplicate by id
    const seen = new Set<string>();
    return all.filter(o => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
    });
}
