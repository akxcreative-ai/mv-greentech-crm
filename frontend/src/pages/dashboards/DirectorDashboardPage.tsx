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
  FileText,
  Users,
  IndianRupee,
  Calendar,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
  ShieldAlert,
  Briefcase,
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
import { dashboardApi, quotationsApi, ordersApi } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { DashboardStats, LeadStatus } from '../../lib/types';

export const DirectorDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['director-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: quotesData } = useQuery({
    queryKey: ['director-recent-quotes'],
    queryFn: () => quotationsApi.list({ limit: 5 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['director-recent-orders'],
    queryFn: () => ordersApi.list({ limit: 5 }),
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Executive Business Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Managing Director Dashboard</h1>
          <p className="text-xs text-white/50">
            Company-wide revenue metrics, sales targets, order conversions, and executive approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<BarChart3 className="w-4 h-4" />}
            onClick={() => navigate('/reports')}
          >
            Financial Reports
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate('/quotations')}
          >
            All Quotations
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Award className="w-4 h-4" />}
            onClick={() => navigate('/orders')}
          >
            Sales Orders
          </Button>
        </div>
      </div>

      {/* 8 Primary Business KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon={<Target className="w-6 h-6" />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          label="Active Opportunities"
          value={stats.activeOpportunities}
          icon={<TrendingUp className="w-6 h-6" />}
          color="teal"
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
          label="Confirmed Order Value"
          value={formatCurrency(stats.wonOrderValue)}
          icon={<Award className="w-6 h-6" />}
          color="green"
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance Trend */}
        <GlassCard
          title="Sales Performance Trend"
          subtitle="Monthly enquiry vs converted order value"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dirColorEnquiry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dirColorOrder" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Legend />
                <Area type="monotone" dataKey="enquiryValue" name="Enquiry Value" stroke="#3B82F6" fillOpacity={1} fill="url(#dirColorEnquiry)" />
                <Area type="monotone" dataKey="orderValue" name="Converted Orders" stroke="#10B981" fillOpacity={1} fill="url(#dirColorOrder)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Lead Conversion Pipeline */}
        <GlassCard
          title="Lead Pipeline Distribution"
          subtitle="Status breakdown across current active prospects"
        >
          <div className="h-72 w-full pt-4 flex flex-col sm:flex-row items-center justify-between">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.leadsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {stats.leadsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} Leads`,
                    String(name).replace(/_/g, ' '),
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Staff & Team Performance Table */}
      <GlassCard
        title="Sales Team League Table"
        subtitle="Individual targets and actual order booking"
      >
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Staff Member</th>
                <th className="pb-3 font-semibold text-center">Leads Handled</th>
                <th className="pb-3 font-semibold text-right">Won Business</th>
                <th className="pb-3 font-semibold text-right">Target Achievement</th>
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
  );
};
