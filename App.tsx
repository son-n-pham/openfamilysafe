import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Admin from './pages/Admin';
import FamilyManagement from './pages/FamilyManagement';
import PendingApproval from './pages/PendingApproval';
import { ApprovalStatus } from './types';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireApproval?: boolean }> = ({ children, requireApproval = true }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireApproval && userProfile?.approvalStatus !== ApprovalStatus.APPROVED) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Layout><Login /></Layout>} />

      <Route
        path="/pending"
        element={
          <ProtectedRoute requireApproval={false}>
            <PendingApproval />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <Layout>
              <FamilyManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;