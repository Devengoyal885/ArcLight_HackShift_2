'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Radar, Filter, MapPin, Clock, Zap, X,
  CheckCircle2, ArrowRight, ExternalLink, Brain,
  FileText, Target, Building2, Globe, Send, Upload,
} from 'lucide-react';
import { mockOpportunities, getUserOpportunities, mockActions, getUserCapabilities } from '@/data/mockData';
import type { Opportunity, OpportunityType } from '@/types';
import { formatDeadline, sleep } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const typeLabels: Record<OpportunityType, string> = {
  job: 'Job', internship: 'Internship', 'paid-internship': 'Paid Intern',
  hackathon: 'Hackathon', competition: 'Competition', fellowship: 'Fellowship',
  scholarship: 'Scholarship', research: 'Research',
};

const typeBadge: Record<OpportunityType, string> = {
  job: 'badge-blue', internship: 'badge-muted', 'paid-internship': 'badge-green',
  hackathon: 'badge-violet', competition: 'badge-cyan', fellowship: 'badge-amber',
  scholarship: 'badge-cyan', research: 'badge-violet',
};

function scoreColor(s: number) {
  if (s >= 88) return 'var(--green)';
  if (s >= 75) return 'var(--blue-primary)';
  if (s >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function MatchRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="4"/>
        <motion.circle
          cx="26" cy="26" r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color,
      }}>
        {score}%
      </div>
    </div>
  );
}

