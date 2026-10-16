import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Target,
  FileCheck2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  Plus,
  MapPin,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { leadsApi, quotationsApi, followUpsApi, visitsApi } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const SalesHeadDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['saleshead-team-leads'],
    queryFn: () => leadsApi.list({ limit: 10 }),
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['saleshead-team-quotes'],
    queryFn: () => quotationsApi.list({ limit: 10 }),
  });

  const { data: followUpsData, isLoading: fuLoading } = useQuery({
    queryKey: ['saleshead-follow-ups'],
    queryFn: () => followUpsApi.list({ limit: 10 }),
  });

  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['saleshead-visits'],
    queryFn: () => visitsApi.list({ limit: 5 }),
  });

  const leads = leadsData?.data || [];
  const quotations = quotesData?.data || [];
  const followUps = followUpsData?.data || [];
  const visits = visitsData?.data || [];

  const pendingQuotes = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'NEGOTIATION');
  const overdueFollowUps = followUps.filter((f) => f.status === 'OVERDUE' || (new Date(f.scheduledDate) < new Date() && f.status === 'PENDING'));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Sales Management Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Sales Head Workspace</h1>
          <p className="text-xs text-white/50">
            Team pipeline management, quotation reviews, target allocation, and sales performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/leads')}
          >
            Assign Lead
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileCheck2 className="w-4 h-4" />}
            onClick={() => navigate('/quotations')}
          >
            Review Quotes
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Target className="w-4 h-4" />}
            onClick={() => navigate('/targets')}
          >
            Team Targets
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Team Active Leads"
          value={leads.length}
          icon={<Target className="w-6 h-6" />}
          color="blue"
          isLoading={leadsLoading}
        />
        <StatCard
          label="Pending Quote Reviews"
          value={pendingQuotes.length}
          icon={<FileCheck2 className="w-6 h-6" />}
          color="teal"
          isLoading={quotesLoading}
        />
        <StatCard
          label="Overdue Follow-ups"
          value={overdueFollowUps.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          isLoading={fuLoading}
        />
        <StatCard
          label="Client Visits Scheduled"
          value={visits.length}
          icon={<MapPin className="w-6 h-6" />}
          color="purple"
          isLoading={visitsLoading}
        />
      </div>

      {/* Main Grid: Pending Quotations & Team Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotations Awaiting Review */}
        <GlassCard
          title="Quotations For Approval"
          subtitle="Quotations submitted by sales staff requiring review"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/quotations')}>
              View All
            </Button>
          }
        >
          <div className="space-y-3 pt-2">
            {pendingQuotes.length > 0 ? (
              pendingQuotes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{q.quotationNumber}</span>
                      <Badge status={q.status} size="sm" />
                    </div>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {q.customer?.name || 'Client Prospect'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-400">
                      ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] text-white/40">{new Date(q.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                All team quotations have been reviewed and approved.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Team Leads In Pipeline */}
        <GlassCard
          title="Recent Team Inquiries"
          subtitle="Active leads assigned to your sales engineers"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/leads')}>
              Lead Pipeline
            </Button>
          }
        >
          <div className="space-y-3 pt-2">
            {leads.slice(0, 5).map((l) => (
              <div
                key={l.id}
                onClick={() => navigate(`/leads/${l.id}`)}
                className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{l.customerName}</span>
                    <Badge status={l.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">
                    Assigned: {l.accountOwner ? `${l.accountOwner.firstName} ${l.accountOwner.lastName}` : 'Unassigned'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-white/80">
                    {l.enquiryValue ? `₹${Number(l.enquiryValue).toLocaleString('en-IN')}` : '—'}
                  </span>
                  <p className="text-[10px] text-white/40">{l.requirementType || l.city || 'Lead'}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Team Follow-ups & Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard
          title="Team Follow-up Schedules"
          subtitle="Critical customer contacts planned by your team"
        >
          <div className="space-y-2.5 pt-2">
            {followUps.slice(0, 5).map((fu) => (
              <div
                key={fu.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{fu.lead?.customerName || 'Client'}</p>
                    <p className="text-[11px] text-white/40 truncate">{fu.notes || fu.type}</p>
                  </div>
                </div>
                <Badge status={fu.status} size="sm" />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          title="On-Site Client Visits"
          subtitle="Industrial site meetings and demonstrations"
        >
          <div className="space-y-2.5 pt-2">
            {visits.slice(0, 5).map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{v.purpose || 'Industrial Client Visit'}</p>
                    <p className="text-[11px] text-white/40 truncate">{v.notes || 'Field demonstration'}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'Scheduled'}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
