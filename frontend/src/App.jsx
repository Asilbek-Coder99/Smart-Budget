import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Auth pages (not lazy – needed immediately)
import Login    from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Lazy-load all other pages for code splitting
const Dashboard      = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
const Transactions   = lazy(() => import('./pages/transactions/Transactions.jsx'));
const Categories     = lazy(() => import('./pages/categories/Categories.jsx'));
const Budgets        = lazy(() => import('./pages/budgets/Budgets.jsx'));
const Savings        = lazy(() => import('./pages/savings/Savings.jsx'));
const Reports        = lazy(() => import('./pages/reports/Reports.jsx'));
const Notifications  = lazy(() => import('./pages/notifications/Notifications.jsx'));
const Profile        = lazy(() => import('./pages/profile/Profile.jsx'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size="xl" className="text-primary-600" />
  </div>
);

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<Navigate to="/dashboard" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/transactions"  element={<Transactions />} />
          <Route path="/categories"    element={<Categories />} />
          <Route path="/budgets"       element={<Budgets />} />
          <Route path="/savings"       element={<Savings />} />
          <Route path="/reports"       element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile"       element={<Profile />} />

          {/* Admin only */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/users"     element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default App;
