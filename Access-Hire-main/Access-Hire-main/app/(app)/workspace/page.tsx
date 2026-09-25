'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles, Send, Brain, ChevronDown, Copy,
  CheckCircle2, Zap, Shield, X, Package,
  ArrowRight, Eye, Share2, Download, Check, FileText,
} from 'lucide-react';
import { mockAIResponses, getUserProfile, getUserCapabilities, getUserOpportunities } from '@/data/mockData';
import { useAuth } from '@/lib/auth-context';
import type { AIProvider, ChatMessage, ContextCapsule } from '@/types';
import { sleep } from '@/lib/utils';

const providers: { id: AIProvider; label: string; desc: string; icon: string; color: string }[] = [
  { id: 'auto', label: 'Auto Router', desc: 'Best model per task', icon: '⚡', color: '#4f8ef7' },
  { id: 'chatgpt', label: 'ChatGPT', desc: 'Complex reasoning', icon: '🟢', color: '#10b981' },
  { id: 'gemini', label: 'Gemini', desc: 'Multimodal & creative', icon: '🔵', color: '#4f8ef7' },
  { id: 'claude', label: 'Claude', desc: 'Document analysis', icon: '🟠', color: '#f59e0b' },
];

const aiContext = {
  project: 'AccessHire Career OS',
  targetRole: 'AI Operations Engineer',
  capabilityFit: 83,
  capabilityGaps: ['AI Evaluation', 'Cloud AI Deployment'],
  resumeFile: 'Priya_AI_Operations.pdf',
  opportunity: 'AI Operations Internship — Infosys AI Labs',
  contextHealth: 92,
};

const suggestedPrompts = [
  { label: 'Prepare me for this AI Operations interview', key: 'interview-prep' },
  { label: 'Help me optimize my resume for this role', key: 'resume-help' },
  { label: 'What capabilities should I focus on?', key: 'capability-question' },
];

const routingRules = [
  { task: 'Analyze this PDF', recommended: 'Claude', reason: 'Document analysis' },
  { task: 'Refine this product idea', recommended: 'Gemini', reason: 'Creative synthesis' },
  { task: 'Reason through this architecture', recommended: 'ChatGPT', reason: 'Complex reasoning' },
  { task: 'Career interview prep', recommended: 'Auto', reason: 'Context-aware routing' },
];

function ModelBadge({ provider }: { provider: AIProvider }) {
  const p = providers.find(x => x.id === provider) || providers[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      fontSize: '0.65rem', fontWeight: 700,
      padding: '0.1rem 0.375rem', borderRadius: 999,
      background: `${p.color}18`, color: p.color,
      border: `1px solid ${p.color}30`,
    }}>
      {p.icon} {p.label}
    </span>
  );
}

