import { NextResponse } from 'next/server';
import { callGeminiFlash } from '@/lib/gemini';

export interface BiasAuditFlag {
  id: string;
  category: 'Career Gap' | 'Education Tier' | 'Geographic Location';
  severity: 'high' | 'medium' | 'low';
  title: string;
  finding: string;
  recommendation: string;
  disparityPercentage: number;
}

export interface BiasAuditResponse {
  auditFlags: BiasAuditFlag[];
  overallParityScore: number;
}

export async function POST(req: Request) {
  try {
    const systemInstruction = `You are AccessHire's Bias Audit Agent.
Analyze enterprise hiring parity metrics across career-gap duration, education tier, and geographic location.

Identify systemic disparities where candidate capability scores do not align with match/callback rates due to legacy screening proxies.

Generate 3 plain-language audit flags. Each flag must include:
- category: ('Career Gap' | 'Education Tier' | 'Geographic Location')
- severity: ('high' | 'medium' | 'low')
- title: Short headline
- finding: Clear empirical finding (e.g. 24% disparity)
- recommendation: Actionable recommendation for HR reviewer
- disparityPercentage: Number (e.g. 24)

Return valid JSON matching:
{
  "overallParityScore": 76,
  "auditFlags": [
    {
      "id": "flag-1",
      "category": "Career Gap",
      "severity": "high",
      "title": "Career Continuity Bias Detected in Pipeline",
      "finding": "Candidates with a 2+ year career gap are matched to 24% fewer opportunities on average despite equivalent verified technical capability twin scores.",
      "recommendation": "Recommend reviewing gap-related keyword filters and enabling capability-first scoring for initial screening.",
      "disparityPercentage": 24
    }
  ]
}`;

    const prompt = `Perform a live bias audit on candidate pool parity metrics across gap duration, education tier, and location.`;

    const result = await callGeminiFlash<BiasAuditResponse>(prompt, systemInstruction, 8000);

    if (result.data && Array.isArray(result.data.auditFlags) && result.data.auditFlags.length > 0) {
      return NextResponse.json({ audit: result.data, source: result.source });
    }

    // Fallback bias audit findings
    const fallback: BiasAuditResponse = {
      overallParityScore: 74,
      auditFlags: [
        {
          id: 'flag-1',
          category: 'Career Gap',
          severity: 'high',
          title: 'Career Continuity Bias Detected in Pipeline',
          finding: 'Candidates with a 2+ year career gap are matched to 24% fewer opportunities on average despite having equivalent verified technical capability scores (86% vs 88%).',
          recommendation: 'Recommend de-weighting employment continuity in automated filters and shifting to capability-first screening.',
          disparityPercentage: 24,
        },
        {
          id: 'flag-2',
          category: 'Geographic Location',
          severity: 'medium',
          title: 'Tier 2/3 City Location Penalty',
          finding: 'Candidates residing in Tier 2/3 cities (e.g. Lucknow, Hubli, Dharwad) experience an 18% lower interview callback rate for remote-first positions.',
          recommendation: 'Recommend standardizing remote eligibility tagging and stripping location filters from initial automated shortlists.',
          disparityPercentage: 18,
        },
        {
          id: 'flag-3',
          category: 'Education Tier',
          severity: 'medium',
          title: 'Degree Proxy Weight Disparity',
          finding: 'Self-taught and non-traditional candidates with 85%+ verified capability scores face a 15% lower initial match rate compared to Tier-1 degree holders.',
          recommendation: 'Recommend applying Job Fairness Agent rewrite to eliminate CS degree requirements on candidate pipelines.',
          disparityPercentage: 15,
        },
      ],
    };

    return NextResponse.json({ audit: fallback, source: 'fallback' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
