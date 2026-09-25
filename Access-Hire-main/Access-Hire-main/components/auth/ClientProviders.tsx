'use client';

import { AuthProvider } from '@/lib/auth-context';
import { SynapseProvider } from '@/lib/synapse-context';
import AuthModal from '@/components/auth/AuthModal';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SynapseProvider>
        {children}
        <AuthModal />
      </SynapseProvider>
    </AuthProvider>
  );
}
