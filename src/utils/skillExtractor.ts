/**
 * skillExtractor.ts
 * ─────────────────
 * Ported from job-find's `backend/internal/ingestion/normalize.go`
 *
 * Mines skills out of a job title + description even when they're
 * not explicitly tagged. Also classifies seniority and work type.
 *
 * Pure, side-effect-free — safe to call anywhere.
 */

// ─── Skill Dictionary ─────────────────────────────────────────────────────────

const KNOWN_SKILLS: string[] = [
    // Languages
    'go', 'golang', 'python', 'java', 'javascript', 'typescript', 'rust',
    'c++', 'c#', '.net', 'ruby', 'rails', 'php', 'laravel', 'kotlin',
    'swift', 'objective-c', 'scala', 'elixir', 'dart', 'r', 'matlab',

    // Frontend
    'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'css',
    'tailwind', 'sass', 'scss', 'redux', 'zustand', 'vite', 'webpack',

    // Backend
    'node.js', 'node', 'express', 'django', 'flask', 'fastapi', 'spring',
    'nestjs', 'hapi', 'gin', 'fiber', 'graphql', 'rest', 'grpc',

    // Mobile
    'flutter', 'react native', 'android', 'ios',

    // Databases
    'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'firestore', 'dynamodb', 'cassandra', 'sqlite', 'neo4j', 'supabase',

    // DevOps / Cloud
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'aws', 'gcp',
    'azure', 'ci/cd', 'jenkins', 'github actions', 'gitlab', 'linux', 'bash',

    // Messaging
    'kafka', 'rabbitmq', 'pubsub', 'sqs',

    // Data / ML / AI
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'machine learning', 'ml',
    'deep learning', 'data science', 'spark', 'hadoop', 'sql', 'nosql',
    'llm', 'langchain', 'openai', 'huggingface', 'scikit-learn',

    // Tools
    'git', 'figma', 'jira', 'confluence', 'postman', 'swagger',
    'prometheus', 'grafana', 'datadog', 'sentry',
];

// ─── Seniority Patterns ───────────────────────────────────────────────────────

const SENIORITY_PATTERNS: { pattern: RegExp; level: string }[] = [
    { pattern: /\b(principal|staff)\b/i,                level: 'principal' },
    { pattern: /\b(lead|tech lead)\b/i,                 level: 'lead' },
    { pattern: /\b(senior|sr\.?)\b/i,                   level: 'senior' },
    { pattern: /\b(mid[- ]?level|mid)\b/i,              level: 'mid' },
    { pattern: /\b(junior|jr\.?)\b/i,                   level: 'junior' },
    { pattern: /\b(entry[- ]?level|graduate|fresher)\b/i, level: 'entry' },
    { pattern: /\b(intern|internship|trainee)\b/i,      level: 'intern' },
];

// ─── Work Type Patterns ───────────────────────────────────────────────────────

type WorkType = 'remote' | 'hybrid' | 'onsite';

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Strip HTML tags from a string (mirrors stripHTML in normalize.go)
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Auto-extract skills from job title + description.
 * Returns a deduplicated, lowercase array.
 *
 * Usage:
 *   extractSkills('Senior React Developer', '<p>We use TypeScript, Node.js...</p>')
 *   // → ['react', 'typescript', 'node.js', ...]
 */
export function extractSkills(title: string, description: string, existingTags?: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    const add = (s: string) => {
        const normalized = s.trim().toLowerCase().replace(/^[.,;:]+|[.,;:]+$/g, '');
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        out.push(normalized);
    };

    // 1. Add existing tags first (from the job board / employer)
    (existingTags ?? []).forEach(add);

    // 2. Mine from the description text
    const text = stripHtml(description + ' ' + title).toLowerCase();

    for (const skill of KNOWN_SKILLS) {
        if (seen.has(skill)) continue;
        if (skill.includes(' ')) {
            // Multi-word skill → substring match
            if (text.includes(skill)) add(skill);
        } else {
            // Single word → whole-word match to avoid "go" matching "google"
            const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(skill)}(?![a-z0-9])`, 'i');
            if (pattern.test(text)) add(skill);
        }
    }

    return out;
}

/**
 * Classify seniority level from job title and description.
 * Returns one of: 'intern' | 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | ''
 */
export function classifySeniority(title: string, description: string = ''): string {
    for (const { pattern, level } of SENIORITY_PATTERNS) {
        if (pattern.test(title)) return level;
    }
    for (const { pattern, level } of SENIORITY_PATTERNS) {
        if (pattern.test(description)) return level;
    }
    return '';
}

/**
 * Classify work type from location string and description.
 * Returns: 'remote' | 'hybrid' | 'onsite'
 */
export function classifyWorkType(locationRaw: string, description: string = ''): WorkType {
    const hay = (locationRaw + ' ' + description).toLowerCase();
    if (hay.includes('hybrid')) return 'hybrid';
    if (
        hay.includes('remote') ||
        hay.includes('work from home') ||
        hay.includes('wfh') ||
        hay.includes('anywhere') ||
        hay.includes('worldwide')
    ) return 'remote';
    return 'onsite';
}

/**
 * Build a canonical location key (mirrors LocationKey in normalize.go)
 * Used for geocoding cache and dedup.
 * e.g. ("Bengaluru", "India") → "bengaluru|india"
 */
export function buildLocationKey(city: string, country: string): string {
    const c = city.trim().toLowerCase();
    const k = country.trim().toLowerCase();
    if (!c && !k) return 'remote';
    if (!c) return k;
    if (!k) return c;
    return `${c}|${k}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