function OpportunityCard({ opp, selected, onClick }: { opp: Opportunity; selected: boolean; onClick: () => void }) {
  const deadlineD = (() => {
    const d = Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000);
    if (d <= 0) return 'Overdue';
    if (d === 1) return 'Tomorrow';
    if (d <= 3) return `${d} days`;
    return formatDeadline(opp.deadline);
  })();
  const isUrgent = Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      onClick={onClick}
      style={{
        padding: '0.875rem', cursor: 'pointer',
        borderColor: selected ? 'rgba(79,142,247,0.4)' : undefined,
        background: selected ? 'rgba(79,142,247,0.04)' : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <MatchRing score={opp.matchScore} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{opp.title}</div>
            {isUrgent && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--red)',
                background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.35rem', borderRadius: 999, flexShrink: 0, marginLeft: '0.5rem',
              }}>URGENT</span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            {opp.company}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge ${typeBadge[opp.type]}`}>{typeLabels[opp.type]}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <MapPin size={10} />{opp.remote ? 'Remote' : opp.location}
            </span>
            <span style={{
              fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem',
              color: isUrgent ? 'var(--red)' : 'var(--text-muted)',
            }}>
              <Clock size={10} />{deadlineD}
            </span>
            {opp.compensation && (
              <span style={{ fontSize: '0.7rem', color: 'var(--green)' }}>{opp.compensation}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OpportunityDetail({ opp, onClose, onApply }: { opp: Opportunity; onClose: () => void; onApply: (opp: Opportunity) => void }) {
  const router = useRouter();
  const scores = [
    { label: 'Opportunity Fit', value: opp.matchScore, color: scoreColor(opp.matchScore) },
    { label: 'Capability Fit', value: opp.capabilityFit, color: scoreColor(opp.capabilityFit) },
    { label: 'Evidence Fit', value: opp.evidenceFit, color: scoreColor(opp.evidenceFit) },
    { label: 'Resume Fit', value: opp.resumeFit, color: scoreColor(opp.resumeFit) },
    { label: 'Future Fit', value: opp.futureFit, color: scoreColor(opp.futureFit) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card"
      style={{ padding: '1.25rem', position: 'sticky', top: '1.25rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{opp.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {opp.company} · {opp.remote ? 'Remote' : opp.location}
          </div>
          {opp.compensation && (
            <div style={{ fontSize: '0.8rem', color: 'var(--green)', marginTop: '0.2rem', fontWeight: 600 }}>
              {opp.compensation}
            </div>
          )}
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '0.3rem' }}>
          <X size={15} />
        </button>
      </div>

      {/* Score Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {scores.map(s => (
          <div key={s.label} style={{
            padding: '0.625rem', background: 'var(--bg-elevated)',
            borderRadius: 8, border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}%</div>
            <div style={{ height: 3, background: 'var(--bg-hover)', borderRadius: 999, marginTop: '0.25rem', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 0.7 }}
                style={{ height: '100%', background: s.color, borderRadius: 999 }}
              />
            </div>
          </div>
        ))}
        <div style={{ padding: '0.625rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Deadline</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--amber)' }}>{formatDeadline(opp.deadline)}</div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
        {opp.description}
      </div>

      {/* Capability Analysis */}
      <div style={{ marginBottom: '1rem' }}>
        {opp.missingCapabilities.length > 0 && (
          <div style={{ marginBottom: '0.625rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
              ⚡ MISSING CAPABILITIES
            </div>
            {opp.missingCapabilities.map(mc => (
              <div key={mc.name} style={{ marginBottom: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{mc.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{mc.current}% → {mc.required}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${mc.current}%`, background: 'var(--blue-primary)', borderRadius: 999 }} />
                    <div style={{ width: `${mc.required - mc.current}%`, background: 'rgba(245,158,11,0.3)', borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
            ✓ TRANSFERABLE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {opp.transferableCapabilities.map(t => (
              <span key={t} className="badge badge-green">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          className="btn-primary"
          style={{ justifyContent: 'center' }}
          id="apply-btn"
          onClick={() => onApply(opp)}
        >
          <ArrowRight size={14} /> Apply Now
        </button>
        <button
          className="btn-secondary"
          style={{ justifyContent: 'center' }}
          onClick={() => router.push('/resume')}
        >
          <FileText size={14} /> Optimize Resume
        </button>
        {opp.missingCapabilities.length > 0 && (
          <button
            className="btn-secondary"
            style={{ justifyContent: 'center', color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }}
            onClick={() => router.push('/capability?tab=trial')}
          >
            <Brain size={14} /> Close Capability Gap
          </button>
        )}
      </div>
    </motion.div>
  );
}

function OpportunitiesContent() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [oppsList, setOppsList] = useState<Opportunity[]>(() => getUserOpportunities(user?.email));
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(() => getUserOpportunities(user?.email)[0] || null);
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');
  const [applyingOpp, setApplyingOpp] = useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedMsg, setAppliedMsg] = useState('');
  const [customPitch, setCustomPitch] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [liveMatchTag, setLiveMatchTag] = useState<string>('');

  useEffect(() => {
    const opps = getUserOpportunities(user?.email);
    setOppsList(opps);
    setSelectedOpp(opps[0] || null);
  }, [user?.email]);

  const allTypes: (OpportunityType | 'all')[] = ['all', 'job', 'paid-internship', 'internship', 'hackathon', 'fellowship', 'scholarship', 'research'];

  const filtered = oppsList
    .filter(o => selectedType === 'all' || o.type === selectedType)
    .filter(o => !remoteOnly || o.remote)
    .sort((a, b) => sortBy === 'match' ? b.matchScore - a.matchScore : new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const handleLiveRescore = async () => {
    if (!selectedOpp) return;
    setRecalculating(true);
    try {
      const res = await fetch('/api/agents/opportunity-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capabilities: getUserCapabilities(user?.email),
          opportunityTitle: selectedOpp.title,
          opportunityRequirements: selectedOpp.description,
        }),
      });
      const data = await res.json();
      if (data.match) {
        const updatedOpp = {
          ...selectedOpp,
          matchScore: data.match.overallMatch,
          capabilityFit: data.match.capabilityFit,
          futureFit: data.match.futureFit,
          evidenceFit: data.match.evidenceFit,
          resumeFit: data.match.resumeFit,
        };
        setSelectedOpp(updatedOpp);
        setOppsList(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        setLiveMatchTag(`Evaluated via Gemini Flash (${data.source.toUpperCase()})`);
      }
    } catch (err) {
      console.warn('Live rescore error', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!applyingOpp) return;
    setSubmitting(true);
    await sleep(1000);
    setSubmitting(false);
    setAppliedMsg(`Application for ${applyingOpp.title} at ${applyingOpp.company} submitted! Capability Twin attached.`);
    setApplyingOpp(null);
    setCustomPitch('');
    setTimeout(() => setAppliedMsg(''), 4000);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Opportunity Radar</h1>
            <p className="page-subtitle">Opportunities matched to your live capabilities, goals and trajectory — not just keywords.</p>
          </div>
          {selectedOpp && (
            <button
              onClick={handleLiveRescore}
              disabled={recalculating}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', borderColor: 'var(--blue-primary)', color: 'var(--blue-primary)' }}
            >
              <Zap size={13} /> {recalculating ? 'Calling Gemini...' : 'Re-Evaluate Match via Gemini Flash'}
            </button>
          )}
        </div>
        {liveMatchTag && (
          <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, marginTop: '0.375rem' }}>
            ⚡ {liveMatchTag}
          </div>
        )}
      </div>

      {appliedMsg && (
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
          {appliedMsg}
        </motion.div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Matches', value: mockOpportunities.length, color: 'var(--blue-primary)' },
          { label: 'Best Match', value: '95%', color: 'var(--green)' },
          { label: 'Urgent Deadlines', value: mockOpportunities.filter(o => Math.ceil((new Date(o.deadline).getTime() - Date.now()) / 86400000) <= 3).length, color: 'var(--red)' },
          { label: 'Remote', value: mockOpportunities.filter(o => o.remote).length, color: 'var(--cyan)' },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ flex: 1 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
          {allTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem',
                fontWeight: 600, cursor: 'pointer', border: 'none', flexShrink: 0,
                background: selectedType === type ? 'var(--blue-primary)' : 'var(--bg-elevated)',
                color: selectedType === type ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.12s',
              }}
            >
              {type === 'all' ? 'All' : typeLabels[type as OpportunityType]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
          <button
            onClick={() => setRemoteOnly(r => !r)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem',
              fontWeight: 600, cursor: 'pointer',
              background: remoteOnly ? 'rgba(6,182,212,0.15)' : 'var(--bg-elevated)',
              color: remoteOnly ? 'var(--cyan)' : 'var(--text-secondary)',
              border: remoteOnly ? '1px solid rgba(6,182,212,0.3)' : '1px solid var(--border)',
            }}
          >
            <Globe size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Remote Only
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'match' | 'deadline')}
            style={{
              padding: '0.3rem 0.625rem', borderRadius: 7, fontSize: '0.75rem',
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="match">Sort: Best Match</option>
            <option value="deadline">Sort: Deadline</option>
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOpp ? '1fr 380px' : '1fr', gap: '1.25rem' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No opportunities match your current filters.
            </div>
          ) : (
            filtered.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                selected={selectedOpp?.id === opp.id}
                onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
              />
            ))
          )}
        </div>

        {/* Detail */}
        <AnimatePresence>
          {selectedOpp && (
            <OpportunityDetail
              opp={selectedOpp}
              onClose={() => setSelectedOpp(null)}
              onApply={(o) => setApplyingOpp(o)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {applyingOpp && (
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
            onClick={() => setApplyingOpp(null)}
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
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Apply: {applyingOpp.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{applyingOpp.company} · {applyingOpp.compensation || 'Standard package'}</div>
                </div>
                <button onClick={() => setApplyingOpp(null)} className="btn-ghost" style={{ padding: '0.3rem' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{
                padding: '0.75rem', borderRadius: 8, background: 'rgba(79,142,247,0.06)',
                border: '1px solid rgba(79,142,247,0.2)', marginBottom: '1rem',
                fontSize: '0.775rem', color: 'var(--text-secondary)',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--blue-primary)', marginBottom: '0.2rem' }}>
                  Capability Twin Attached (Score: {applyingOpp.matchScore}%)
                </div>
                Your verified evidence (GitHub, practical trials, project work) will be presented to {applyingOpp.company}.
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'block' }}>
                  Applicant Persona
                </label>
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <strong>{user?.name || 'Priya Sharma'}</strong> ({user?.email || 'priya@accesshire.ai'})
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'block' }}>
                  Add Capability Pitch / Statement (Optional)
                </label>
                <textarea
                  value={customPitch}
                  onChange={e => setCustomPitch(e.target.value)}
                  placeholder="Tell the recruiter why your transferable capabilities make you a strong fit..."
                  className="input"
                  style={{ minHeight: 90, fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border)' }}
                  onClick={() => setApplyingOpp(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={handleConfirmApply}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>}>
      <OpportunitiesContent />
    </Suspense>
  );
}
