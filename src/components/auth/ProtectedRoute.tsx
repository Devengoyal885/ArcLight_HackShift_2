import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../services/profileService';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Roles allowed to access this route. If empty/undefined, any authenticated user can access. */
    allowedRoles?: UserRole[];
}

/**
 * Route guard that:
 * 1. Redirects unauthenticated users to /login
 * 2. Redirects users without a completed profile to /onboarding
 * 3. Checks role-based access if allowedRoles is specified
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, profile, role, loading, profileLoading } = useAuth();

    // Still loading auth state — show spinner
    if (loading || profileLoading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0a0a0f',
            }}>
                <Loader2 size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Profile not completed — send to onboarding
    if (!profile?.profileComplete) {
        return <Navigate to="/onboarding" replace />;
    }

    // Role-based check (if specified)
    if (allowedRoles && allowedRoles.length > 0 && role) {
        if (!allowedRoles.includes(role)) {
            // Redirect to their own dashboard
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
