'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Radar, Brain, FileText, CheckSquare,
  Sparkles, Building2, Zap, GitBranch, LayoutDashboard,
  ChevronRight, ArrowRight,
} from 'lucide-react';

const commands = [
  { id: 'dashboard', label: 'Command Center', shortcut: 'D', icon: <LayoutDashboard size={15}/>, href: '/dashboard', category: 'Navigate' },
  { id: 'capability', label: 'Open Capability Twin', shortcut: 'C', icon: <Brain size={15}/>, href: '/capability', category: 'Navigate' },
  { id: 'opportunities', label: 'Find Opportunity', icon: <Radar size={15}/>, href: '/opportunities', category: 'Navigate' },
  { id: 'resume', label: 'Generate Resume', icon: <FileText size={15}/>, href: '/resume', category: 'Navigate' },
  { id: 'actions', label: 'Open Action Center', icon: <CheckSquare size={15}/>, href: '/actions', category: 'Navigate' },
  { id: 'workspace', label: 'Ask AccessHire AI', icon: <Sparkles size={15}/>, href: '/workspace', category: 'Navigate' },
  { id: 'workforce', label: 'Workforce Console', icon: <Building2 size={15}/>, href: '/workforce', category: 'Navigate' },
  { id: 'translate', label: 'Translate Experience', icon: <Zap size={15}/>, href: '/capability?tab=translator', category: 'Actions' },
  { id: 'trial', label: 'Start Transition Trial', icon: <GitBranch size={15}/>, href: '/capability?tab=trial', category: 'Actions' },
  { id: 'capsule', label: 'Create Context Capsule', icon: <Sparkles size={15}/>, href: '/workspace?tab=capsule', category: 'Actions' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const execute = useCallback((cmd: typeof commands[0]) => {
    router.push(cmd.href);
    onClose();
    setQuery('');
  }, [router, onClose]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
      if (e.key === 'Enter' && filtered[highlighted]) { execute(filtered[highlighted]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, highlighted, onClose, execute]);

  const categories = [...new Set(filtered.map(c => c.category))];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="command-box"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)',
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
                placeholder="Search commands, pages, actions..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                }}
                aria-label="Command palette search"
              />
              <kbd style={{
                fontSize: '0.65rem', padding: '0.15rem 0.4rem',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-muted)',
              }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0.375rem 0' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                categories.map(cat => (
                  <div key={cat}>
                    <div style={{
                      padding: '0.375rem 1rem', fontSize: '0.65rem', fontWeight: 700,
                      color: 'var(--text-muted)', letterSpacing: '0.06em',
                    }}>
                      {cat.toUpperCase()}
                    </div>
                    {filtered.filter(c => c.category === cat).map((cmd, i) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          className={`command-result ${highlighted === globalIdx ? 'highlighted' : ''}`}
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setHighlighted(globalIdx)}
                        >
                          <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{cmd.icon}</span>
                          <span style={{ flex: 1, fontWeight: 500 }}>{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd style={{
                              fontSize: '0.65rem', padding: '0.1rem 0.35rem',
                              background: 'var(--bg-hover)', border: '1px solid var(--border)',
                              borderRadius: 4, color: 'var(--text-muted)',
                            }}>⌘{cmd.shortcut}</kbd>
                          )}
                          <ArrowRight size={12} style={{ color: 'var(--text-disabled)' }} />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.5rem 1rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '1rem',
              fontSize: '0.7rem', color: 'var(--text-muted)',
            }}>
              <span><kbd style={{ marginRight: '0.25rem', padding: '0.1rem 0.3rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3 }}>↑↓</kbd>Navigate</span>
              <span><kbd style={{ marginRight: '0.25rem', padding: '0.1rem 0.3rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3 }}>↵</kbd>Open</span>
              <span><kbd style={{ marginRight: '0.25rem', padding: '0.1rem 0.3rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3 }}>Esc</kbd>Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
