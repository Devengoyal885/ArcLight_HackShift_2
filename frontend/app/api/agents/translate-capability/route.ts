import { NextResponse } from 'next/server';
import type { MLCapability } from '@/types';

// ─── AccessHire ML Skills Discovery Agent Proxy ─────────────
// Proxies browser requests to the FastAPI + MPNet backend.
// Target: POST ${process.env.ACCESSHIRE_ML_API_URL}/infer-capabilities

interface MLApiResponse {
  capabilities: MLCapability[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Input text is required', status: 400 },
        { status: 400 },
      );
    }

    const rawMlApiUrl = process.env.ACCESSHIRE_ML_API_URL;
    if (!rawMlApiUrl || !rawMlApiUrl.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ML API URL is not configured (ACCESSHIRE_ML_API_URL)',
          status: 503,
        },
        { status: 503 },
      );
    }

    // Normalize URL to prevent trailing slashes or duplicate paths
    let baseUrl = rawMlApiUrl.trim().replace(/^["']|["']$/g, '');
    baseUrl = baseUrl.replace(/\/+$/, '');
    baseUrl = baseUrl.replace(/\/infer-capabilities\/?$/i, '');
    baseUrl = baseUrl.replace(/\/api\/?$/i, '');
    baseUrl = baseUrl.replace(/\/+$/, '');

    const inferUrl = `${baseUrl}/infer-capabilities`;
    const top_k = typeof body.top_k === 'number' ? body.top_k : 8;

    // Safe debugging logs (no secrets or sensitive data logged)
    console.log("ACCESSHIRE ML URL:", process.env.ACCESSHIRE_ML_API_URL);
    console.log("ACCESSHIRE ML ENDPOINT:", `${process.env.ACCESSHIRE_ML_API_URL?.replace(/\/+$/, '')}/infer-capabilities`);
    console.log("[ML Proxy] Outbound request to:", inferUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const mlRes = await fetch(inferUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'AccessHire-Proxy/1.0',
      },
      body: JSON.stringify({ text: text.trim(), top_k }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("FastAPI response status:", mlRes.status);

    if (!mlRes.ok) {
      const errText = await mlRes.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          success: false,
          error: "ML backend request failed",
          status: mlRes.status,
          detail: errText,
        },
        { status: mlRes.status },
      );
    }

    const mlData: MLApiResponse = await mlRes.json();

    if (!mlData.capabilities || !Array.isArray(mlData.capabilities)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response format from ML API',
          status: 502,
        },
        { status: 502 },
      );
    }

    // Map capabilities — preserve all ML signals
    const capabilities: MLCapability[] = mlData.capabilities.map((c) => ({
      capability: c.capability,
      confidence: typeof c.confidence === 'number' ? Math.round(c.confidence * 10) / 10 : 0,
      semantic_score: c.semantic_score,
      keyword_score: c.keyword_score,
      evidence_score: c.evidence_score,
      evidence_snippet: c.evidence_snippet,
      category: c.category || 'AI-Inferred Capability',
    }));

    return NextResponse.json({
      success: true,
      capabilities,
      source: 'live',
      model: 'AccessHire MPNet',
      capability_count: capabilities.length,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'ML API request timed out (20s). The backend may be starting up.',
          status: 504,
        },
        { status: 504 },
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown server error';

    return NextResponse.json(
      { success: false, error: message, status: 500 },
      { status: 500 },
    );
  }
}
