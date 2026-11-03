import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation, RefreshCw, Radio, Battery, Compass, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { trackingApi } from '../lib/api';
import type { LiveTrackUser } from '../lib/types';
import { LiveTrackingMap } from '../components/map/LiveTrackingMap';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const LiveTrackingPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<LiveTrackUser | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  // Poll live positions every 10 seconds for real-time tracking
  const {
    data: liveUsersResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['live-tracking-users'],
    queryFn: () => trackingApi.getLive(),
    refetchInterval: 10000,
  });

  const users = liveUsersResponse?.data || [];

  // Fetch route history for selected user
  const { data: routeResponse, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['route-history', selectedUser?.id],
    queryFn: () => trackingApi.getHistory(selectedUser!.id),
    enabled: Boolean(selectedUser && showRoute),
  });

  const routeHistory = routeResponse?.data || [];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              OpenStreetMap GPS Radar
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Navigation className="w-6 h-6 text-blue-400" />
            Live Field & Sales Team Tracking
          </h1>
          <p className="text-xs text-white/50">
            Real-time GPS direction arrows, moving speed, client visit pins, and daily travel routes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh Radar'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Team List & Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Sales Team Roster */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Active Field Staff ({users.length})
            </span>
            <span className="text-[11px] text-white/40">Auto-sync 10s</span>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-white/40 text-xs">Loading live radar positions...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-xs">No active sales personnel registered.</div>
            ) : (
              users.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                const hasLocation = Boolean(u.lastLatitude && u.lastLongitude);
                const isMoving = (u.lastSpeed || 0) > 3;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setShowRoute(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-950/40'
                        : 'bg-slate-900/40 hover:bg-slate-900/70 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 border border-white/10 text-white/80'
                          }`}
                        >
                          {u.firstName?.[0]}
                          {u.lastName?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-white/40">{u.role}</div>
                        </div>
                      </div>

                      {/* Moving / Idle status badge */}
                      <div>
                        {hasLocation ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isMoving
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isMoving ? '🚗 Moving' : '📍 Stationary'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/40 border border-white/10">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats & Coordinates row */}
                    {hasLocation && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <Compass className="w-3.5 h-3.5 text-blue-400" />
                          <span>Speed: <strong>{u.lastSpeed || 0} km/h</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70 justify-end">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            {u.lastLocationAt
                              ? new Date(u.lastLocationAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action button if selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2 flex items-center gap-2">
                        <Button
                          variant={showRoute ? 'primary' : 'secondary'}
                          size="sm"
                          className="w-full text-xs py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRoute(!showRoute);
                          }}
                        >
                          {showRoute ? "Hide Today's Route" : "Show Today's Route 🗺️"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Map Container */}
        <div className="lg:col-span-8 h-[640px]">
          <LiveTrackingMap
            users={users}
            selectedUser={selectedUser}
            routeHistory={routeHistory}
            onSelectUser={(u) => {
              setSelectedUser(u);
              setShowRoute(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};
