/**
 * codeExecutionService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sandboxed remote code execution via the Judge0 CE API.
 * Supports 12 programming languages.
 *
 * Security: Code is NEVER evaluated locally. All execution happens on remote
 * sandboxed servers via Judge0 CE.
 */

import type { CodingProblem, SupportedLanguage, TestCase, TestResult } from '../types/domain';

const JUDGE0_API = 'https://ce.judge0.com/submissions?base64_encoded=true&wait=true';
const TIMEOUT_MS = 15_000;

function encodeBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str: string | null | undefined): string {
    if (!str) return '';
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch {
        return atob(str);
    }
}

// ── Language configs for Judge0 CE ──────────────────────────────────────────

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { id: number; label: string; monacoId: string; extension: string; color: string }> = {
    python:     { id: 71,  label: 'Python 3',     monacoId: 'python',      extension: '.py',  color: '#3b82f6' },
    javascript: { id: 63,  label: 'JavaScript',   monacoId: 'javascript',  extension: '.js',  color: '#f59e0b' },
    typescript: { id: 74,  label: 'TypeScript',   monacoId: 'typescript',  extension: '.ts',  color: '#2563eb' },
    java:       { id: 62,  label: 'Java',         monacoId: 'java',        extension: '.java',color: '#ef4444' },
    cpp:        { id: 54,  label: 'C++',          monacoId: 'cpp',         extension: '.cpp', color: '#8b5cf6' },
    c:          { id: 50,  label: 'C',            monacoId: 'c',           extension: '.c',   color: '#6366f1' },
    go:         { id: 60,  label: 'Go',           monacoId: 'go',          extension: '.go',  color: '#06b6d4' },
    rust:       { id: 73,  label: 'Rust',         monacoId: 'rust',        extension: '.rs',  color: '#ea580c' },
    kotlin:     { id: 78,  label: 'Kotlin',       monacoId: 'kotlin',      extension: '.kt',  color: '#7c3aed' },
    csharp:     { id: 51,  label: 'C#',           monacoId: 'csharp',      extension: '.cs',  color: '#10b981' },
    ruby:       { id: 72,  label: 'Ruby',         monacoId: 'ruby',        extension: '.rb',  color: '#dc2626' },
    php:        { id: 68,  label: 'PHP',          monacoId: 'php',         extension: '.php', color: '#7c3aed' },
};

export const ALL_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[];

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTimeMs: number;
    memoryUsedKb?: number;
    error?: string;
}

// ── Core executor ─────────────────────────────────────────────────────────────

export async function executeCode(
    language: SupportedLanguage,
    code: string,
    stdin: string = ''
): Promise<ExecutionResult> {
    const cfg = LANGUAGE_CONFIG[language];
    const start = performance.now();

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(JUDGE0_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                source_code: encodeBase64(code),
                language_id: cfg.id,
                stdin: encodeBase64(stdin),
            }),
        });

        clearTimeout(timer);

        if (!response.ok) {
            throw new Error(`Judge0 API error: HTTP ${response.status}`);
        }

        const data = await response.json();

        // Judge0 Status IDs: 3 = Accepted, 6 = Compile Error, >3 = Error
        if (data.status?.id === 6) {
            const cmpErr = decodeBase64(data.compile_output);
            return {
                stdout: '',
                stderr: cmpErr || 'Compilation error',
                exitCode: 1,
                executionTimeMs: performance.now() - start,
                error: 'Compilation failed: ' + (cmpErr || ''),
            };
        }

        const isError = data.status?.id > 3;
        const memKb = data.memory ? Math.round(data.memory) : undefined;
        const outStr = decodeBase64(data.stdout);
        const errStr = decodeBase64(data.stderr) || decodeBase64(data.compile_output) || decodeBase64(data.message);

        return {
            stdout: outStr.trimEnd(),
            stderr: errStr.trimEnd(),
            exitCode: isError ? 1 : 0,
            executionTimeMs: performance.now() - start,
            memoryUsedKb: memKb,
            error: isError ? (data.status?.description || 'Runtime error') : undefined,
        };
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            return { stdout: '', stderr: '', exitCode: -1, executionTimeMs: TIMEOUT_MS, error: 'Execution timed out (>15s)' };
        }
        return {
            stdout: '', stderr: '',
            exitCode: -1,
            executionTimeMs: performance.now() - start,
            error: err instanceof Error ? err.message : 'Network error — check internet connection',
        };
    }
}

// ── Normalise output for comparison ──────────────────────────────────────────

function normalise(s: string): string {
    return s
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n+$/, '');
}

// ── Run against visible test cases ───────────────────────────────────────────

export async function runVisibleTests(
    problem: CodingProblem,
    language: SupportedLanguage,
    code: string
): Promise<TestResult[]> {
    const visible = problem.testCases.filter(tc => !tc.isHidden);
    return runTestCases(visible, language, code);
}

// ── Submit: run against ALL test cases ───────────────────────────────────────

export async function submitSolution(
    problem: CodingProblem,
    language: SupportedLanguage,
    code: string
): Promise<TestResult[]> {
    return runTestCases(problem.testCases, language, code);
}

async function runTestCases(
    testCases: TestCase[],
    language: SupportedLanguage,
    code: string
): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const BATCH = 3;

    for (let i = 0; i < testCases.length; i += BATCH) {
        const batch = testCases.slice(i, i + BATCH);
        const batchResults = await Promise.all(
            batch.map(tc => runSingleTestCase(tc, language, code))
        );
        results.push(...batchResults);
    }

    return results;
}

async function runSingleTestCase(
    tc: TestCase,
    language: SupportedLanguage,
    code: string
): Promise<TestResult> {
    const execResult = await executeCode(language, code, tc.stdin);
    const actual = normalise(execResult.stdout);
    const expected = normalise(tc.expectedOutput);
    const passed = !execResult.error && execResult.exitCode === 0 && actual === expected;

    return {
        testCaseId: tc.id,
        passed,
        input: tc.stdin,
        expectedOutput: expected,
        actualOutput: execResult.error
            ? `Error: ${execResult.error}`
            : (execResult.stderr || actual),
        isHidden: tc.isHidden,
        executionTimeMs: execResult.executionTimeMs,
        error: execResult.error ?? (execResult.stderr || undefined),
    };
}

// ── Score calculation ─────────────────────────────────────────────────────────

export function calculateCodingScore(results: TestResult[]): number {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.passed).length;
    return Math.round((passed / results.length) * 100);
}
