import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="loading-container">Проверка авторизации...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute;