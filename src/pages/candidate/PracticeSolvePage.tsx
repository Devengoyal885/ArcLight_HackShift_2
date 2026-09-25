import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

import CodingIDE from './CodingIDE';
import type { CodingProblem } from '../../types/domain';
import { fetchLeetCodeProblemDetails, normalizeDifficulty } from '../../services/leetcodeService';
import type { LCProblem } from '../../services/leetcodeService';
import { getStarterCode } from '../../services/problemService';

export default function PracticeSolvePage() {
    const { titleSlug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!titleSlug) {
            navigate('/candidate/practice', { replace: true });
            return;
        }

        const lcProblem = location.state?.lcProblem as LCProblem | undefined;

        fetchLeetCodeProblemDetails(titleSlug)
            .then(details => {
                const p: CodingProblem = {
                    id: details.questionId,
                    domain: 'dsa',
                    topic: details.topicTags?.[0]?.name || 'competitive',
                    difficulty: normalizeDifficulty(details.difficulty),
                    title: details.title,
                    description: `<html-content>${details.content}
                    
                    <div style="margin-top: 40px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #334155; font-size: 15px;">📝 LeetCode Practice Mode</h3>
                        <ul style="color: #475569; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
                            <li>Write your solution using standard I/O or standard class methods.</li>
                            <li>The test cases provided are raw inputs from LeetCode. Compare your output with the examples above.</li>
                            <li>Once you are satisfied, copy your code and submit it on the LeetCode website for official judging!</li>
                        </ul>
                    </div>
                    `,
                    constraints: [], // LC includes constraints in the HTML description
                    examples: [],
                    testCases: [
                        { 
                            id: 'lc-tc-1', 
                            stdin: details.exampleTestcases || '', 
                            expectedOutput: '(Compare with description)', 
                            isHidden: false 
                        }
                    ],
                    starterCode: getStarterCode(details.title, 'Standard Input'),
                    roles: [],
                    timeSeconds: 7200,
                };
                setProblem(p);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load problem details. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });

    }, [titleSlug, location.state, navigate]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#fdfdfd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div className="prac-spinner" />
                    <p style={{ color: '#64748b' }}>Loading problem details...</p>
                </div>
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div style={{ minHeight: '100vh', background: '#fdfdfd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#ef4444' }}>{error || 'Problem not found'}</p>
                <button onClick={() => navigate('/candidate/preparation?tab=practice')} style={{ marginLeft: 16, padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 4 }}>Go Back</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fdfdfd', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                <CodingIDE 
                    problem={problem}
                    problemIndex={0}
                    totalProblems={1}
                    onSubmit={async () => {
                        setTimeout(() => {
                            alert("Great job! Please copy your code and submit it directly on LeetCode for an official Accepted verdict.");
                        }, 100);
                    }}
                    onSkip={() => {
                        navigate('/candidate/preparation?tab=practice');
                    }}
                    practiceMode={true}
                />
            </div>
        </div>
    );
}
