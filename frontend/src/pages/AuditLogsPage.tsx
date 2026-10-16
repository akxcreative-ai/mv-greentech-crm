import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User as UserIcon,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { auditLogsApi } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any | null>(null);

  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['audit-logs', page, selectedEntity, selectedAction],
    queryFn: () =>
      auditLogsApi.list({
        page,
        limit: 15,
        entity: selectedEntity !== 'ALL' ? selectedEntity : undefined,
        action: selectedAction !== 'ALL' ? selectedAction : undefined,
      }),
  });

  const logs = logsResponse?.data || [];
  const pagination = logsResponse?.pagination || { page: 1, limit: 15, total: logs.length, totalPages: 1 };

  // Filter logs locally if search query is provided
  const filteredLogs = logs.filter((log: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.toLowerCase();
    const action = (log.action || '').toLowerCase();
    const entity = (log.entity || '').toLowerCase();
    const entityId = (log.entityId || '').toLowerCase();
    const ip = (log.ipAddress || '').toLowerCase();
    return userName.includes(term) || action.includes(term) || entity.includes(term) || entityId.includes(term) || ip.includes(term);
  });

  const exportLogsCsv = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Email', 'Action', 'Entity', 'EntityID', 'IP Address'];
    const rows = filteredLogs.map((l: any) => [
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.user?.firstName || 'System'} ${l.user?.lastName || ''}"`,
      `"${l.user?.role || 'N/A'}"`,
      `"${l.user?.email || 'N/A'}"`,
      `"${l.action || ''}"`,
      `"${l.entity || ''}"`,
      `"${l.entityId || ''}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('WON') || action.includes('CONVERTED')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (action.includes('UPDATE') || action.includes('ASSIGN')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('LOST')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    if (action.includes('LOGIN') || action.includes('OTP')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Trail & Logs</h1>
              <p className="text-xs text-white/60">
                Immutable record of administrative actions, authentication attempts, pipeline changes, and data mutations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={exportLogsCsv}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 border border-white/10 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Search by user, action, entity ID, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-white/40" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setPage(1);
            }}
            className="glass-input text-xs py-2 px-3 rounded-xl bg-[#0B1220]/80 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL" className="bg-[#0B1220]">All Entities</option>
            <option value="User" className="bg-[#0B1220]">User & Auth</option>
            <option value="Lead" className="bg-[#0B1220]">Lead Pipeline</option>
            <option value="Customer" className="bg-[#0B1220]">Customer Directory</option>
            <option value="Quotation" className="bg-[#0B1220]">Quotations</option>
            <option value="Order" className="bg-[#0B1220]">Orders</option>
            <option value="Item" className="bg-[#0B1220]">Item Master</option>
            <option value="Setting" className="bg-[#0B1220]">System Settings</option>
          </select>
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="glass-input text-xs py-2 px-3 rounded-xl bg-[#0B1220]/80 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL" className="bg-[#0B1220]">All Actions</option>
            <option value="LOGIN" className="bg-[#0B1220]">LOGIN</option>
            <option value="LEAD_CREATED" className="bg-[#0B1220]">LEAD_CREATED</option>
            <option value="LEAD_CONVERTED" className="bg-[#0B1220]">LEAD_CONVERTED</option>
            <option value="QUOTATION_CREATED" className="bg-[#0B1220]">QUOTATION_CREATED</option>
            <option value="QUOTATION_CONVERTED" className="bg-[#0B1220]">QUOTATION_CONVERTED</option>
            <option value="ORDER_CREATED" className="bg-[#0B1220]">ORDER_CREATED</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/50">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading audit logs...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-white/60 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-400" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/30">
                            {log.user?.firstName ? log.user.firstName[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {log.user?.firstName || 'System'} {log.user?.lastName || ''}
                            </p>
                            <p className="text-[10px] text-white/50">{log.user?.email || 'system@mvgreentech.com'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{log.entity}</div>
                        {log.entityId && (
                          <div className="font-mono text-[10px] text-teal-400/80">{log.entityId}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-white/50">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogDetails(log)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>View Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <div>
            Showing {filteredLogs.length} of {pagination.total} audit events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-white">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedLogDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full p-6 border border-white/15 relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="text-white/50 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-white/40 block">Action</span>
                  <span className="font-semibold text-white">{selectedLogDetails.action}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Entity</span>
                  <span className="font-semibold text-teal-400">
                    {selectedLogDetails.entity} ({selectedLogDetails.entityId})
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Actor</span>
                  <span className="font-semibold text-white">
                    {selectedLogDetails.user?.firstName} {selectedLogDetails.user?.lastName} (
                    {selectedLogDetails.user?.role})
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Timestamp</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedLogDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-white/60 block mb-1 font-semibold">Changes & Payload JSON</span>
                <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-emerald-400 font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLogDetails.changes, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 text-right">
              <Button variant="secondary" onClick={() => setSelectedLogDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
