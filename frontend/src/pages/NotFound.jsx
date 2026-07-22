import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div className="text-center">
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="text-6xl font-bold text-primary-600 mb-3">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button size="lg">Back to Dashboard</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
