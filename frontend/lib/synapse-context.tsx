'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SynapseContextType {
  synapseActive: boolean;
  toggleSynapse: () => void;
}

const SynapseContext = createContext<SynapseContextType>({
  synapseActive: false,
  toggleSynapse: () => {},
});

export function SynapseProvider({ children }: { children: React.ReactNode }) {
  const [synapseActive, setSynapseActive] = useState(false);

  useEffect(() => {
    // Inject OpenDyslexic font definition if not already present
    const fontId = 'opendyslexic-font-face';
    if (!document.getElementById(fontId)) {
      const style = document.createElement('style');
      style.id = fontId;
      style.innerHTML = `
        @font-face {
          font-family: 'OpenDyslexic';
          src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@0.9.2/woff/OpenDyslexic-Regular.woff') format('woff');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'OpenDyslexic';
          src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@0.9.2/woff/OpenDyslexic-Bold.woff') format('woff');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }

        [data-synapse="active"] body,
        [data-synapse="active"] * {
          font-family: 'OpenDyslexic', -apple-system, BlinkMacSystemFont, sans-serif !important;
          letter-spacing: 0.04em !important;
          line-height: 1.65 !important;
        }

        [data-synapse="active"] {
          --synapse-contrast-border: #4f8ef7;
        }

        [data-synapse="active"] .card,
        [data-synapse="active"] .card-flat,
        [data-synapse="active"] .topbar,
        [data-synapse="active"] .sidebar {
          border-width: 1.5px !important;
          border-color: rgba(79, 142, 247, 0.4) !important;
        }

        [data-synapse="active"] .badge {
          border-width: 1.5px !important;
          font-weight: 800 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (synapseActive) {
      document.documentElement.setAttribute('data-synapse', 'active');
    } else {
      document.documentElement.removeAttribute('data-synapse');
    }
  }, [synapseActive]);

  const toggleSynapse = () => {
    setSynapseActive(prev => !prev);
  };

  return (
    <SynapseContext.Provider value={{ synapseActive, toggleSynapse }}>
      {children}
    </SynapseContext.Provider>
  );
}

export function useSynapse() {
  return useContext(SynapseContext);
}
