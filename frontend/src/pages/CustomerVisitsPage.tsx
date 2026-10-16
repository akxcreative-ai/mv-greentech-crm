import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Calendar } from 'lucide-react';
import { visitsApi, customersApi, leadsApi } from '../lib/api';
import type { CustomerVisit, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const CustomerVisitsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');

  // Fetch visits
  const { data: visitsResponse, isLoading } = useQuery({
    queryKey: ['visits', { page, dateFilter }],
    queryFn: () => visitsApi.list({ page, limit: 10, date: dateFilter || undefined }),
  });

  // Fetch customers
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  // Fetch leads
  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-select'],
    queryFn: () => leadsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      visitsApi.create({
        customerId: customerId || undefined,
        leadId: leadId || undefined,
        visitDate: new Date(visitDate).toISOString(),
        purpose,
        outcome,
        notes,
        nextAction,
        userId: 'self',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setIsModalOpen(false);
      setCustomerId('');
      setLeadId('');
      setVisitDate('');
      setPurpose('');
      setOutcome('');
      setNotes('');
      setNextAction('');
    },
  });

  const columns: Column<CustomerVisit>[] = [
    {
      header: 'Visit Date',
      accessorKey: 'visitDate',
      render: (v) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-white">
            {new Date(v.visitDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Purpose',
      accessorKey: 'purpose',
      render: (v) => (
        <div>
          <p className="text-sm font-semibold text-white">{v.purpose || 'Site Inspection'}</p>
          {v.notes && <p className="text-xs text-white/50 truncate max-w-xs">{v.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Outcome',
      accessorKey: 'outcome',
      render: (v) => (
        <span className="text-xs text-teal-300 font-medium">
          {v.outcome || 'Pending Review'}
        </span>
      ),
    },
    {
      header: 'Next Action',
      accessorKey: 'nextAction',
      render: (v) => (
        <span className="text-xs text-amber-300 font-medium">{v.nextAction || '—'}</span>
      ),
    },
    {
      header: 'Representative',
      accessorKey: 'user',
      render: (v) => (
        <span className="text-xs text-white/70">
          {v.user ? `${v.user.firstName} ${v.user.lastName}` : 'Field Staff'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-purple-400" />
            Field & Customer Visits
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Log on-site client interactions, technical demonstrations, and plant audits
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Schedule Visit
        </Button>
      </div>

      {/* Date Filter Card */}
      <GlassCard padding={false} className="p-4">
        <div className="flex items-center gap-4 max-w-sm">
          <Input
            type="date"
            label="Filter by Visit Date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-5"
              onClick={() => {
                setDateFilter('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={visitsResponse?.data || []}
          isLoading={isLoading}
          pagination={visitsResponse?.pagination}
          onPageChange={setPage}
          emptyMessage="No customer visits logged."
        />
      </GlassCard>

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule / Log Customer Visit"
        subtitle="Record visit details and action items"
        size="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer Account"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select Customer...</option>
              {customersResponse?.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Opportunity (Optional)"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">Select Linked Lead...</option>
              {leadsResponse?.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.leadNumber} - {l.customerName}
                </option>
              ))}
            </Select>

            <Input
              label="Visit Date"
              type="date"
              required
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />

            <Input
              label="Purpose of Visit"
              placeholder="e.g. Tank level sensor demonstration"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />

            <div className="md:col-span-2">
              <Input
                label="Visit Notes / Meeting Summary"
                placeholder="Key stakeholders present, questions asked..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Input
              label="Outcome / Findings"
              placeholder="e.g. Client requested customized flange specs"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            />

            <Input
              label="Next Action Required"
              placeholder="e.g. Issue revision quotation with RS485 module"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!visitDate || !purpose.trim()}
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Save Visit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
