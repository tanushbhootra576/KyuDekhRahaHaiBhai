import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CompleteProfile from './pages/auth/CompleteProfile';
import Dashboard from './pages/dashboard/Dashboard';
import ReportIssue from './pages/issues/ReportIssue';
import NotFound from './pages/errors/NotFound';

// Role-based route components
const CitizenRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      {children}
    </ProtectedRoute>
  );
};

const GovernmentRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['government']}>
      {children}
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Complete Profile - Protected */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Citizen Routes */}
            <Route
              path="/report-issue"
              element={
                <CitizenRoute>
                  <ReportIssue />
                </CitizenRoute>
              }
            />
            <Route
              path="/dashboard/my-issues"
              element={
                <CitizenRoute>
                  <Dashboard />
                </CitizenRoute>
              }
            />

            {/* Government Routes */}
            <Route
              path="/dashboard/pending-issues"
              element={
                <GovernmentRoute>
                  <Dashboard />
                </GovernmentRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <GovernmentRoute>
                  <Dashboard />
                </GovernmentRoute>
              }
            />

            {/* Error Routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
