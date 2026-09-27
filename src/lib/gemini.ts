/**
 * gemini.ts - CapAble AI Client
 * -------------------------------------------------------------------------
 * SECURITY: Zero API keys in this file. All calls go through the CapAble
 * backend proxy (server/index.ts -> /api/gemini and /api/gemini/stream).
 *
 * Keys (Gemini + Groq) live ONLY in the server .env file.
 * They are never compiled into the browser bundle.
 *
 * Public API (unchanged - all callers keep working):
 *   callGemini(prompt, systemInstruction?, model?)       -> Promise<string>
 *   callGeminiJSON<T>(prompt, systemInstruction?, model?) -> Promise<T | null>
 *   callGeminiStream(prompt, systemInstruction?, model?) -> AsyncGenerator<string>
 */

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (SERVER_URL && !SERVER_URL.startsWith('http')) SERVER_URL = 'https://' + SERVER_URL;
if (SERVER_URL.includes('up.railway.app')) SERVER_URL = SERVER_URL.replace('http://', 'https://');

// Internal proxy helper
async function proxyGenerate(
    contents: unknown[],
    generationConfig?: Record<string, unknown>,
    systemInstruction?: string,
    model = 'gemini-2.5-flash',
): Promise<string> {
    const body: Record<string, unknown> = { model, contents };
    if (generationConfig) body.generationConfig = generationConfig;
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const res = await fetch(`${SERVER_URL}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[Gemini Proxy] ${res.status}: ${errText}`);
    }

    const data = await res.json() as Record<string, unknown>;
    return (data?.candidates as any)?.[0]?.content?.parts?.[0]?.text ?? '';
}

// Public API

/** Standard (non-streaming) generate. Returns full response as string. */
export async function callGemini(
    prompt: string,
    systemInstruction?: string,
    model = 'gemini-2.5-flash',
): Promise<string> {
    return proxyGenerate(
        [{ parts: [{ text: prompt }] }],
        { temperature: 0.3, maxOutputTokens: 8192 },
        systemInstruction,
        model,
    );
}

/**
 * JSON-mode generate. Parses the response as JSON and returns typed result.
 * Returns null on parse failure instead of throwing.
 */
export async function callGeminiJSON<T>(
    prompt: string,
    systemInstruction: string,
    model = 'gemini-2.5-flash',
): Promise<T | null> {
    const raw = await proxyGenerate(
        [{ parts: [{ text: prompt }] }],
        { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        systemInstruction,
        model,
    );

    if (!raw.trim()) {
        console.error('[Gemini] Empty response');
        return null;
    }

    try {
        const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error('[Gemini] JSON parse error. Raw:', raw, e);
        return null;
    }
}

/** Streaming generate. Yields text chunks as they arrive from SSE stream. */
export async function* callGeminiStream(
    prompt: string,
    systemInstruction?: string,
    model = 'gemini-2.5-flash',
): AsyncGenerator<string, void, unknown> {
    const body: Record<string, unknown> = {
        model,
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const res = await fetch(`${SERVER_URL}/api/gemini/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`[Gemini Stream Proxy] ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') return;

            try {
                const data = JSON.parse(dataStr);
                const chunk = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.choices?.[0]?.delta?.content;
                if (chunk) yield chunk;
            } catch {
                // Malformed SSE chunk - skip silently
            }
        }
    }
}
