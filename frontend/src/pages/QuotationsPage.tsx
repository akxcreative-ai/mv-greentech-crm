import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Eye,
  Download,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { quotationsApi } from '../lib/api';
import type { Quotation, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [quotationForEmail, setQuotationForEmail] = useState<Quotation | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openEmailModal = (q: Quotation) => {
    setQuotationForEmail(q);
    setRecipientEmail(q.customer?.contacts?.find((c: any) => c.isPrimary && c.email)?.email || q.customer?.contacts?.[0]?.email || '');
    setEmailSubject(`Commercial Quotation #${q.quotationNumber} - MV GREENTECH PVT LTD`);
    setEmailMessage('Dear Customer,\n\nPlease find attached our official commercial quotation for your requirement. Let us know if you need any technical clarifications.\n\nRegards,\nMV GREENTECH PVT LTD');
    setEmailFeedback(null);
    setIsEmailModalOpen(true);
  };

  const sendEmailMutation = useMutation({
    mutationFn: () => {
      if (!quotationForEmail) throw new Error('No quotation selected');
      return quotationsApi.sendEmail(quotationForEmail.id, {
        recipientEmail,
        customSubject: emailSubject,
        customMessage: emailMessage,
      });
    },
    onSuccess: (res: any) => {
      setEmailFeedback({ type: 'success', message: res.message || 'Quotation successfully emailed!' });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setQuotationForEmail(null);
      }, 2000);
    },
    onError: (err: any) => {
      setEmailFeedback({ type: 'error', message: err.response?.data?.error || err.message || 'Failed to send email.' });
    },
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: quotationsResponse, isLoading } = useQuery({
    queryKey: ['quotations', { page, limit, search, status: statusFilter }],
    queryFn: () =>
      quotationsApi.list({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const handleDownloadPdf = async (id: string, quotationNumber: string) => {
    try {
      const blob = await quotationsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotationNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download quotation PDF.');
    }
  };

  const columns: Column<Quotation>[] = [
    {
      header: 'Quotation #',
      accessorKey: 'quotationNumber',
      render: (q) => (
        <div>
          <span className="font-mono text-xs font-semibold text-teal-400">
            {q.quotationNumber}
          </span>
          <span className="text-[11px] text-white/40 ml-1.5">(Rev {q.revision})</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
      render: (q) => (
        <div>
          <p className="text-sm font-semibold text-white">{q.customer?.name || '—'}</p>
          {q.lead && (
            <p className="text-[11px] text-white/40 font-mono">Ref: {q.lead.leadNumber}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'quotationDate',
      render: (q) => (
        <span className="text-xs text-white/70">
          {new Date(q.quotationDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Validity',
      accessorKey: 'validityDate',
      render: (q) => (
        <span className="text-xs text-white/70">
          {new Date(q.validityDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessorKey: 'totalAmount',
      render: (q) => (
        <span className="text-xs font-bold text-emerald-400">
          ₹{Number(q.totalAmount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (q) => <Badge status={q.status} size="sm" dot />,
    },
    {
      header: 'Owner',
      accessorKey: 'user',
      render: (q) => (
        <span className="text-xs text-white/80">
          {q.user ? `${q.user.firstName} ${q.user.lastName}` : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/quotations/${q.id}`)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadPdf(q.id, q.quotationNumber)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-teal-400 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEmailModal(q)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-emerald-400 transition-colors"
            title="Email to Customer"
          >
            <Mail className="w-4 h-4" />
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
            <FileText className="w-6 h-6 text-teal-400" />
            Quotations & Proposals
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Generate, revise, and track customer commercial and technical price quotes
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/quotations/create')}
        >
          Create Quotation
        </Button>
      </div>

      {/* Filter Row */}
      <GlassCard padding={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchBar
              placeholder="Search by Quotation#, Customer, or Lead..."
              value={search}
              onSearch={(val) => {
                if (val !== search) {
                  setSearch(val);
                  setPage(1);
                }
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Quotation Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="APPROVED">Approved</option>
            <option value="LOST">Lost</option>
            <option value="EXPIRED">Expired</option>
            <option value="CONVERTED">Converted</option>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={quotationsResponse?.data || []}
          isLoading={isLoading}
          pagination={quotationsResponse?.pagination}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100, 200, 500]}
          exportTitle="Quotations Register"
          onRowClick={(q) => navigate(`/quotations/${q.id}`)}
          emptyMessage="No quotations generated yet."
        />
      </GlassCard>
      {/* EMAIL QUOTATION MODAL */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title={`Email Quotation ${quotationForEmail?.quotationNumber || ''}`}
      >
        <div className="space-y-4 text-slate-800">
          {emailFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                emailFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {emailFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{emailFeedback.message}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <p><strong>Customer:</strong> {quotationForEmail?.customer?.name}</p>
            <p><strong>Sender:</strong> sales@mvgreentechcrm.in (GoDaddy Verified SMTP)</p>
            <p><strong>Attachment:</strong> Quotation-{quotationForEmail?.quotationNumber}.pdf (Automatic)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Email *
            </label>
            <Input
              placeholder="e.g. procurement@customercompany.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject *
            </label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Message / Note (Optional)
            </label>
            <textarea
              rows={4}
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={sendEmailMutation.isPending}
              disabled={!recipientEmail || !recipientEmail.includes('@')}
              onClick={() => sendEmailMutation.mutate()}
            >
              Send PDF Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
