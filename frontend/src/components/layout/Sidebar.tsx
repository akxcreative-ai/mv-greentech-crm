import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../lib/api';
import {
  LayoutDashboard,
  Target,
  Users,
  MapPin,
  Clock,
  Package,
  FileText,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Bell,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();

  const { data: settingsData } = useQuery({
    queryKey: ['settings-all'],
    queryFn: () => settingsApi.getAll(),
    staleTime: 30000,
  });

  const [companyName, setCompanyName] = useState<string>(
    () => localStorage.getItem('mv_company_name') || 'MV GREENTECH'
  );

  useEffect(() => {
    const handleUpdated = () => {
      const stored = localStorage.getItem('mv_company_name');
      if (stored) setCompanyName(stored);
    };
    window.addEventListener('company_settings_updated', handleUpdated);
    return () => window.removeEventListener('company_settings_updated', handleUpdated);
  }, []);

  useEffect(() => {
    const profile =
      (settingsData as any)?.settings?.company_profile ||
      (settingsData as any)?.data?.find((s: any) => s.key === 'company_profile')?.value;
    if (profile?.companyName) {
      setCompanyName(profile.companyName);
      localStorage.setItem('mv_company_name', profile.companyName);
    }
  }, [settingsData]);

  const getNavItems = () => {
    switch (user?.role) {
      case 'ADMINISTRATOR':
        return [
          { label: 'Admin Console', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Employee Accounts', to: '/users', icon: UserCog },
          { label: 'Master Data & Forex', to: '/masters', icon: Globe },
          { label: 'Audit & Security Logs', to: '/audit-logs', icon: ShieldCheck },
          { label: 'Item Master', to: '/items', icon: Package },
          { label: 'Company Settings', to: '/settings', icon: Settings },
          { label: 'Notifications', to: '/notifications', icon: Bell },
        ];
      case 'DIRECTOR':
        return [
          { label: 'Executive Dashboard', to: '/director/dashboard', icon: LayoutDashboard },
          { label: 'Lead Pipeline', to: '/leads', icon: Target },
          { label: 'Quotations', to: '/quotations', icon: FileText },
          { label: 'Sales Orders', to: '/orders', icon: ShoppingCart },
          { label: 'Financial Reports', to: '/reports', icon: BarChart3 },
          { label: 'Sales Targets', to: '/targets', icon: TrendingUp },
          { label: 'Client Accounts', to: '/customers', icon: Users },
          { label: 'Customer Visits', to: '/visits', icon: MapPin },
          { label: 'Follow-ups', to: '/follow-ups', icon: Clock },
          { label: 'Item Master', to: '/items', icon: Package },
          { label: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck },
          { label: 'Forex & Currencies', to: '/masters', icon: Globe },
          { label: 'Settings', to: '/settings', icon: Settings },
        ];
      case 'SALES_HEAD':
        return [
          { label: 'Sales Head Desk', to: '/sales-head/dashboard', icon: LayoutDashboard },
          { label: 'Team Leads', to: '/leads', icon: Target },
          { label: 'Quotations Review', to: '/quotations', icon: FileText },
          { label: 'Sales Orders', to: '/orders', icon: ShoppingCart },
          { label: 'Team Targets', to: '/targets', icon: TrendingUp },
          { label: 'Team Performance', to: '/reports', icon: BarChart3 },
          { label: 'Customers', to: '/customers', icon: Users },
          { label: 'Client Visits', to: '/visits', icon: MapPin },
          { label: 'Follow-ups', to: '/follow-ups', icon: Clock },
          { label: 'Item Master', to: '/items', icon: Package },
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Settings', to: '/settings', icon: Settings },
        ];
      case 'SALESPERSON':
      default:
        return [
          { label: 'My Sales Desk', to: '/salesperson/dashboard', icon: LayoutDashboard },
          { label: 'My Leads', to: '/leads', icon: Target },
          { label: 'Quotations', to: '/quotations', icon: FileText },
          { label: 'Sales Orders', to: '/orders', icon: ShoppingCart },
          { label: 'My Customers', to: '/customers', icon: Users },
          { label: 'Client Visits', to: '/visits', icon: MapPin },
          { label: 'Follow-ups', to: '/follow-ups', icon: Clock },
          { label: 'Item Master', to: '/items', icon: Package },
          { label: 'My Targets', to: '/targets', icon: TrendingUp },
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Settings', to: '/settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={clsx(
        'glass-sidebar fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-700/40 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-sm tracking-wide truncate max-w-[135px]" title={companyName}>
                {companyName}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold tracking-widest uppercase">
                {user?.role?.replace(/_/g, ' ') || 'CRM Portal'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-emerald-100/60 hover:text-white hover:bg-emerald-800/40 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    isActive
                      ? 'bg-emerald-500/25 text-white border-l-4 border-emerald-400 font-semibold shadow-inner shadow-emerald-900/20'
                      : 'text-emerald-100/75 hover:text-white hover:bg-emerald-800/40'
                  )
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Info Footer */}
      {user && (
        <div className="p-3 border-t border-emerald-700/40 shrink-0 bg-emerald-950/30">
          <div
            className={clsx(
              'flex items-center gap-3 p-2 rounded-xl transition-colors',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : <Shield className="w-4 h-4" />}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </span>
                <div className="mt-0.5">
                  <Badge status={user.role} size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
