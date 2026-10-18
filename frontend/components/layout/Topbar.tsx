'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, User, Menu, Command,
  Brain, CheckSquare, Zap, LogOut, RefreshCw, LogIn, ChevronDown, Check, Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import CommandPalette from './CommandPalette';
import { mockNotifications } from '@/data/mockData';
import { useAuth } from '@/lib/auth-context';
import { useSynapse } from '@/lib/synapse-context';
import { usePathname } from 'next/navigation';
import { Sparkles, Accessibility } from 'lucide-react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const { user, isAuthenticated, logout, openAuthModal, switchView, loginAsDeven } = useAuth();
  const { synapseActive, toggleSynapse } = useSynapse();
  const router = useRouter();
  const pathname = usePathname();

  const unread = notifications.filter(n => !n.read).length;
  const isEnterprise = (user?.activeView === 'employer' || pathname.startsWith('/workforce'));

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markSingleRead = (id: string, type: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setNotifOpen(false);
    if (type === 'opportunity') router.push('/opportunities');
    else if (type === 'capability' || type === 'verification') router.push('/capability');
    else if (type === 'email') router.push('/actions');
    else if (type === 'resume') router.push('/resume');
  };

  const openCmd = useCallback(() => setCmdOpen(true), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCmd();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCmd]);

  const notifIcon: Record<string, React.ReactNode> = {
    capability: <Brain size={13} style={{ color: 'var(--blue-primary)' }} />,
    opportunity: <Zap size={13} style={{ color: 'var(--amber)' }} />,
    email: <CheckSquare size={13} style={{ color: 'var(--green)' }} />,
    verification: <CheckSquare size={13} style={{ color: 'var(--green)' }} />,
    resume: <Search size={13} style={{ color: 'var(--violet)' }} />,
  };

  const activeView = user?.activeView || (isEnterprise ? 'employer' : 'candidate');

  return (
    <>
      <header
        className="topbar"
        role="banner"
        style={{
          background: isEnterprise ? 'rgba(15,118,110,0.06)' : undefined,
          borderBottom: isEnterprise ? '1px solid rgba(13,148,136,0.3)' : undefined,
          transition: 'all 0.2s ease',
        }}
      >
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="btn-ghost"
          style={{ display: 'none', padding: '0.4rem' }}
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        {/* Mode Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.2rem 0.55rem', borderRadius: 6,
          background: isEnterprise ? 'rgba(13,148,136,0.15)' : 'rgba(79,142,247,0.12)',
          border: `1px solid ${isEnterprise ? 'rgba(13,148,136,0.4)' : 'rgba(79,142,247,0.3)'}`,
          color: isEnterprise ? '#0d9488' : 'var(--blue-primary)',
          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', flexShrink: 0,
        }}>
          {isEnterprise ? <Building2 size={12} /> : <User size={12} />}
          {isEnterprise ? 'ENTERPRISE CONSOLE' : 'CANDIDATE OS'}
        </div>

        {/* Search / Command */}
        <button
          onClick={openCmd}
          style={{
            flex: 1, maxWidth: 320,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.12s',
          }}
          aria-label="Open command palette"
          id="search-trigger"
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search capabilities, actions...</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <kbd style={{
              fontSize: '0.65rem', padding: '0.1rem 0.35rem',
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-muted)',
            }}>
              <Command size={9} style={{ display: 'inline' }} />K
            </kbd>
          </div>
        </button>

        {/* Dual Role View Switcher in Header */}
        {isAuthenticated && user && (user.role === 'both' || user.role === 'employer') && (
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <button
              onClick={() => { switchView('candidate'); if (pathname === '/workforce') router.push('/dashboard'); }}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: 6,
                fontSize: '0.725rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeView === 'candidate' ? 'var(--blue-primary)' : 'transparent',
                color: activeView === 'candidate' ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              Candidate App
            </button>
            <button
              onClick={() => { switchView('employer'); router.push('/workforce'); }}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: 6,
                fontSize: '0.725rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeView === 'employer' ? '#0d9488' : 'transparent',
                color: activeView === 'employer' ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              Enterprise Console
            </button>
          </div>
        )}

        {/* Synapse UI Toggle Button */}
        <button
          onClick={toggleSynapse}
          id="synapse-ui-toggle-btn"
          className="btn-ghost"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 7,
            background: synapseActive ? 'rgba(79,142,247,0.18)' : 'var(--bg-elevated)',
            border: `1.5px solid ${synapseActive ? 'var(--blue-primary)' : 'var(--border)'}`,
            color: synapseActive ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontSize: '0.725rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          title="Toggle Synapse UI: OpenDyslexic accessible font + high contrast mode"
        >
          <Sparkles size={13} style={{ color: synapseActive ? 'var(--blue-primary)' : 'var(--violet)' }} />
          <span>Synapse UI</span>
          {synapseActive && (
            <span style={{
              fontSize: '0.55rem', padding: '0.05rem 0.3rem',
              background: 'var(--blue-primary)', color: 'white',
              borderRadius: 4, fontWeight: 900,
            }}>
              ON
            </span>
          )}
        </button>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'auto' }}>
          <ThemeSwitcher />

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
              className="btn-ghost"
              style={{ padding: '0.4rem', borderRadius: 7, border: '1px solid var(--border)', position: 'relative' }}
              aria-label="Notifications"
              id="notifications-btn"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--red)', border: '1.5px solid var(--bg-surface)',
                }} />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                    width: 320, background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 50, overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Notifications</span>
                    {unread > 0 ? (
                      <button
                        onClick={markAllRead}
                        style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          background: 'rgba(79,142,247,0.15)', color: 'var(--blue-primary)',
                          border: 'none', padding: '0.15rem 0.4rem', borderRadius: 999,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <Check size={10} /> Mark read ({unread})
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>All caught up</span>
                    )}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markSingleRead(n.id, n.type)}
                        style={{
                          display: 'flex', gap: '0.625rem', padding: '0.625rem 0.875rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: n.read ? 'transparent' : 'rgba(79,142,247,0.04)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {notifIcon[n.type] || <Bell size={13} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.4 }}>{n.message}</div>
                        </div>
                        {!n.read && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue-primary)', flexShrink: 0, marginTop: 6 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Account / Profile Menu */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.3rem 0.625rem', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  cursor: 'pointer', transition: 'all 0.12s', color: 'inherit',
                  fontFamily: 'inherit',
                }}
                aria-label="User Account Menu"
                id="profile-btn"
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: activeView === 'employer'
                    ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
                    : 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: 'white',
                }}>
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                    {user.title || (activeView === 'employer' ? 'Workforce Recruiter' : 'Candidate')}
                  </span>
                </div>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                      width: 240, background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      zIndex: 50, overflow: 'hidden', padding: '0.375rem',
                    }}
                  >
                    <div style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                      <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      <span className={`badge ${activeView === 'employer' ? 'badge-violet' : 'badge-green'}`} style={{ marginTop: '0.375rem', display: 'inline-block' }}>
                        {activeView === 'employer' ? 'Enterprise View' : 'Candidate View'}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.625rem', borderRadius: 6,
                        fontSize: '0.775rem', color: 'var(--text-secondary)',
                        textDecoration: 'none', transition: 'all 0.12s',
                      }}
                      className="nav-item-sub"
                    >
                      <User size={13} /> View Profile
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        switchView(activeView === 'candidate' ? 'employer' : 'candidate');
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.625rem', borderRadius: 6,
                        fontSize: '0.775rem', color: 'var(--text-secondary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <RefreshCw size={13} /> Switch View ({activeView === 'candidate' ? 'Enterprise' : 'Candidate'})
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); openAuthModal('demo'); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.625rem', borderRadius: 6,
                        fontSize: '0.775rem', color: 'var(--text-secondary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <LogIn size={13} /> Manage Auth / Accounts
                    </button>

                    <div style={{ borderTop: '1px solid var(--border)', margin: '0.375rem 0' }} />

                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.625rem', borderRadius: 6,
                        fontSize: '0.775rem', color: 'var(--red)',
                        background: 'rgba(239,68,68,0.06)', border: 'none', cursor: 'pointer',
                        textAlign: 'left', fontWeight: 600,
                      }}
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('demo')}
              className="btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <LogIn size={13} /> Sign In
            </button>
          )}
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
