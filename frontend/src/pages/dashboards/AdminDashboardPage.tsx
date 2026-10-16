import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Settings,
  ShieldCheck,
  Globe,
  Package,
  Activity,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { usersApi, auditLogsApi } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-overview'],
    queryFn: () => usersApi.list({ limit: 100 }),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-overview'],
    queryFn: () => auditLogsApi.list({ limit: 5 }),
  });

  const users = usersData?.data || [];
  const totalEmployees = users.length;
  const activeEmployees = users.filter((u) => u.isActive).length;
  const directorsCount = users.filter((u) => u.role === 'DIRECTOR').length;
  const salesHeadsCount = users.filter((u) => u.role === 'SALES_HEAD').length;
  const salespersonsCount = users.filter((u) => u.role === 'SALESPERSON').length;
  const adminsCount = users.filter((u) => u.role === 'ADMINISTRATOR').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              System Administrator Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Admin Control Console</h1>
          <p className="text-xs text-white/50">
            System configuration, user role management, security audits, and master records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/users')}
          >
            Add Employee
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={() => navigate('/settings')}
          >
            System Settings
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetchUsers()}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total System Users"
          value={totalEmployees}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend={{ value: activeEmployees, isPositive: true, label: 'Active Accounts' }}
          isLoading={usersLoading}
        />
        <StatCard
          label="Sales Staff"
          value={salespersonsCount}
          icon={<Users className="w-6 h-6" />}
          color="teal"
          trend={{ value: salesHeadsCount, isPositive: true, label: 'Sales Heads' }}
          isLoading={usersLoading}
        />
        <StatCard
          label="Executive Directors"
          value={directorsCount}
          icon={<Shield className="w-6 h-6" />}
          color="purple"
          isLoading={usersLoading}
        />
        <StatCard
          label="System Administrators"
          value={adminsCount}
          icon={<Lock className="w-6 h-6" />}
          color="green"
          isLoading={usersLoading}
        />
      </div>

      {/* System Status & Quick Management Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard title="Core Administrative Modules" subtitle="Central management for MV GREENTECH CRM">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                onClick={() => navigate('/users')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-white">Employee & Role Management</h3>
                <p className="text-[11px] text-white/50 mt-1">
                  Create accounts, assign 4 roles, manage sales head teams, activate or deactivate access.
                </p>
              </div>

              <div
                onClick={() => navigate('/audit-logs')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-white">Security & Audit Logs</h3>
                <p className="text-[11px] text-white/50 mt-1">
                  Inspect authentication events, role changes, IP addresses, and critical security operations.
                </p>
              </div>

              <div
                onClick={() => navigate('/masters')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-white">Masters & Currencies</h3>
                <p className="text-[11px] text-white/50 mt-1">
                  Manage Forex exchange rates (USD, EUR, CNY, INR), countries, states, and lead statuses.
                </p>
              </div>

              <div
                onClick={() => navigate('/items')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-white">Item & Product Master</h3>
                <p className="text-[11px] text-white/50 mt-1">
                  Industrial water controllers, sensors, HSN codes, standard pricing, and tax brackets.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Recent Audit Activities */}
          <GlassCard
            title="Recent Security & System Events"
            subtitle="Real-time log of administrative and authentication activity"
            headerAction={
              <Button size="sm" variant="ghost" onClick={() => navigate('/audit-logs')}>
                View Full Audit
              </Button>
            }
          >
            <div className="space-y-2 pt-2">
              {auditData?.data && auditData.data.length > 0 ? (
                auditData.data.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-white">{log.action}</span>
                        <span className="text-white/40 ml-2">{log.entityType}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-white/40 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 opacity-40 text-emerald-400" />
                  System audit log is active and clean.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* System Health & Security Config */}
        <div className="space-y-4">
          <GlassCard title="Infrastructure Health" subtitle="Live service telemetry">
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white">PostgreSQL Cloud DB</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">AWS us-east-2</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white">Render Backend API</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400">Online 24/7</span>
              </div>

              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <span className="text-xs font-semibold text-white">Vercel Edge Network</span>
                </div>
                <span className="text-[10px] font-mono text-teal-400">Global SSL</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Password Policy:</span>
                <span className="text-white font-medium">Bcrypt (Salt 10)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Session JWT:</span>
                <span className="text-white font-medium">7 Days Expire</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>OTP Expiry Policy:</span>
                <span className="text-white font-medium">5 Minutes</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick User List Preview */}
          <GlassCard title="Active Accounts" subtitle="Recent staff members">
            <div className="space-y-2.5 pt-2">
              {users.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                  </div>
                  <Badge status={u.role} size="sm" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
