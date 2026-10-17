export interface GeminiResponse<T> {
  data: T | null;
  source: 'live' | 'fallback';
  error?: string;
}

export async function callGeminiFlash<T = any>(
  prompt: string,
  systemInstruction?: string,
  timeoutMs: number = 8000
): Promise<GeminiResponse<T>> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[Gemini Client] No API Key provided in environment. Using fallback.');
    return { data: null, source: 'fallback', error: 'No API Key configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2,
    }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Gemini API Error ${res.status}]`, errText);
      return { data: null, source: 'fallback', error: `Gemini API returned ${res.status}` };
    }

    const result = await res.json();
    const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return { data: null, source: 'fallback', error: 'Empty text in Gemini response' };
    }

    const parsedData = JSON.parse(textOutput) as T;
    return { data: parsedData, source: 'live' };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Gemini Client Exception]', err?.message || err);
    return {
      data: null,
      source: 'fallback',
      error: err?.name === 'AbortError' ? 'Gemini API call timed out (8s limit)' : err?.message || 'Network error',
    };
  }
}
