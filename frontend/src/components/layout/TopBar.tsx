import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Target,
  FileText,
  Users,
  MapPin,
  Menu,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { Badge } from '../ui/Badge';

interface TopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setIsQuickAddOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.data?.filter((n) => !n.isRead).length || 0;

  // Breadcrumbs based on pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const formatBreadcrumb = (part: string) => {
    return part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/dashboard" className="hover:text-emerald-700 font-medium transition-colors">
            Home
          </Link>
          {pathParts.map((part, index) => {
            const to = `/${pathParts.slice(0, index + 1).join('/')}`;
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={to}>
                <span className="text-slate-300">/</span>
                {isLast ? (
                  <span className="text-slate-900 font-semibold">{formatBreadcrumb(part)}</span>
                ) : (
                  <Link to={to} className="hover:text-emerald-700 transition-colors">
                    {formatBreadcrumb(part)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right side: Quick Add, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Add Dropdown */}
        <div className="relative" ref={quickAddRef}>
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  navigate('/leads');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors cursor-pointer"
              >
                <Target className="w-4 h-4 text-emerald-600" />
                <span>New Lead</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  navigate('/quotations/create');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>New Quotation</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  navigate('/customers');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  navigate('/visits');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Schedule Visit</span>
              </button>
              {(user?.role === 'ADMINISTRATOR' || user?.role === 'DIRECTOR') && (
                <button
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    navigate('/users');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">Add Employee / User</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <Badge status={user?.role} size="sm" />
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
