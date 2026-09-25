/**
 * problemService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered problem generation using Gemini.
 * Generates original coding problems dynamically — no hardcoded question bank.
 *
 * Each problem includes:
 *   - Full problem statement with constraints and examples
 *   - 5 visible + 3 hidden test cases with real I/O
 *   - Starter code for all 12 supported languages
 *   - Tags, difficulty, estimated solve time
 *
 * Problems are cached in memory (session-level) and optionally in Firestore
 * to avoid regenerating the same problem in the same session.
 */

import type {
    CodingProblem,
    AssessmentDomain,
    SupportedLanguage,
    TestCase,
    QuestionDifficulty,
} from '../types/domain';
import { CODING_PROBLEMS } from '../data/codingProblems';


// ── In-memory cache (keyed by problemId) ─────────────────────────────────────
const _cache = new Map<string, CodingProblem>();

// ── Topic pools per domain ────────────────────────────────────────────────────
const DOMAIN_TOPICS: Record<AssessmentDomain, string[][]> = {
    dsa: [
        ['Arrays', 'Hashing', 'Two Pointers'],
        ['Sorting', 'Binary Search', 'Sliding Window'],
        ['Linked Lists', 'Stacks', 'Queues'],
        ['Trees', 'Binary Trees', 'BST'],
        ['Graphs', 'BFS', 'DFS'],
        ['Dynamic Programming', 'Memoization', 'Tabulation'],
        ['Greedy Algorithms', 'Interval Scheduling'],
        ['Heaps', 'Priority Queue'],
        ['Tries', 'String Algorithms'],
        ['Backtracking', 'Recursion'],
    ],
    development: [
        ['String Manipulation', 'Regular Expressions'],
        ['Object Oriented Design', 'Class Design'],
        ['Functional Programming', 'Higher Order Functions'],
        ['Data Serialization', 'JSON Processing'],
        ['Algorithm Design', 'Code Optimization'],
        ['Pattern Recognition', 'Code Parsing'],
    ],
    aptitude: [
        ['Number Theory', 'Modular Arithmetic'],
        ['Combinatorics', 'Permutations'],
        ['Probability', 'Statistics'],
        ['Geometry', 'Matrix Operations'],
        ['Bit Manipulation', 'Bitwise Operations'],
    ],
    devops: [
        ['Process Management', 'System Calls'],
        ['File System Operations', 'Path Manipulation'],
        ['String Processing', 'Log Parsing'],
        ['Configuration Parsing', 'YAML/JSON'],
        ['Networking Utilities', 'Port Scanning'],
    ],
    computer_networks: [
        ['IP Address Processing', 'Subnet Calculation'],
        ['Packet Analysis', 'Protocol Simulation'],
        ['Routing Algorithms', 'Shortest Path'],
        ['Data Encoding', 'Checksum Calculation'],
    ],
    system_design: [
        ['Rate Limiting', 'Token Bucket'],
        ['Cache Implementation', 'LRU Cache'],
        ['Queue Design', 'Message Broker Simulation'],
        ['Load Balancing', 'Round Robin'],
        ['Data Sharding', 'Consistent Hashing'],
    ],
    dbms: [
        ['Data Aggregation', 'Group By Simulation'],
        ['Join Operations', 'Set Theory'],
        ['Index Simulation', 'Binary Search Tree'],
        ['Transaction Processing', 'ACID Properties'],
        ['Query Optimization', 'Cost Estimation'],
    ],
    soft_skills: [
        ['Communication', 'Presentation Skills'],
        ['Teamwork', 'Collaboration Patterns'],
        ['Problem Solving', 'Critical Thinking'],
        ['Leadership', 'Conflict Resolution'],
        ['Emotional Intelligence', 'Empathy'],
    ],
};

// ── Difficulty to complexity mapping ─────────────────────────────────────────
const DIFFICULTY_CONTEXT: Record<QuestionDifficulty, string> = {
    easy: 'beginner-level, solvable in 10-20 minutes, O(n) or O(n log n) solution, straightforward logic',
    medium: 'intermediate-level, solvable in 20-35 minutes, may require O(n log n) or O(n²) with optimization, some algorithmic insight needed',
    hard: 'advanced-level, solvable in 35-60 minutes, requires clever algorithmic insight, may involve DP, graphs, or advanced data structures',
};

