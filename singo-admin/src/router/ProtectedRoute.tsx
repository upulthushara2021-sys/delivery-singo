import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string | string[];
}

export default function ProtectedRoute({
  children,
  role,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && (Array.isArray(role) ? !role.includes(user.role) : user.role !== role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}