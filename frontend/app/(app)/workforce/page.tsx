'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, TrendingUp, Shield, AlertTriangle,
  CheckCircle2, ArrowRight, ChevronRight, Brain,
  FileText, Zap, Eye, Target, Accessibility, X, Check, Search, Filter, RefreshCw, Sparkles,
} from 'lucide-react';
import { mockWorkforceDepartments, mockEquityCandidates, mockFutureSignals } from '@/data/mockData';
import { sleep } from '@/lib/utils';

const capabilityKeys = ['Python', 'AI / ML', 'Cloud', 'SQL', 'Linux', 'Automation', 'Data Analysis', 'Security'];

function ScoreCell({ value }: { value: number }) {
  const color = value >= 75 ? '#10b981' : value >= 55 ? '#4f8ef7' : value >= 35 ? '#f59e0b' : '#ef4444';
  const bg = value >= 75 ? 'rgba(16,185,129,0.12)' : value >= 55 ? 'rgba(79,142,247,0.12)' : value >= 35 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <td style={{ padding: '0.375rem 0.5rem', textAlign: 'center' }}>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, color,
        background: bg, padding: '0.15rem 0.4rem', borderRadius: 4,
        display: 'inline-block',
      }}>{value}%</span>
    </td>
  );
}

// ─── 1. OVERVIEW SCREEN ─────────────────────────────────────────
function OverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Capability Coverage Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'AI / ML Coverage', value: '48%', sub: '+12% this quarter', color: 'var(--violet)' },
          { label: 'Cloud Capability', value: '58%', sub: '+8% this quarter', color: 'var(--cyan)' },
          { label: 'Data Systems', value: '76%', sub: 'Stable coverage', color: 'var(--blue-primary)' },
          { label: 'Cybersecurity', value: '52%', sub: '+5% this quarter', color: 'var(--green)' },
        ].map(c => (
          <div key={c.label} className="metric-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.color, marginTop: '0.2rem' }}>{c.value}</div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }}>
        {/* Future Demand Signals */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title" style={{ marginBottom: '0.375rem' }}>Future Capability Demand Forecast</div>
          <div className="section-subtitle" style={{ marginBottom: '1rem' }}>AI-projected workforce capability trends over 2026–2028</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {mockFutureSignals.map(signal => (
              <div key={signal.role} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)',
                borderRadius: 8, border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>{signal.role}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    2026: {signal.year2026}% → 2028: {signal.year2028}% Demand
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999,
                    background: signal.trend === 'rising' ? 'rgba(16,185,129,0.15)' : signal.trend === 'declining' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: signal.trend === 'rising' ? 'var(--green)' : signal.trend === 'declining' ? 'var(--red)' : 'var(--amber)',
                  }}>
                    {signal.trend === 'rising' ? '↑ RISING DEMAND' : signal.trend === 'declining' ? '↓ DECLINING DEMAND' : '→ STABLE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Potential Transition Callouts */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title" style={{ marginBottom: '0.375rem' }}>High-Potential Callouts</div>
          <div className="section-subtitle" style={{ marginBottom: '1rem' }}>Ready internal mobility pipelines</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { target: 'AI Operations Engineers', count: '1,240', source: 'IT Support & Infra', readiness: 74 },
              { target: 'AI Analytics Engineers', count: '890', source: 'Data & Analytics', readiness: 86 },
              { target: 'AI Evaluation Specialists', count: '650', source: 'Quality Assurance', readiness: 81 },
              { target: 'AI-Enabled BA', count: '2,100', source: 'Operations & Business', readiness: 79 },
            ].map(c => (
              <div key={c.target} style={{
                padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--blue-primary)' }}>{c.target}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {c.count} eligible from {c.source}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.375rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Avg Readiness:</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>{c.readiness}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. WORKFORCE CAPABILITY MAP SCREEN ─────────────────────────
function CapabilityMapTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const filteredDepts = mockWorkforceDepartments.filter(d => 
    (selectedDept === 'all' || d.id === selectedDept) &&
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search department or team..."
            className="input"
            style={{ paddingLeft: 32, fontSize: '0.8rem' }}
          />
        </div>
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="input"
          style={{ width: 220, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <option value="all">All Departments</option>
          {mockWorkforceDepartments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div className="section-title">Workforce Capability Matrix</div>
            <div className="section-subtitle">Aggregate Capability Twin scores across enterprise units</div>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', fontSize: '0.7rem' }}>
            {[{ color: '#10b981', l: '75+' }, { color: '#4f8ef7', l: '55-74' }, { color: '#f59e0b', l: '35-54' }, { color: '#ef4444', l: '<35' }].map(x => (
              <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 10, height: 10, background: x.color, borderRadius: 2, display: 'inline-block', opacity: 0.7 }} />
                {x.l}%
              </span>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Department</th>
              <th style={{ padding: '0.375rem 0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>Headcount</th>
              {capabilityKeys.map(k => (
                <th key={k} style={{ padding: '0.375rem 0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDepts.map(dept => (
              <tr key={dept.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {dept.name}
                </td>
                <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {dept.headcount.toLocaleString()}
                </td>
                {capabilityKeys.map(k => (
                  <ScoreCell key={k} value={dept.capabilities[k] || 0} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 3. EQUITY REVIEW TAB ───────────────────────────────────────
function EquityNudge() {
  const [generated, setGenerated] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<typeof mockEquityCandidates[0] | null>(null);

  const generateQuestions = async (id: string) => {
    await sleep(500);
    setGenerated(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{
        padding: '0.875rem 1rem',
        background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)',
        borderRadius: 8, fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <strong style={{ color: 'var(--blue-primary)' }}>🤖 AI Recommendation Layer:</strong>
        {' '}Surfaces non-blocking equity insights during candidate review. All decisions require explicit human reviewer approval.
      </div>

      {mockEquityCandidates.map(candidate => (
        <div key={candidate.id} className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: 'white',
            }}>
              {candidate.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{candidate.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.location} · {candidate.credentials}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', textAlign: 'center' }}>
                  {[
                    { label: 'Capability Fit', value: candidate.capabilityFit, color: '#10b981' },
                    { label: 'Evidence', value: candidate.evidenceConfidence, color: '#4f8ef7' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Check */}
              <div style={{
                padding: '0.625rem 0.875rem',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 8, marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <AlertTriangle size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)' }}>EQUITY CHECK</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Career continuity note: <strong>{candidate.careerGap}</strong>.
                  &quot;Career continuity may not accurately represent current capability. Evaluate demonstrated skills separately from career-gap duration.&quot;
                  This candidate has <strong style={{ color: 'var(--green)' }}>{candidate.capabilityFit}% capability fit</strong> with verified evidence.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {generated !== candidate.id ? (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.775rem' }}
                    onClick={() => generateQuestions(candidate.id)}
                  >
                    <Brain size={13} /> Generate Capability-Based Interview Questions
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-flat"
                    style={{ padding: '0.75rem', width: '100%' }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--blue-primary)', marginBottom: '0.5rem' }}>
                      CAPABILITY-BASED INTERVIEW QUESTIONS
                    </div>
                    {[
                      'Walk me through a production system failure you diagnosed and resolved.',
                      'Describe how you automated a repetitive process. What was the outcome?',
                      'How would you evaluate the quality of an AI model\'s outputs?',
                      'Tell me about managing multiple stakeholders with conflicting priorities.',
                    ].map((q, i) => (
                      <div key={i} style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', lineHeight: 1.4 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{i + 1}.</strong> {q}
                      </div>
                    ))}
                    <div style={{ marginTop: '0.625rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Questions target verified capabilities rather than employment continuity or degree credentials.
                    </div>
                  </motion.div>
                )}
                <button
                  className="btn-ghost"
                  style={{ fontSize: '0.775rem', border: '1px solid var(--border)' }}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <Eye size={13} /> View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              padding: '1rem',
            }}
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 440,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedCandidate.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCandidate.location} · {selectedCandidate.credentials}</div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="btn-ghost" style={{ padding: '0.3rem' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--green)' }}>{selectedCandidate.capabilityFit}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Capability Fit</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(79,142,247,0.1)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--blue-primary)' }}>{selectedCandidate.evidenceConfidence}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Evidence Confidence</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Candidate verified via AccessHire Adaptive Capability Twin. High performance in practical problem solving and automated workflow execution.
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedCandidate(null)}>
                Close Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 4. JOB FAIRNESS AGENT TAB ──────────────────────────────────
function JobFairnessAgent() {
  const [rewritten, setRewritten] = useState(false);

  const original = `Requirements:
• Master's degree in Computer Science required
• 5+ years industry experience mandatory
• Must have worked at a Fortune 500 company
• No career gaps acceptable`;

  const rewrite = `Requirements:
• Demonstrated proficiency in Python, AI engineering and distributed systems (assessment verified)
• Practical experience deploying and monitoring production services
• Evidence of problem-solving in complex technical environments
• Capability verified through practical trial or portfolio projects`;

  const flags = [
    { issue: 'Credential Proxy', text: "Master's degree in Computer Science", suggestion: 'Demonstrated proficiency in Python, AI engineering' },
    { issue: 'Experience Proxy', text: '5+ years Fortune 500 company', suggestion: 'Practical experience deploying production services' },
    { issue: 'Continuity Bias', text: 'No career gaps acceptable', suggestion: 'Remove — evaluate verified capability directly' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: 8, fontSize: '0.775rem', color: 'var(--text-secondary)',
      }}>
        <strong style={{ color: 'var(--violet)' }}>Job Fairness Agent:</strong> Analyzes job descriptions for credential proxies, geographic bias, and exclusionary language. Explicit HR human approval required for all suggested rewrites.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card-flat" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            TRADITIONAL REQUIREMENT (FLAGGED)
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {original}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            CAPABILITY-BASED REQUIREMENT
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {rewrite}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          FLAGS DETECTED INLINE
        </div>
        {flags.map(f => (
          <div key={f.issue} style={{
            display: 'flex', gap: '0.75rem', padding: '0.625rem 0.875rem', marginBottom: '0.375rem',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 7,
          }}>
            <AlertTriangle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--red)' }}>{f.issue}</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>&quot;{f.text}&quot;</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--green)', marginTop: '0.2rem' }}>→ {f.suggestion}</div>
            </div>
          </div>
        ))}
      </div>

      {!rewritten ? (
        <button className="btn-primary" style={{ width: 'fit-content' }} onClick={() => setRewritten(true)}>
          <CheckCircle2 size={14} /> Review &amp; Approve Capability-Based Rewrite
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.625rem 0.875rem', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7,
            fontSize: '0.825rem', fontWeight: 600, color: 'var(--green)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={15} /> Rewrite Approved &amp; Recorded by HR Reviewer.
        </motion.div>
      )}
    </div>
  );
}

// ─── 5. ACCESSIBILITY BLUEPRINTS TAB ────────────────────────────
function AccessibilityAgent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        padding: '0.875rem 1rem',
        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
        borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, color: 'var(--cyan)',
      }}>
        "Ask how the workplace can enable the person — not confirm compliance checkboxes."
      </div>

      <div className="card-flat" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.875rem', letterSpacing: '0.04em' }}>
          ACCOMMODATION BLUEPRINT CHECKLIST — SOFTWARE / AI OPERATIONS ROLE
        </div>

        {[
          { title: 'Screen-Reader Compatible Tooling', desc: 'Ensure all monitoring dashboards support NVDA/JAWS. Terminal access with screen-reader mode pre-configured.', icon: '♿' },
          { title: 'Accessible Development Environment', desc: 'VS Code with high contrast themes, screen magnification, and keyboard navigation shortcuts.', icon: '💻' },
          { title: 'Flexible Communication Protocols', desc: 'Asynchronous communication preferred. Written documentation for meetings; mandatory transcriptions.', icon: '💬' },
          { title: 'Accessible Documentation Standard', desc: 'All technical documentation in accessible HTML. Alt text on diagram nodes and flowcharts.', icon: '📄' },
          { title: 'Flexible Assessment Format', desc: 'Take-home practical trials with flexible time windows rather than timed whiteboard pressure.', icon: '✍️' },
        ].map(item => (
          <div key={item.title} style={{
            display: 'flex', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem',
            background: 'var(--bg-hover)', borderRadius: 8,
          }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.25rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. BIAS AUDIT AGENT TAB ────────────────────────────────────
function BiasAuditTab() {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [sourceTag, setSourceTag] = useState<'live' | 'fallback'>('live');
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/bias-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.audit) {
        setAuditData(data.audit);
        setSourceTag(data.source === 'live' ? 'live' : 'fallback');
      }
    } catch (err) {
      console.warn('Bias audit call error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const handleAcknowledge = (id: string) => {
    setAcknowledged(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 8, fontSize: '0.775rem', color: 'var(--text-secondary)', flex: 1, marginRight: '1rem',
        }}>
          <strong style={{ color: 'var(--red)' }}>Bias Audit Agent:</strong> Monitors enterprise hiring pipelines for demographic, continuous employment, and geographic disparities. AI recommends flags; human reviewers evaluate and decide.
        </div>
        <button onClick={runAudit} disabled={loading} className="btn-secondary" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> {loading ? 'Auditing...' : 'Re-Run Live Audit'}
        </button>
      </div>

      {/* Parity Metrics Comparison Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {/* Gap Parity */}
        <div className="card-flat" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Match Rate by Career Gap Length
          </div>
          {[
            { label: '0 Years Gap', rate: 92, color: 'var(--green)' },
            { label: '1–2 Years Gap', rate: 74, color: 'var(--blue-primary)' },
            { label: '3+ Years Gap (Caregiving)', rate: 58, color: 'var(--red)' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <span>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color }}>{m.rate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.rate}%`, background: m.color }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: '0.675rem', color: 'var(--red)', marginTop: '0.5rem', fontWeight: 600 }}>
            ⚠ Disparity Threshold Crossed: -34% for 3+ yr gap
          </div>
        </div>

        {/* Education Tier Parity */}
        <div className="card-flat" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Match Rate by Education Credential
          </div>
          {[
            { label: 'Tier-1 CS Degree (IIT/CU)', rate: 94, color: 'var(--green)' },
            { label: 'State University Degree', rate: 79, color: 'var(--blue-primary)' },
            { label: 'Self-Taught / Non-Traditional', rate: 68, color: 'var(--amber)' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <span>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color }}>{m.rate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.rate}%`, background: m.color }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: '0.675rem', color: 'var(--amber)', marginTop: '0.5rem', fontWeight: 600 }}>
            ⚠ Credential Proxy Disparity: -26% for self-taught
          </div>
        </div>

        {/* Location Parity */}
        <div className="card-flat" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Callback Rate by Location Tier
          </div>
          {[
            { label: 'Tier-1 Metro (Bangalore/NCR)', rate: 91, color: 'var(--green)' },
            { label: 'Tier-2 City (Chandigarh/Hubli)', rate: 82, color: 'var(--blue-primary)' },
            { label: 'Tier-3 City (Lucknow/Dharwad)', rate: 71, color: 'var(--amber)' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <span>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color }}>{m.rate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.rate}%`, background: m.color }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: '0.675rem', color: 'var(--amber)', marginTop: '0.5rem', fontWeight: 600 }}>
            ⚠ Geographic Bias Disparity: -20% for Tier-3 cities
          </div>
        </div>
      </div>

      {/* Audit Flags from Gemini Flash */}
      {auditData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Gemini Flash Bias Audit Findings ({auditData.auditFlags?.length || 0} Flags)
            </div>
            <span className={`badge ${sourceTag === 'live' ? 'badge-green' : 'badge-amber'}`}>
              {sourceTag === 'live' ? '⚡ LIVE GEMINI 1.5 FLASH AUDIT' : '🛡️ CACHED MODEL'}
            </span>
          </div>

          {auditData.auditFlags?.map((flag: any) => (
            <div key={flag.id} className="card-flat" style={{
              padding: '1rem', border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.04)', borderRadius: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--red)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{flag.title}</span>
                </div>
                <span className="badge badge-amber">{flag.category}</span>
              </div>

              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                <strong>Empirical Finding:</strong> {flag.finding}
              </div>

              <div style={{
                padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6,
                fontSize: '0.75rem', color: 'var(--green)', fontWeight: 500, marginBottom: '0.75rem',
              }}>
                <strong>Recommended HR Action:</strong> {flag.recommendation}
              </div>

              {!acknowledged[flag.id] ? (
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.725rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => handleAcknowledge(flag.id)}
                >
                  <CheckCircle2 size={13} /> Acknowledge &amp; Review Disparity
                </button>
              ) : (
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle2 size={13} /> Acknowledged by Human HR Reviewer
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN WORKFORCE CONTENT ─────────────────────────────────────
function WorkforceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [selectedTransition, setSelectedTransition] = useState<{ dept: string; from: string; to: string; readiness: number; employees: number } | null>(null);
  const [planCreatedMsg, setPlanCreatedMsg] = useState('');

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.replace(`/workforce?tab=${newTab}`, { scroll: false });
  };

  const totalEmployees = mockWorkforceDepartments.reduce((s, d) => s + d.headcount, 0);
  const avgAI = Math.round(mockWorkforceDepartments.reduce((s, d) => s + (d.capabilities['AI / ML'] || 0), 0) / mockWorkforceDepartments.length);
  const avgCloud = Math.round(mockWorkforceDepartments.reduce((s, d) => s + (d.capabilities['Cloud'] || 0), 0) / mockWorkforceDepartments.length);
  const totalTransitions = mockWorkforceDepartments.reduce((s, d) => s + d.transitions.reduce((t, r) => t + r.employees, 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Workforce Capability Map' },
    { id: 'mobility', label: 'Internal Mobility' },
    { id: 'fairness', label: 'Job Fairness Agent' },
    { id: 'equity', label: 'Equity Review' },
    { id: 'bias-audit', label: 'Bias Audit Agent' },
    { id: 'accessibility', label: 'Accessibility Blueprints' },
  ];

  const handleCreateReskillingPlan = () => {
    if (!selectedTransition) return;
    setPlanCreatedMsg(`Reskilling Plan created for ${selectedTransition.employees} employees in ${selectedTransition.from} → ${selectedTransition.to}!`);
    setSelectedTransition(null);
    setTimeout(() => setPlanCreatedMsg(''), 4000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workforce Capability Console</h1>
        <p className="page-subtitle">See what your workforce can do today — and what it can become tomorrow.</p>
      </div>

      {planCreatedMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 8,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: 'var(--green)',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          {planCreatedMsg}
        </motion.div>
      )}

      {/* Headline Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Enterprise Workforce', value: totalEmployees.toLocaleString(), color: 'var(--blue-primary)', icon: <Users size={15} /> },
          { label: 'Avg AI Capability', value: `${avgAI}%`, color: 'var(--violet)', icon: <Brain size={15} /> },
          { label: 'Avg Cloud Capability', value: `${avgCloud}%`, color: 'var(--cyan)', icon: <TrendingUp size={15} /> },
          { label: 'High-Potential Transitions', value: totalTransitions.toLocaleString(), color: 'var(--green)', icon: <Zap size={15} /> },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {m.icon} {m.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: m.color, marginTop: '0.2rem' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="tab-nav" style={{ marginBottom: '1.25rem', overflowX: 'auto', maxWidth: '100%' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => handleTabChange(t.id)}
            id={`tab-btn-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OverviewTab />
          </motion.div>
        )}

        {activeTab === 'map' && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Workforce Capability Map</div>
              <div className="section-subtitle" style={{ marginBottom: '1rem' }}>Capability proficiency by department</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Headcount</th>
                      {capabilityKeys.map(k => (
                        <th key={k} style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockWorkforceDepartments.map(dept => (
                      <tr key={dept.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{dept.name}</td>
                        <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{dept.headcount.toLocaleString()}</td>
                        {capabilityKeys.map(k => (
                          <ScoreCell key={k} value={dept.capabilities[k] || 0} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'mobility' && (
          <motion.div key="mobility" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Internal Mobility Opportunities</div>
              <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Employees ready for high-demand transitions based on current capability twins</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {mockWorkforceDepartments.flatMap(dept =>
                  dept.transitions.map(t => ({
                    dept: dept.name,
                    ...t,
                  }))
                ).sort((a, b) => b.readiness - a.readiness).map((t, i) => (
                  <motion.div
                    key={`${t.dept}-${t.from}-${t.to}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 9,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t.from}</span>
                        <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--blue-primary)' }}>{t.to}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.dept} · {t.employees.toLocaleString()} employees eligible
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.25rem', fontWeight: 800,
                        color: t.readiness >= 80 ? 'var(--green)' : t.readiness >= 65 ? 'var(--blue-primary)' : 'var(--amber)',
                      }}>
                        {t.readiness}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Readiness</div>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', flexShrink: 0 }}
                      onClick={() => setSelectedTransition(t)}
                    >
                      Build Reskilling Plan
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'fairness' && (
          <motion.div key="fairness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Job Fairness Agent</div>
              <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Rewrite credential proxies and exclusionary language with capability-based requirements. Human approval required.</div>
              <JobFairnessAgent />
            </div>
          </motion.div>
        )}

        {activeTab === 'equity' && (
          <motion.div key="equity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Equity Review &amp; Gap Mitigation</div>
              <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Capability-based insights during candidate review. Humans always decide.</div>
              <EquityNudge />
            </div>
          </motion.div>
        )}

        {activeTab === 'bias-audit' && (
          <motion.div key="bias-audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Bias Audit Agent</div>
              <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Demographic &amp; continuity parity metrics across candidate pool. AI flags disparities for HR review.</div>
              <BiasAuditTab />
            </div>
          </motion.div>
        )}

        {activeTab === 'accessibility' && (
          <motion.div key="accessibility" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.375rem' }}>Accessibility Blueprints</div>
              <div className="section-subtitle" style={{ marginBottom: '1.25rem' }}>Tailored accommodation blueprints that enable candidates in their role.</div>
              <AccessibilityAgent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reskilling Plan Modal */}
      <AnimatePresence>
        {selectedTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              padding: '1rem',
            }}
            onClick={() => setSelectedTransition(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 480,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                    Reskilling Plan: {selectedTransition.from} → {selectedTransition.to}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Department: {selectedTransition.dept} · {selectedTransition.employees} employees
                  </div>
                </div>
                <button onClick={() => setSelectedTransition(null)} className="btn-ghost" style={{ padding: '0.3rem' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{
                padding: '0.875rem', borderRadius: 8, background: 'rgba(79,142,247,0.06)',
                border: '1px solid rgba(79,142,247,0.2)', marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-primary)' }}>Target Readiness</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>{selectedTransition.readiness}% → 92%</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Estimated transition timeline: <strong>6 weeks</strong> (10 hrs/week practical work)
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                  TARGET COMPETENCY MODULES
                </div>
                {[
                  'Module 1: Practical AI Evaluation & Quality Assurance (15 hrs)',
                  'Module 2: Cloud Infrastructure & Container Deployment (20 hrs)',
                  'Module 3: Hands-on MLOps Practical Trial (15 hrs)',
                  'Module 4: Enterprise Safety & Bias Mitigation (10 hrs)',
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    {m}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-ghost" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setSelectedTransition(null)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleCreateReskillingPlan}>
                  Deploy Reskilling Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkforcePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Workforce Console...</div>}>
      <WorkforceContent />
    </Suspense>
  );
}
