'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, Brain, Zap, CheckCircle2,
  Target, Shield, TrendingUp, Users, Building2,
  ChevronRight, Star, LogIn,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Animated capability network nodes
const nodes = [
  { id: 'python',     label: 'Python',    x: 50,  y: 30,  score: 87, color: '#4f8ef7' },
  { id: 'ai',         label: 'AI / ML',   x: 75,  y: 45,  score: 78, color: '#8b5cf6' },
  { id: 'sql',        label: 'SQL',        x: 25,  y: 55,  score: 83, color: '#06b6d4' },
  { id: 'cloud',      label: 'Cloud',      x: 60,  y: 65,  score: 61, color: '#f59e0b' },
  { id: 'apis',       label: 'APIs',       x: 80,  y: 25,  score: 84, color: '#10b981' },
  { id: 'leadership', label: 'Leadership', x: 20,  y: 35,  score: 84, color: '#ef4444' },
  { id: 'automation', label: 'Automation', x: 40,  y: 75,  score: 80, color: '#6366f1' },
  { id: 'linux',      label: 'Linux',      x: 70,  y: 80,  score: 76, color: '#ec4899' },
];

const connections = [
  ['python', 'ai'], ['python', 'automation'], ['python', 'apis'],
  ['sql', 'python'], ['ai', 'cloud'], ['apis', 'linux'],
  ['automation', 'linux'], ['leadership', 'python'],
];

const journeySteps = [
  { icon: '👁️', label: 'INVISIBLE', desc: 'Hidden talent unrecognized' },
  { icon: '🔄', label: 'TRANSLATED', desc: 'Experience mapped to capabilities' },
  { icon: '🧠', label: 'UNDERSTOOD', desc: 'Living capability twin created' },
  { icon: '📈', label: 'DEVELOPED', desc: 'Targeted transition planned' },
  { icon: '✅', label: 'VERIFIED', desc: 'Capability proven in practice' },
  { icon: '🎯', label: 'MATCHED', desc: '94% opportunity match found' },
  { icon: '🤝', label: 'INCLUDED', desc: 'Fair, evidence-based hiring' },
  { icon: '🚀', label: 'EMPOWERED', desc: 'Career in motion' },
];

const features = [
  {
    icon: <Brain size={20} />,
    title: 'Adaptive Capability Twin',
    desc: 'A living, evidence-backed profile of what you can actually do — updated continuously through practical work and AI verification.',
    color: '#4f8ef7',
  },
  {
    icon: <Zap size={20} />,
    title: 'Capability Translator',
    desc: 'Describe your lived experience in plain language. Watch it transform into enterprise-grade capabilities with evidence.',
    color: '#8b5cf6',
  },
  {
    icon: <Target size={20} />,
    title: 'Opportunity Radar',
    desc: 'Discover opportunities matched to your capabilities, trajectory and goals — not just keywords on a resume.',
    color: '#10b981',
  },
  {
    icon: <Shield size={20} />,
    title: 'Equity & Fairness Engine',
    desc: 'Bias audits, equity nudges, and capability-based JD rewrites that make hiring inclusive by design.',
    color: '#f59e0b',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Transition Intelligence',
    desc: 'The minimum path from where you are to where you want to be — 3 capabilities, 1 project, 1 trial.',
    color: '#06b6d4',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'AI Workspace',
    desc: 'A multi-model AI environment that knows your full capability context. No re-explaining. Just results.',
    color: '#ec4899',
  },
];

