'use client';

import { motion } from 'framer-motion';
import { getUserCapabilities, getUserProfile } from '@/data/mockData';
import {
  CheckCircle2, MapPin, GraduationCap, Clock, TrendingUp,
  Shield, Award, Briefcase, FileCode, Phone, Mail,
  Sparkles, ExternalLink, BookOpen, Layers, Code2, Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = getUserProfile(user?.email);
  const capabilities = getUserCapabilities(user?.email);
  const isDeven = profile.id === 'user-deven' || profile.name.toLowerCase().includes('deven');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Master Profile &amp; Adaptive Twin</h1>
        <p className="page-subtitle">
          Verified credentials, intellectual property, and real capability evidence for <strong>{profile.name}</strong>.
        </p>
      </div>

      {/* Flagship Headline Stat Strip for Deven */}
      {isDeven && profile.headlineStats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {profile.headlineStats.map((stat, i) => (
            <div
              key={stat.label}
              className="card"
              style={{
                padding: '1rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(79,142,247,0.06), rgba(139,92,246,0.06))',
                border: '1.5px solid rgba(79,142,247,0.25)',
              }}
            >
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--blue-primary)' : i === 2 ? 'var(--violet)' : 'var(--green)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>

        {/* Left: Profile Card & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 900, color: 'white',
              boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
            }}>
              {profile.name[0]}
            </div>

            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.2rem' }}>{profile.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--blue-primary)', fontWeight: 700, marginBottom: '0.875rem' }}>
              {profile.title || profile.targetRole}
            </div>

            <div style={{
              fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5,
              padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 8,
              border: '1px solid var(--border)', textAlign: 'left', marginBottom: '1rem',
            }}>
              {profile.summary || 'Passionate technology innovator developing research-driven solutions across enterprise AI, full-stack systems, and product innovation.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{profile.location}</span>
              </div>
              {profile.contact?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span>{profile.contact.phone}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{profile.contact?.email || profile.email}</span>
              </div>
              {profile.contact?.github && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Code2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span>github.com/{profile.contact.github}</span>
                </div>
              )}
              {profile.contact?.linkedin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Globe size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span>{profile.contact.linkedin}</span>
                </div>
              )}
            </div>

            <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--blue-primary)' }}>{profile.capabilityTwinScore}%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Capability Twin Score</div>
            </div>

            {/* Certifications Badge */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div style={{ marginTop: '0.875rem', padding: '0.625rem', background: 'rgba(16,185,129,0.08)', borderRadius: 7, border: '1px solid rgba(16,185,129,0.2)', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Award size={13} /> CERTIFICATIONS
                </div>
                {profile.certifications.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    • {c}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Education Breakdown */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="section-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <GraduationCap size={15} /> Education History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {(profile.educationList || [{ degree: profile.education, institution: '', year: '' }]).map((ed, i) => (
                <div key={i} style={{ padding: '0.625rem', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ed.degree}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {ed.institution} · {ed.year}
                  </div>
                  {ed.score && (
                    <div style={{ fontSize: '0.675rem', color: 'var(--blue-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                      Performance: {ed.score}
                    </div>
                  )}
                  {ed.distinction && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--amber)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                      ★ {ed.distinction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Patents, Projects, Hackathons, and Capabilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Patent Portfolio (21 Filed & Published Disclosures) */}
          {profile.patents && profile.patents.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <div>
                  <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} style={{ color: 'var(--amber)' }} />
                    Patent &amp; Intellectual Property Portfolio ({profile.patents.length})
                  </div>
                  <div className="section-subtitle">
                    Independently verifiable patent disclosures filed and published with the Indian Patent Office
                  </div>
                </div>
                <span className="badge badge-amber">{profile.patents.length} Filings</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '0.625rem',
                maxHeight: 420,
                overflowY: 'auto',
                paddingRight: '0.25rem',
              }}>
                {profile.patents.map((pat) => (
                  <div
                    key={pat.id}
                    style={{
                      padding: '0.625rem 0.75rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: 7,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      {pat.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.675rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>App No. {pat.applicationNo}</span>
                      <span style={{
                        padding: '0.1rem 0.375rem',
                        borderRadius: 4,
                        fontWeight: 800,
                        fontSize: '0.625rem',
                        background: pat.status === 'PUBLISHED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: pat.status === 'PUBLISHED' ? 'var(--green)' : 'var(--amber)',
                      }}>
                        {pat.status} · {pat.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects & Hackathons */}
          {isDeven && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Projects */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div className="section-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--blue-primary)' }}>
                  <FileCode size={15} /> Verified Projects
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {(profile.projectsList || []).map((pr, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{pr.name}</div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pr.period}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                        {pr.description}
                      </div>
                      {pr.tech && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                          {pr.tech.map(t => (
                            <span key={t} className="badge badge-muted" style={{ fontSize: '0.6rem' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hackathons */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div className="section-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--green)' }}>
                  <Award size={15} /> Hackathon Distinctions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(profile.hackathonsList || []).map((h, i) => (
                    <div key={i} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {h.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', fontSize: '0.675rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{h.org || h.note}</span>
                        {h.placement && (
                          <span style={{ color: 'var(--green)', fontWeight: 700 }}>{h.placement}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Derived Capabilities Twin */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="section-title">Derived Adaptive Capability Twin</div>
                <div className="section-subtitle">Scored through practical work, code analysis, and patent disclosures</div>
              </div>
              <span className="badge badge-green">Live ML Twin</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 220, flexShrink: 0 }}>
                    {cap.evidence.some(e => e.verified) && <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{cap.name}</span>
                  </div>
                  <div style={{ flex: 1, height: 7, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cap.proficiency}%` }}
                      transition={{ delay: i * 0.04 + 0.2, duration: 0.7, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 999,
                        background: cap.proficiency >= 88 ? 'var(--green)' : cap.proficiency >= 75 ? 'var(--blue-primary)' : 'var(--amber)',
                      }}
                    />
                  </div>
                  <span style={{
                    width: 36, textAlign: 'right', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                    color: cap.proficiency >= 88 ? 'var(--green)' : cap.proficiency >= 75 ? 'var(--blue-primary)' : 'var(--amber)',
                  }}>
                    {cap.proficiency}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                    {cap.evidenceConfidence}% conf
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
