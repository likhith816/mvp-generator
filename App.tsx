
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MvpPlanProvider } from './contexts/MvpPlanContext';
import { AccessRequestProvider } from './contexts/AccessRequestContext';
import { ConvexProviderWrapper } from './lib/convex';
import type { Role } from './types';

// Layouts
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import MvpGeneratorPage from './pages/MvpGeneratorPage';
import MvpPlanViewerPage from './pages/MvpPlanViewerPage';
import PreviewPage from './pages/PreviewPage';

// This new component encapsulates the logic for which dashboard to show.
// It resolves the "Invalid Element" error by providing a single, stable component
// to the route, which then handles the conditional rendering internally.
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // ProtectedRoute ensures user is not null, but this is a safeguard.
  if (!user) {
    return null;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SUPERADMIN':
      return <SuperAdminDashboard />;
    case 'USER':
    default:
      return <UserDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <ConvexProviderWrapper>
      <AuthProvider>
        <MvpPlanProvider>
          <AccessRequestProvider>
            <HashRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <AppRoutes />
                </main>
              </div>
            </HashRouter>
          </AccessRequestProvider>
        </MvpPlanProvider>
      </AuthProvider>
    </ConvexProviderWrapper>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/generate-mvp" element={
        <ProtectedRoute>
          <MvpGeneratorPage />
        </ProtectedRoute>
      } />
       <Route path="/view-plan/:id" element={
        <ProtectedRoute>
          <MvpPlanViewerPage />
        </ProtectedRoute>
      } />
      <Route path="/preview/:id" element={
        <ProtectedRoute>
          <PreviewPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileSettingsPage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};


export default App;