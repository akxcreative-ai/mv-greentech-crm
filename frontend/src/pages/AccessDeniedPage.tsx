import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getPermittedDashboard = () => {
    switch (user?.role) {
      case 'ADMINISTRATOR':
        return '/admin/dashboard';
      case 'DIRECTOR':
        return '/director/dashboard';
      case 'SALES_HEAD':
        return '/sales-head/dashboard';
      case 'SALESPERSON':
        return '/salesperson/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 border border-rose-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            HTTP 403 — Restricted Module
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-xs text-white/60 leading-relaxed">
            Your user account does not have authorization to view this module. Current Role:{' '}
            <span className="text-teal-400 font-semibold">{user?.role?.replace(/_/g, ' ') || 'Guest'}</span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => navigate(getPermittedDashboard(), { replace: true })}
          >
            My Permitted Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
