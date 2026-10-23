import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Archive,
  Target,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { leadsApi, usersApi } from '../lib/api';
import type { Lead, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

import { LocationSelector } from '../components/ui/LocationSelector';

const leadFormSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  contactPerson: z.string().optional(),
  designation: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  industry: z.string().optional(),
  manufacturerOrTrader: z.string().optional(),
  productsManufactured: z.string().optional(),
  productsRequired: z.string().optional(),
  partType: z.string().optional(),
  requirementType: z.string().optional(),
  annualQuantity: z.string().optional(),
  competitors: z.string().optional(),
  enquiryValue: z.coerce.number().optional(),
  currency: z.string().optional(),
  accountOwnerId: z.string().optional(),
  status: z.enum(['GENERAL', 'MARKET', 'QUOTE_SUBMITTED', 'WON', 'LOST']).optional(),
  nextAction: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  remarks: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Fetch leads
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', { page, limit, search, status: statusFilter, owner: ownerFilter, city: cityFilter }],
    queryFn: () =>
      leadsApi.list({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        accountOwnerId: ownerFilter || undefined,
        city: cityFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Fetch users for owner select
  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersApi.list({ limit: 100 }),
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema) as any,
    defaultValues: {
      currency: 'INR',
      country: 'India',
      state: '',
      city: '',
      postalCode: '',
      status: 'GENERAL',
    },
  });

  const openCreateModal = () => {
    setEditingLead(null);
    setDuplicateWarning(null);
    reset({
      customerName: '',
      contactPerson: '',
      designation: '',
      mobile: '',
      email: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      industry: '',
      manufacturerOrTrader: '',
      productsManufactured: '',
      productsRequired: '',
      partType: '',
      requirementType: '',
      annualQuantity: '',
      competitors: '',
      enquiryValue: 0,
      currency: 'INR',
      accountOwnerId: '',
      status: 'GENERAL',
      nextAction: '',
      nextFollowUpDate: '',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setDuplicateWarning(null);
    reset({
      customerName: lead.customerName,
      contactPerson: lead.contactPerson || '',
      designation: lead.designation || '',
      mobile: lead.mobile || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || 'India',
      postalCode: lead.postalCode || '',
      industry: lead.industry || '',
      manufacturerOrTrader: lead.manufacturerOrTrader || '',
      productsManufactured: lead.productsManufactured || '',
      productsRequired: lead.productsRequired || '',
      partType: lead.partType || '',
      requirementType: lead.requirementType || '',
      annualQuantity: lead.annualQuantity || '',
      competitors: lead.competitors || '',
      enquiryValue: Number(lead.enquiryValue) || 0,
      currency: lead.currency || 'INR',
      accountOwnerId: lead.accountOwnerId || '',
      status: lead.status || 'GENERAL',
      nextAction: lead.nextAction || '',
      nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '',
      remarks: lead.remarks || '',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const payload: Partial<Lead> = {
        ...data,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate).toISOString() : undefined,
      };
      if (editingLead) {
        return leadsApi.update(editingLead.id, payload);
      }
      return leadsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      setDuplicateWarning(null);
    },
    onError: (err: any) => {
      if (err.response?.status === 409 && err.response?.data?.isDuplicate) {
        setDuplicateWarning(err.response.data.error);
      } else {
        alert(err.response?.data?.error || err.message || 'Failed to save lead');
      }
    },
  });

  const convertToCustomerMutation = useMutation({
    mutationFn: (leadId: string) => leadsApi.convertToCustomer(leadId, { status: 'WON' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alert(res.message || 'Lead successfully converted to Customer!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to convert lead to customer');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => leadsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleExportCsv = async () => {
    try {
      const blob = await leadsApi.exportCsv({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    }
  };

  const columns: Column<Lead>[] = [
    {
      header: 'Lead #',
      accessorKey: 'leadNumber',
      render: (lead) => (
        <span className="font-mono text-xs font-semibold text-blue-400">
          {lead.leadNumber}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'loginDate',
      render: (lead) => (
        <span className="text-xs text-white/70">
          {lead.loginDate ? new Date(lead.loginDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      render: (lead) => (
        <div>
          <p className="text-sm font-semibold text-white">{lead.customerName}</p>
          {lead.industry && <p className="text-[11px] text-white/40">{lead.industry}</p>}
        </div>
      ),
    },
    {
      header: 'Contact',
      accessorKey: 'contactPerson',
      render: (lead) => (
        <div>
          <p className="text-xs text-white/90">{lead.contactPerson || '—'}</p>
          {lead.mobile && <p className="text-[11px] text-white/50">{lead.mobile}</p>}
        </div>
      ),
    },
    {
      header: 'City',
      accessorKey: 'city',
      render: (lead) => <span className="text-xs text-white/70">{lead.city || '—'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (lead) => <Badge status={lead.status} size="sm" dot />,
    },
    {
      header: 'Enquiry Value',
      accessorKey: 'enquiryValue',
      render: (lead) => (
        <span className="text-xs font-semibold text-emerald-400">
          {lead.enquiryValue
            ? `₹${Number(lead.enquiryValue).toLocaleString('en-IN')}`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Owner',
      accessorKey: 'accountOwner',
      render: (lead) => (
        <span className="text-xs text-white/80">
          {lead.accountOwner
            ? `${lead.accountOwner.firstName} ${lead.accountOwner.lastName}`
            : 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Next Follow-up',
      accessorKey: 'nextFollowUpDate',
      render: (lead) => (
        <span className="text-xs text-amber-400">
          {lead.nextFollowUpDate
            ? new Date(lead.nextFollowUpDate).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (lead) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/leads/${lead.id}`)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(lead)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-blue-400 transition-colors"
            title="Edit Lead"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Convert lead "${lead.customerName}" into a permanent Customer record?`)) {
                convertToCustomerMutation.mutate(lead.id);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-emerald-400 transition-colors"
            title="Convert to Customer"
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Archive lead ${lead.leadNumber}?`)) {
                archiveMutation.mutate(lead.id);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-rose-400 transition-colors"
            title="Archive Lead"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-blue-400" />
            Lead Management
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Capture, track, and convert sales opportunities and client enquiries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            New Lead
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <GlassCard padding={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchBar
            placeholder="Search by customer, lead#, contact..."
            value={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="GENERAL">General</option>
            <option value="MARKET">Market</option>
            <option value="QUOTE_SUBMITTED">Quote Submitted</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </Select>

          <Select
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Account Owners</option>
            {usersResponse?.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.role})
              </option>
            ))}
          </Select>

          <Input
            placeholder="Filter by City..."
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </GlassCard>

      {/* Leads Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={leadsResponse?.data || []}
          isLoading={isLoading}
          pagination={leadsResponse?.pagination}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100, 200, 500]}
          exportTitle="Lead Pipeline"
          onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
          emptyMessage="No leads found matching your criteria."
        />
      </GlassCard>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? `Edit Lead: ${editingLead.leadNumber}` : 'Create New Lead'}
        subtitle="Fill in customer enquiry information and requirement details"
        size="4xl"
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data as LeadFormData))} className="space-y-6">
          {duplicateWarning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-200">
                <span className="font-semibold block mb-1">Duplicate Record Detected</span>
                {duplicateWarning}
              </div>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div>
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
              1. Basic Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Customer / Company Name"
                required
                error={errors.customerName?.message}
                {...register('customerName')}
              />
              <Input
                label="Contact Person"
                error={errors.contactPerson?.message}
                {...register('contactPerson')}
              />
              <Input
                label="Designation"
                error={errors.designation?.message}
                {...register('designation')}
              />
              <Input
                label="Mobile Phone"
                type="tel"
                error={errors.mobile?.message}
                {...register('mobile')}
              />
              <Input
                label="Email Address"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Industry"
                placeholder="e.g. Manufacturing, Solar, Water"
                error={errors.industry?.message}
                {...register('industry')}
              />
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="pt-4 border-t border-white/10">
            <LocationSelector
              countryValue={watch('country') || 'India'}
              stateValue={watch('state') || ''}
              cityValue={watch('city') || ''}
              postalCodeValue={watch('postalCode') || ''}
              onCountryChange={(val) => setValue('country', val)}
              onStateChange={(val) => setValue('state', val)}
              onCityChange={(val) => setValue('city', val)}
              onPostalCodeChange={(val) => setValue('postalCode', val)}
              required
            />
            <div className="mt-3">
              <Input
                label="Detailed Street / Factory Address"
                placeholder="Plot No., Industrial Area, Landmark"
                error={errors.address?.message}
                {...register('address')}
              />
            </div>
          </div>

          {/* Section 3: Business & Requirements */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              3. Requirements & Scope
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="Manufacturer or Trader" {...register('manufacturerOrTrader')}>
                <option value="">Select Type</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Trader">Trader</option>
                <option value="Both">Both</option>
              </Select>
              <Input
                label="Products Manufactured"
                error={errors.productsManufactured?.message}
                {...register('productsManufactured')}
              />
              <Input
                label="Products Required"
                error={errors.productsRequired?.message}
                {...register('productsRequired')}
              />
              <Input
                label="Part Type / Category"
                error={errors.partType?.message}
                {...register('partType')}
              />
              <Input
                label="Requirement Type"
                placeholder="e.g. Regular, Project, Prototype"
                error={errors.requirementType?.message}
                {...register('requirementType')}
              />
              <Input
                label="Annual Estimated Quantity"
                error={errors.annualQuantity?.message}
                {...register('annualQuantity')}
              />
              <Input
                label="Key Competitors"
                error={errors.competitors?.message}
                {...register('competitors')}
              />
            </div>
          </div>

          {/* Section 4: Commercial & Status */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              4. Commercial & Pipeline Stage
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Enquiry Value (INR)"
                type="number"
                step="any"
                error={errors.enquiryValue?.message}
                {...register('enquiryValue')}
              />
              <Select label="Account Owner" {...register('accountOwnerId')}>
                <option value="">Assign To...</option>
                {usersResponse?.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </Select>
              <Select label="Status" {...register('status')}>
                <option value="GENERAL">General</option>
                <option value="MARKET">Market</option>
                <option value="QUOTE_SUBMITTED">Quote Submitted</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </Select>
              <Input
                label="Next Action"
                placeholder="e.g. Send technical datasheet"
                error={errors.nextAction?.message}
                {...register('nextAction')}
              />
              <Input
                label="Next Follow-up Date"
                type="date"
                error={errors.nextFollowUpDate?.message}
                {...register('nextFollowUpDate')}
              />
              <div className="md:col-span-3">
                <Input
                  label="Remarks / Notes"
                  placeholder="Additional context about this opportunity..."
                  error={errors.remarks?.message}
                  {...register('remarks')}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
