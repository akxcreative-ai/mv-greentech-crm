import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';
import { notificationsApi } from '../lib/api';
import type { Notification } from '../lib/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const notifications = notificationsResponse?.data || [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-400" />
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Real-time reminders for follow-ups, lead assignments, and quotation approvals
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            isLoading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => (
            <GlassCard
              key={item.id}
              padding={false}
              className={`p-4 transition-all ${
                !item.isRead ? 'border-l-4 border-l-blue-500 bg-white/[0.05]' : 'bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      !item.isRead ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm tracking-tight ${
                        !item.isRead ? 'font-semibold text-white' : 'font-medium text-white/80'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{item.message}</p>
                    <p className="text-[11px] text-white/40 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markReadMutation.mutate(item.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-teal-400/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No notifications</h3>
            <p className="text-xs text-white/50 mt-1">
              You are all caught up with your CRM alerts.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
