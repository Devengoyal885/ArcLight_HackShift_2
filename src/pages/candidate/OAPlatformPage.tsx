import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { updateApplicationStatus } from '../../services/employerService';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle, Clock, Maximize, ShieldAlert, XCircle, Code, Brain } from 'lucide-react';
import { getAptitudeQuizQuestions, type AptitudeQuestion } from '../../data/aptitudeData';
import { callGeminiJSON } from '../../lib/gemini';
import CodingIDE from './CodingIDE';
import type { CodingProblem, SupportedLanguage, TestResult } from '../../types/domain';
import './OAPlatformPage.css';

const MOCK_CODING_PROBLEM: CodingProblem = {
    id: 'oa-coding-1',
    domain: 'dsa',
    topic: 'arrays',
    difficulty: 'medium',
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
    ],
    starterCode: {
        javascript: 'function twoSum(nums, target) {\n    // Write your code here\n}',
        python: 'def twoSum(nums, target):\n    # Write your code here\n    pass',
    },
    testCases: [
        { id: 'tc1', stdin: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
        { id: 'tc2', stdin: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false },
        { id: 'tc3', stdin: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true },
    ],
    roles: [],
    timeSeconds: 1800
};

export default function OAPlatformPage() {
    const { appId } = useParams<{ appId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, dbUid } = useAuth();
    
    // We expect roleId to be passed in state
    const roleId = location.state?.roleId;

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes total
    const [violations, setViolations] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const [passed, setPassed] = useState(false);

    // Mixed Assessment State
    const [section, setSection] = useState<'mcq' | 'coding' | 'essay'>('mcq');
    const [mcqs, setMcqs] = useState<AptitudeQuestion[]>([]);
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [essayAnswer, setEssayAnswer] = useState('');
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcInput, setCalcInput] = useState('');
    
    // Coding Assessment State
    const [codingScore, setCodingScore] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordingChunks, setRecordingChunks] = useState<BlobPart[]>([]);
    const [faceVisible, setFaceVisible] = useState(true);

    const requestFullscreenAndMedia = async () => {
        try {
            // Screen Recording
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            // Webcam
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            if (videoRef.current) {
                videoRef.current.srcObject = camStream;
            }

            const combinedStream = new MediaStream([...screenStream.getTracks(), ...camStream.getAudioTracks()]);
            const recorder = new MediaRecorder(combinedStream);
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setRecordingChunks(prev => [...prev, e.data]);
            };
            recorder.start(1000); // chunk every second
            mediaRecorderRef.current = recorder;

            // Stop recording if user stops sharing screen natively
            screenStream.getVideoTracks()[0].onended = () => {
                setViolations(v => v + 3); // Auto-fail
                alert('CRITICAL VIOLATION: Screen sharing stopped.');
            };

            await document.documentElement.requestFullscreen();
            
            // Load 5 MCQs and randomize order
            const q = getAptitudeQuizQuestions(['logical', 'quantitative'], 5).sort(() => Math.random() - 0.5);
            setMcqs(q);
            
            setIsFullscreen(true);
            setStarted(true);
        } catch (e) {
            console.error(e);
            alert('Fullscreen, Camera, and Screen Sharing permissions are strictly required for this assessment.');
        }
    };

    // Fullscreen and Tab visibility monitoring
    useEffect(() => {
        if (!started || finished) return;

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                setViolations(v => v + 1);
                alert('WARNING: Exiting fullscreen is recorded as a cheating violation.');
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(v => v + 1);
                alert('WARNING: Switching tabs is not allowed. A violation has been recorded.');
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };
        
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            alert('Copying is disabled during the assessment.');
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
        };
    }, [started, finished]);

    // Real-time WebCam Face Detection using HTML5 FaceDetector API
    useEffect(() => {
        if (!started || finished) return;
        const intervalId = setInterval(async () => {
            if (!videoRef.current) return;
            // @ts-ignore
            if ('FaceDetector' in window) {
                try {
                    // @ts-ignore
                    const faceDetector = new window.FaceDetector();
                    const faces = await faceDetector.detect(videoRef.current);
                    if (faces.length === 0) {
                        setFaceVisible(false);
                        setViolations(v => v + 1);
                        console.warn("Proctoring: No face detected");
                    } else if (faces.length > 1) {
                        setFaceVisible(false);
                        setViolations(v => v + 1);
                        alert("PROCTORING WARNING: Multiple faces detected! This is a severe violation.");
                    } else {
                        setFaceVisible(true);
                    }
                } catch (e) {
                    console.log("FaceDetector API error:", e);
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(intervalId);
    }, [started, finished]);

    // Timer
    useEffect(() => {
        if (!started || finished || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [started, finished, timeLeft]);

    // Mock AI Face Detection
    useEffect(() => {
        if (!started || finished) return;
        const faceCheck = setInterval(() => {
            if (Math.random() < 0.01) {
                setFaceVisible(false);
                setViolations(v => v + 1);
                setTimeout(() => setFaceVisible(true), 3000);
            }
        }, 1000);
        return () => clearInterval(faceCheck);
    }, [started, finished]);

    // Auto-fail on too many violations
    useEffect(() => {
        if (violations >= 3 && !finished) {
            submitAssessment(true, 0); // forced fail
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [violations, finished]);

    const submitAssessment = useCallback(async (forcedFail = false, codeScore = codingScore) => {
        if (!appId || !roleId || !user) return;
        setSubmitting(true);
        
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }

        // Grading Logic
        let mcqScore = 0;
        mcqs.forEach((q) => {
            if (mcqAnswers[q.id] !== undefined) {
                if (mcqAnswers[q.id] === q.correctIndex) {
                    mcqScore += 1;
                } else {
                    mcqScore -= 0.25; // Negative marking
                }
            }
        });
        
        // AI Grading for Essay
        let essayScore = 0;
        let aiFeedback = '';
        if (essayAnswer.trim().length > 15) {
            try {
                const prompt = `Grade this candidate's short subjective/essay response on a scale of 0 to 10 based on clarity, technical depth, and completeness. \nEssay: "${essayAnswer}"\nReturn a JSON with { "score": number, "feedback": "1 sentence short reason" }`;
                const result = await callGeminiJSON<{ score: number, feedback: string }>(prompt, "You are an expert grading assistant. Always return strictly valid JSON.");
                essayScore = result?.score ?? 5;
                aiFeedback = result?.feedback ?? "AI grading fallback applied.";
            } catch (e) {
                console.error("AI Essay Grading failed", e);
                essayScore = 5; // fallback
                aiFeedback = "Grading timeout fallback applied.";
            }
        }

        // Pass condition: At least 3 MCQs correct AND Code score > 50 AND (if essay exists) essay > 4
        const isPass = !forcedFail && (mcqScore >= 3 && codeScore > 50 && (essayAnswer.trim() === '' || essayScore >= 4));

        try {
            if (isPass) {
                const venue = "Microsoft Teams Hub 4";
                const date = new Date(Date.now() + 86400000 * 3).toLocaleDateString(); // 3 days from now
                const time = "10:00 AM IST";
                
                await updateApplicationStatus(roleId, appId, dbUid!, 'Interview Scheduled',
                    `Congratulations! You passed the Mixed OA. Scores -> MCQ: ${mcqScore}/${mcqs.length}, Coding: ${codeScore}%, Subjective: ${essayScore}/10 (${aiFeedback}). We have scheduled an interview.`,
                    { venue, date, time }
                );
            } else {
                await updateApplicationStatus(roleId, appId, dbUid!, 'OA Rejected',
                    forcedFail 
                        ? "Your assessment was automatically terminated due to multiple cheating violations (tab switching, exiting fullscreen, face not detected)." 
                        : `Thank you for taking the assessment. Unfortunately, your scores (MCQ: ${mcqScore}/${mcqs.length}, Coding: ${codeScore}%, Subjective: ${essayScore}/10) did not meet the required threshold this time.`
                );
            }
            
            setPassed(isPass);
            setFinished(true);
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(console.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to submit assessment.');
        } finally {
            setSubmitting(false);
        }
    }, [appId, roleId, user, dbUid, mcqs, mcqAnswers, codingScore]);

    if (!appId || !roleId) {
        return <div className="oa-page">Invalid Assessment Link</div>;
    }

    if (finished) {
        return (
            <div className="oa-page">
                <div className="oa-finished-card">
                    {passed ? (
                        <>
                            <CheckCircle size={64} color="#10b981" />
                            <h2>Assessment Passed!</h2>
                            <p>You have successfully cleared the OA stage.</p>
                            <div className="oa-finished-msg">
                                Check your Applications Dashboard for Interview details!
                            </div>
                        </>
                    ) : (
                        <>
                            <XCircle size={64} color="#ef4444" />
                            <h2>Assessment Failed</h2>
                            <p>You did not clear the assessment.</p>
                            <div className="oa-finished-msg">
                                Your application status has been updated.
                            </div>
                        </>
                    )}
                    <button className="oa-btn" onClick={() => navigate('/candidate/applications')}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    if (!started) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 1000 * 60 * 60); // 1 hr ago
        const windowEnd = new Date(now.getTime() + 1000 * 60 * 60); // 1 hr from now
        const isOutOfWindow = now < windowStart || now > windowEnd;

        if (isOutOfWindow) {
            return (
                <div className="oa-page">
                    <div className="oa-start-card">
                        <Clock size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                        <h2>Assessment Window Closed</h2>
                        <p>This assessment is only available between:</p>
                        <p style={{ fontWeight: 600, color: '#0f172a', margin: '8px 0 24px' }}>
                            {windowStart.toLocaleString()} - {windowEnd.toLocaleString()}
                        </p>
                        <button className="oa-btn" onClick={() => navigate('/candidate/applications')}>Return to Dashboard</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="oa-page">
                <div className="oa-start-card">
                    <h2>Online Assessment Environment</h2>
                    <div style={{ background: '#eff6ff', color: '#1e40af', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <Clock size={16} /> Window closes at {windowEnd.toLocaleTimeString()}
                    </div>
                    <div className="oa-start-modules">
                        <div className="oa-module">
                            <Brain size={24} color="#2563eb" />
                            <div>
                                <h4>Part 1: Aptitude Test</h4>
                                <p>Multiple Choice Questions (Logical & Quant)</p>
                            </div>
                        </div>
                        <div className="oa-module">
                            <Code size={24} color="#10b981" />
                            <div>
                                <h4>Part 2: Live Coding</h4>
                                <p>Algorithmic Data Structures Challenge</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="oa-rules">
                        <div className="oa-rule"><ShieldAlert size={20} color="#f59e0b" /> This is a strict proctored environment.</div>
                        <div className="oa-rule"><Maximize size={20} color="#3b82f6" /> Fullscreen mode is enforced.</div>
                        <div className="oa-rule"><AlertTriangle size={20} color="#ef4444" /> Tab switching or exiting fullscreen counts as a violation.</div>
                        <div className="oa-rule"><CheckCircle size={20} color="#10b981" /> Webcam & Screen Recording will be active. AI Face tracking enabled.</div>
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>3 violations will result in automatic disqualification.</p>
                    <button className="oa-btn" onClick={requestFullscreenAndMedia}>Agree & Start Assessment</button>
                </div>
            </div>
        );
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const secs = s % 60;
        return `${m}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="oa-platform">
            <header className="oa-header">
                <div className="oa-header-left">
                    <h3>Mixed Technical Assessment</h3>
                    <div className="oa-tabs">
                        <button 
                            className={`oa-tab ${section === 'mcq' ? 'active' : ''}`} 
                            onClick={() => setSection('mcq')}
                        >
                            <Brain size={16} /> MCQ
                        </button>
                        <button 
                            className={`oa-tab ${section === 'coding' ? 'active' : ''}`} 
                            onClick={() => setSection('coding')}
                        >
                            <Code size={16} /> Coding
                        </button>
                        <button 
                            className={`oa-tab ${section === 'essay' ? 'active' : ''}`} 
                            onClick={() => setSection('essay')}
                        >
                            <Brain size={16} /> Subjective
                        </button>
                    </div>
                </div>
                <div className="oa-header-right">
                    <button className="oa-btn-small" style={{ background: '#f1f5f9', color: '#334155', marginRight: 8 }} onClick={() => setShowCalculator(!showCalculator)}>
                        Calculator
                    </button>
                    <div className="oa-stat" style={{ color: violations > 0 ? '#ef4444' : '#64748b' }}>
                        Violations: {violations}/3
                    </div>
                    <div className="oa-stat timer">
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                    <button 
                        className="oa-btn-small" 
                        onClick={() => submitAssessment(false)}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                </div>
            </header>

            <main className="oa-content oa-content--mixed" style={{ padding: section === 'coding' ? 0 : '2rem', position: 'relative' }}>
                {showCalculator && (
                    <div style={{ position: 'absolute', top: 20, right: 20, background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600 }}>
                            Calculator <XCircle size={16} style={{ cursor: 'pointer' }} onClick={() => setShowCalculator(false)} />
                        </div>
                        <input type="text" value={calcInput} onChange={e => setCalcInput(e.target.value)} placeholder="e.g. 15 * 42" style={{ padding: '8px', width: '200px', border: '1px solid #cbd5e1', borderRadius: 4 }} />
                        <div style={{ marginTop: 8, fontWeight: 600, color: '#2563eb' }}>
                            Result: {(() => { try { return new Function('return ' + calcInput)() || ''; } catch { return 'Error'; } })()}
                        </div>
                    </div>
                )}
                
                {section === 'mcq' ? (
                    <div className="oa-mcq-container">
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }}>
                            {mcqs.map((q, idx) => (
                                <button 
                                    key={q.id}
                                    style={{
                                        width: 36, height: 36, borderRadius: 18, border: 'none',
                                        background: flaggedQuestions.has(q.id) ? '#f59e0b' : (mcqAnswers[q.id] !== undefined ? '#10b981' : '#e2e8f0'),
                                        color: mcqAnswers[q.id] !== undefined || flaggedQuestions.has(q.id) ? 'white' : '#475569',
                                        fontWeight: 600, cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        {mcqs.map((q, idx) => (
                            <div key={q.id} id={`q-${q.id}`} className="oa-question-card" style={{ borderLeft: flaggedQuestions.has(q.id) ? '4px solid #f59e0b' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>Question {idx + 1}</h4>
                                    <button 
                                        style={{ background: 'none', border: 'none', color: flaggedQuestions.has(q.id) ? '#f59e0b' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        onClick={() => {
                                            setFlaggedQuestions(prev => {
                                                const next = new Set(prev);
                                                if (next.has(q.id)) next.delete(q.id);
                                                else next.add(q.id);
                                                return next;
                                            });
                                        }}
                                    >
                                        <AlertTriangle size={14} /> {flaggedQuestions.has(q.id) ? 'Flagged' : 'Flag for review'}
                                    </button>
                                </div>
                                <p>{q.question}</p>
                                <div className="oa-options">
                                    {q.options.map((opt, oIdx) => (
                                        <label key={oIdx} className="oa-option">
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`}
                                                checked={mcqAnswers[q.id] === oIdx}
                                                onChange={() => setMcqAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : section === 'essay' ? (
                    <div className="oa-mcq-container">
                        <div className="oa-question-card">
                            <h4>Subjective / Essay Section</h4>
                            <p style={{ marginBottom: 16 }}>Please describe your approach to ensuring scalable architecture in a high-traffic web application. Mention at least two design patterns you would use.</p>
                            <textarea 
                                value={essayAnswer}
                                onChange={e => setEssayAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                style={{ width: '100%', height: '300px', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none', fontFamily: 'inherit', fontSize: '15px' }}
                            />
                            <div style={{ marginTop: 12, textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
                                {essayAnswer.length} characters
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: 'calc(100vh - 70px)', width: '100%', overflow: 'hidden' }}>
                        <CodingIDE 
                            problem={MOCK_CODING_PROBLEM}
                            problemIndex={1}
                            totalProblems={1}
                            practiceMode={false}
                            onSkip={() => setSection('mcq')}
                            onSubmit={(results, score, code, lang) => {
                                setCodingScore(score);
                                alert(`Coding Submitted! Score: ${score}%. Switch back to MCQs or Submit the entire assessment.`);
                                setSection('mcq');
                            }}
                        />
                    </div>
                )}
            </main>

            {/* Webcam / Proctoring PIP */}
            <div className="oa-proctor-pip" style={{ position: 'fixed', bottom: 24, right: 24, width: 200, height: 150, background: '#000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!faceVisible && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, textAlign: 'center', padding: 12 }}>
                        Face Not Detected
                    </div>
                )}
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', animation: 'pulse 2s infinite' }} /> REC
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    AI Active
                </div>
            </div>
        </div>
    );
}
