import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog, Plus, Pencil, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { usersApi } from '../lib/api';
import type { User, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  role: z.enum(['DIRECTOR', 'SALES_HEAD', 'SALESPERSON', 'ADMINISTRATOR']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => usersApi.list({ page, limit: 10, search: search || undefined }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'SALESPERSON',
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormError(null);
    reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'SALESPERSON',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      if (editingUser) {
        return usersApi.update(editingUser.id, data);
      }
      return usersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to save user. Please verify all fields.';
      setFormError(msg);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to toggle user status');
    },
  });

  const columns: Column<User>[] = [
    {
      header: 'Name',
      accessorKey: 'firstName',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
            {u.firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-[11px] text-white/40">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      render: (u) => <Badge status={u.role} size="sm" />,
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      render: (u) => <span className="text-xs text-white/70">{u.phone || '—'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      render: (u) => (
        <Badge status={u.isActive ? 'ACTIVE' : 'DISCONTINUED'} size="sm" dot />
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      render: (u) => (
        <span className="text-xs text-white/50">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(u)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-blue-400 transition-colors"
            title="Edit User"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStatusMutation.mutate(u.id)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={u.isActive ? 'Deactivate User' : 'Activate User'}
          >
            {u.isActive ? (
              <UserX className="w-4 h-4 text-rose-400" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            )}
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
            <UserCog className="w-6 h-6 text-purple-400" />
            User Management & Access Control
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Manage sales directors, representatives, quotas, and permission roles
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Add New User
        </Button>
      </div>

      {/* Search Bar */}
      <GlassCard padding={false} className="p-4">
        <SearchBar
          placeholder="Search by user name or email..."
          value={search}
          onSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={usersResponse?.data || []}
          isLoading={isLoading}
          pagination={usersResponse?.pagination}
          onPageChange={setPage}
          emptyMessage="No users found."
        />
      </GlassCard>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.firstName} ${editingUser.lastName}` : 'Add CRM User'}
        subtitle="Configure profile and assign role"
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mobile Phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Select label="Role / Permission Level" {...register('role')}>
            <option value="SALESPERSON">Salesperson (Direct field rep)</option>
            <option value="SALES_HEAD">Sales Head (Manager & Team Supervisor)</option>
            <option value="DIRECTOR">Director (Executive Access)</option>
            <option value="ADMINISTRATOR">Administrator (Full System Control)</option>
          </Select>

          {!editingUser && (
            <Input
              label="Initial Password"
              type="password"
              placeholder="Minimum 6 characters"
              required
              error={errors.password?.message}
              {...register('password')}
            />
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
