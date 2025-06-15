
import { useAuth } from '@/hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, loading, guestAccess } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user && !guestAccess) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
