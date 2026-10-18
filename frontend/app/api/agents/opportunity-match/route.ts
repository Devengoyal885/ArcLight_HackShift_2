import { NextResponse } from 'next/server';
import { callGeminiFlash } from '@/lib/gemini';

export interface MatchBreakdown {
  opportunityFit: number;
  capabilityFit: number;
  evidenceFit: number;
  resumeFit: number;
  futureFit: number;
  overallMatch: number;
  missing_capabilities: string[];
  transferable_capabilities: string[];
}

export async function POST(req: Request) {
  try {
    const { capabilities, opportunityTitle, opportunityRequirements } = await req.json();

    const capabilitiesSummary = Array.isArray(capabilities)
      ? capabilities.map((c: any) => `${c.name || c.capability}: ${c.proficiency || c.confidence}% (Category: ${c.category || 'General'})`).join('\n')
      : 'Python: 91%, Full Stack: 93%, AI/ML: 88%, Problem Solving: 94%';

    const systemInstruction = `You are AccessHire's Inclusive Matching & Market Intelligence Agent.
Evaluate candidate capabilities against opportunity requirements based on DEMONSTRATED CAPABILITY, not degree titles or company brand names.

Calculate scores (0-100):
- opportunityFit: Overall alignment
- capabilityFit: Demonstrated skill overlay
- evidenceFit: Verified evidence confidence
- resumeFit: ATS alignment
- futureFit: Long-term growth potential
- missing_capabilities: Array of 1-3 specific skills needed
- transferable_capabilities: Array of 2-4 candidate skills that apply directly

Return valid JSON strictly matching:
{
  "opportunityFit": 92,
  "capabilityFit": 94,
  "evidenceFit": 90,
  "resumeFit": 88,
  "futureFit": 95,
  "overallMatch": 92,
  "missing_capabilities": ["Kubernetes", "Advanced MLOps"],
  "transferable_capabilities": ["Python System Architecture", "Data Pipeline Automation"]
}`;

    const prompt = `Candidate Capabilities:\n${capabilitiesSummary}\n\nOpportunity: "${opportunityTitle || 'Software Engineer'}"\nRequirements: "${opportunityRequirements || 'Python, REST APIs, System Design'}"`;

    const result = await callGeminiFlash<MatchBreakdown>(prompt, systemInstruction, 8000);

    if (result.data && typeof result.data.overallMatch === 'number') {
      return NextResponse.json({ match: result.data, source: result.source });
    }

    // Fallback match calculation
    const fallback: MatchBreakdown = {
      opportunityFit: 91,
      capabilityFit: 93,
      evidenceFit: 89,
      resumeFit: 87,
      futureFit: 94,
      overallMatch: 91,
      missing_capabilities: ['Enterprise MLOps', 'Kubernetes'],
      transferable_capabilities: ['Python', 'System Architecture', 'Event Automation'],
    };

    return NextResponse.json({ match: fallback, source: 'fallback' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
