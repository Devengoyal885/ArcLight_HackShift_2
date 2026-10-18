'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Brain, Radar, Zap, CheckSquare,
  ArrowRight, Clock, AlertCircle, Sparkles, Target,
  ChevronRight, Award, X, CheckCircle2, FileText,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  mockMomentumData, mockActions, mockOpportunities,
  getUserProfile, getUserCapabilities, getUserActions, getUserOpportunities,
} from '@/data/mockData';
import { formatDeadline } from '@/lib/utils';
import type { Action } from '@/types';
import { useAuth } from '@/lib/auth-context';

function AnimatedNumber({ target, suffix = '', prefix = '', duration = 1200 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let animationFrameId: number;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };
    animationFrameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return <>{prefix}{current}{suffix}</>;
}

const actionColors: Record<string, string> = {
  urgent: 'var(--red)',
  high: 'var(--amber)',
  medium: 'var(--blue-primary)',
  low: 'var(--text-muted)',
};

const actionBg: Record<string, string> = {
  urgent: 'rgba(239,68,68,0.08)',
  high: 'rgba(245,158,11,0.08)',
  medium: 'rgba(79,142,247,0.08)',
  low: 'rgba(92,98,112,0.08)',
};

const actionIcon: Record<string, React.ReactNode> = {
  application: <Radar size={14} />,
  assessment: <Brain size={14} />,
  interview: <Award size={14} />,
  hackathon: <Zap size={14} />,
  learning: <Target size={14} />,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [actionsList, setActionsList] = useState(() => getUserActions(user?.email));
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actionDoneMsg, setActionDoneMsg] = useState('');

  const activeProfile = getUserProfile(user?.email);
  const activeCapabilities = getUserCapabilities(user?.email);
  const activeOpportunities = getUserOpportunities(user?.email);

  useEffect(() => {
    setActionsList(getUserActions(user?.email));
  }, [user?.email]);

  const topActions = actionsList.filter(a => !a.completed).slice(0, 4);
  const topOpps = activeOpportunities.slice(0, 3);

  const handleExecuteAction = (action: Action) => {
    if (action.category === 'application') {
      router.push('/opportunities');
    } else if (action.category === 'assessment') {
      router.push('/capability?tab=trial');
    } else if (action.category === 'interview') {
      router.push('/workspace');
    } else if (action.category === 'learning') {
      router.push('/capability');
    } else {
      setSelectedAction(action);
    }
  };

  const handleMarkComplete = (actionId: string) => {
    setActionsList(prev => prev.map(a => a.id === actionId ? { ...a, completed: true } : a));
    setSelectedAction(null);
    setActionDoneMsg('Action completed! Capability momentum updated.');
    setTimeout(() => setActionDoneMsg(''), 3000);
  };

  const metrics = [
    {
      label: 'Capability Momentum',
      value: activeProfile.capabilityMomentum || 22,
      suffix: '%',
      prefix: '+',
      sub: 'this month',
      icon: <TrendingUp size={16} />,
      color: 'var(--green)',
      href: '/capability',
    },
    {
      label: 'Capability Twin',
      value: activeProfile.capabilityTwinScore || 89,
      suffix: '%',
      sub: 'Verified',
      icon: <Brain size={16} />,
      color: 'var(--blue-primary)',
      href: '/capability',
    },
    {
      label: 'Future Readiness',
      value: activeProfile.futureReadiness || 86,
      suffix: '%',
      sub: 'AI/FullStack trajectory',
      icon: <Target size={16} />,
      color: 'var(--violet)',
      href: '/capability',
    },
    {
      label: 'Opportunity Match',
      value: activeProfile.opportunityMatch || 95,
      suffix: '%',
      sub: 'Best match',
      icon: <Radar size={16} />,
      color: 'var(--cyan)',
      href: '/opportunities',
    },
    {
      label: 'Active Transitions',
      value: activeProfile.activeTransitions || 3,
      sub: 'In progress',
      icon: <Zap size={16} />,
      color: 'var(--amber)',
      href: '/capability?tab=transfer',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">Good day, {user?.name || activeProfile.name}. 👋</h1>
          <p className="page-subtitle">Your career is moving forward. Here&apos;s your capability momentum &amp; top priorities.</p>
        </motion.div>
      </div>

      {actionDoneMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
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
          {actionDoneMsg}
        </motion.div>
      )}

      {/* Hero Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link href={m.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="metric-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
                  <span style={{ color: m.color }}>{m.icon}</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: m.color, lineHeight: 1.1, marginTop: '0.375rem' }}>
                  <AnimatedNumber target={m.value} suffix={m.suffix} prefix={m.prefix} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.sub}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Career Momentum Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="section-title">Career Momentum</div>
                <div className="section-subtitle">6-month capability &amp; opportunity growth</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem' }}>
                {[
                  { color: '#4f8ef7', label: 'Capabilities' },
                  { color: '#10b981', label: 'Opportunities' },
                  { color: '#8b5cf6', label: 'Readiness' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 8, height: 3, borderRadius: 2, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mockMomentumData}>
                <defs>
                  <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="oppGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[30, 100]} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="capabilities" stroke="#4f8ef7" strokeWidth={2} fill="url(#capGrad)" dot={false} />
                <Area type="monotone" dataKey="opportunities" stroke="#10b981" strokeWidth={2} fill="url(#oppGrad)" dot={false} />
                <Area type="monotone" dataKey="readiness" stroke="#8b5cf6" strokeWidth={2} fill="url(#readGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Next Best Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="section-title">Next Best Actions</div>
                <div className="section-subtitle">AI-prioritized tasks requiring your attention</div>
              </div>
              <Link href="/actions" className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 0.875rem', borderRadius: 8,
                    background: actionBg[action.priority],
                    border: `1px solid ${actionColors[action.priority]}22`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${actionColors[action.priority]}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: actionColors[action.priority],
                  }}>
                    {actionIcon[action.category] || <CheckSquare size={14} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</span>
                      {action.agentCode && (
                        <span style={{
                          fontSize: '0.575rem', fontWeight: 800, padding: '0.05rem 0.35rem',
                          borderRadius: 4, background: 'rgba(79,142,247,0.12)', color: 'var(--blue-primary)',
                          border: '1px solid rgba(79,142,247,0.25)',
                        }}>
                          [{action.agentCode}]
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        padding: '0.1rem 0.375rem', borderRadius: 999,
                        background: `${actionColors[action.priority]}20`,
                        color: actionColors[action.priority],
                        textTransform: 'uppercase',
                      }}>
                        {action.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {action.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                    {action.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: actionColors[action.priority] }}>
                        <Clock size={11} />
                        {formatDeadline(action.deadline)}
                      </div>
                    )}
                    {action.estimatedTime && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{action.estimatedTime}</span>
                    )}
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', marginTop: '0.1rem' }}
                      onClick={() => handleExecuteAction(action)}
                    >
                      Act <ArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Top Capabilities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="card"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div className="section-title">Top Capabilities ({activeProfile.name.split(' ')[0]})</div>
              <Link href="/capability" className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                Twin <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {activeCapabilities.slice(0, 6).map(cap => (
                <div key={cap.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cap.name}</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${cap.proficiency}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      style={{
                        background: cap.proficiency >= 85 ? 'var(--green)' :
                          cap.proficiency >= 70 ? 'var(--blue-primary)' : 'var(--amber)',
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, width: 32, textAlign: 'right',
                    color: cap.proficiency >= 85 ? 'var(--green)' :
                      cap.proficiency >= 70 ? 'var(--blue-primary)' : 'var(--amber)',
                  }}>
                    {cap.proficiency}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Opportunities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="card"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div className="section-title">Top Opportunities</div>
              <Link href="/opportunities" className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                Radar <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topOpps.map((opp) => (
                <div key={opp.id} className="card-flat" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{opp.title}</div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 800, color: 'var(--green)',
                      background: 'rgba(16,185,129,0.12)', padding: '0.1rem 0.375rem', borderRadius: 999,
                    }}>
                      {opp.matchScore}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {opp.company} · {opp.remote ? 'Remote' : opp.location}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <span style={{
                      fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 999,
                      background: 'var(--bg-hover)', color: 'var(--text-muted)',
                    }}>
                      Deadline: {formatDeadline(opp.deadline)}
                    </span>
                    {opp.compensation && (
                      <span style={{
                        fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 999,
                        background: 'rgba(16,185,129,0.1)', color: 'var(--green)',
                      }}>
                        {opp.compensation}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <Link href="/opportunities" className="btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                <Radar size={14} /> View Opportunity Radar
              </Link>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="card"
            style={{ padding: '1.25rem' }}
          >
            <div className="section-title" style={{ marginBottom: '0.875rem' }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Translate Experience', icon: <Zap size={13} />, href: '/capability?tab=translator', color: 'var(--violet)' },
                { label: 'Open AI Workspace', icon: <Sparkles size={13} />, href: '/workspace', color: 'var(--cyan)' },
                { label: 'Run Practical Trial', icon: <Brain size={13} />, href: '/capability?tab=trial', color: 'var(--blue-primary)' },
                { label: 'Create Context Capsule', icon: <Target size={13} />, href: '/workspace?tab=capsule', color: 'var(--amber)' },
              ].map(qa => (
                <Link
                  key={qa.label}
                  href={qa.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 0.75rem', borderRadius: 7,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    textDecoration: 'none', color: 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: 500,
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ color: qa.color }}>{qa.icon}</span>
                  {qa.label}
                  <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Execution Modal */}
      <AnimatePresence>
        {selectedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
              padding: '1rem',
            }}
            onClick={() => setSelectedAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 }}
              style={{
                width: '100%', maxWidth: 440,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 14, padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedAction.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {selectedAction.category} · Priority: {selectedAction.priority}
                  </div>
                </div>
                <button onClick={() => setSelectedAction(null)} className="btn-ghost" style={{ padding: '0.3rem' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedAction.description}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleMarkComplete(selectedAction.id)}
                >
                  <CheckCircle2 size={15} /> Mark Complete
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    const id = selectedAction.id;
                    setSelectedAction(null);
                    handleExecuteAction(selectedAction);
                  }}
                >
                  Go to Action Module
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
