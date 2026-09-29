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
    mockLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbUid: null,
    profile: null,
    role: null,
    loading: true,
    profileLoading: false,
    refreshProfile: async () => {},
    mockLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

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
        try {
            let p = await getProfile(currentDbUid);
            if (!p) {
                try {
                    await createProfile(currentDbUid, {
                        uid: currentDbUid,
                        name: u.displayName || '',
                        email: u.email || '',
                        avatar: u.photoURL || undefined,
                        profileComplete: false,
                    });
                    p = await getProfile(currentDbUid);
                } catch {
                    p = {
                        uid: currentDbUid,
                        name: u.displayName || '',
                        email: u.email || '',
                        avatar: u.photoURL || undefined,
                        profileComplete: false,
                    };
                }
            }
            setProfile(p);
        } catch {
            setProfile({
                uid: currentDbUid,
                name: u.displayName || '',
                email: u.email || '',
                avatar: u.photoURL || undefined,
                profileComplete: false,
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user && dbUid) await loadProfile(user, dbUid);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('[AuthContext] onAuthStateChanged fired, user:', currentUser?.uid ?? 'null');
            setUser(currentUser);
            if (currentUser) {
                const activeRole = (localStorage.getItem('userRole') as UserRole | null) || 'candidate';
                const currentDbUid = `${currentUser.uid}_${activeRole}`;
                await loadProfile(currentUser, currentDbUid);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // ── Bypass Firebase for local dev / blocked network ───────────────────
    const mockLogin = async (mockRole: UserRole) => {
        setLoading(true);
        localStorage.setItem('userRole', mockRole);
        const mockUid = 'mockuser_123';
        const mockDbUid = `${mockUid}_${mockRole}`;
        
        const mockUser = {
            uid: mockUid,
            email: 'dev@capable.app',
            displayName: 'Local Dev User',
            emailVerified: true,
        } as User;
        
        setUser(mockUser);
        await loadProfile(mockUser, mockDbUid);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, dbUid, profile, role, loading, profileLoading, refreshProfile, mockLogin }}>
            {children}
        </AuthContext.Provider>
    );
};
