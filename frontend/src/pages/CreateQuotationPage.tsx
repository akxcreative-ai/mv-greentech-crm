import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Save,
  Send,
} from 'lucide-react';
import { quotationsApi, customersApi, leadsApi, itemsApi } from '../lib/api';
import type { QuotationItem, QuotationStatus } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

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
          <Select
            label="Customer Account"
            required
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
            label="Linked Opportunity"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
          >
            <option value="">Select Lead (Optional)...</option>
            {leadsResponse?.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.leadNumber} - {l.customerName}
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
    </div>
  );
};
