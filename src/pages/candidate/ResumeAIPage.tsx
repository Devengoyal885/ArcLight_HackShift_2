import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, getProjects } from '../../services/profileService';
import { getCandidateApplications } from '../../services/employerService';
import { generateTailoredResumeHTMLStream, calculateATSMetricsFast } from '../../services/resumeParserService';
import type { UserCapability, UserProject } from '../../services/profileService';
import { FileText, ArrowRight, Brain, AlertCircle, Copy, CheckCircle2, Sparkles, Loader2, Download, Briefcase, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import './ResumeAIPage.css';

const FAMOUS_JDS = [
    {
        title: 'Google SWE',
        text: "Google is looking for a Software Engineer to work on complex, large-scale systems. Requirements: Strong in Data Structures & Algorithms. Experience in Java, C++, or Python. Familiarity with distributed systems, microservices, and high-scalability architectures. Excellent problem-solving skills and ability to thrive in an ambiguous environment."
    },
    {
        title: 'Amazon SDE',
        text: "Amazon is hiring a Software Development Engineer. Responsibilities include building highly available, scalable systems. Requirements: Proficiency in object-oriented design (Java/C++). Experience with AWS services (EC2, S3, DynamoDB, Lambda). Strong understanding of system design, RESTful APIs, and Agile methodologies."
    },
    {
        title: 'Frontend React Dev',
        text: "We are seeking a Senior Frontend Developer. Requirements: 3+ years experience with React.js and TypeScript. Deep understanding of state management (Redux, Zustand) and hooks. Strong HTML5/CSS3 skills (Tailwind, SCSS). Experience with Next.js, performance optimization, and responsive design. Ability to write clean, maintainable code."
    }
];

export default function ResumeAIPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);

    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'tailor' | 'applications'>('tailor');
    const [stage, setStage] = useState<'input' | 'analyzing' | 'generated' | 'streaming'>('input');
    const [jdText, setJdText] = useState(location.state?.jdText || '');
    const [loadingMsg, setLoadingMsg] = useState('');
    const [copied, setCopied] = useState(false);
    
    const [dataLoaded, setDataLoaded] = useState(false);
    const hasAutoStarted = useRef(false);
    
    const [atsMetrics, setAtsMetrics] = useState<{atsScore: number, keywordsMatched: string[], keywordsMissing: string[]} | null>(null);
    const [streamedHtml, setStreamedHtml] = useState<string>('');
    const resumeRef = useRef<HTMLDivElement>(null);
    
    const [applications, setApplications] = useState<any[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [template, setTemplate] = useState<'latex' | 'modern' | 'creative'>('latex');
    const [pages, setPages] = useState<'1' | '2'>('1');

    useEffect(() => {
        if (!user) return;
        setAppsLoading(true);
        getCandidateApplications(dbUid!)
            .then(setApplications)
            .catch(console.error)
            .finally(() => setAppsLoading(false));
    }, [user]);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            getCapabilities(dbUid!),
            getProjects(dbUid!)
        ]).then(([caps, projs]) => {
            setCapabilities(caps);
            setProjects(projs);
            setDataLoaded(true);
        }).catch(console.error);
    }, [user]);

    useEffect(() => {
        if (dataLoaded && location.state?.jdText && profile && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            handleGenerate();
        }
    }, [dataLoaded, location.state, profile]);

    const handleGenerate = async (overrideTemplate?: string) => {
        if (!profile) return;
        
        const activeTemplate = overrideTemplate && typeof overrideTemplate === 'string' ? overrideTemplate : template;
        if (overrideTemplate && typeof overrideTemplate === 'string') setTemplate(overrideTemplate as any);

        // 1. Instantly calculate ATS Metrics on client side
        setStage('streaming');
        setStreamedHtml('');
        
        const metrics = calculateATSMetricsFast(capabilities, jdText);
        setAtsMetrics(metrics);

        // 2. Stream the AI HTML response immediately
        try {
            const stream = generateTailoredResumeHTMLStream(
                { name: profile.name, headline: profile.headline, email: profile.email, location: profile.location, resumeText: profile.resumeText },
                capabilities,
                projects,
                jdText,
                { template: activeTemplate, pages }
            );
            
            for await (const chunk of stream) {
                setStreamedHtml(prev => prev + chunk);
            }
            
            setStage('generated');
        } catch (err) {
            console.error('Failed to stream resume', err);
            alert('Network Error. Please try again later.');
            setStage('input');
        }
    };

    const handleCopy = () => {
        if (!resumeRef.current) return;
        const text = resumeRef.current.innerText;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = () => {
        if (!resumeRef.current) return;
        const element = resumeRef.current;
        const opt = {
            margin:       0.5,
            filename:     `${profile?.name?.replace(/\s+/g, '_')}_Resume.pdf`,
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };
        html2pdf().set(opt).from(element).save();
    };

    const applyTemplate = (text: string) => {
        setJdText(text);
    };

    return (
        <div className="res-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="res-bg" />}

            <main className="res-main">
                <motion.div className="res-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="res-eyebrow"><Sparkles size={14} className="inline-icon"/> AI RESUME BUILDER</p>
                    <h1 className="res-title">Applications &<br /><em>AI Tailoring.</em></h1>
                    <p className="res-sub">
                        Track your applied roles or generate customized, ATS-friendly resumes using your verified capabilities and projects.
                    </p>
                </motion.div>

                <div className="res-tabs">
                    <button className={`res-tab ${activeTab === 'tailor' ? 'active' : ''}`} onClick={() => setActiveTab('tailor')}>🤖 AI Resume Tailor</button>
                    <button className={`res-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>📋 My Applications</button>
                    <Link to="/candidate/resume-builder" className="res-tab" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Palette size={14} /> Visual Builder
                    </Link>
                </div>

                {activeTab === 'tailor' && (
                <div className="res-layout">
                    {/* LEFT COLUMN: Input/Status */}
                    <div className="res-left">
                        <AnimatePresence mode="wait">
                            {stage === 'input' && (
                                <motion.div
                                    key="input"
                                    className="res-card res-input-card"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="res-card-title"><FileText size={18} /> Target Job Description</h2>
                                    <p className="res-card-desc">Paste the job description here. We will extract keywords and highlight your matching capabilities.</p>
                                    
                                    <div className="res-templates">
                                        <p className="res-templates-title">Try a famous job description:</p>
                                        <div className="res-chips">
                                            {FAMOUS_JDS.map((jd, idx) => (
                                                <button key={idx} className="res-chip" onClick={() => applyTemplate(jd.text)}>
                                                    <Briefcase size={12} /> {jd.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <textarea
                                        className="res-textarea"
                                        placeholder="Paste JD here (optional)..."
                                        value={jdText}
                                        onChange={e => setJdText(e.target.value)}
                                        rows={8}
                                    />
                                    
                                    <div className="res-evidence-summary">
                                        <p><strong>Your Current Resume Details:</strong></p>
                                        <div className="res-details-box">
                                            <p className="res-detail-item"><strong>Name:</strong> {profile?.name}</p>
                                            <p className="res-detail-item"><strong>Headline:</strong> {profile?.headline || 'Not set'}</p>
                                            <p className="res-detail-item"><strong>Verified Capabilities:</strong> {capabilities.length > 0 ? capabilities.map(c => c.skill).join(', ') : 'None'}</p>
                                            <p className="res-detail-item"><strong>Projects:</strong> {projects.length > 0 ? projects.map(p => p.name).join(', ') : 'None'}</p>
                                        </div>
                                        <p className="res-edit-hint">Want to update these? Use the <strong>Update Base Resume</strong> option on your Profile page.</p>
                                    </div>
                                    <div className="res-options-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <p className="res-templates-title" style={{ marginBottom: '4px' }}>Resume Length:</p>
                                            <select 
                                                value={pages} 
                                                onChange={e => setPages(e.target.value as any)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="1">1 Page (Concise, Strict Fit)</option>
                                                <option value="2">2 Pages (Deeply Detailed)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Only show Generate button if we are not in the template selection stage, OR if on mobile they just want to regenerate */}
                                    {stage !== 'input' && (
                                        <button 
                                            className="res-btn-primary" 
                                            onClick={() => handleGenerate()}
                                            disabled={capabilities.length === 0}
                                        >
                                            <Brain size={16} /> Regenerate Resume
                                        </button>
                                    )}
                                    
                                    {capabilities.length === 0 && (
                                        <p className="res-warning-text">
                                            <AlertCircle size={14} /> You need at least one verified capability to generate a resume.
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {(stage === 'generated' || stage === 'streaming') && atsMetrics && (
                                <motion.div
                                    key="generated"
                                    className="res-card res-success-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="res-success-icon">
                                        {stage === 'streaming' ? <Loader2 size={32} className="spin text-blue" /> : <CheckCircle2 size={32} />}
                                    </div>
                                    <h3>{stage === 'streaming' ? 'Writing Resume...' : 'Resume Generated'}</h3>
                                    <p>Your profile has been perfectly tailored for this role.</p>

                                    <div className="res-ats-box">
                                        <div className="res-ats-header">
                                            <h4>Estimated ATS Match Score</h4>
                                            <span className={`res-ats-score ${atsMetrics.atsScore >= 80 ? 'high' : atsMetrics.atsScore >= 50 ? 'med' : 'low'}`}>
                                                {atsMetrics.atsScore}%
                                            </span>
                                        </div>
                                        
                                        {atsMetrics.keywordsMatched.length > 0 && (
                                            <div className="res-keywords matched">
                                                <strong>Matched Keywords:</strong>
                                                <div className="keyword-tags">
                                                    {atsMetrics.keywordsMatched.map((k, i) => <span key={i} className="kw-match">{k}</span>)}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {atsMetrics.keywordsMissing.length > 0 && (
                                            <div className="res-keywords missing">
                                                <strong>Missing Keywords:</strong>
                                                <div className="keyword-tags">
                                                    {atsMetrics.keywordsMissing.map((k, i) => <span key={i} className="kw-miss">{k}</span>)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {stage === 'generated' && (
                                        <div className="res-actions-row">
                                            <button className="res-btn-secondary" onClick={() => setStage('input')}>
                                                Start Over
                                            </button>
                                            <button className="res-btn-primary" onClick={handleExportPDF}>
                                                <Download size={16} /> Export PDF
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: Output Preview */}
                    <motion.div
                        className="res-right"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="res-preview-card">
                            <div className="res-preview-header">
                                <h3>Tailored Resume Preview</h3>
                                {stage === 'generated' && (
                                    <button className="res-icon-btn" onClick={handleCopy}>
                                        {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                                        {copied ? 'Copied' : 'Copy Text'}
                                    </button>
                                )}
                            </div>
                            
                            <div className="res-preview-body">
                                {stage === 'input' ? (
                                    <div className="res-template-selection-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#1e1b4b' }}>Select a Template to Generate</h3>
                                        <p style={{ color: '#64748b', marginBottom: '32px' }}>Choose a layout style below. Your resume will be generated instantly.</p>
                                        
                                        <div className="res-template-gallery" style={{ display: 'flex', gap: '24px', justifyContent: 'center', maxWidth: '800px', flexWrap: 'wrap' }}>
                                            {/* LaTeX Card */}
                                            <div 
                                                className={`res-template-card-large`}
                                                onClick={() => handleGenerate('latex')}
                                                style={{ width: '220px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', background: '#fff', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                            >
                                                <img src="/latex_thumb.jpg" alt="LaTeX Template" style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px', border: '1px solid #e2e8f0' }} />
                                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', display: 'block', paddingBottom: '8px' }}>LaTeX Classic</span>
                                            </div>

                                            {/* Modern Card */}
                                            <div 
                                                className={`res-template-card-large`}
                                                onClick={() => handleGenerate('modern')}
                                                style={{ width: '220px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', background: '#fff', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                            >
                                                <img src="/modern_thumb.jpg" alt="Modern Template" style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px', border: '1px solid #e2e8f0' }} />
                                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', display: 'block', paddingBottom: '8px' }}>Modern Pro</span>
                                            </div>

                                            {/* Creative Card */}
                                            <div 
                                                className={`res-template-card-large`}
                                                onClick={() => handleGenerate('creative')}
                                                style={{ width: '220px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', background: '#fff', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                            >
                                                <img src="/creative_thumb.jpg" alt="Creative Template" style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px', border: '1px solid #e2e8f0' }} />
                                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', display: 'block', paddingBottom: '8px' }}>Creative Bold</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (stage === 'streaming' || stage === 'generated') ? (
                                    <div 
                                        className={`res-preview-html theme-${template}`}
                                        ref={resumeRef}
                                        dangerouslySetInnerHTML={{ __html: streamedHtml }}
                                    />
                                ) : (
                                    <div className="res-preview-empty">
                                        <AlertCircle size={48} color="#cbd5e1" />
                                        <p>Something went wrong displaying the resume.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
                )}

                {activeTab === 'applications' && (
                    <div className="res-apps">
                        {appsLoading ? (
                            <div className="res-loading-apps"><Loader2 className="spin" size={24} /> <p>Loading applications...</p></div>
                        ) : applications.length === 0 ? (
                            <div className="res-no-apps">
                                <Briefcase size={32} color="#94a3b8" />
                                <p>You haven't applied to any roles on CapAble yet.</p>
                            </div>
                        ) : (
                            <div className="res-app-list">
                                {applications.map(app => (
                                    <div key={app.id} className="res-app-card">
                                        <div className="res-app-main">
                                            <h3>{app.title}</h3>
                                            <p className="res-app-co">{app.company}</p>
                                            <p className="res-app-date">Applied on {app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleDateString() : 'Recently'}</p>
                                        </div>
                                        <div className="res-app-status">
                                            <span className={`status-badge status-${app.status?.toLowerCase()}`}>{app.status || 'Applied'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
