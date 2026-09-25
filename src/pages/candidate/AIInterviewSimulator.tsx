import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import { 
    Video, Mic, MicOff, VideoOff, PhoneMissed, 
    Activity, ChevronLeft, ShieldAlert, Loader,
    TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveInterviewSession } from '../../services/interviewHistoryService';
import './AIInterviewSimulator.css';

const VAPI_PUBLIC_KEY = "af6cccc7-49bd-4211-b98f-a6405b51dcef"; 
const VAPI_AGENT_ID = "26a5d47b-6875-4906-9777-9bfcc11ea776";

export default function AIInterviewSimulator() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, dbUid } = useAuth();

    // Role passed from CareerPage or elsewhere
    const targetRole = (location.state as any)?.role || 'General Software Engineering';

    const [state, setState] = useState<'lobby' | 'interview' | 'results'>('lobby');
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [agentVolume, setAgentVolume] = useState(0);
    
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const vapiRef = useRef<any>(null);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    
    const [fillerWords, setFillerWords] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [sessionSaved, setSessionSaved] = useState(false);

    useEffect(() => {
        if (state === 'lobby' || state === 'interview') {
            if (camOn) {
                navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                    .then(stream => {
                        streamRef.current = stream;
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                        }
                    })
                    .catch(err => console.error("Camera access denied:", err));
            } else {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }
            }
        }
        
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [state, camOn]);

    useEffect(() => {
        const VapiClass = (Vapi as any).default || Vapi;
        const vapi = new VapiClass(VAPI_PUBLIC_KEY);
        vapiRef.current = vapi;

        vapi.on('call-start', () => {
            setIsConnecting(false);
            setIsConnected(true);
            setState('interview');
        });

        vapi.on('call-end', () => {
            setIsConnected(false);
            setState('results');
        });

        vapi.on('speech-start', () => setIsAiSpeaking(true));
        vapi.on('speech-end', () => setIsAiSpeaking(false));

        vapi.on('volume-level', (level: number) => {
            setAgentVolume(level);
        });

        vapi.on('message', (message: any) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const role = message.role;
                const text = message.transcript;
                
                setTranscript(prev => [...prev, { role, text }]);

                if (role === 'user') {
                    const words = text.split(' ').filter((w: string) => w.trim().length > 0);
                    setWordCount(prev => prev + words.length);
                    const fillers = words.filter((w: string) => ['um', 'uh', 'like', 'literally', 'basically', 'you know', 'so'].includes(w.toLowerCase()));
                    setFillerWords(prev => prev + fillers.length);
                }
            }
        });

        vapi.on('error', (e: any) => {
            console.error("Vapi Error:", e);
            setIsConnecting(false);
        });

        return () => {
            vapi.stop();
        };
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (state === 'interview' && isConnected) {
            timer = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [state, isConnected]);

    // Auto-save session to Firestore when results are shown
    useEffect(() => {
        if (state === 'results' && user && dbUid && !sessionSaved && timeElapsed > 10) {
            const fluency = Math.max(40, 95 - fillerWords * 2);
            const wpm = Math.round((wordCount / Math.max(1, timeElapsed)) * 60);

            saveInterviewSession({
                uid: dbUid,
                role: targetRole,
                durationSeconds: timeElapsed,
                wordCount,
                fillerWords,
                fluencyScore: fluency,
                wpm,
                transcript,
            }).then(() => {
                setSessionSaved(true);
                console.log('[Interview] Session saved to Firestore.');
            }).catch(err => console.error('[Interview] Failed to save session:', err));
        }
    }, [state]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startInterview = async () => {
        setIsConnecting(true);
        try {
            await vapiRef.current.start(VAPI_AGENT_ID);
        } catch (e) {
            setIsConnecting(false);
        }
    };

    const toggleMic = () => {
        if (vapiRef.current && isConnected) {
            const isCurrentlyMuted = vapiRef.current.isMuted();
            vapiRef.current.setMuted(!isCurrentlyMuted);
            setMicOn(isCurrentlyMuted); 
        } else {
            setMicOn(!micOn);
        }
    };

    const endInterview = () => {
        if (vapiRef.current) vapiRef.current.stop();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setState('results');
    };

    const fluencyScore = Math.max(40, 95 - fillerWords * 2);
    const wpm = Math.round((wordCount / Math.max(1, timeElapsed)) * 60);
    const orbScale = 1 + (agentVolume * 1.5);
    const recentTranscript = transcript.slice(-1);

    return (
        <div className="ai-sim-page">
            <header className="ai-sim-header">
                <div className="ai-sim-brand">
                    <Activity size={24} color="#a5b4fc" />
                    Capable AI Recruiter {targetRole !== 'General Software Engineering' && <span style={{ color: '#6366f1', marginLeft: '8px', fontSize: '13px', fontWeight: 500 }}>— {targetRole}</span>}
                </div>
                <button className="ai-sim-back" onClick={() => {
                    if (vapiRef.current) vapiRef.current.stop();
                    navigate('/candidate/communication');
                }}>
                    <ChevronLeft size={16} /> Exit
                </button>
            </header>

            <AnimatePresence mode="wait">
                {state === 'lobby' && (
                    <motion.div 
                        key="lobby"
                        className="ai-sim-lobby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div className="ai-sim-lobby-card">
                            <div className="ai-sim-preview">
                                {camOn ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="ai-sim-cam-feed-video" />
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <VideoOff size={48} color="#94a3b8" />
                                    </div>
                                )}
                                <div className="ai-sim-controls">
                                    <button className={`ai-btn-circle ${!micOn ? 'danger' : ''}`} onClick={() => setMicOn(!micOn)}>
                                        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                                    </button>
                                    <button className={`ai-btn-circle ${!camOn ? 'danger' : ''}`} onClick={() => setCamOn(!camOn)}>
                                        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="ai-sim-lobby-info">
                                <h2>Ready for your interview?</h2>
                                {targetRole !== 'General Software Engineering' && (
                                    <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: '#a5b4fc' }}>
                                        🎯 Interview configured for: <strong>{targetRole}</strong>
                                    </div>
                                )}
                                <p>You are about to join a real-time behavioral interview with Capable AI. Speak naturally — the AI handles interruptions and pacing. This session will be saved to your profile.</p>
                                
                                <div className="ai-check"><ShieldAlert size={16} color="#a5b4fc" /> Audio System Ready</div>
                                <div className="ai-check">
                                    <ShieldAlert size={16} color={micOn ? "#10b981" : "#ef4444"} /> 
                                    {micOn ? "Microphone enabled" : "Microphone disabled"}
                                </div>
                                <div className="ai-check"><ShieldAlert size={16} color="#10b981" /> Session will be saved & scored</div>

                                <button 
                                    className="ai-btn-join" 
                                    onClick={startInterview}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? <><Loader size={20} className="spinner" style={{display:'inline-block'}} /> Connecting...</> : "Start Interview"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {state === 'interview' && (
                    <motion.div 
                        key="interview"
                        className="ai-sim-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="ai-orb-container">
                            {isAiSpeaking && (
                                <>
                                    <div className="ai-orb-rings"></div>
                                    <div className="ai-orb-rings"></div>
                                    <div className="ai-orb-rings"></div>
                                </>
                            )}
                            <div 
                                className="ai-orb" 
                                style={{ 
                                    transform: `scale(${isAiSpeaking ? orbScale : 1})`,
                                    boxShadow: isAiSpeaking 
                                        ? `0 0 ${40 + agentVolume*100}px rgba(99, 102, 241, 0.8), inset 0 0 20px rgba(255,255,255,0.8)`
                                        : `0 0 40px rgba(99, 102, 241, 0.4), inset 0 0 10px rgba(255,255,255,0.2)`
                                }}
                            ></div>
                        </div>

                        <div className={`ai-status-text ${isAiSpeaking ? 'speaking' : ''}`}>
                            {isAiSpeaking ? 'AI is speaking' : 'Listening...'}
                        </div>

                        {camOn && (
                            <div className="user-pip">
                                <video ref={videoRef} autoPlay playsInline muted />
                            </div>
                        )}

                        {recentTranscript.length > 0 && (
                            <div className="ai-sim-live-transcript">
                                {recentTranscript.map((msg, idx) => (
                                    <div key={idx} className="transcript-bubble">
                                        <strong style={{ color: msg.role === 'user' ? '#a5b4fc' : '#10b981', marginRight: '8px' }}>
                                            {msg.role === 'user' ? 'You:' : 'AI:'}
                                        </strong> 
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="ai-sim-bottom-bar">
                            <div className="ai-sim-metrics">
                                <div className="metric-pill">Time <span className="metric-val">{formatTime(timeElapsed)}</span></div>
                                <div className="metric-pill">Words <span className="metric-val">{wordCount}</span></div>
                                <div className="metric-pill">Fillers <span className="metric-val" style={{color: fillerWords > 5 ? '#f59e0b' : 'white'}}>{fillerWords}</span></div>
                            </div>
                            
                            <div className="ai-sim-action-bar">
                                <button className={`ai-btn-circle ${!micOn ? 'danger' : ''}`} onClick={toggleMic}>
                                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                                <button className="ai-btn-end" onClick={endInterview}>
                                    <PhoneMissed size={16} /> End Call
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {state === 'results' && (
                    <motion.div 
                        key="results"
                        className="ai-sim-results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="ai-sim-lobby-card" style={{ display: 'block', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Interview Complete</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '16px' }}>Here is how you performed across key communication metrics.</p>
                            {sessionSaved && (
                                <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '32px' }}>✓ Session saved to your profile — track your improvement over time.</p>
                            )}
                            
                            <div className="ai-results-grid" style={{ justifyContent: 'center' }}>
                                <div className="ai-res-card">
                                    <span className="res-val" style={{ color: fluencyScore >= 80 ? '#10b981' : '#f59e0b' }}>{fluencyScore}%</span>
                                    <span className="res-label">Fluency Score</span>
                                </div>
                                <div className="ai-res-card">
                                    <span className="res-val" style={{ color: fillerWords > 5 ? '#f59e0b' : '#10b981' }}>{fillerWords}</span>
                                    <span className="res-label">Filler Words</span>
                                </div>
                                <div className="ai-res-card">
                                    <span className="res-val" style={{ color: '#6366f1' }}>{wpm}</span>
                                    <span className="res-label">Words per minute</span>
                                </div>
                                <div className="ai-res-card">
                                    <span className="res-val" style={{ color: '#a5b4fc' }}>{formatTime(timeElapsed)}</span>
                                    <span className="res-label">Duration</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
                                <button className="ai-btn-join" onClick={() => setState('lobby')} style={{ maxWidth: '220px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    Practice Again
                                </button>
                                <button className="ai-btn-join" onClick={() => navigate('/candidate/communication')} style={{ maxWidth: '220px' }}>
                                    Back to Hub
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
