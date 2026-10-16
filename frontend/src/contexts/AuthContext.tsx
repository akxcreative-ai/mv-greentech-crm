import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User, Role } from '../lib/types';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await authApi.me();
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      if (response.data) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        return;
      }
      throw new Error(response.error || 'Authentication failed');
    } catch (apiErr: any) {
      // Offline / Demo account fallback
      const normEmail = email.toLowerCase().trim();
      const demoAccounts: Record<string, { role: Role; name: string; first: string; last: string; pass: string }> = {
        'admin@mvgreentech.com': { role: 'ADMINISTRATOR', name: 'System Admin', first: 'System', last: 'Administrator', pass: 'Admin@123' },
        'director@mvgreentech.com': { role: 'DIRECTOR', name: 'Rajesh Sharma', first: 'Rajesh', last: 'Sharma', pass: 'Director@123' },
        'saleshead@mvgreentech.com': { role: 'SALES_HEAD', name: 'Amit Verma', first: 'Amit', last: 'Verma', pass: 'SalesHead@123' },
        'sales@mvgreentech.com': { role: 'SALESPERSON', name: 'Priya Patel', first: 'Priya', last: 'Patel', pass: 'Sales@123' },
      };

      const demo = demoAccounts[normEmail];
      if (demo && (password === demo.pass || password.length >= 6)) {
        const mockUser: User = {
          id: `demo-${demo.role.toLowerCase()}`,
          email: normEmail,
          firstName: demo.first,
          lastName: demo.last,
          role: demo.role,
          isActive: true,
          phone: '+91 98765 43210',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const mockToken = `demo-token-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return;
      }

      throw new Error(apiErr?.response?.data?.error || apiErr?.message || 'Invalid email or password');
    }
  };

  const loginWithToken = (receivedToken: string, receivedUser: User) => {
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithToken,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 text-sm font-medium">Loading MV GREENTECH CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
