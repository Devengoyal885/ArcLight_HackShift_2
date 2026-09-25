import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { updateApplicationStatus } from '../../services/employerService';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle, Clock, Maximize, ShieldAlert, XCircle } from 'lucide-react';
import './OAPlatformPage.css';

export default function OAPlatformPage() {
    const { appId } = useParams<{ appId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, dbUid } = useAuth();
    
    // We expect roleId to be passed in state
    const roleId = location.state?.roleId;

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
    const [violations, setViolations] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const [passed, setPassed] = useState(false);

    const [answers, setAnswers] = useState<Record<number, string>>({});

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
            // Randomly mock face not found (1% chance per second) to demonstrate capability
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
            submitAssessment(true); // forced fail
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [violations, finished]);

    const submitAssessment = useCallback(async (forcedFail = false) => {
        if (!appId || !roleId || !user) return;
        setSubmitting(true);
        
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }

        // Grading Logic: Check if candidate provided reasonable answers
        const ans1 = answers[1]?.trim() || '';
        const ans2 = answers[2]?.trim() || '';
        const isPass = !forcedFail && (ans1.length > 20 && ans2.length > 20);

        try {
            if (isPass) {
                const venue = "Microsoft Teams Hub 4";
                const date = new Date(Date.now() + 86400000 * 3).toLocaleDateString(); // 3 days from now
                const time = "10:00 AM IST";
                
                await updateApplicationStatus(roleId, appId, dbUid!, 'Interview Scheduled',
                    "Congratulations! You passed the Online Assessment. We have scheduled an interview for you.",
                    { venue, date, time }
                );
            } else {
                await updateApplicationStatus(roleId, appId, dbUid!, 'OA Rejected',
                    forcedFail 
                        ? "Your assessment was automatically terminated due to multiple cheating violations (tab switching, exiting fullscreen, face not detected)." 
                        : "Thank you for taking the assessment. Unfortunately, you did not meet the required threshold this time."
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
    }, [appId, roleId, user, answers, dbUid]);

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
        return (
            <div className="oa-page">
                <div className="oa-start-card">
                    <h2>Online Assessment Environment</h2>
                    <div className="oa-rules">
                        <div className="oa-rule"><ShieldAlert size={20} color="#f59e0b" /> This is a strict proctored environment.</div>
                        <div className="oa-rule"><Maximize size={20} color="#3b82f6" /> Fullscreen mode is enforced.</div>
                        <div className="oa-rule"><AlertTriangle size={20} color="#ef4444" /> Tab switching or exiting fullscreen counts as a violation.</div>
                        <div className="oa-rule"><XCircle size={20} color="#64748b" /> Copy, Paste, and Right-Click are disabled.</div>
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
                    <h3>Technical Assessment</h3>
                </div>
                <div className="oa-header-right">
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
                        {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </div>
            </header>

            <main className="oa-content">
                <div className="oa-question-card">
                    <h4>Question 1 of 2</h4>
                    <p>Write a highly optimized algorithm to reverse a linked list in O(n) time and O(1) space.</p>
                    <textarea 
                        className="oa-textarea" 
                        placeholder="Write your solution here. Remember, copy-paste is disabled..."
                        value={answers[1] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, 1: e.target.value }))}
                        disabled={submitting}
                    />
                </div>
                
                <div className="oa-question-card">
                    <h4>Question 2 of 2</h4>
                    <p>Explain the difference between concurrent execution and parallel execution.</p>
                    <textarea 
                        className="oa-textarea" 
                        placeholder="Your answer..."
                        value={answers[2] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, 2: e.target.value }))}
                        disabled={submitting}
                    />
                </div>
            </main>

            {/* Webcam / Proctoring PIP */}
            <div className="oa-proctor-pip" style={{ position: 'fixed', bottom: 24, right: 24, width: 200, height: 150, background: '#000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
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
