import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getProfile, createProfile } from '../services/profileService';
import type { UserProfile, UserRole } from '../services/profileService';

interface AuthContextType {
    user: User | null;
    dbUid: string | null;
    profile: UserProfile | null;
    role: UserRole | null;
    loading: boolean;
    profileLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbUid: null,
    profile: null,
    role: null,
    loading: true,
    profileLoading: false,
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    // Derive role from localStorage primarily, then profile
    const role: UserRole | null = (localStorage.getItem('userRole') as UserRole | null) || profile?.role || null;
    const dbUid = user && role ? `${user.uid}_${role}` : (user ? `${user.uid}_candidate` : null);

    const loadProfile = async (u: User, currentDbUid: string) => {
        setProfileLoading(true);
        const fallbackProfile: UserProfile = {
            uid: currentDbUid,
            name: u.displayName || u.email?.split('@')[0] || 'User',
            email: u.email || '',
            avatar: u.photoURL || undefined,
            profileComplete: false,
        };
        try {
            let p = await withTimeout(getProfile(currentDbUid), 2500, null);
            if (!p) {
                try {
                    await withTimeout(createProfile(currentDbUid, fallbackProfile), 2000, null);
                    p = await withTimeout(getProfile(currentDbUid), 2000, fallbackProfile);
                } catch {
                    p = fallbackProfile;
                }
            }
            setProfile(p || fallbackProfile);
        } catch {
            setProfile(fallbackProfile);
        } finally {
            setProfileLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user && dbUid) await loadProfile(user, dbUid);
    };

    useEffect(() => {
        // Purge any legacy mock login keys from local storage
        localStorage.removeItem('capable_mock_login');

        // Safety watchdog: Auth loading state must NEVER hang for more than 3 seconds
        const watchdog = setTimeout(() => {
            setLoading(false);
            setProfileLoading(false);
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('[AuthContext] onAuthStateChanged fired, user:', currentUser?.uid ?? 'null');
            clearTimeout(watchdog);
            setUser(currentUser);
            setLoading(false); // Firebase auth state is resolved! Never block loading on Firestore

            if (currentUser) {
                const activeRole = (localStorage.getItem('userRole') as UserRole | null) || 'candidate';
                const currentDbUid = `${currentUser.uid}_${activeRole}`;
                await loadProfile(currentUser, currentDbUid);
            } else {
                setProfile(null);
                setProfileLoading(false);
            }
        });
        return () => {
            clearTimeout(watchdog);
            unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, dbUid, profile, role, loading, profileLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
