'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export default function HelpPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Help & Documentation</h1>
        <p className="page-subtitle">AccessHire user guide and feature documentation</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { title: 'Capability Twin', desc: 'How your living capability profile works', href: '/capability' },
          { title: 'Capability Translator', desc: 'Translate lived experience into enterprise capabilities', href: '/capability?tab=translator' },
          { title: 'Opportunity Radar', desc: 'Finding and evaluating matched opportunities', href: '/opportunities' },
          { title: 'Resume Studio', desc: 'Generating capability-grounded resumes', href: '/resume' },
          { title: 'Practical Trials', desc: 'Verifying capabilities through real work', href: '/capability?tab=trial' },
          { title: 'AI Workspace', desc: 'Using multi-model AI with shared context', href: '/workspace' },
        ].map(item => (
          <Link key={item.title} href={item.href} className="card" style={{ padding: '1rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>{item.title}</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{item.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--blue-primary)' }}>
              Explore <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
