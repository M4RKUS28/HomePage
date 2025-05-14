// frontend/frontend/src/App.jsx (updated)
import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import Spinner from './components/UI/Spinner';
import { useAuth } from './hooks/useAuth';
import { ThemeContext } from './contexts/ThemeContext';
import ToastNotification from './components/UI/ToastNotification';

// Protected Route Components
const ProtectedRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();
  
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="h-10 w-10" color="text-primary" />
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();
  
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="h-10 w-10" color="text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!currentUser.is_admin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  
  // Add the theme class to the body for global theme application
  React.useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <>
      <MainLayout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </MainLayout>
      
      {/* Toast Notifications */}
      <ToastNotification />
    </>
  );
}

export default App;