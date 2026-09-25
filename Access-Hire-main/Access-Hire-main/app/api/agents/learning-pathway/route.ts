import { NextResponse } from 'next/server';
import { callGeminiFlash } from '@/lib/gemini';
import { sapLearningHubCourses } from '@/data/sapLearningHubCourses';

export async function POST(req: Request) {
  try {
    const { capabilityGap, targetRole } = await req.json();

    const courseListText = sapLearningHubCourses
      .map(c => `ID: ${c.id} | Title: ${c.title} | Topic: ${c.topic} | Level: ${c.level} | Description: ${c.description}`)
      .join('\n');

    const systemInstruction = `You are AccessHire's SAP Learning Pathway Agent.
Given a candidate capability gap and target role, select the 2 most relevant courses exclusively from the provided SAP Learning Hub catalog.

Catalog:
${courseListText}

Rules:
1. Select ONLY real courses from the catalog provided above. Do NOT invent new course names.
2. Provide a clear, personalized justification for why each selected SAP course bridges the capability gap for the target role.

Return valid JSON strictly matching:
{
  "recommendations": [
    {
      "courseId": "sap-course-1",
      "courseTitle": "Exact Course Title",
      "justification": "Why this course bridges the capability gap"
    }
  ]
}`;

    const prompt = `Capability Gap: "${capabilityGap || 'AI Evaluation & Cloud MLOps'}"\nTarget Role: "${targetRole || 'AI Operations Engineer'}"`;

    const result = await callGeminiFlash<any>(prompt, systemInstruction, 8000);

    if (result.data && Array.isArray(result.data.recommendations) && result.data.recommendations.length > 0) {
      const enriched = result.data.recommendations.map((rec: any) => {
        const fullCourse = sapLearningHubCourses.find(c => c.id === rec.courseId || c.title.toLowerCase().includes(rec.courseTitle?.toLowerCase()));
        return {
          ...rec,
          course: fullCourse || sapLearningHubCourses[0],
        };
      });
      return NextResponse.json({ recommendations: enriched, source: result.source });
    }

    // Fallback response
    const fallback = [
      {
        courseId: 'sap-course-2',
        courseTitle: sapLearningHubCourses[1].title,
        justification: `Directly builds hands-on model evaluation and batch inferencing skills to bridge your ${capabilityGap || 'AI Evaluation'} gap for ${targetRole || 'AI Operations Engineer'}.`,
        course: sapLearningHubCourses[1],
      },
      {
        courseId: 'sap-course-1',
        courseTitle: sapLearningHubCourses[0].title,
        justification: `Establishes core SAP Business AI architectural principles required for enterprise transition.`,
        course: sapLearningHubCourses[0],
      },
    ];

    return NextResponse.json({ recommendations: fallback, source: 'fallback' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
