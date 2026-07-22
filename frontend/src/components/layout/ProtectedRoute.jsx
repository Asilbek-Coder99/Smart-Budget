import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuth, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
            <Spinner size="md" className="text-white" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading Smart Budget…</p>
        </div>
      </div>
    );
  }

  if (!isAuth) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
