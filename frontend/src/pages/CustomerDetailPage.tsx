import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  Target,
  FileText,
  ShoppingCart,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { customersApi, leadsApi, quotationsApi, ordersApi } from '../lib/api';
import type { Contact } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'contacts' | 'leads' | 'quotations' | 'orders'>('contacts');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Customer query
  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  });

  // Leads query
  const { data: leadsResponse } = useQuery({
    queryKey: ['customer-leads', id],
    queryFn: () => leadsApi.list({ customerId: id }),
    enabled: !!id && activeTab === 'leads',
  });

  // Quotations query
  const { data: quotationsResponse } = useQuery({
    queryKey: ['customer-quotations', id],
    queryFn: () => quotationsApi.list({ customerId: id }),
    enabled: !!id && activeTab === 'quotations',
  });

  // Orders query
  const { data: ordersResponse } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => ordersApi.list({ customerId: id }),
    enabled: !!id && activeTab === 'orders',
  });

  const customer = customerResponse?.data;

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => customersApi.addContact(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setIsContactModalOpen(false);
      setContactName('');
      setContactDesignation('');
      setContactMobile('');
      setContactEmail('');
      setIsPrimary(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Customer not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/customers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{customer.name}</h1>
              <Badge status={customer.isActive ? 'ACTIVE' : 'DISCONTINUED'} size="sm" />
            </div>
            <p className="text-xs text-teal-400 mt-0.5">
              {customer.industry || 'General Industry'} • {customer.customerType || 'Client'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Target className="w-4 h-4" />}
            onClick={() => navigate(`/leads?customer=${encodeURIComponent(customer.name)}`)}
          >
            New Opportunity
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate(`/quotations/create?customerId=${customer.id}`)}
          >
            New Quotation
          </Button>
        </div>
      </div>

      {/* Summary Glass Card */}
      <GlassCard padding={false} className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <p className="text-white/40">GST Number</p>
              <p className="font-mono font-medium text-white">{customer.gstNumber || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-white/40">Location</p>
              <p className="font-medium text-white">
                {[customer.city, customer.country].filter(Boolean).join(', ') || 'India'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-white/40">Website</p>
              <p className="font-medium text-white truncate">
                {customer.website ? (
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {customer.website}
                  </a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-white/40">Active Contacts</p>
              <p className="font-medium text-white">{customer.contacts?.length || 0} Registered</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm">
        {(['contacts', 'leads', 'quotations', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-medium capitalize transition-colors relative cursor-pointer ${
              activeTab === tab ? 'text-teal-400 font-semibold' : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: CONTACTS */}
      {activeTab === 'contacts' && (
        <GlassCard
          title="Points of Contact"
          subtitle="Authorized personnel, technical directors, and procurement heads"
          headerAction={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsContactModalOpen(true)}
            >
              Add Contact
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.contacts && customer.contacts.length > 0 ? (
              customer.contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 relative space-y-3"
                >
                  {c.isPrimary && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> Primary
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                    <p className="text-xs text-white/50">{c.designation || 'Representative'}</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-white/70">
                    {c.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-white/40" />
                        <span>{c.mobile}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-white/40" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-white/40 text-xs">
                No contacts registered for this customer yet. Click "Add Contact" above.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Tab: LEADS */}
      {activeTab === 'leads' && (
        <GlassCard title="Associated Leads & Opportunities">
          <div className="space-y-3">
            {leadsResponse?.data && leadsResponse.data.length > 0 ? (
              leadsResponse.data.map((l) => (
                <div
                  key={l.id}
                  onClick={() => navigate(`/leads/${l.id}`)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-400">
                        {l.leadNumber}
                      </span>
                      <span className="text-sm font-semibold text-white">{l.customerName}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {l.productsRequired || 'Water Level Indicator & Sensor enquiry'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-emerald-400">
                      {l.enquiryValue ? `₹${Number(l.enquiryValue).toLocaleString('en-IN')}` : '—'}
                    </span>
                    <Badge status={l.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No leads linked to this customer yet.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Tab: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <GlassCard title="Quotations History">
          <div className="space-y-3">
            {quotationsResponse?.data && quotationsResponse.data.length > 0 ? (
              quotationsResponse.data.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <div>
                    <span className="font-mono text-xs font-semibold text-teal-400">
                      {q.quotationNumber}
                    </span>
                    <p className="text-xs text-white/50 mt-1">
                      Date: {new Date(q.quotationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{Number(q.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <Badge status={q.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No quotations on record for this customer.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Tab: ORDERS */}
      {activeTab === 'orders' && (
        <GlassCard title="Confirmed Purchase Orders">
          <div className="space-y-3">
            {ordersResponse?.data && ordersResponse.data.length > 0 ? (
              ordersResponse.data.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {o.orderNumber}
                    </span>
                    <p className="text-xs text-white/50 mt-1">
                      Order Date: {new Date(o.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-400">
                      ₹{Number(o.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <Badge status={o.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No orders placed by this customer yet.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Add Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Customer Contact"
        subtitle={`Register key person at ${customer.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Contact Full Name"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            label="Designation / Department"
            placeholder="e.g. Purchase Manager, Chief Engineer"
            value={contactDesignation}
            onChange={(e) => setContactDesignation(e.target.value)}
          />
          <Input
            label="Mobile Phone"
            type="tel"
            value={contactMobile}
            onChange={(e) => setContactMobile(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 pt-1">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-teal-500 focus:ring-teal-500"
            />
            <span>Set as Primary Contact for this organization</span>
          </label>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsContactModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!contactName.trim()}
              isLoading={addContactMutation.isPending}
              onClick={() =>
                addContactMutation.mutate({
                  name: contactName,
                  designation: contactDesignation,
                  mobile: contactMobile,
                  email: contactEmail,
                  isPrimary,
                })
              }
            >
              Save Contact
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
