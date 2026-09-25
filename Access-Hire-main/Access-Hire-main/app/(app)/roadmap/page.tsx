'use client';

import { motion } from 'framer-motion';
import {
  Sparkles, Globe, Brain, Shield, CheckCircle2, ArrowRight,
  Compass, Layers, Zap, Eye, MessageSquare, Clock, Check,
} from 'lucide-react';
import Link from 'next/link';
import { useSynapse } from '@/lib/synapse-context';

export default function RoadmapPage() {
  const { synapseActive, toggleSynapse } = useSynapse();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-violet">Platform Vision &amp; Architecture</span>
          <span className="badge badge-green">Phase 1 Shipped</span>
        </div>
        <h1 className="page-title">AccessHire Product Roadmap</h1>
        <p className="page-subtitle">
          Expanding from Adaptive Capability Intelligence into Ambient Neuro-Inclusion &amp; Cross-Cultural Workforce Mobility.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1080 }}>

        {/* Phase 1 Live Banner */}
        <div className="card" style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(16,185,129,0.08))',
          border: '1.5px solid rgba(16,185,129,0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--green)' }}>
                <CheckCircle2 size={18} /> Phase 1 of Synapse — Live in this build!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                Test the live <strong>Synapse UI</strong> toggle in the header: switches typography to OpenDyslexic and enables high-contrast neuro-inclusive readability instantly.
              </div>
            </div>
            <button
              onClick={toggleSynapse}
              className="btn-primary"
              style={{ fontSize: '0.775rem' }}
            >
              <Sparkles size={14} /> {synapseActive ? 'Disable Synapse UI' : 'Test Synapse UI Live'}
            </button>
          </div>
        </div>

        {/* MODULE 1: SYNAPSE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: '1.5rem', borderLeft: '4px solid var(--violet)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--violet)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                MODULE: SYNAPSE
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                Neuro-Inclusive Workspace Customiser
              </div>
            </div>
            <span className="badge badge-violet">Vision &amp; Phase 1</span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            &quot;Standard software is rigid. Synapse is a background layer that adapts the digital environment to a user&apos;s specific cognitive profile (e.g., ADHD, Autism, Dyslexia, PTSD) without ever exposing their medical data.&quot;
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* Feature 1 */}
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue-primary)', marginBottom: '0.35rem' }}>
                <MessageSquare size={15} /> Dynamic Communication Rewriter
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Real-time email/Slack/Teams plugin that translates vague or aggressive corporate communication into direct, clear, structured instructions without altering tone or context.
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.35rem' }}>
                <Eye size={15} /> Sensory Workspace Management
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Tracks calendars and screen activity to prompt micro-breaks, auto-adjust contrast, or shift text layout using fonts like OpenDyslexic based on fatigue markers.
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber)', marginBottom: '0.35rem' }}>
                <Clock size={15} /> Anxiety-Reducing Task Deconstructor
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Breaks ambiguous project briefs (e.g. &quot;Revamp the client dashboard by Friday&quot;) into distinct, micro-actionable checklists with time estimations.
              </div>
            </div>
          </div>
        </motion.div>

        {/* MODULE 2: BRIDGE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ padding: '1.5rem', borderLeft: '4px solid var(--cyan)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                MODULE: BRIDGE
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                Cross-Cultural &amp; Linguistic Inclusion Engine
              </div>
            </div>
            <span className="badge badge-cyan">Phase 2 Planned</span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            &quot;True inclusion requires integrating workers from diverse regional, linguistic, or socio-economic backgrounds into highly corporate settings.&quot;
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* Feature 1 */}
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue-primary)', marginBottom: '0.35rem' }}>
                <Globe size={15} /> Idiom and Nuance Decoder
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Real-time audio/text translator for hybrid meetings that decodes localized idioms, corporate jargon, and socio-cultural context for non-native employees — not just literal language translation.
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.35rem' }}>
                <Brain size={15} /> Reverse Inclusion Upskilling
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Analyzes manager-to-employee communication metrics to privately coach managers on adjusting their feedback style to match their diverse team members&apos; communication culture, instead of putting the adaptation burden only on the minority employee.
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
