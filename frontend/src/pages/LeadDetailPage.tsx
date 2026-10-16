import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Plus,
  Send,
  Clock,
  FileText,
  Activity,
} from 'lucide-react';
import { leadsApi, followUpsApi, quotationsApi } from '../lib/api';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'follow-ups' | 'quotations'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Call Note');
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState('Phone Call');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Fetch lead details
  const { data: leadResponse, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id!),
    enabled: !!id,
  });

  // Fetch activities
  const { data: activitiesResponse } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: () => leadsApi.getActivities(id!),
    enabled: !!id && activeTab === 'activities',
  });

  // Fetch quotations for this lead
  const { data: quotationsResponse } = useQuery({
    queryKey: ['lead-quotations', id],
    queryFn: () => quotationsApi.list({ leadId: id }),
    enabled: !!id && activeTab === 'quotations',
  });

  const lead = leadResponse?.data;

  // Add activity note mutation
  const addActivityMutation = useMutation({
    mutationFn: (data: { type: string; description: string }) =>
      leadsApi.addActivity(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
      setNewNote('');
    },
  });

  // Create follow up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: (data: { scheduledDate: string; type: string; notes?: string }) =>
      followUpsApi.create({
        leadId: id,
        customerId: lead?.customerId || undefined,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        type: data.type,
        notes: data.notes,
        status: 'PENDING',
        userId: lead?.accountOwnerId || '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setIsFollowUpModalOpen(false);
      setFollowUpNotes('');
      setFollowUpDate('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Lead not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{lead.customerName}</h1>
              <Badge status={lead.status} />
            </div>
            <p className="text-xs text-white/40 mt-0.5 font-mono">Lead Ref: {lead.leadNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Clock className="w-4 h-4" />}
            onClick={() => setIsFollowUpModalOpen(true)}
          >
            Schedule Follow-up
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate(`/quotations/create?leadId=${lead.id}&customerId=${lead.customerId || ''}`)}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm">
        {(['overview', 'activities', 'follow-ups', 'quotations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-medium capitalize transition-colors relative cursor-pointer ${
              activeTab === tab ? 'text-blue-400 font-semibold' : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Customer Contact */}
          <GlassCard title="Customer & Contact Details">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 text-white/80">
                <Building className="w-4 h-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-white/40">Company / Entity</p>
                  <p className="font-semibold text-white text-sm">{lead.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <User className="w-4 h-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-white/40">Contact Person</p>
                  <p className="font-medium text-white">
                    {lead.contactPerson || '—'}{' '}
                    {lead.designation && <span className="text-white/50">({lead.designation})</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Phone className="w-4 h-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-white/40">Phone</p>
                  <p className="text-white">{lead.mobile || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Mail className="w-4 h-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-white/40">Email</p>
                  <p className="text-white">{lead.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-white/40">Location</p>
                  <p className="text-white">
                    {[lead.address, lead.city, lead.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Card 2: Requirements & Business Scope */}
          <GlassCard title="Requirements & Scope">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Industry</span>
                <span className="font-medium text-white">{lead.industry || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Entity Role</span>
                <span className="font-medium text-white">{lead.manufacturerOrTrader || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Products Manufactured</span>
                <span className="font-medium text-white">{lead.productsManufactured || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Products Required</span>
                <span className="font-medium text-white">{lead.productsRequired || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Part Type</span>
                <span className="font-medium text-white">{lead.partType || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Annual Quantity</span>
                <span className="font-medium text-white">{lead.annualQuantity || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/40">Competitors</span>
                <span className="font-medium text-white">{lead.competitors || '—'}</span>
              </div>
            </div>
          </GlassCard>

          {/* Card 3: Commercial Details */}
          <GlassCard title="Commercial & Assignment">
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-300 font-medium">Estimated Enquiry Value</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {lead.enquiryValue
                      ? `₹${Number(lead.enquiryValue).toLocaleString('en-IN')}`
                      : 'Not estimated'}
                  </p>
                </div>
                <IndianRupee className="w-8 h-8 text-emerald-400/40" />
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Account Owner</span>
                <span className="font-medium text-white">
                  {lead.accountOwner
                    ? `${lead.accountOwner.firstName} ${lead.accountOwner.lastName}`
                    : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40">Next Action</span>
                <span className="font-medium text-blue-400">{lead.nextAction || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/40">Next Follow-up Date</span>
                <span className="font-medium text-amber-400">
                  {lead.nextFollowUpDate
                    ? new Date(lead.nextFollowUpDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Card 4: Timeline & Remarks */}
          <GlassCard title="Notes & Remarks">
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 min-h-[90px]">
                <p className="text-white/70 whitespace-pre-wrap">
                  {lead.remarks || 'No remarks recorded for this lead yet.'}
                </p>
              </div>

              <div className="flex justify-between text-white/40 text-[11px] pt-2">
                <span>Created: {new Date(lead.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(lead.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <GlassCard title="Log New Note / Interaction">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="sm:col-span-1"
                >
                  <option value="Call Note">Call Note</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Email Sent">Email Sent</option>
                  <option value="Technical Discussion">Technical Discussion</option>
                  <option value="Commercial Review">Commercial Review</option>
                </Select>
                <div className="sm:col-span-3 flex gap-2">
                  <Input
                    placeholder="Describe the update, interaction, or client response..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    rightIcon={<Send className="w-4 h-4" />}
                    disabled={!newNote.trim()}
                    isLoading={addActivityMutation.isPending}
                    onClick={() =>
                      addActivityMutation.mutate({
                        type: noteType,
                        description: newNote,
                      })
                    }
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Activity Timeline */}
          <GlassCard title="Interaction History">
            <div className="space-y-4">
              {activitiesResponse?.data && activitiesResponse.data.length > 0 ? (
                activitiesResponse.data.map((act) => (
                  <div
                    key={act.id}
                    className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 h-fit">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{act.type}</span>
                        <span className="text-[11px] text-white/40">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">{act.description}</p>
                      {act.user && (
                        <p className="text-[10px] text-white/40 mt-2">
                          Logged by: {act.user.firstName} {act.user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40 text-xs">
                  No activity logged yet. Use the form above to add an interaction note.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: FOLLOW-UPS */}
      {activeTab === 'follow-ups' && (
        <GlassCard
          title="Scheduled Follow-ups"
          headerAction={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsFollowUpModalOpen(true)}
            >
              Add Follow-up
            </Button>
          }
        >
          <div className="space-y-3">
            {lead.followUps && lead.followUps.length > 0 ? (
              lead.followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{fu.type}</p>
                      <p className="text-xs text-white/60 mt-0.5">{fu.notes || 'No notes'}</p>
                      <p className="text-[11px] text-amber-400/80 mt-1">
                        Due: {new Date(fu.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge status={fu.status} size="sm" />
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No follow-ups scheduled for this lead.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Tab: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <GlassCard
          title="Associated Quotations"
          headerAction={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate(`/quotations/create?leadId=${lead.id}&customerId=${lead.customerId || ''}`)}
            >
              Create Quotation
            </Button>
          }
        >
          <div className="space-y-3">
            {quotationsResponse?.data && quotationsResponse.data.length > 0 ? (
              quotationsResponse.data.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => navigate(`/quotations/${quote.id}`)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white font-mono">
                        {quote.quotationNumber} (Rev {quote.revision})
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        Date: {new Date(quote.quotationDate).toLocaleDateString()} | Validity: {new Date(quote.validityDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{Number(quote.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <Badge status={quote.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No quotations created for this lead yet.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Follow-up"
        subtitle={`Set reminder for ${lead.customerName}`}
      >
        <div className="space-y-4">
          <Input
            label="Scheduled Date"
            type="date"
            required
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
          <Select
            label="Interaction Type"
            value={followUpType}
            onChange={(e) => setFollowUpType(e.target.value)}
          >
            <option value="Phone Call">Phone Call</option>
            <option value="Factory Visit">Factory Visit</option>
            <option value="Video Conference">Video Conference</option>
            <option value="Send Commercial Offer">Send Commercial Offer</option>
            <option value="Sample Submission">Sample Submission</option>
          </Select>
          <Input
            label="Notes / Objective"
            placeholder="e.g. Follow up on technical datasheet approval"
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!followUpDate}
              isLoading={createFollowUpMutation.isPending}
              onClick={() =>
                createFollowUpMutation.mutate({
                  scheduledDate: followUpDate,
                  type: followUpType,
                  notes: followUpNotes,
                })
              }
            >
              Save Follow-up
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
