'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockDevenUser, mockUser } from '@/data/mockData';

export type UserRole = 'candidate' | 'employer' | 'both';
export type AppView = 'candidate' | 'employer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  activeView: AppView;
  avatar?: string;
  title?: string;
  org?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginAsDeven: () => void;
  loginAsPriya: () => void;
  loginAsSunita: () => void;
  loginAsEmployer: () => void;
  loginCustom: (email: string, password?: string, role?: UserRole) => boolean;
  signup: (name: string, email: string, password?: string, role?: UserRole) => void;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => void;
  switchView: (view: AppView) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (initialTab?: 'demo' | 'login' | 'signup' | 'reset') => void;
  closeAuthModal: () => void;
  authModalTab: 'demo' | 'login' | 'signup' | 'reset';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const devenUser: AuthUser = {
  id: mockDevenUser.id,
  name: mockDevenUser.name,
  email: mockDevenUser.email!,
  role: 'both',
  activeView: 'candidate',
  title: 'Software Engineer & Innovator',
  org: 'Chandigarh University · 3 Patents',
};

export const priyaUser: AuthUser = {
  id: mockUser.id,
  name: mockUser.name,
  email: 'priya.sharma@accesshire.ai',
  role: 'candidate',
  activeView: 'candidate',
  title: 'AI Ops Candidate',
  org: 'Hubli Technology Circle',
};

export const sunitaUser: AuthUser = {
  id: 'user-sunita',
  name: 'Sunita Verma',
  email: 'sunita.verma@accesshire.ai',
  role: 'candidate',
  activeView: 'candidate',
  title: 'AI Ops & Care Logistics Candidate',
  org: 'Lucknow Caregiver Archetype (3-yr Gap)',
};

export const employerUser: AuthUser = {
  id: 'user-recruiter-sap',
  name: 'Marcus Vance',
  email: 'marcus.vance@sap.com',
  role: 'employer',
  activeView: 'employer',
  title: 'Lead Talent Partner',
  org: 'SAP Workforce Intelligence',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(devenUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'demo' | 'login' | 'signup' | 'reset'>('demo');
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ah_session_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveUserSession = (u: AuthUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('ah_session_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('ah_session_user');
    }
  };

  const loginAsDeven = () => {
    saveUserSession(devenUser);
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  const loginAsPriya = () => {
    saveUserSession(priyaUser);
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  const loginAsSunita = () => {
    saveUserSession(sunitaUser);
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  const loginAsEmployer = () => {
    saveUserSession(employerUser);
    setIsAuthModalOpen(false);
    router.push('/workforce');
  };

  const loginCustom = (email: string, password?: string, role: UserRole = 'candidate') => {
    const isDeven = email.toLowerCase().includes('deven') || email.toLowerCase().includes('goyaldeven');
    if (isDeven) {
      saveUserSession(devenUser);
      setIsAuthModalOpen(false);
      router.push('/dashboard');
      return true;
    }

    if (email.toLowerCase().includes('sunita')) {
      saveUserSession(sunitaUser);
      setIsAuthModalOpen(false);
      router.push('/dashboard');
      return true;
    }

    const isEmployer = role === 'employer' || email.includes('sap.com') || email.includes('enterprise');
    const newUser: AuthUser = isEmployer
      ? {
          id: `user-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          email,
          role: 'employer',
          activeView: 'employer',
          title: 'Workforce Director',
          org: 'Enterprise Talent Org',
        }
      : {
          id: `user-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          email,
          role: 'candidate',
          activeView: 'candidate',
          title: 'Career OS User',
          org: 'Individual Practitioner',
        };
    saveUserSession(newUser);
    setIsAuthModalOpen(false);
    router.push(newUser.activeView === 'employer' ? '/workforce' : '/dashboard');
    return true;
  };

  const signup = (name: string, email: string, password?: string, role: UserRole = 'candidate') => {
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      activeView: role === 'employer' ? 'employer' : 'candidate',
      title: role === 'candidate' ? 'AI Candidate' : 'Talent Acquisition Manager',
      org: role === 'candidate' ? 'Individual' : 'Partner Enterprise',
    };
    saveUserSession(newUser);
    setIsAuthModalOpen(false);
    router.push(role === 'employer' ? '/workforce' : '/dashboard');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  };

  const switchView = (targetView: AppView) => {
    if (!user) return;
    const updatedUser = { ...user, activeView: targetView };
    saveUserSession(updatedUser);
    router.push(targetView === 'employer' ? '/workforce' : '/dashboard');
  };

  const logout = () => {
    saveUserSession(null);
    router.push('/');
  };

  const openAuthModal = (tab: 'demo' | 'login' | 'signup' | 'reset' = 'demo') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginAsDeven,
        loginAsPriya,
        loginAsSunita,
        loginAsEmployer,
        loginCustom,
        signup,
        resetPassword,
        logout,
        switchView,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
