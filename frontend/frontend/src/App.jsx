import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // Ensure AnimatePresence is hereimport { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import Spinner from './components/UI/Spinner';
import { useAuth } from './hooks/useAuth'; // Exactly like this

    
// Protected Route Components
const ProtectedRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  return currentUser && currentUser.isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  const location = useLocation(); // For AnimatePresence key

   return (
    // AuthProvider is now correctly wrapping in main.jsx, so no need here
    // <AuthProvider> // REMOVE if it was here, it's in main.jsx
      <MainLayout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute> <UserDashboardPage /> </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute> <AdminDashboardPage /> </AdminRoute>
            } />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </MainLayout>
    // </AuthProvider> // REMOVE if it was here
  );
}

export default App;