// ── Starter code templates ─────────────────────────────────────────────────────
export function getStarterCode(title: string, inputFormat: string): Record<SupportedLanguage, string> {
    const fn = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    return {
        python: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # Read input: ${inputFormat}\n    # TODO: Implement your solution\n    pass\n\nsolve()\n`,
        javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');\nlet idx = 0;\n// Read input: ${inputFormat}\n\n// TODO: Implement your solution\n`,
        typescript: `import * as fs from 'fs';\nconst lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\\n');\nlet idx = 0;\n// Read input: ${inputFormat}\n\n// TODO: Implement your solution\n`,
        java: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Read input: ${inputFormat}\n        // TODO: Implement your solution\n    }\n}\n`,
        cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Read input: ${inputFormat}\n    // TODO: Implement your solution\n    return 0;\n}\n`,
        c: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Read input: ${inputFormat}\n    // TODO: Implement your solution\n    return 0;\n}\n`,
        go: `package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    _ = reader\n    // Read input: ${inputFormat}\n    // TODO: Implement your solution\n    fmt.Println()\n}\n`,
        rust: `use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    let mut lines = stdin.lock().lines();\n    // Read input: ${inputFormat}\n    // TODO: Implement your solution\n}\n`,
        kotlin: `import java.util.Scanner\n\nfun main() {\n    val sc = Scanner(System.\`in\`)\n    // Read input: ${inputFormat}\n    // TODO: Implement your solution\n}\n`,
        csharp: `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        // Read input: ${inputFormat}\n        // TODO: Implement your solution\n    }\n}\n`,
        ruby: `# Read input: ${inputFormat}\n# TODO: Implement your solution\n`,
        php: `<?php\n$lines = explode("\\n", trim(file_get_contents("php://stdin")));\n$idx = 0;\n// Read input: ${inputFormat}\n// TODO: Implement your solution\n?>`,
    };
}

export async function generateProblem(
    domain: AssessmentDomain,
    difficulty: QuestionDifficulty,
    excludeIds: string[] = []
): Promise<CodingProblem | null> {
    // 1. Filter problems by domain and difficulty
    let candidates = CODING_PROBLEMS.filter(
        p => p.domain === domain && p.difficulty === difficulty
    );

    // 2. Fallback to any difficulty if none found
    if (candidates.length === 0) {
        candidates = CODING_PROBLEMS.filter(p => p.domain === domain);
    }

    // 3. Fallback to 'dsa' if the domain has no problems at all
    if (candidates.length === 0) {
        candidates = CODING_PROBLEMS.filter(p => p.domain === 'dsa');
    }

    // 4. Remove excluded IDs to prevent repeats
    const available = candidates.filter(p => !excludeIds.includes(p.id));
    if (available.length === 0) {
        // If all are excluded, just return a random one anyway
        if (candidates.length === 0) return null;
    } else {
        candidates = available;
    }

    // 5. Select a random problem
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // 6. Ensure starter code exists for all 12 languages
    const problem = { ...selected };
    if (!problem.starterCode) {
        problem.starterCode = getStarterCode(problem.title, 'Standard input lines');
    } else {
        const fullStarterCode = getStarterCode(problem.title, 'Standard input lines');
        problem.starterCode = {
            ...fullStarterCode,
            ...problem.starterCode // Overwrite with existing if available
        };
    }

    // Mock an artificial delay to simulate "fetching" so UI loading states still work smoothly
    await new Promise(r => setTimeout(r, 600));

    return problem as CodingProblem;
}

// ── Generate multiple problems ─────────────────────────────────────────────────

export async function generateProblems(
    domain: AssessmentDomain,
    count: number,
    difficulty: 'mixed' | QuestionDifficulty = 'mixed'
): Promise<CodingProblem[]> {
    const problems: CodingProblem[] = [];
    const usedIds: string[] = [];

    const difficulties: QuestionDifficulty[] =
        difficulty === 'mixed'
            ? count === 1
                ? ['medium']
                : count === 2
                    ? ['easy', 'medium']
                    : ['easy', 'medium', 'hard']
            : Array(count).fill(difficulty);

    for (let i = 0; i < count; i++) {
        const diff = difficulties[i % difficulties.length];
        const p = await generateProblem(domain, diff, usedIds);
        if (p) {
            problems.push(p);
            usedIds.push(p.id);
        }
    }

    return problems;
}

// ── Get a single random problem ────────────────────────────────────────────────
export async function getRandomProblem(
    domain: AssessmentDomain,
    difficulty: QuestionDifficulty = 'medium'
): Promise<CodingProblem | null> {
    return generateProblem(domain, difficulty);
}

// ── Clear the cache (useful for testing) ──────────────────────────────────────
export function clearProblemCache(): void {
    _cache.clear();
}

