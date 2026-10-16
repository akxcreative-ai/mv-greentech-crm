import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Eye,
  Download,
} from 'lucide-react';
import { quotationsApi } from '../lib/api';
import type { Quotation, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Select } from '../components/ui/Select';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: quotationsResponse, isLoading } = useQuery({
    queryKey: ['quotations', { page, search, status: statusFilter }],
    queryFn: () =>
      quotationsApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
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
                setSearch(val);
                setPage(1);
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
          onRowClick={(q) => navigate(`/quotations/${q.id}`)}
          emptyMessage="No quotations generated yet."
        />
      </GlassCard>
    </div>
  );
};
