import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { ordersApi } from '../lib/api';
import type { Order, Column, OrderStatus } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', { page, limit, search, status: statusFilter }],
    queryFn: () =>
      ordersApi.list({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTargetOrder(null);
    },
  });

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      accessorKey: 'orderNumber',
      render: (o) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {o.orderNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
      render: (o) => (
        <div>
          <p className="text-sm font-semibold text-white">{o.customer?.name || '—'}</p>
          {o.lead && (
            <p className="text-[11px] text-white/40 font-mono">Lead: {o.lead.leadNumber}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'orderDate',
      render: (o) => (
        <span className="text-xs text-white/70">
          {new Date(o.orderDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Total Value',
      accessorKey: 'totalAmount',
      render: (o) => (
        <span className="text-xs font-bold text-emerald-400">
          ₹{Number(o.totalAmount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Fulfillment Status',
      accessorKey: 'status',
      render: (o) => <Badge status={o.status} size="sm" dot />,
    },
    {
      header: 'Terms & Notes',
      render: (o) => (
        <span className="text-xs text-white/60 truncate max-w-xs block">
          {o.paymentTerms || o.notes || 'Standard'}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (o) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setTargetOrder(o);
            setNewStatus(o.status);
          }}
        >
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            Purchase Orders & Fulfillment
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Confirmed customer orders, factory production status, and shipments
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <GlassCard padding={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchBar
              placeholder="Search by Order#, Customer Name..."
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
            <option value="">All Fulfillment Stages</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={ordersResponse?.data || []}
          isLoading={isLoading}
          pagination={ordersResponse?.pagination}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100, 200, 500]}
          exportTitle="Sales Orders"
          emptyMessage="No orders found."
        />
      </GlassCard>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!targetOrder}
        onClose={() => setTargetOrder(null)}
        title="Update Order Status"
        subtitle={`Order ${targetOrder?.orderNumber}`}
      >
        <div className="space-y-4">
          <Select
            label="Fulfillment Stage"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
          >
            <option value="CONFIRMED">Confirmed (Pending Factory Production)</option>
            <option value="IN_PRODUCTION">In Production / Assembly</option>
            <option value="SHIPPED">Shipped / In Transit</option>
            <option value="DELIVERED">Delivered & Accepted</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setTargetOrder(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={updateStatusMutation.isPending}
              onClick={() => {
                if (targetOrder) {
                  updateStatusMutation.mutate({
                    id: targetOrder.id,
                    status: newStatus,
                  });
                }
              }}
            >
              Save Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