function CapsuleGenerator({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<'idle' | 'generating' | 'done'>('idle');
  const [tokensBefore, setTokensBefore] = useState(42800);
  const [tokensAfter, setTokensAfter] = useState(42800);
  const [reviewed, setReviewed] = useState(false);

  const generate = async () => {
    setStage('generating');
    // Animate compression
    const start = 42800;
    const end = 2100;
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      await sleep(50);
      setTokensAfter(Math.round(start - (start - end) * (i / steps)));
    }
    setStage('done');
  };

  const capsule: ContextCapsule = {
    id: 'capsule-1',
    project: 'AccessHire Career OS — Priya Sharma',
    goal: 'Secure AI Operations Internship at Infosys AI Labs',
    constraints: ['3-year career gap', 'Missing AI Evaluation capability', 'Remote preferred'],
    decisions: ['Focus on AI Ops role (74% readiness)', 'Prioritize AI Evaluation practical trial', 'Resume optimized to 94% ATS fit'],
    importantFacts: ['Capability Twin: 82% verified', 'Best match: AI Ops Internship 94%', 'Interview scheduled: Sep 2'],
    files: ['Priya_AI_Operations.pdf', 'capability-twin.json'],
    openQuestions: ['Agent Orchestration capability gap?', 'Cloud AI deployment timeline?'],
    conversationSummary: 'Discussed career transition from IT Support to AI Operations. Identified 3 capability gaps. Resume optimized. Interview prep initiated.',
    tokensBefore: 42800,
    tokensAfter: 2100,
    createdAt: new Date().toISOString(),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 520,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Package size={18} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>Context Capsule</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              A portable structured context package for any AI to continue your work
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.3rem' }}>
            <X size={15} />
          </button>
        </div>

        {/* Token animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-hover)', borderRadius: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>BEFORE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>{tokensBefore.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>tokens</div>
          </div>
          <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AFTER</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stage === 'done' ? 'var(--green)' : 'var(--text-secondary)' }}>
              {tokensAfter.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>tokens</div>
          </div>
          {stage === 'done' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                marginLeft: 'auto', padding: '0.375rem 0.75rem', borderRadius: 8,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                fontSize: '1rem', fontWeight: 900, color: 'var(--green)',
              }}
            >
              95% smaller
            </motion.div>
          )}
        </div>

        {stage === 'done' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              ACCESSHIRE CONTEXT CAPSULE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { label: 'Project', value: capsule.project },
                { label: 'Goal', value: capsule.goal },
                { label: 'Key Facts', value: capsule.importantFacts.join(' · ') },
                { label: 'Open Questions', value: capsule.openQuestions.join(' · ') },
                { label: 'Summary', value: capsule.conversationSummary },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0.625rem', background: 'var(--bg-hover)', borderRadius: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, width: 90 }}>{item.label}</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {!reviewed && (
              <div style={{
                padding: '0.625rem', marginBottom: '0.875rem',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 8, fontSize: '0.775rem', color: 'var(--amber)',
              }}>
                <Shield size={13} style={{ display: 'inline', marginRight: '0.375rem' }} />
                Review before sharing — remove any sensitive personal data
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: '0.775rem' }}>
                <Copy size={13} /> Copy Capsule
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.775rem' }}>
                <Share2 size={13} /> Share Link
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.775rem' }}>
                <Download size={13} /> Export
              </button>
              <button onClick={() => setReviewed(true)} className="btn-ghost" style={{ fontSize: '0.775rem', border: '1px solid var(--border)' }}>
                <Eye size={13} /> Mark Reviewed
              </button>
            </div>
          </motion.div>
        )}

        {stage !== 'done' && (
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem', padding: '0.75rem' }}
            onClick={generate}
            disabled={stage === 'generating'}
            id="generate-capsule-btn"
          >
            {stage === 'generating' ? (
              <>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[0,1,2].map(i => <div key={i} className="ai-dot" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
                Compressing context...
              </>
            ) : (
              <><Package size={15} /> Generate Context Capsule</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { user } = useAuth();

  const profile = getUserProfile(user?.email);
  const capabilities = getUserCapabilities(user?.email);
  const opportunities = getUserOpportunities(user?.email);
  const topOpp = opportunities[0];

  const initialSysMessage: ChatMessage = {
    id: 'sys-1',
    role: 'system',
    content: `Context loaded: ${profile.name} (${profile.title}) · Capability Twin ${profile.capabilityTwinScore}% · ${profile.patents ? `${profile.patents.length} Patents Registered` : '3-Year Gap Mitigated'} · Target: ${topOpp ? topOpp.title : 'AI Systems Architect'} · 0 Cross-Contamination Verified`,
    provider: 'auto',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  };

  const isDeven = user?.email === 'deven@accesshire.dev' || (!user?.email && profile.name.includes('Deven'));

  const personaPrompts = isDeven ? [
    { label: 'How to pitch my 20+ patents in NVIDIA LLM interview?', key: 'patents-pitch' },
    { label: 'Technical architecture deep-dive for MailIQ & Cogniflow', key: 'arch-deepdive' },
    { label: 'Fastest pathway to Principal AI Systems Architect', key: 'principal-path' },
  ] : [
    { label: 'Prepare me for this AI Operations interview', key: 'interview-prep' },
    { label: 'Help me optimize my resume for this role', key: 'resume-help' },
    { label: 'What capabilities should I focus on closing?', key: 'capability-question' },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([initialSysMessage]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>('auto');
  const [loading, setLoading] = useState(false);
  const [showCapsule, setShowCapsule] = useState(tabParam === 'capsule');
  const [activeTab, setActiveTab] = useState<'chat' | 'router'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `Context loaded: ${profile.name} (${profile.title}) · Capability Twin ${profile.capabilityTwinScore}% · ${profile.patents ? `${profile.patents.length} Patents Registered` : 'Evidence Grounded'} · Target: ${topOpp ? topOpp.title : 'AI Systems Architect'}`,
        provider: 'auto',
        timestamp: new Date().toISOString(),
      }
    ]);
  }, [user?.email, profile.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateRichResponse = (query: string, providerName: string): string => {
    const q = query.toLowerCase();

    if (isDeven) {
      if (q.includes('patent') || q.includes('pitch') || q.includes('nvidia') || q.includes('interview')) {
        return `### 🎯 Strategic Pitch: Leveraging 21 Patents for NVIDIA AI Systems

**Core Narrative:** Ground your capability in verified intellectual property and full-stack execution rather than theoretical knowledge.

#### 1. The Intellectual Property Pillar
• **21 Filed/Published Patents** (Indian Patent Office: 202611092508, 202611101525, 202611068506) demonstrate proven ability to invent end-to-end architectures in **Wearable AI, Autonomous Edge Sensing, and Real-Time Signal Processing**.
• Emphasize your **NVIDIA LLM Application Developer** certification and **Vibe Coding 2026 2nd Place distinction (out of 676 national teams)** as empirical proof of velocity.

#### 2. High-Yield Interview Simulation (STAR Method)
**Question:** *"How do you design scalable LLM systems that maintain low latency under concurrent load?"*
• **Situation:** Built **MailIQ** and **Cogniflow AI** to process high-throughput semantic embeddings with minimal compute overhead.
• **Task:** Eliminate latency bottlenecks during multi-agent context retrieval and token generation.
• **Action:** Deployed quantization-aware fine-tuning, vector caching with FAISS/Pinecone, and asynchronous worker orchestration via FastAPI.
• **Result:** Reduced median response latency by 68% while sustaining 99.4% factual accuracy across 5,000+ benchmark requests.

#### 3. Recommended Next Best Actions
1. ✅ Review the **NVIDIA AI Systems Architecture Fellow** application on the Opportunity Radar (98% match).
2. 📄 Export your verified PDF resume from **Resume Studio** with all 21 patent disclosures embedded.`;
      }

      if (q.includes('arch') || q.includes('mailiq') || q.includes('cogniflow') || q.includes('code')) {
        return `### 🏗️ Technical Architecture: MailIQ & Cogniflow AI

**Overview:** High-performance distributed AI architecture combining streaming LLM inference with vector memory.

\`\`\`typescript
// Distributed Semantic Ingestion Pipeline
interface PipelineArchitecture {
  ingestion: "FastAPI Async Worker Pool";
  embeddingModel: "sentence-transformers/all-mpnet-base-v2 (768-dim)";
  vectorStore: "HNSW Indexed Memory Capsule";
  orchestrator: "Multi-Agent Consensus (SD, MI, LP)";
  telemetry: "Real-Time Confidence & Parity Audit Trail";
}
\`\`\`

#### Key Architectural Differentiators:
1. **Context Capsule Serialization:** Compresses 42,800 tokens to 2,100 tokens (95% efficiency) with zero semantic drift.
2. **Deterministic Verification:** Enforces a 4-step practical sandbox evaluation before updating capability scores.
3. **Patent Disclosures:** Backed by registered filings on autonomous adaptive edge computing and context-aware routing.`;
      }

      return `### 🚀 Capability Analysis & Career Acceleration Plan

**Profile Context:** ${profile.name} · ${profile.title} · Twin Score: **${profile.capabilityTwinScore}%**

#### 📊 Current Capability Strengths:
• **AI Systems & LLM Architecture:** 98% (Verified via NVIDIA Certification & 21 Patents)
• **Full-Stack Engineering & Fast Prototyping:** 94% (Vibe Coding 2nd Place / 676 Teams)
• **Algorithm Design & Problem Solving:** 92% (Chandigarh Univ, Kargil Distinction)

#### ⚡ Actionable 3-Step Strategy:
1. **Target Opportunity:** Submit application to **NVIDIA AI Systems Architecture Fellow** (Deadline: 15 Sept 2026).
2. **Micro-Project:** Complete SAP BTP AI Core integration micro-task to expand enterprise readiness.
3. **Audit Trail:** Maintain full transparency via the built-in Multi-Agent Telemetry pipeline.`;
    }

    // Priya / Default
    if (q.includes('interview')) return mockAIResponses['interview-prep'];
    if (q.includes('resume')) return mockAIResponses['resume-help'];
    if (q.includes('capabilit')) return mockAIResponses['capability-question'];

    return `### 🤖 Adaptive Career Intelligence Briefing

**Analyzed Candidate:** ${profile.name} · Current Capability Twin: **${profile.capabilityTwinScore}%**

#### 🎯 Strategic Assessment for "${query.slice(0, 40)}":
Based on your Capability Twin and verified evidence logs, here is your tailored roadmap:

• **Strongest Transferable Capabilities:** Python (87%), Workflow Automation (84%), Troubleshooting (91%).
• **Critical Verification Focus:** Hands-on AI Evaluation & Cloud Deployment.
• **Mitigation Strategy:** Career continuity notes are automatically neutralized by AccessHire's **Equity Nudge** and **Job Fairness** agents during employer review.

#### 📋 Recommended Next Steps:
1. Complete the **4-Step Practical Transition Trial** in the Capability Center.
2. Export your ATS-tailored resume from **Resume Studio** (94% capability match).
3. Access authentic **SAP Learning Hub** micro-projects to earn verifiable competency badges.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    const sentInput = input;
    setInput('');
    setLoading(true);

    await sleep(900);

    const response = generateRichResponse(sentInput, provider);

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      provider,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Workspace</h1>
        <p className="page-subtitle">One conversation. Multiple AI engines. Your full career context — already loaded.</p>
      </div>

      {/* Tab */}
      <div className="tab-nav" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
        <button className={`tab-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>AI Chat</button>
        <button className={`tab-item ${activeTab === 'router' ? 'active' : ''}`} onClick={() => setActiveTab('router')}>AI Router</button>
      </div>

      {activeTab === 'router' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '0.375rem' }}>Multi-AI Router</div>
          <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Transparent routing — each task recommended to the best AI engine</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {routingRules.map(r => (
              <div key={r.task} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1rem', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 9,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.2rem' }}>"{r.task}"</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Reason: {r.reason}</div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--blue-primary)' }}>{r.recommended}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recommended</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>

          {/* Chat Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            {/* Header */}
            <div style={{
              padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <Sparkles size={16} style={{ color: 'var(--blue-primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>AccessHire AI Assistant</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--green)' }}>
                  Context: {profile.name} · Twin {profile.capabilityTwinScore}% · Ready
                </div>
              </div>

              {/* Model selector */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    style={{
                      padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.7rem',
                      fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: provider === p.id ? `${p.color}22` : 'var(--bg-elevated)',
                      color: provider === p.id ? p.color : 'var(--text-secondary)',
                      transition: 'all 0.12s',
                    }}
                    title={p.desc}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>

              <button
                className="btn-secondary"
                style={{ fontSize: '0.725rem' }}
                onClick={() => setShowCapsule(true)}
              >
                <Package size={12} /> Capsule
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: '0.5rem', alignItems: 'flex-start',
                  }}
                >
                  {msg.role !== 'user' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800, color: 'white',
                    }}>A</div>
                  )}
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? 'var(--blue-primary)' :
                      msg.role === 'system' ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
                    border: msg.role === 'system' ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border-subtle)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}>
                    {msg.role === 'system' && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
                        🤖 SYSTEM CONTEXT LOADED
                      </div>
                    )}
                    {msg.content}

                    {msg.provider && msg.role === 'assistant' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.625rem', paddingTop: '0.375rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <ModelBadge provider={msg.provider} />
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="btn-ghost"
                          style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem', gap: '0.25rem' }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={11} style={{ color: 'var(--green)' }} /> : <Copy size={11} />}
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: 'white', flexShrink: 0,
                  }}>A</div>
                  <div style={{ padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)', borderRadius: '12px 12px 12px 2px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.3rem' }}>
                    {[0,1,2].map(i => <div key={i} className="ai-dot" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 1rem 0.625rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {personaPrompts.map(p => (
                  <button
                    key={p.key}
                    onClick={() => { setInput(p.label); }}
                    style={{
                      padding: '0.3rem 0.625rem', borderRadius: 999, fontSize: '0.725rem',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Ask AccessHire AI about ${profile.name}'s capabilities, interviews, or architecture...`}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text-primary)', fontSize: '0.825rem', outline: 'none',
                  fontFamily: 'inherit',
                }}
                id="chat-input"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-primary"
                style={{ padding: '0.5rem 0.75rem' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Context Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <Brain size={15} style={{ color: 'var(--blue-primary)' }} />
                <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>Active Persona Context</span>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                  color: 'var(--green)', background: 'rgba(16,185,129,0.1)',
                  padding: '0.1rem 0.375rem', borderRadius: 999,
                }}>
                  100% Synced
                </span>
              </div>

              {[
                { label: 'Candidate', value: profile.name },
                { label: 'Twin Score', value: `${profile.capabilityTwinScore}%` },
                { label: 'Key Asset', value: profile.patents ? `${profile.patents.length} Patents Registered` : 'Lived Experience Evidence' },
                { label: 'Top Match', value: topOpp ? topOpp.title : 'AI Systems Architect' },
                { label: 'Education', value: profile.education || 'Computer Science' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ marginTop: '0.75rem', paddingTop: '0.625rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  TOP CAPABILITIES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {capabilities.slice(0, 4).map(c => (
                    <span key={c.name} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                      {c.name} ({c.proficiency}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="btn-secondary"
              style={{ justifyContent: 'center', width: '100%', border: '1px solid var(--violet)', color: 'var(--violet)' }}
              onClick={() => setShowCapsule(true)}
              id="create-capsule-btn"
            >
              <Package size={14} /> Create Context Capsule
            </button>
          </div>
        </div>
      )}

      {/* Capsule Modal */}
      <AnimatePresence>
        {showCapsule && <CapsuleGenerator onClose={() => setShowCapsule(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading AI Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}

