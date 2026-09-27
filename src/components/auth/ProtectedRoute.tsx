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
        console.log('[ProtectedRoute] No user after loading finished, redirecting to /login');
        return <Navigate to="/login" replace />;
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
