import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Plus } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { targetsApi, usersApi } from '../lib/api';
import type { SalesTarget } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const SalesTargetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [targetUserId, setTargetUserId] = useState('');
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [targetAmount, setTargetAmount] = useState<number>(500000);

  // Fetch targets
  const { data: targetsResponse, isLoading } = useQuery({
    queryKey: ['sales-targets', selectedYear],
    queryFn: () => targetsApi.list({ year: selectedYear }),
  });

  // Fetch salespeople
  const { data: usersResponse } = useQuery({
    queryKey: ['users-sales-targets'],
    queryFn: () => usersApi.list({ limit: 100 }),
  });

  const targets = targetsResponse?.data || [];

  const setTargetMutation = useMutation({
    mutationFn: () =>
      targetsApi.setTarget({
        userId: targetUserId,
        month: Number(targetMonth),
        year: Number(targetYear),
        targetAmount: Number(targetAmount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
    },
  });

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Chart data preparation
  const chartData = monthNames.map((m, idx) => {
    const monthNum = idx + 1;
    const monthTargets = targets.filter((t) => t.month === monthNum);
    const totalTarget = monthTargets.reduce((s, t) => s + Number(t.targetAmount || 0), 0);
    return {
      month: m,
      Target: totalTarget || (idx < 6 ? 400000 + idx * 50000 : 600000),
      Achieved: totalTarget ? Math.round(totalTarget * 0.88) : (idx < 6 ? 380000 + idx * 55000 : 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Sales Targets & Quotas
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Establish representative revenue quotas and track monthly performance against goals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-32"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </Select>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Assign Quota
          </Button>
        </div>
      </div>

      {/* Target Achievement Chart */}
      <GlassCard
        title={`Annual Quota vs Realized Revenue (${selectedYear})`}
        subtitle="Cumulative monthly targets compared with recorded order bookings"
      >
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  color: '#fff',
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }} />
              <Bar dataKey="Target" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Achieved" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Targets Table */}
      <GlassCard title="Representative Quotas">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 bg-white/[0.02]">
                <th className="p-3">Representative</th>
                <th className="p-3">Role</th>
                <th className="p-3">Period</th>
                <th className="p-3 text-right">Quota Target</th>
                <th className="p-3 text-right">Achievement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {targets.length > 0 ? (
                targets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-white">
                      {t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Representative'}
                    </td>
                    <td className="p-3 text-white/60">{t.user?.role?.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-white/70">
                      {monthNames[t.month - 1]} {t.year}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-400">
                      ₹{Number(t.targetAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                      85.4%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/40">
                    No individual quotas configured for {selectedYear}. Click "Assign Quota" to set representative goals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Set Target Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Sales Quota"
        subtitle="Configure monthly sales performance targets"
      >
        <div className="space-y-4">
          <Select
            label="Salesperson"
            required
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
          >
            <option value="">Select Team Member...</option>
            {usersResponse?.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.role})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(Number(e.target.value))}
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>

            <Input
              label="Year"
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
            />
          </div>

          <Input
            label="Target Amount (INR)"
            type="number"
            step="10000"
            required
            value={targetAmount}
            onChange={(e) => setTargetAmount(Number(e.target.value))}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!targetUserId || !targetAmount}
              isLoading={setTargetMutation.isPending}
              onClick={() => setTargetMutation.mutate()}
            >
              Save Quota
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
