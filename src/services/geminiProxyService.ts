/**
 * geminiProxyService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for direct Gemini API calls.
 *
 * SECURITY: Routes all calls through the CapAble backend (/api/gemini)
 * so the API key is NEVER exposed in the browser bundle.
 *
 * Falls back to direct API call (using VITE_GEMINI_API_KEY) if the
 * backend is not reachable — useful during local development without
 * the server running.
 *
 * Usage:
 *   import { geminiGenerate, geminiStream } from './geminiProxyService';
 *
 *   // Standard generate
 *   const text = await geminiGenerate('Tell me about React');
 *
 *   // Streaming generate
 *   await geminiStream('Write a poem', chunk => console.log(chunk));
 */

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (SERVER_URL && !SERVER_URL.startsWith('http')) SERVER_URL = 'https://' + SERVER_URL;
if (SERVER_URL.includes('up.railway.app')) SERVER_URL = SERVER_URL.replace('http://', 'https://');
const FALLBACK_KEY = import.meta.env.VITE_GEMINI_API_KEY?.split(',')[0]?.trim() || '';

// ── Type helpers ──────────────────────────────────────────────────────────────

export interface GeminiContent {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
}

export interface GeminiGenerateOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    systemInstruction?: string;
}

// ── Non-streaming generate ────────────────────────────────────────────────────

export async function geminiGenerate(
    prompt: string | GeminiContent[],
    opts: GeminiGenerateOptions = {},
): Promise<string> {
    const contents: GeminiContent[] = typeof prompt === 'string'
        ? [{ role: 'user', parts: [{ text: prompt }] }]
        : prompt;

    let model = opts.model || 'gemini-2.5-flash';
    if (!model || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash') {
        model = 'gemini-2.5-flash';
    }

    const body = {
        model,
        contents,
        ...(opts.temperature !== undefined || opts.maxOutputTokens !== undefined
            ? { generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxOutputTokens } }
            : {}),
        ...(opts.systemInstruction
            ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } }
            : {}),
    };

    // Try backend proxy first
    try {
        const res = await fetch(`${SERVER_URL}/api/gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) {
            const data = await res.json() as any;
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        } else {
            console.warn(`[Gemini Proxy] Backend returned ${res.status}, attempting fallback...`);
        }
    } catch {
        // Server not running — fall back to direct API call
        console.warn('[Gemini] Backend not reachable, falling back to direct API call');
    }

    // Fallback: direct call (development only)
    if (!FALLBACK_KEY) throw new Error('No Gemini API key available');
    const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent?key=${FALLBACK_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: body.contents, generationConfig: body.generationConfig, systemInstruction: body.systemInstruction }),
        }
    );
    const fallbackData = await fallbackRes.json() as any;
    return fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Streaming generate ────────────────────────────────────────────────────────

export async function geminiStream(
    prompt: string | GeminiContent[],
    onChunk: (text: string) => void,
    opts: GeminiGenerateOptions = {},
): Promise<void> {
    const contents: GeminiContent[] = typeof prompt === 'string'
        ? [{ role: 'user', parts: [{ text: prompt }] }]
        : prompt;

    let model = opts.model || 'gemini-2.5-flash';
    if (!model || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash') {
        model = 'gemini-2.5-flash';
    }

    const body = {
        model,
        contents,
        ...(opts.temperature !== undefined || opts.maxOutputTokens !== undefined
            ? { generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxOutputTokens } }
            : {}),
        ...(opts.systemInstruction
            ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } }
            : {}),
    };

    // Try backend streaming proxy
    try {
        const res = await fetch(`${SERVER_URL}/api/gemini/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const json = line.slice(6).trim();
                    if (!json || json === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(json);
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) onChunk(text);
                    } catch { /* ignore malformed */ }
                }
            }
            return;
        }
    } catch {
        console.warn('[Gemini Stream] Backend not reachable, falling back to direct API');
    }

    // Fallback: direct streaming
    if (!FALLBACK_KEY) throw new Error('No Gemini API key available');
    const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:streamGenerateContent?alt=sse&key=${FALLBACK_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: body.contents, generationConfig: body.generationConfig }),
        }
    );

    if (!fallbackRes.body) return;
    const reader = fallbackRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json || json === '[DONE]') continue;
            try {
                const parsed = JSON.parse(json);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) onChunk(text);
            } catch { /* ignore */ }
        }
    }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Generate a short AI summary for a career context */
export async function aiSummarize(text: string, maxWords = 80): Promise<string> {
    return geminiGenerate(
        `Summarize the following in ${maxWords} words or fewer, concisely and professionally:\n\n${text}`,
        { temperature: 0.3, maxOutputTokens: 200 }
    );
}

/** Generate role-specific interview questions */
export async function generateInterviewQuestions(role: string, count = 5): Promise<string[]> {
    const text = await geminiGenerate(
        `Generate ${count} technical + behavioral interview questions for the role: "${role}". Return as a JSON array of strings only.`,
        { temperature: 0.7, maxOutputTokens: 500 }
    );
    try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
    } catch { /* fallback */ }
    return text.split('\n').filter(l => l.trim().length > 10).slice(0, count);
}
