import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Components & Layouts
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChatPage } from './pages/ChatPage';
import { QuizPage } from './pages/QuizPage';
import { LiveClassPage } from './pages/LiveClassPage';
import { AssignmentPage } from './pages/AssignmentPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// ==========================================
// Protected Layout Wrapper
// ==========================================
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-google-gray-50 dark:bg-google-gray-900 transition-colors duration-200">
      {/* Navigation Drawer */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel Content */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// Route Protection Guard
// ==========================================
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-google-gray-50 dark:bg-google-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-google-blue border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <LayoutWrapper>
        <NotFoundPage />
      </LayoutWrapper>
    );
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
};

// ==========================================
// Dashboard Route Redirect Selector
// ==========================================
const DashboardRedirectSelector: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'STUDENT') {
    return <StudentDashboard />;
  } else if (user.role === 'MENTOR') {
    return <MentorDashboard />;
  } else {
    return <AdminDashboard />;
  }
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Main Dashboard Selector */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirectSelector />
          </ProtectedRoute>
        }
      />

      {/* Shared Student / Mentor / Admin Routes */}
      <Route
        path="/classes"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'ADMIN', 'SUPER_ADMIN']}>
            <LiveClassPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/assignments"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'ADMIN', 'SUPER_ADMIN']}>
            <AssignmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/quizzes"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}>
            <QuizPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin specific CRUD routes */}
      <Route
        path="/students-mgmt"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentors-mgmt"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees-mgmt"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
