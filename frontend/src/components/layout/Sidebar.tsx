import React from 'react';
import { NavLink } from 'react-router-dom';
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

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', to: '/leads', icon: Target },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Visits', to: '/visits', icon: MapPin },
    { label: 'Follow-ups', to: '/follow-ups', icon: Clock },
    { label: 'Item Master', to: '/items', icon: Package },
    { label: 'Quotations', to: '/quotations', icon: FileText },
    { label: 'Orders', to: '/orders', icon: ShoppingCart },
    { label: 'Sales Targets', to: '/targets', icon: TrendingUp },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ];

  // Admin / Director / Configuration
  const adminItems = [
    { label: 'Masters & Forex', to: '/masters', icon: Globe },
    { label: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck, roles: ['DIRECTOR', 'ADMINISTRATOR'] },
    { label: 'User Management', to: '/users', icon: UserCog, roles: ['DIRECTOR', 'ADMINISTRATOR'] },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const canAccessAdmin = user?.role === 'DIRECTOR' || user?.role === 'ADMINISTRATOR';

  return (
    <aside
      className={clsx(
        'glass-sidebar fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-sm tracking-wide">
                MV GREENTECH
              </span>
              <span className="text-[10px] text-teal-400 font-semibold tracking-widest uppercase">
                CRM Portal
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
                      ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold shadow-inner shadow-blue-500/10'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  )
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Section */}
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              System
            </p>
          )}
          {adminItems.map((item) => {
            if (item.roles && !canAccessAdmin) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold shadow-inner'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
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
        <div className="p-3 border-t border-white/10 shrink-0 bg-white/[0.02]">
          <div
            className={clsx(
              'flex items-center gap-3 p-2 rounded-xl transition-colors',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
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
