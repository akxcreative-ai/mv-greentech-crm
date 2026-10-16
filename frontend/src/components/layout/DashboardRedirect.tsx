import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMINISTRATOR':
      return <Navigate to="/admin/dashboard" replace />;
    case 'DIRECTOR':
      return <Navigate to="/director/dashboard" replace />;
    case 'SALES_HEAD':
      return <Navigate to="/sales-head/dashboard" replace />;
    case 'SALESPERSON':
      return <Navigate to="/salesperson/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};
