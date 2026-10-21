import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Save,
  Send,
} from 'lucide-react';
import { quotationsApi, customersApi, leadsApi, itemsApi, settingsApi } from '../lib/api';
import type { QuotationItem, QuotationStatus } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

interface LineItemFormState {
  itemId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
}

export const CreateQuotationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const prefillLeadId = searchParams.get('leadId') || '';
  const prefillCustomerId = searchParams.get('customerId') || '';

  // Form header fields
  const [customerId, setCustomerId] = useState(prefillCustomerId);
  const [leadId, setLeadId] = useState(prefillLeadId);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('INR');
  const [paymentTerms, setPaymentTerms] = useState('100% advance against PI or 30 days credit');
  const [deliveryTerms, setDeliveryTerms] = useState('Ex-works, dispatch within 7-10 working days');
  const [notes, setNotes] = useState('Prices quoted include standard 1-year manufacturer warranty.');
  const [specifications, setSpecifications] = useState('');

  // Quick Customer Creation modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustState, setNewCustState] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Line items
  const [items, setItems] = useState<LineItemFormState[]>([
    {
      description: 'Water Level Indicator Controller Panel with 4-level LED display',
      quantity: 1,
      unit: 'PCS',
      unitPrice: 4500,
      discount: 0,
      taxRate: 18,
      lineTotal: 4500,
    },
  ]);

  // Queries
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.list({ limit: 100 }),
  });

  const { data: masterItemsResponse } = useQuery({
    queryKey: ['items-all'],
    queryFn: () => itemsApi.list({ limit: 200 }),
  });

  const { data: settingsResponse } = useQuery({
    queryKey: ['settings-all'],
    queryFn: () => settingsApi.getAll(),
  });

  useEffect(() => {
    if (settingsResponse) {
      const companyProfile =
        (settingsResponse as any)?.settings?.company_profile ||
        (settingsResponse as any)?.data?.find((s: any) => s.key === 'company_profile')?.value;

      if (companyProfile) {
        if (companyProfile.defaultValidity) {
          const days = parseInt(companyProfile.defaultValidity, 10) || 30;
          setValidityDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        }
        if (companyProfile.bankName && companyProfile.bankAccount) {
          setPaymentTerms(`100% advance or RTGS/NEFT to ${companyProfile.bankName} (A/C: ${companyProfile.bankAccount})`);
        }
      }
    }
  }, [settingsResponse]);

  // Handle lead selection & auto-fill customer info
  const handleLeadSelect = (selectedLeadId: string) => {
    setLeadId(selectedLeadId);
    if (!selectedLeadId) return;

    const lead = leadsResponse?.data?.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    if (lead.customerId) {
      setCustomerId(lead.customerId);
    } else {
      // Pre-fill quick customer modal
      setNewCustName(lead.customerName || '');
      setNewCustPhone(lead.mobile || '');
      setNewCustEmail(lead.email || '');
      setNewCustCity(lead.city || '');
      setNewCustState(lead.state || '');
      setNewCustAddress(lead.address || '');
      if (!customerId) {
        setIsCustomerModalOpen(true);
      }
    }
  };

  // Quick create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!newCustName.trim()) {
        throw new Error('Customer / Company name is required');
      }
      const payload: Record<string, unknown> = {
        name: newCustName.trim(),
        city: newCustCity.trim() || undefined,
        state: newCustState.trim() || undefined,
        address: newCustAddress.trim() || undefined,
        gstNumber: newCustGst.trim() || undefined,
      };
      if (newCustPhone.trim() || newCustEmail.trim()) {
        payload.contacts = [
          {
            name: newCustName.trim(),
            mobile: newCustPhone.trim() || undefined,
            email: newCustEmail.trim() || undefined,
            isPrimary: true,
          },
        ];
      }
      return customersApi.create(payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers-all'] });
      if (res.data?.id) {
        setCustomerId(res.data.id);
      }
      setIsCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustCity('');
      setNewCustState('');
      setNewCustGst('');
      setNewCustAddress('');
    },
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
    0
  );
  const totalTax = items.reduce((sum, item) => {
    const discounted = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return sum + (discounted * item.taxRate) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleItemSelect = (index: number, itemId: string) => {
    const selected = masterItemsResponse?.data?.find((i) => i.id === itemId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        itemId: selected.id,
        description: selected.description,
        unit: selected.unit || 'PCS',
        unitPrice: Number(selected.standardPrice) || 0,
        lineTotal: copy[index].quantity * (Number(selected.standardPrice) || 0),
      };
      return copy;
    });
  };

  const updateItemField = (
    index: number,
    field: keyof LineItemFormState,
    value: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value };
      const discounted = updated.quantity * updated.unitPrice * (1 - updated.discount / 100);
      updated.lineTotal = Math.round(discounted * 100) / 100;
      copy[index] = updated;
      return copy;
    });
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unit: 'PCS',
        unitPrice: 0,
        discount: 0,
        taxRate: 18,
        lineTotal: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit mutation
  const createMutation = useMutation({
    mutationFn: (status: QuotationStatus) => {
      const quotationNumber = `QT-${Date.now().toString().slice(-6)}`;
      return quotationsApi.create({
        quotationNumber,
        customerId,
        leadId: leadId || undefined,
        quotationDate: new Date(quotationDate).toISOString(),
        validityDate: new Date(validityDate).toISOString(),
        currency,
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount: grandTotal,
        paymentTerms,
        deliveryTerms,
        notes,
        specifications,
        status,
        items: items as unknown as QuotationItem[],
      });
    },
    onSuccess: (res) => {
      if (res.data?.id) {
        navigate(`/quotations/${res.data.id}`);
      } else {
        navigate('/quotations');
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-400" />
              Create Quotation
            </h1>
            <p className="text-xs text-white/50 mt-0.5">
              Draft commercial offer, select line items, and calculate GST totals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={createMutation.isPending}
            onClick={() => createMutation.mutate('DRAFT')}
            disabled={!customerId}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            isLoading={createMutation.isPending}
            onClick={() => createMutation.mutate('SENT')}
            disabled={!customerId}
          >
            Issue Quotation
          </Button>
        </div>
      </div>

      {/* Header Form Card */}
      <GlassCard title="1. Quotation Details">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-white/80">
                Customer Account <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">
                {customersResponse?.data && customersResponse.data.length > 0
                  ? 'Select Customer...'
                  : '⚠️ No customers yet — Click + New Customer'}
              </option>
              {customersResponse?.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Linked Opportunity"
            value={leadId}
            onChange={(e) => handleLeadSelect(e.target.value)}
          >
            <option value="">Select Lead (Optional)...</option>
            {leadsResponse?.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.leadNumber} - {l.customerName} {l.city ? `(${l.city})` : ''}
              </option>
            ))}
          </Select>

          <Input
            label="Quotation Date"
            type="date"
            required
            value={quotationDate}
            onChange={(e) => setQuotationDate(e.target.value)}
          />

          <Input
            label="Validity Date"
            type="date"
            required
            value={validityDate}
            onChange={(e) => setValidityDate(e.target.value)}
          />

          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </Select>

          <Input
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />

          <div className="md:col-span-2">
            <Input
              label="Delivery Terms"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
            />
          </div>
        </div>
      </GlassCard>

      {/* Line Items Table Card */}
      <GlassCard
        title="2. Quotation Line Items"
        subtitle="Add items from Master Catalog or customize specifications"
        headerAction={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={addRow}
          >
            Add Item Row
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/60 bg-white/[0.02]">
                <th className="p-3 w-48">Item Master</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-24">Unit</th>
                <th className="p-3 w-28">Price (₹)</th>
                <th className="p-3 w-20">Disc %</th>
                <th className="p-3 w-20">Tax %</th>
                <th className="p-3 w-32 text-right">Total (₹)</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="p-2">
                    <select
                      className="glass-input text-xs py-1 px-2"
                      value={row.itemId || ''}
                      onChange={(e) => handleItemSelect(idx, e.target.value)}
                    >
                      <option value="">Custom Item</option>
                      {masterItemsResponse?.data?.map((mi) => (
                        <option key={mi.id} value={mi.id}>
                          {mi.itemCode}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="glass-input text-xs py-1 px-2"
                      value={row.description}
                      onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                      placeholder="Item description or model name"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      className="glass-input text-xs py-1 px-2"
                      value={row.quantity}
                      onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="glass-input text-xs py-1 px-2"
                      value={row.unit}
                      onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                    >
                      <option value="PCS">PCS</option>
                      <option value="SET">SET</option>
                      <option value="MTR">MTR</option>
                      <option value="NOS">NOS</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      className="glass-input text-xs py-1 px-2"
                      value={row.unitPrice}
                      onChange={(e) => updateItemField(idx, 'unitPrice', Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="glass-input text-xs py-1 px-2"
                      value={row.discount}
                      onChange={(e) => updateItemField(idx, 'discount', Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      className="glass-input text-xs py-1 px-2"
                      value={row.taxRate}
                      onChange={(e) => updateItemField(idx, 'taxRate', Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                    ₹{row.lineTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={items.length <= 1}
                      className="p-1 rounded text-white/40 hover:text-rose-400 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation summary footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:max-w-md space-y-3">
            <Input
              label="Technical Specifications & Notes"
              placeholder="Sensor depth, cable length, tank dimensions, etc..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
            />
            <Input
              label="Standard Warranty & Terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="w-full md:w-80 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-white/70">
              <span>Subtotal:</span>
              <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Discount Total:</span>
              <span className="font-mono text-rose-400">-₹{totalDiscount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>GST / Taxes:</span>
              <span className="font-mono text-teal-300">+₹{totalTax.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold">
              <span className="text-white">Grand Total:</span>
              <span className="font-mono text-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Customer"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCustomerMutation.mutate();
          }}
          className="space-y-4"
        >
          <p className="text-xs text-white/60">
            Quickly register a new company or client to immediately issue this quotation.
          </p>

          {createCustomerMutation.isError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {(createCustomerMutation.error as any)?.response?.data?.error ||
                (createCustomerMutation.error as Error).message ||
                'Failed to create customer'}
            </div>
          )}

          <div className="space-y-3">
            <Input
              label="Customer / Company Name *"
              placeholder="e.g. Acme Industrial Valves Ltd"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Phone / Mobile"
                placeholder="e.g. +91 98765 43210"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. procurement@acme.com"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="City"
                placeholder="e.g. Pune, Ahmedabad"
                value={newCustCity}
                onChange={(e) => setNewCustCity(e.target.value)}
              />
              <Input
                label="State"
                placeholder="e.g. Maharashtra, Gujarat"
                value={newCustState}
                onChange={(e) => setNewCustState(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="GST Number (Optional)"
                placeholder="e.g. 27ABCDE1234F1Z5"
                value={newCustGst}
                onChange={(e) => setNewCustGst(e.target.value.toUpperCase())}
              />
              <Input
                label="Billing / Shipping Address"
                placeholder="e.g. Plot 42, MIDC Industrial Area"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createCustomerMutation.isPending}
              disabled={!newCustName.trim()}
            >
              Create & Select Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
