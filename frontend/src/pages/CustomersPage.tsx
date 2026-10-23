import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Eye, Pencil, Building2 } from 'lucide-react';
import { customersApi } from '../lib/api';
import type { Customer, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { LocationSelector } from '../components/ui/LocationSelector';
import { AlertCircle } from 'lucide-react';

const customerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  customerType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  gstNumber: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers', { page, limit, search }],
    queryFn: () => customersApi.list({ page, limit, search: search || undefined }),
    placeholderData: (previousData) => previousData,
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      country: 'India',
      state: '',
      city: '',
      postalCode: '',
    },
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    setDuplicateWarning(null);
    reset({
      customerCode: '',
      name: '',
      industry: '',
      customerType: 'Direct Client',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      gstNumber: '',
      website: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setDuplicateWarning(null);
    reset({
      customerCode: cust.customerCode || '',
      name: cust.name,
      industry: cust.industry || '',
      customerType: cust.customerType || 'Direct Client',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      country: cust.country || 'India',
      postalCode: cust.postalCode || '',
      gstNumber: cust.gstNumber || '',
      website: cust.website || '',
      notes: cust.notes || '',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: CustomerFormData) => {
      if (editingCustomer) {
        return customersApi.update(editingCustomer.id, data);
      }
      return customersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setDuplicateWarning(null);
    },
    onError: (err: any) => {
      if (err.response?.status === 409 && err.response?.data?.isDuplicate) {
        setDuplicateWarning(err.response.data.error);
      } else {
        alert(err.response?.data?.error || err.message || 'Failed to save customer');
      }
    },
  });

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      accessorKey: 'name',
      render: (cust) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{cust.name}</p>
            {cust.website && (
              <p className="text-[11px] text-teal-400/80">{cust.website}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Industry',
      accessorKey: 'industry',
      render: (cust) => <span className="text-xs text-white/70">{cust.industry || '—'}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'customerType',
      render: (cust) => <span className="text-xs text-white/70">{cust.customerType || 'Standard'}</span>,
    },
    {
      header: 'Location',
      render: (cust) => (
        <span className="text-xs text-white/80">
          {[cust.city, cust.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      header: 'GST Number',
      accessorKey: 'gstNumber',
      render: (cust) => (
        <span className="font-mono text-xs text-white/60">{cust.gstNumber || '—'}</span>
      ),
    },
    {
      header: 'Contacts',
      render: (cust) => (
        <span className="text-xs font-semibold text-blue-400">
          {cust.contacts ? `${cust.contacts.length} Contacts` : '0'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      render: (cust) => (
        <Badge status={cust.isActive ? 'ACTIVE' : 'DISCONTINUED'} size="sm" />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (cust) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/customers/${cust.id}`)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(cust)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-blue-400 transition-colors"
            title="Edit Customer"
          >
            <Pencil className="w-4 h-4" />
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
            <Users className="w-6 h-6 text-teal-400" />
            Customer Directory
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Accounts, client organizations, and point-of-contact master database
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <GlassCard padding={false} className="p-4">
        <SearchBar
          placeholder="Search by company name, industry, city, or GST..."
          value={search}
          onSearch={(val) => {
            if (val !== search) {
              setSearch(val);
              setPage(1);
            }
          }}
        />
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={customersResponse?.data || []}
          isLoading={isLoading}
          pagination={customersResponse?.pagination}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100, 200, 500]}
          exportTitle="Customer Directory"
          onRowClick={(cust) => navigate(`/customers/${cust.id}`)}
          emptyMessage="No customers found."
        />
      </GlassCard>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? `Edit: ${editingCustomer.name}` : 'Add New Customer'}
        subtitle="Register customer account details"
        size="2xl"
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data as CustomerFormData))} className="space-y-4">
          {duplicateWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-200">
                <span className="font-semibold block mb-0.5">Duplicate Customer Warning</span>
                {duplicateWarning}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Company / Customer Name"
                required
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <Input
              label="Industry / Segment"
              placeholder="e.g. Solar Energy, Wastewater, HVAC"
              error={errors.industry?.message}
              {...register('industry')}
            />
            <Select label="Customer Type" {...register('customerType')}>
              <option value="Direct Client">Direct Client</option>
              <option value="Distributor">Distributor</option>
              <option value="OEM">OEM</option>
              <option value="EPC Contractor">EPC Contractor</option>
              <option value="Govt / Semi-Govt">Govt / Semi-Govt</option>
            </Select>

            {/* Location Selector */}
            <div className="md:col-span-2">
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
            </div>

            <div className="md:col-span-2">
              <Input
                label="Registered Factory / Office Address"
                placeholder="Street address, building, landmark"
                error={errors.address?.message}
                {...register('address')}
              />
            </div>
            <Input
              label="GST Number"
              placeholder="22AAAAA0000A1Z5"
              error={errors.gstNumber?.message}
              {...register('gstNumber')}
            />
            <Input
              label="Website"
              placeholder="https://..."
              error={errors.website?.message}
              {...register('website')}
            />
            <div className="md:col-span-2">
              <Input
                label="General Notes"
                placeholder="Any special handling or remarks..."
                error={errors.notes?.message}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              {editingCustomer ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
