'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('ah-theme') as 'dark' | 'light' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ah-theme', next);
  };

  return (
    <button
      onClick={toggle}
      className="btn-ghost"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{ padding: '0.4rem', borderRadius: 7, border: '1px solid var(--border)' }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
