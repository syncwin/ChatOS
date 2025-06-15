
import { useAuth } from '@/hooks/useAuth';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Allow access regardless of authentication status
  return <Outlet />;
};

export default ProtectedRoute;
