import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSeller?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireSeller = false,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isSeller } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check admin permission
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check seller permission
  if (requireSeller && !isSeller) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
