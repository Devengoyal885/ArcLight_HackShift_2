import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../services/profileService';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const Spinner = () => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0f',
    }}>
        <Loader2 size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
    </div>
);

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, role, loading, profileLoading } = useAuth();

    // Always wait for Firebase auth to finish initializing.
    // loading=true means onAuthStateChanged hasn't fired yet — NEVER redirect during this time.
    if (loading) {
        console.log('[ProtectedRoute] Auth still loading, showing spinner');
        return <Spinner />;
    }

    // Profile is loading — show spinner
    if (profileLoading) {
        return <Spinner />;
    }

    // Auth finished loading, user is not signed in — redirect to login
    if (!user) {
        console.error('[ProtectedRoute] Redirecting to /login! State:', { loading, profileLoading, hasUser: !!user, role });
        return <Navigate to="/login" replace />;
    }

    // Email verification check (ignore for Google/OAuth which are verified by default)
    // and skip for localhost/dev to not break the developer loop if they are using mock accounts
    if (
        !user.emailVerified &&
        user.providerData[0]?.providerId === 'password' &&
        import.meta.env.PROD
    ) {
        return <Navigate to="/verify-email" replace />;
    }

    // Role-based check
    if (allowedRoles && allowedRoles.length > 0 && role) {
        if (!allowedRoles.includes(role)) {
            const dashboardMap: Record<UserRole, string> = {
                candidate: '/candidate',
                employer: '/employer',
                academician: '/faculty',
                institution: '/institution',
            };
            return <Navigate to={dashboardMap[role] || '/candidate'} replace />;
        }
    }

    return <>{children}</>;
}