function CapabilityNetwork() {
  const [visible, setVisible] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 300);
    setTimeout(() => setAnimated(true), 800);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 320 }}>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[20, 40, 60, 80].map(v => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3"/>
            <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3"/>
          </g>
        ))}

        {/* Connections */}
        {animated && connections.map(([a, b]) => {
          const na = nodes.find(n => n.id === a)!;
          const nb = nodes.find(n => n.id === b)!;
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={na.color}
              strokeWidth="0.5"
              strokeOpacity="0.35"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: Math.random() * 0.5 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={visible ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: i * 0.08 + 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Glow */}
            <circle cx={node.x} cy={node.y} r="4" fill={node.color} opacity="0.15"/>
            {/* Main node */}
            <circle cx={node.x} cy={node.y} r="2.8" fill={node.color} opacity="0.9"/>
            {/* Score ring */}
            <circle
              cx={node.x} cy={node.y} r="3.5"
              fill="none" stroke={node.color} strokeWidth="0.4" strokeOpacity="0.5"
              strokeDasharray={`${(node.score / 100) * 22} 22`}
              transform={`rotate(-90 ${node.x} ${node.y})`}
            />
            {/* Label */}
            <text x={node.x} y={node.y + 5.5} textAnchor="middle" fontSize="2.2" fill="white" opacity="0.7">
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Floating score badges */}
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'rgba(79,142,247,0.15)',
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: 8, padding: '0.5rem 0.75rem',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>TWIN SCORE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f8ef7', lineHeight: 1 }}>82%</div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Verified</div>
        </motion.div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const { openAuthModal } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % journeySteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowX: 'hidden' }}>

      {/* Top Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 2rem', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79,142,247,0.35)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="4" r="2.2" fill="white" opacity="0.95"/>
              <path d="M9 6.5 L9 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 11 L6 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 11 L12 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 9 L12 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="3" cy="7" r="1.5" fill="white" opacity="0.6"/>
              <circle cx="15" cy="7" r="1.5" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>AccessHire</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ADAPTIVE CAPABILITY TWIN</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
          }}>
            <Star size={11} fill="currentColor" />
            SAP Hackfest 2026
          </span>

          <button
            onClick={() => openAuthModal('demo')}
            className="btn-ghost"
            style={{ fontSize: '0.8rem', border: '1px solid var(--border)' }}
          >
            <LogIn size={13} /> Demo Login / Auth
          </button>

          <Link href="/dashboard" className="btn-primary" id="enter-app-btn">
            Enter AccessHire <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '3rem', alignItems: 'center',
      }}>
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.75rem',
              background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 999, marginBottom: '1.5rem',
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--blue-primary)',
              letterSpacing: '0.04em',
            }}>
              <Sparkles size={11} />
              AI CAREER & WORKFORCE OPERATING SYSTEM
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900, lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}>
              Your past is not
              <br />
              <span className="gradient-text">your ceiling.</span>
            </h1>

            <p style={{
              fontSize: '1.05rem', color: 'var(--text-secondary)',
              lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 440,
            }}>
              Discover what you can do. Prove what you can become.
              AccessHire translates hidden potential into verified capability —
              and maps the shortest path to your next role.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }} id="cta-enter">
                Enter AccessHire <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => openAuthModal('demo')}
                className="btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}
              >
                Sign In / Select Persona
              </button>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { icon: <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />, label: 'No resume proxy filters' },
                { icon: <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />, label: 'Practical verification' },
                { icon: <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />, label: 'Equity by design' },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {t.icon} {t.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Capability Network Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Brain size={14} style={{ color: 'var(--blue-primary)' }} />
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>Adaptive Capability Twin — Priya Sharma</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
              {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>
          <CapabilityNetwork />
        </motion.div>
      </section>

      {/* Journey Flow */}
      <section style={{
        padding: '3rem 2rem',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              THE ACCESSHIRE JOURNEY
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              From invisible to empowered
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {journeySteps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: '1 0 auto' }}>
                <motion.div
                  animate={{ scale: activeStep === i ? 1.05 : 1 }}
                  style={{
                    textAlign: 'center', padding: '0.75rem 0.5rem', cursor: 'pointer',
                    borderRadius: 8, minWidth: 100,
                    background: activeStep === i ? 'rgba(79,142,247,0.08)' : 'transparent',
                    border: activeStep === i ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                    transition: 'all 0.3s',
                  }}
                  onClick={() => setActiveStep(i)}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>{step.icon}</div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
                    color: activeStep === i ? 'var(--blue-primary)' : 'var(--text-primary)',
                    marginBottom: '0.2rem',
                  }}>{step.label}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{step.desc}</div>
                </motion.div>
                {i < journeySteps.length - 1 && (
                  <ChevronRight size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            PLATFORM CAPABILITIES
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            One intelligent system.<br/>
            <span className="gradient-text">Everything connected.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
              style={{ padding: '1.25rem' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `${f.color}18`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, marginBottom: '0.875rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Two Sides */}
      <section style={{
        padding: '3rem 2rem',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Two experiences. One capability intelligence layer.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* Individual */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '3px solid var(--blue-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Users size={18} style={{ color: 'var(--blue-primary)' }} />
                <span style={{ fontWeight: 700 }}>Individual Career OS</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Capability Twin', 'Experience Translator', 'Opportunity Radar', 'Resume Studio', 'Action Center', 'AI Workspace', 'Transition Engine'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="btn-primary" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}>
                Start Career OS <ArrowRight size={14} />
              </Link>
            </div>

            {/* Enterprise */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '3px solid var(--violet)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Building2 size={18} style={{ color: 'var(--violet)' }} />
                <span style={{ fontWeight: 700 }}>Enterprise Workforce OS</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Workforce Capability Map', 'Internal Mobility Engine', 'Inclusive Hiring Console', 'Equity Nudge System', 'Job Fairness Agent', 'Accessibility Blueprint', 'Bias Audit Trail'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/workforce" className="btn-secondary" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', border: '1px solid var(--violet)', color: 'var(--violet)' }}>
                Workforce Console <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, rgba(139,92,246,0.06) 100%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem' }}>
            ACCESSHIRE — ADAPTIVE CAPABILITY TWIN
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            See Capability.{' '}
            <span className="gradient-text">Prove Potential.</span>
            {' '}Enable Transition.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            From invisible talent to verified potential.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: '0.925rem', padding: '0.75rem 1.75rem' }} id="cta-final">
            Enter AccessHire <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '1.25rem 2rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.75rem', color: 'var(--text-muted)',
      }}>
        <span>© 2026 AccessHire. SAP Hackfest — Theme 2: Inclusive Workforce</span>
        <span>Adaptive Capability Twin · AI Career Operating System</span>
      </footer>
    </div>
  );
}
