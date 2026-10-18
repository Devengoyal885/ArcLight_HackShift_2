'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Brain,
  Radar,
  FileText,
  CheckSquare,
  Sparkles,
  Building2,
  User,
  Settings,
  HelpCircle,
  TrendingUp,
  ChevronRight,
  X,
  LogOut,
  LogIn,
  Milestone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getUserProfile } from '@/data/mockData';

interface NavSection {
  label: string;
  items: {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: string;
  }[];
}

const bottomItems = [
  { icon: <User size={15} />, label: 'Profile', href: '/profile' },
  { icon: <Milestone size={15} />, label: 'Roadmap', href: '/roadmap' },
  { icon: <Settings size={15} />, label: 'Settings', href: '/settings' },
  { icon: <HelpCircle size={15} />, label: 'Help', href: '/help' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const profile = getUserProfile(user?.email);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const candidateSections: NavSection[] = [
    {
      label: 'CAREER OS',
      items: [
        { icon: <LayoutDashboard size={15} />, label: 'Command Center', href: '/dashboard' },
        { icon: <Brain size={15} />, label: 'Capability Twin', href: '/capability', badge: `${profile.capabilityTwinScore}%` },
        { icon: <Radar size={15} />, label: 'Opportunities', href: '/opportunities', badge: 'Active' },
        { icon: <FileText size={15} />, label: 'Resume Studio', href: '/resume' },
        { icon: <CheckSquare size={15} />, label: 'Action Center', href: '/actions', badge: 'Live' },
        { icon: <Sparkles size={15} />, label: 'AI Workspace', href: '/workspace' },
      ],
    },
    {
      label: 'ENTERPRISE',
      items: [
        { icon: <Building2 size={15} />, label: 'Workforce Console', href: '/workforce' },
      ],
    },
  ];

  const employerSections: NavSection[] = [
    {
      label: 'WORKFORCE OS',
      items: [
        { icon: <Building2 size={15} />, label: 'Workforce Console', href: '/workforce' },
        { icon: <Brain size={15} />, label: 'Internal Mobility', href: '/workforce?tab=mobility' },
        { icon: <Sparkles size={15} />, label: 'Equity Nudge', href: '/workforce?tab=equity' },
      ],
    },
    {
      label: 'CANDIDATE VIEW',
      items: [
        { icon: <LayoutDashboard size={15} />, label: 'Command Center', href: '/dashboard' },
        { icon: <Radar size={15} />, label: 'Opportunity Radar', href: '/opportunities' },
        { icon: <Sparkles size={15} />, label: 'AI Workspace', href: '/workspace' },
      ],
    },
  ];

  const currentSections = user?.activeView === 'employer' ? employerSections : candidateSections;
  const isEnterprise = user?.activeView === 'employer' || pathname.startsWith('/workforce');

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <div
          className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div style={{ padding: '1rem 0.875rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
              {/* Logo Icon */}
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: isEnterprise
                  ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                  : 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isEnterprise ? '0 2px 8px rgba(13,148,136,0.35)' : '0 2px 8px rgba(79,142,247,0.35)',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="4" r="2.2" fill="white" opacity="0.95"/>
                  <path d="M9 6.5 L9 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 11 L6 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 11 L12 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 9 L12 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="3" cy="7" r="1.5" fill="white" opacity="0.6"/>
                  <circle cx="15" cy="7" r="1.5" fill="white" opacity="0.6"/>
                  <circle cx="3" cy="12" r="1.2" fill="white" opacity="0.4"/>
                  <circle cx="15" cy="12" r="1.2" fill="white" opacity="0.4"/>
                  <path d="M3 7 L6 9" stroke="white" strokeWidth="0.8" opacity="0.5"/>
                  <path d="M15 7 L12 9" stroke="white" strokeWidth="0.8" opacity="0.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  AccessHire
                </div>
                <div style={{ fontSize: '0.6rem', color: isEnterprise ? '#0d9488' : 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  {isEnterprise ? 'ENTERPRISE OS' : 'CAPABILITY TWIN'}
                </div>
              </div>
            </Link>

            {/* Mobile close */}
            {onClose && (
              <button onClick={onClose} className="btn-ghost" aria-label="Close sidebar" style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Nav Sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem' }}>
          {currentSections.map((section) => (
            <div key={section.label} style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)',
                letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.375rem',
              }}>
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${active ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <span style={{ flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.375rem',
                          borderRadius: '999px',
                          background: active ? 'rgba(79,142,247,0.2)' : 'var(--bg-hover)',
                          color: active ? 'var(--blue-primary)' : 'var(--text-muted)',
                        }}>
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Capability Momentum */}
        <div style={{
          padding: '0.75rem 0.875rem',
          borderTop: '1px solid var(--border)',
          background: 'rgba(79,142,247,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={13} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Capability Momentum
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>+{profile.capabilityMomentum}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>this month</span>
          </div>
          <div style={{
            marginTop: '0.5rem', height: 3, borderRadius: 999,
            background: 'var(--bg-elevated)', overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.capabilityTwinScore}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 999, background: 'var(--green)' }}
            />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Twin Score: {profile.capabilityTwinScore}% Verified ({profile.name.split(' ')[0]})
          </div>
        </div>

        {/* Bottom Nav & Auth */}
        <div style={{ padding: '0.5rem 0.625rem', borderTop: '1px solid var(--border)' }}>
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="nav-item"
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', marginTop: '0.25rem' }}
            >
              <LogOut size={15} />
              <span>Sign Out ({profile.name.split(' ')[0]})</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('demo')}
              className="nav-item"
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--blue-primary)', marginTop: '0.25rem' }}
            >
              <LogIn size={15} />
              <span>Sign In / Demo Accounts</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
