import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PassengerPortal from './pages/PassengerPortal';
import Dashboard from './pages/Dashboard';
import BusesPage from './pages/BusesPage';
import DriversPage from './pages/DriversPage';
import RoutesPage from './pages/RoutesPage';
import SchedulesPage from './pages/SchedulesPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import ComplaintsPage from './pages/ComplaintsPage';
import SettingsPage from './pages/SettingsPage';

// Private Route Guard
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/passenger" element={<PassengerPortal />} />

          {/* Protected Console Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="buses" element={<BusesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="tracking" element={<LiveTrackingPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="fuel" element={<FuelPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Fallback for admin console */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
