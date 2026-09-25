/**
 * leetcodeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches problems and details from LeetCode's public GraphQL API.
 */

export interface LCProblem {
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicTags: { name: string; slug: string }[];
}

export interface LCProblemDetails {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    content: string; // HTML description
    exampleTestcases: string; // Raw string with newlines
    topicTags: { name: string; slug: string }[];
}
const LC_GRAPHQL = '/lc-api';
/**
 * Fetch a paginated list of problems
 */
export async function fetchLeetCodeProblems(
    limit: number = 50,
    skip: number = 0,
    searchKeyword: string = '',
    difficulty: string = '',
    tags: string[] = []
): Promise<{ total: number; questions: LCProblem[] }> {
    const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
                categorySlug: $categorySlug
                limit: $limit
                skip: $skip
                filters: $filters
            ) {
                total: totalNum
                questions: data {
                    title
                    titleSlug
                    difficulty
                    topicTags { name slug }
                }
            }
        }
    `;

    const filters: any = {};
    if (searchKeyword) filters.searchKeywords = searchKeyword;
    if (difficulty && difficulty !== 'all') {
        filters.difficulty = difficulty.toUpperCase();
    }
    if (tags.length > 0 && !tags.includes('all')) {
        filters.tags = tags;
    }

    const variables = { categorySlug: '', skip, limit, filters };

    const res = await fetch(LC_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });

    if (!res.ok) throw new Error('Failed to fetch from LeetCode');
    const json = await res.json();
    return json.data.problemsetQuestionList;
}

/**
 * Fetch full problem details (HTML description, test cases)
 */
export async function fetchLeetCodeProblemDetails(titleSlug: string): Promise<LCProblemDetails> {
    const query = `
        query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                title
                titleSlug
                difficulty
                content
                exampleTestcases
                topicTags { name slug }
            }
        }
    `;

    const variables = { titleSlug };

    const res = await fetch(LC_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });

    if (!res.ok) throw new Error('Failed to fetch from LeetCode');
    const json = await res.json();
    if (!json.data.question) throw new Error('Problem not found');
    return json.data.question;
}

// Convert LC difficulty to our lowercase standard
export function normalizeDifficulty(diff: string): 'easy' | 'medium' | 'hard' {
    return diff.toLowerCase() as 'easy' | 'medium' | 'hard';
}

/**
 * Fetch user profile stats (used in Codolio Profile Page)
 */
export async function fetchLeetCodeStats(username: string): Promise<any> {
    try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`);
        if (!res.ok) throw new Error('Failed to fetch LeetCode profile');
        const data = await res.json();
        
        // If the API returns an error for the user, return mock data for the demo
        if (data.errors || data.totalSolved === undefined) {
            console.warn('LeetCode API returned error for user, using mock data for demo:', data.errors);
            return getMockLeetCodeData();
        }
        
        return data;
    } catch (err) {
        console.warn('LeetCode API failed, using mock data for demo:', err);
        return getMockLeetCodeData();
    }
}

function getMockLeetCodeData() {
    return {
        totalSolved: 342,
        totalQuestions: 3000,
        easySolved: 150,
        totalEasy: 700,
        mediumSolved: 142,
        totalMedium: 1500,
        hardSolved: 50,
        totalHard: 800,
        ranking: 15420,
        reputation: 120,
        submissionCalendar: {
            [Math.floor(Date.now() / 1000) - 86400]: 2,
            [Math.floor(Date.now() / 1000) - 172800]: 5,
            [Math.floor(Date.now() / 1000) - 259200]: 1,
        }
    };
}

/**
 * Calculate streak from submission calendar
 */
export function calculateCurrentStreak(submissionCalendar: Record<string, number> | null | undefined): number {
    if (!submissionCalendar) return 0;
    
    const timestamps = Object.keys(submissionCalendar).map(Number).sort((a, b) => b - a);
    if (timestamps.length === 0) return 0;
    
    let streak = 0;
    let currentDay = timestamps[0];
    
    // If the last submission is more than 2 days ago, streak is 0
    const currentUnix = Math.floor(Date.now() / 1000);
    if (currentUnix - currentDay > 86400 * 2) {
        return 0;
    }
    
    streak = 1;
    for (let i = 1; i < timestamps.length; i++) {
        const diff = currentDay - timestamps[i];
        if (diff > 0 && diff <= 86400 * 1.5) {
            streak++;
            currentDay = timestamps[i];
        } else if (diff === 0) {
            continue;
        } else {
            break;
        }
    }
    
    return streak;
}
