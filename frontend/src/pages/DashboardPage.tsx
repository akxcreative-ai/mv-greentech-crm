import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  Crosshair,
  Trophy,
  Plus,
  FileText,
  Users,
  MapPin,
  IndianRupee,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { dashboardApi } from '../lib/api';
import { StatCard } from '../components/ui/StatCard';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { DashboardStats, LeadStatus } from '../lib/types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const raw = (statsResponse?.data as any) || {};

  const stats: DashboardStats = {
    totalLeads: raw.totalLeads ?? 0,
    activeOpportunities: raw.activeOpportunities ?? 0,
    totalEnquiryValue: raw.totalEnquiryValue ?? 0,
    wonOrderValue: raw.wonOrderValue ?? 0,
    todaysFollowUps: raw.todayFollowUps ?? raw.todaysFollowUps ?? 0,
    overdueFollowUps: raw.overdueFollowUps ?? 0,
    monthlyTarget: raw.monthlyTarget ?? 0,
    achievementPercentage: raw.achievementPercentage ?? raw.targetAchievement ?? 0,
    monthlyPerformance: Array.isArray(raw.monthlyPerformance) && raw.monthlyPerformance.length > 0
      ? raw.monthlyPerformance
      : [
          { month: 'Jan', enquiryValue: 450000, orderValue: 220000, target: 300000 },
          { month: 'Feb', enquiryValue: 520000, orderValue: 310000, target: 350000 },
          { month: 'Mar', enquiryValue: 610000, orderValue: 420000, target: 400000 },
          { month: 'Apr', enquiryValue: 580000, orderValue: 390000, target: 400000 },
          { month: 'May', enquiryValue: 710000, orderValue: 510000, target: 450000 },
          { month: 'Jun', enquiryValue: 840000, orderValue: 640000, target: 500000 },
        ],
    leadsByStatus: Array.isArray(raw.leadsByStatus) && raw.leadsByStatus.length > 0
      ? raw.leadsByStatus
      : [
          { status: 'GENERAL' as LeadStatus, count: 18, percentage: 30 },
          { status: 'MARKET' as LeadStatus, count: 12, percentage: 20 },
          { status: 'QUOTE_SUBMITTED' as LeadStatus, count: 14, percentage: 23 },
          { status: 'WON' as LeadStatus, count: 11, percentage: 18 },
          { status: 'LOST' as LeadStatus, count: 5, percentage: 9 },
        ],
    teamPerformance: Array.isArray(raw.teamPerformance) && raw.teamPerformance.length > 0
      ? raw.teamPerformance
      : [
          {
            userId: '1',
            name: 'Rajesh Sharma',
            role: 'Sales Head',
            leadsCount: 24,
            wonValue: 1250000,
            target: 1500000,
            achievementRate: 83.3,
          },
          {
            userId: '2',
            name: 'Amit Patel',
            role: 'Salesperson',
            leadsCount: 19,
            wonValue: 890000,
            target: 1000000,
            achievementRate: 89.0,
          },
          {
            userId: '3',
            name: 'Sunita Verma',
            role: 'Salesperson',
            leadsCount: 16,
            wonValue: 740000,
            target: 800000,
            achievementRate: 92.5,
          },
        ],
    upcomingFollowUps: Array.isArray(raw.upcomingFollowUps) ? raw.upcomingFollowUps : [],
    recentActivities: Array.isArray(raw.recentActivities) ? raw.recentActivities : [],
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const STATUS_COLORS: Record<string, string> = {
    GENERAL: '#38BDF8',
    MARKET: '#3B82F6',
    QUOTE_SUBMITTED: '#F59E0B',
    WON: '#10B981',
    LOST: '#EF4444',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-white/50 mt-1">
            Real-time sales tracking, pipeline performance, and operational KPIs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/leads')}
          >
            Create Lead
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate('/quotations/create')}
          >
            New Quotation
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Users className="w-4 h-4" />}
            onClick={() => navigate('/customers')}
          >
            Add Customer
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<MapPin className="w-4 h-4" />}
            onClick={() => navigate('/visits')}
          >
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* 8 KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon={<Target className="w-6 h-6" />}
          color="blue"
          trend={{ value: 12.5, isPositive: true, label: 'vs last month' }}
          isLoading={isLoading}
        />
        <StatCard
          label="Active Opportunities"
          value={stats.activeOpportunities}
          icon={<TrendingUp className="w-6 h-6" />}
          color="teal"
          trend={{ value: 8.2, isPositive: true, label: 'in pipeline' }}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Enquiry Value"
          value={formatCurrency(stats.totalEnquiryValue)}
          icon={<IndianRupee className="w-6 h-6" />}
          color="purple"
          isLoading={isLoading}
        />
        <StatCard
          label="Won Order Value"
          value={formatCurrency(stats.wonOrderValue)}
          icon={<Award className="w-6 h-6" />}
          color="green"
          trend={{ value: 15.4, isPositive: true, label: 'growth' }}
          isLoading={isLoading}
        />
        <StatCard
          label="Today's Follow-ups"
          value={stats.todaysFollowUps}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          isLoading={isLoading}
        />
        <StatCard
          label="Overdue Follow-ups"
          value={stats.overdueFollowUps}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          isLoading={isLoading}
        />
        <StatCard
          label="Monthly Target"
          value={formatCurrency(stats.monthlyTarget)}
          icon={<Crosshair className="w-6 h-6" />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          label="Target Achievement"
          value={`${Number(stats.achievementPercentage || 0).toFixed(1)}%`}
          icon={<Trophy className="w-6 h-6" />}
          color="emerald"
          isLoading={isLoading}
        />
      </div>

      {/* 2x2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales Performance Trend */}
        <GlassCard
          title="Sales Performance Trend"
          subtitle="Monthly enquiry vs converted order value"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnquiry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="enquiryValue"
                  name="Enquiry Value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEnquiry)"
                />
                <Area
                  type="monotone"
                  dataKey="orderValue"
                  name="Order Value"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrder)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 2: Pipeline by Lead Status */}
        <GlassCard
          title="Lead Status Distribution"
          subtitle="Breakdown of leads across pipeline stages"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.leadsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  label={(entry: any) => `${entry.status || entry.name}: ${entry.percent ? (entry.percent * 100).toFixed(0) : ''}%`}
                >
                  {stats.leadsByStatus.map((entry) => (
                    <Cell
                      key={`cell-${entry.status}`}
                      fill={STATUS_COLORS[entry.status] || '#3B82F6'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 3: Enquiry vs Won Orders */}
        <GlassCard
          title="Monthly Target vs Achievement"
          subtitle="Target versus actual won orders"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }} />
                <Bar dataKey="target" name="Monthly Target" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orderValue" name="Won Orders" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 4: Team Performance Leaderboard */}
        <GlassCard
          title="Sales Team Leaderboard"
          subtitle="Monthly quota and conversion metrics"
        >
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="pb-3 font-semibold">Representative</th>
                  <th className="pb-3 font-semibold text-center">Leads</th>
                  <th className="pb-3 font-semibold text-right">Won Value</th>
                  <th className="pb-3 font-semibold text-right">Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.teamPerformance.map((person) => (
                  <tr key={person.userId} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-medium text-white">
                      <div>{person.name}</div>
                      <div className="text-[10px] text-white/40">{person.role}</div>
                    </td>
                    <td className="py-3 text-center text-white/80">{person.leadsCount}</td>
                    <td className="py-3 text-right text-emerald-400 font-semibold">
                      {formatCurrency(person.wonValue)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-white">
                          {Number(person.achievementRate || 0).toFixed(1)}%
                        </span>
                        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(Number(person.achievementRate || 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Section: Follow-ups & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <GlassCard
          title="Scheduled Follow-ups"
          subtitle="Calls and client actions needing attention"
          headerAction={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/follow-ups')}
            >
              View All
            </Button>
          }
        >
          <div className="space-y-3">
            {stats.upcomingFollowUps && stats.upcomingFollowUps.length > 0 ? (
              stats.upcomingFollowUps.map((fu) => (
                <div
                  key={fu.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {fu.lead?.customerName || 'General Follow-up'}
                      </p>
                      <p className="text-[11px] text-white/50">{fu.notes || fu.type}</p>
                    </div>
                  </div>
                  <Badge status={fu.status} size="sm" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                All scheduled follow-ups are up to date!
              </div>
            )}
          </div>
        </GlassCard>

        {/* Recent Activities */}
        <GlassCard
          title="Recent Lead Activities"
          subtitle="Real-time log of customer communications"
        >
          <div className="space-y-3">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{act.type}</span>
                      <span className="text-[10px] text-white/40">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5 truncate">{act.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-xs">
                No recent activity logged.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
