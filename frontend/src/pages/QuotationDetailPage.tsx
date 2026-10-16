import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { quotationsApi } from '../lib/api';
import type { QuotationStatus } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');

  // Fetch quotation
  const { data: quotationResponse, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.get(id!),
    enabled: !!id,
  });

  const quotation = quotationResponse?.data;

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: QuotationStatus; reason?: string }) =>
      quotationsApi.updateStatus(id!, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setIsLostModalOpen(false);
    },
  });

  // Convert to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: () => quotationsApi.convertToOrder(id!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (res.data?.id) {
        navigate('/orders');
      }
    },
  });

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    try {
      const blob = await quotationsApi.downloadPdf(quotation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.quotationNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download quotation PDF.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Quotation not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/quotations')}>
          Back to Quotations
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
            onClick={() => navigate('/quotations')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
                {quotation.quotationNumber}
              </h1>
              <Badge status={quotation.status} />
              <span className="text-xs text-white/40">Rev {quotation.revision}</span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Customer: <span className="text-white font-medium">{quotation.customer?.name}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>

          {quotation.status !== 'CONVERTED' && quotation.status !== 'LOST' && (
            <>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => setIsLostModalOpen(true)}
              >
                Mark Lost
              </Button>
              <Button
                variant="success"
                size="sm"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                isLoading={convertToOrderMutation.isPending}
                onClick={() => {
                  if (window.confirm('Convert this quotation into a Confirmed Order?')) {
                    convertToOrderMutation.mutate();
                  }
                }}
              >
                Convert to Order
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding={false} className="p-4">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
            Quotation Date
          </p>
          <p className="text-base font-semibold text-white mt-1">
            {new Date(quotation.quotationDate).toLocaleDateString()}
          </p>
        </GlassCard>

        <GlassCard padding={false} className="p-4">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
            Valid Until
          </p>
          <p className="text-base font-semibold text-amber-400 mt-1">
            {new Date(quotation.validityDate).toLocaleDateString()}
          </p>
        </GlassCard>

        <GlassCard padding={false} className="p-4">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
            Payment Terms
          </p>
          <p className="text-xs font-medium text-white/90 mt-1 truncate">
            {quotation.paymentTerms || 'Standard Terms'}
          </p>
        </GlassCard>

        <GlassCard padding={false} className="p-4">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
            Representative
          </p>
          <p className="text-sm font-semibold text-white mt-1">
            {quotation.user ? `${quotation.user.firstName} ${quotation.user.lastName}` : 'Direct'}
          </p>
        </GlassCard>
      </div>

      {/* Line Items Table */}
      <GlassCard title="Quotation Items Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 bg-white/[0.02]">
                <th className="p-3">#</th>
                <th className="p-3">Description / Specification</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3">Unit</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Disc %</th>
                <th className="p-3 text-right">GST %</th>
                <th className="p-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quotation.items && quotation.items.length > 0 ? (
                quotation.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-white/40">{idx + 1}</td>
                    <td className="p-3 font-medium text-white max-w-sm">
                      <p>{item.description}</p>
                      {item.item && (
                        <p className="text-[11px] text-blue-400 font-mono mt-0.5">
                          SKU: {item.item.itemCode}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right text-white font-mono">{Number(item.quantity)}</td>
                    <td className="p-3 text-white/70">{item.unit || 'PCS'}</td>
                    <td className="p-3 text-right font-mono text-white/80">
                      ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-300">
                      {Number(item.discount)}%
                    </td>
                    <td className="p-3 text-right font-mono text-teal-300">
                      {Number(item.taxRate)}%
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                      ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-white/40">
                    No items in this quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Totals */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2 text-xs text-white/60 max-w-md">
            {quotation.deliveryTerms && (
              <p>
                <span className="font-semibold text-white/80">Delivery:</span>{' '}
                {quotation.deliveryTerms}
              </p>
            )}
            {quotation.notes && (
              <p>
                <span className="font-semibold text-white/80">Terms & Warranty:</span>{' '}
                {quotation.notes}
              </p>
            )}
            {quotation.specifications && (
              <p>
                <span className="font-semibold text-white/80">Specifications:</span>{' '}
                {quotation.specifications}
              </p>
            )}
          </div>

          <div className="w-full md:w-80 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-white/70">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                ₹{Number(quotation.subtotal).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Discount:</span>
              <span className="font-mono text-rose-400">
                -₹{Number(quotation.discountAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>GST / Taxes:</span>
              <span className="font-mono text-teal-300">
                +₹{Number(quotation.taxAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold">
              <span className="text-white">Total Amount:</span>
              <span className="font-mono text-emerald-400">
                ₹{Number(quotation.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lost Reason Modal */}
      <Modal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        title="Mark Quotation as Lost"
        subtitle="Record reason for competitor win or client drop"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Loss"
            placeholder="e.g. Price too high, competitor selected, project shelved"
            required
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsLostModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!lostReason.trim()}
              isLoading={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  status: 'LOST',
                  reason: lostReason,
                })
              }
            >
              Confirm Lost
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
