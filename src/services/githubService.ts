/**
 * githubService.ts
 * ────────────────
 * Fetches real public GitHub repositories for a given username.
 * Uses GitHub's unauthenticated public API (60 req/hr per IP).
 * Extracts: repo name, description, languages, stars, topics, last updated.
 */

export interface GitHubRepo {
    id: number;
    name: string;
    fullName: string;
    description?: string;
    url: string;
    homepage?: string;
    language?: string;       // primary language
    stars: number;
    forks: number;
    topics: string[];
    updatedAt: string;
    createdAt: string;
    isPrivate: boolean;
}

export interface GitHubProfile {
    username: string;
    name?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    publicRepos: number;
    followers: number;
    following: number;
}

export interface GitHubSyncResult {
    profile: GitHubProfile;
    repos: GitHubRepo[];
    languageDistribution: Record<string, number>;  // language → repo count
    topTopics: string[];
    lastSynced: string;
}

// ─── Fetch GitHub Profile ─────────────────────────────────────────────────────

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile | null> {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
            headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            username: data.login,
            name: data.name,
            avatar: data.avatar_url,
            bio: data.bio,
            location: data.location,
            publicRepos: data.public_repos,
            followers: data.followers,
            following: data.following,
        };
    } catch {
        return null;
    }
}

// ─── Fetch Repositories ───────────────────────────────────────────────────────

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
    try {
        const res = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=50`,
            { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return [];
        const data = await res.json();

        return (data as GitHubAPIRepo[]).map(r => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description || undefined,
            url: r.html_url,
            homepage: r.homepage || undefined,
            language: r.language || undefined,
            stars: r.stargazers_count,
            forks: r.forks_count,
            topics: r.topics ?? [],
            updatedAt: r.updated_at,
            createdAt: r.created_at,
            isPrivate: r.private,
        }));
    } catch {
        return [];
    }
}

interface GitHubAPIRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    topics?: string[];
    updated_at: string;
    created_at: string;
    private: boolean;
}

// ─── Full Sync ────────────────────────────────────────────────────────────────

export async function syncGitHub(username: string): Promise<GitHubSyncResult | null> {
    const [profile, repos] = await Promise.all([
        fetchGitHubProfile(username),
        fetchGitHubRepos(username),
    ]);

    if (!profile) return null;

    // Language distribution
    const langMap: Record<string, number> = {};
    for (const r of repos) {
        if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
    }

    // Top topics across all repos
    const topicCount: Record<string, number> = {};
    for (const r of repos) {
        for (const t of r.topics) {
            topicCount[t] = (topicCount[t] || 0) + 1;
        }
    }
    const topTopics = Object.entries(topicCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([t]) => t);

    return {
        profile,
        repos: repos.filter(r => !r.isPrivate),  // only public
        languageDistribution: langMap,
        topTopics,
        lastSynced: new Date().toISOString(),
    };
}

// ─── Derive capabilities from GitHub data ─────────────────────────────────────

export interface GitHubDerivedCapability {
    skill: string;
    repoCount: number;
    score: number;
    confidence: 'low' | 'medium' | 'high';
}

export function deriveCapabilitiesFromGitHub(result: GitHubSyncResult): GitHubDerivedCapability[] {
    const caps: GitHubDerivedCapability[] = [];

    for (const [lang, count] of Object.entries(result.languageDistribution)) {
        const score = Math.min(30 + count * 10 + (count > 5 ? 15 : 0), 80);
        caps.push({
            skill: lang,
            repoCount: count,
            score,
            confidence: count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low',
        });
    }

    return caps.sort((a, b) => b.score - a.score);
}
