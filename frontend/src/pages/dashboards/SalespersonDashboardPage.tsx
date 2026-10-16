import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  FileText,
  Clock,
  MapPin,
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { leadsApi, quotationsApi, followUpsApi, visitsApi } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const SalespersonDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['salesperson-my-leads'],
    queryFn: () => leadsApi.list({ limit: 10 }),
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['salesperson-my-quotes'],
    queryFn: () => quotationsApi.list({ limit: 10 }),
  });

  const { data: followUpsData, isLoading: fuLoading } = useQuery({
    queryKey: ['salesperson-my-follow-ups'],
    queryFn: () => followUpsApi.list({ limit: 10 }),
  });

  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['salesperson-my-visits'],
    queryFn: () => visitsApi.list({ limit: 5 }),
  });

  const leads = leadsData?.data || [];
  const quotations = quotesData?.data || [];
  const followUps = followUpsData?.data || [];
  const visits = visitsData?.data || [];

  const wonQuotes = quotations.filter((q) => q.status === 'CONVERTED' || q.status === 'APPROVED');
  const activeOpportunities = leads.filter((l) => l.status === 'GENERAL' || l.status === 'MARKET' || l.status === 'QUOTE_SUBMITTED');
  const todaysFollowUps = followUps.filter((f) => {
    const today = new Date().toISOString().split('T')[0];
    return f.scheduledDate && f.scheduledDate.startsWith(today);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Sales Representative Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">My Daily Sales Desk</h1>
          <p className="text-xs text-white/50">
            Assigned customer inquiries, scheduled client visits, quotations, and monthly quota
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
            leftIcon={<MapPin className="w-4 h-4" />}
            onClick={() => navigate('/visits')}
          >
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="My Active Leads"
          value={activeOpportunities.length}
          icon={<Target className="w-6 h-6" />}
          color="blue"
          isLoading={leadsLoading}
        />
        <StatCard
          label="Follow-ups Due Today"
          value={todaysFollowUps.length}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          isLoading={fuLoading}
        />
        <StatCard
          label="My Quotations"
          value={quotations.length}
          icon={<FileText className="w-6 h-6" />}
          color="teal"
          isLoading={quotesLoading}
        />
        <StatCard
          label="Deals Won / Closed"
          value={wonQuotes.length}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          isLoading={quotesLoading}
        />
      </div>

      {/* Middle Grid: My Inquiries & Follow-up Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Action Items */}
        <GlassCard
          title="Today's Calling & Follow-up Agenda"
          subtitle="Calls and client communications requiring action today"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/follow-ups')}>
              All Follow-ups
            </Button>
          }
        >
          <div className="space-y-3 pt-2">
            {followUps.length > 0 ? (
              followUps.slice(0, 5).map((fu) => (
                <div
                  key={fu.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">
                        {fu.lead?.customerName || 'Customer Prospect'}
                      </p>
                      <p className="text-[11px] text-white/50 truncate">{fu.notes || fu.type}</p>
                    </div>
                  </div>
                  <Badge status={fu.status} size="sm" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                No pending calls or follow-ups for today. Great job!
              </div>
            )}
          </div>
        </GlassCard>

        {/* My Active Leads */}
        <GlassCard
          title="My Assigned Leads"
          subtitle="Inquiries assigned to you for qualification and follow-up"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/leads')}>
              View Leads
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
                    Requirement: {l.requirementType || l.productsRequired || 'Industrial Automation'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-emerald-400">
                    {l.enquiryValue ? `₹${Number(l.enquiryValue).toLocaleString('en-IN')}` : '—'}
                  </span>
                  <p className="text-[10px] text-white/40">{l.city || l.leadNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Grid: My Quotations & Client Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard
          title="My Recent Quotations"
          subtitle="Quotations prepared and sent to your clients"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/quotations/create')}>
              + New Quote
            </Button>
          }
        >
          <div className="space-y-2.5 pt-2">
            {quotations.slice(0, 5).map((q) => (
              <div
                key={q.id}
                onClick={() => navigate(`/quotations/${q.id}`)}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between gap-3 text-xs cursor-pointer transition"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-white">{q.quotationNumber}</p>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">{q.customer?.name || 'Client'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-emerald-400">
                    ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                  <div className="mt-0.5">
                    <Badge status={q.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          title="Scheduled Site Visits"
          subtitle="Upcoming on-site demonstrations and meetings"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/visits')}>
              + Visit
            </Button>
          }
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
                    <p className="font-semibold text-white truncate">{v.purpose || 'Client Visit'}</p>
                    <p className="text-[11px] text-white/40 truncate">{v.notes || 'Meeting'}</p>
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
