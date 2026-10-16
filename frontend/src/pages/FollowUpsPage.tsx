import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CheckCheck,
  Building,
} from 'lucide-react';
import { followUpsApi, leadsApi } from '../lib/api';
import type { FollowUp, FollowUpStatus } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const FollowUpsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<FollowUp | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextAction, setNextAction] = useState('');

  // Create form state
  const [leadId, setLeadId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [type, setType] = useState('Phone Call');
  const [notes, setNotes] = useState('');

  // Fetch follow-ups
  const { data: followUpsResponse, isLoading } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => followUpsApi.list({ limit: 100 }),
  });

  // Fetch leads for selector
  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-quick-select'],
    queryFn: () => leadsApi.list({ limit: 100 }),
  });

  const allFollowUps = followUpsResponse?.data || [];

  // Categorize
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowUps = allFollowUps.filter((f) => {
    if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return false;
    const datePart = f.scheduledDate ? f.scheduledDate.split('T')[0] : '';
    return datePart === todayStr;
  });

  const upcomingFollowUps = allFollowUps.filter((f) => {
    if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return false;
    const datePart = f.scheduledDate ? f.scheduledDate.split('T')[0] : '';
    return datePart > todayStr;
  });

  const overdueFollowUps = allFollowUps.filter((f) => {
    if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return false;
    const datePart = f.scheduledDate ? f.scheduledDate.split('T')[0] : '';
    return datePart < todayStr;
  });

  const currentList =
    activeTab === 'today'
      ? todayFollowUps
      : activeTab === 'upcoming'
      ? upcomingFollowUps
      : overdueFollowUps;

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, notes, nextAction }: { id: string; notes?: string; nextAction?: string }) =>
      followUpsApi.markComplete(id, notes, nextAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCompleteTarget(null);
      setCompletionNotes('');
      setNextAction('');
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      followUpsApi.create({
        leadId: leadId || undefined,
        scheduledDate: new Date(scheduledDate).toISOString(),
        type,
        notes,
        status: 'PENDING' as FollowUpStatus,
        userId: 'self',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsCreateOpen(false);
      setLeadId('');
      setScheduledDate('');
      setNotes('');
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-400" />
            Follow-up Actions & Reminders
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Organize customer engagements, phone calls, and technical meetings
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Schedule Follow-up
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Today's Actions</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px]">
            {todayFollowUps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px]">
            {upcomingFollowUps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Overdue</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px]">
            {overdueFollowUps.length}
          </span>
        </button>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : currentList.length > 0 ? (
          currentList.map((fu) => (
            <GlassCard key={fu.id} padding={false} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      activeTab === 'overdue'
                        ? 'bg-rose-500/10 text-rose-400'
                        : activeTab === 'today'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white">
                        {fu.lead?.customerName || 'General Follow-up'}
                      </h4>
                      <Badge status={fu.status} size="sm" />
                      <span className="text-[11px] text-white/40">• {fu.type}</span>
                    </div>

                    <p className="text-xs text-white/70 mt-1">
                      {fu.notes || 'No description entered.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-white/50 mt-2">
                      <span className="flex items-center gap-1 font-medium text-white/70">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(fu.scheduledDate).toLocaleDateString()}
                      </span>
                      {fu.lead && (
                        <span className="flex items-center gap-1 text-blue-400 font-mono">
                          <Building className="w-3 h-3" />
                          {fu.lead.leadNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="success"
                    leftIcon={<CheckCheck className="w-4 h-4" />}
                    onClick={() => setCompleteTarget(fu)}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No actions in this category</h3>
            <p className="text-xs text-white/50 mt-1">
              You are completely caught up with scheduled follow-ups!
            </p>
          </GlassCard>
        )}
      </div>

      {/* Complete Modal */}
      <Modal
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        title="Complete Follow-up"
        subtitle={`Record notes for ${completeTarget?.lead?.customerName || 'action'}`}
      >
        <div className="space-y-4">
          <Input
            label="Completion Notes / Client Feedback"
            placeholder="What was discussed or concluded?"
            required
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
          <Input
            label="Next Action (Optional)"
            placeholder="e.g. Issue revision quotation, prepare sample"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setCompleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={completeMutation.isPending}
              onClick={() => {
                if (completeTarget) {
                  completeMutation.mutate({
                    id: completeTarget.id,
                    notes: completionNotes,
                    nextAction,
                  });
                }
              }}
            >
              Mark Completed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Follow-up Action"
        subtitle="Set date and notes for customer outreach"
      >
        <div className="space-y-4">
          <Select
            label="Link to Lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
          >
            <option value="">Select Opportunity / Lead...</option>
            {leadsResponse?.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.leadNumber} - {l.customerName}
              </option>
            ))}
          </Select>

          <Input
            label="Scheduled Date"
            type="date"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />

          <Select
            label="Action Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="Phone Call">Phone Call</option>
            <option value="Client Visit">Client Visit</option>
            <option value="Technical Review">Technical Review</option>
            <option value="Send Quotation">Send Quotation</option>
            <option value="Commercial Negotiation">Commercial Negotiation</option>
          </Select>

          <Input
            label="Notes / Agenda"
            placeholder="Purpose of this follow-up..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!scheduledDate}
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
