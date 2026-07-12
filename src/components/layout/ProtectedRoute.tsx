import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Signed in, but this role isn't allowed on this route — send them
    // somewhere they *do* have access to instead of a dead end.
    return <Navigate to="/marketplace" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
