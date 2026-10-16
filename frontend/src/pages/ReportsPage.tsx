import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  Target,
  Award,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type ReportType = 'owner-enquiry' | 'won-value' | 'lead-conversion' | 'team-performance';

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('owner-enquiry');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Sample data for the reports
  const ownerEnquiryData = [
    { name: 'Rajesh Sharma', enquiryValue: 4200000, leads: 34 },
    { name: 'Amit Patel', enquiryValue: 2850000, leads: 26 },
    { name: 'Sunita Verma', enquiryValue: 2100000, leads: 21 },
    { name: 'Vikas Kumar', enquiryValue: 1650000, leads: 18 },
  ];

  const wonValueData = [
    { month: 'Jan', wonValue: 820000, orders: 12 },
    { month: 'Feb', wonValue: 1150000, orders: 16 },
    { month: 'Mar', wonValue: 1420000, orders: 20 },
    { month: 'Apr', wonValue: 1390000, orders: 18 },
    { month: 'May', wonValue: 1740000, orders: 24 },
    { month: 'Jun', wonValue: 1980000, orders: 28 },
  ];

  const conversionFunnelData = [
    { stage: 'General Enquiries', count: 120, fill: '#38BDF8' },
    { stage: 'Market Qualified', count: 86, fill: '#3B82F6' },
    { stage: 'Quote Submitted', count: 54, fill: '#F59E0B' },
    { stage: 'Won Orders', count: 32, fill: '#10B981' },
  ];

  const teamPerformanceData = [
    { name: 'Rajesh Sharma', target: 2000000, achieved: 1840000, rate: '92%' },
    { name: 'Amit Patel', target: 1500000, achieved: 1390000, rate: '93%' },
    { name: 'Sunita Verma', target: 1200000, achieved: 1100000, rate: '91%' },
    { name: 'Vikas Kumar', target: 1000000, achieved: 780000, rate: '78%' },
  ];

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (selectedReport === 'owner-enquiry') {
      csvContent += 'Name,Enquiry Value,Leads\n';
      ownerEnquiryData.forEach((row) => {
        csvContent += `"${row.name}",${row.enquiryValue},${row.leads}\n`;
      });
    } else if (selectedReport === 'won-value') {
      csvContent += 'Month,Won Value,Orders\n';
      wonValueData.forEach((row) => {
        csvContent += `"${row.month}",${row.wonValue},${row.orders}\n`;
      });
    } else if (selectedReport === 'lead-conversion') {
      csvContent += 'Stage,Count\n';
      conversionFunnelData.forEach((row) => {
        csvContent += `"${row.stage}",${row.count}\n`;
      });
    } else {
      csvContent += 'Representative,Target,Achieved,Rate\n';
      teamPerformanceData.forEach((row) => {
        csvContent += `"${row.name}",${row.target},${row.achieved},"${row.rate}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Analytics & Reports
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Sales velocity, representative pipelines, conversion metrics, and revenue summaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export Report CSV
          </Button>
        </div>
      </div>

      {/* Date Filter & Preset Controls */}
      <GlassCard padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          <p className="text-xs text-white/40">Showing records for selected date range</p>
        </div>
      </GlassCard>

      {/* 4 Report Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedReport('owner-enquiry')}
          className={`glass-card p-4 cursor-pointer transition-all border-l-4 ${
            selectedReport === 'owner-enquiry'
              ? 'border-l-blue-500 bg-white/[0.08]'
              : 'border-l-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Enquiry by Owner</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Pipeline volume & value</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedReport('won-value')}
          className={`glass-card p-4 cursor-pointer transition-all border-l-4 ${
            selectedReport === 'won-value'
              ? 'border-l-emerald-500 bg-white/[0.08]'
              : 'border-l-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Won Order Value</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Booked revenue trends</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedReport('lead-conversion')}
          className={`glass-card p-4 cursor-pointer transition-all border-l-4 ${
            selectedReport === 'lead-conversion'
              ? 'border-l-amber-500 bg-white/[0.08]'
              : 'border-l-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Conversion Funnel</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Enquiry-to-order ratio</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedReport('team-performance')}
          className={`glass-card p-4 cursor-pointer transition-all border-l-4 ${
            selectedReport === 'team-performance'
              ? 'border-l-purple-500 bg-white/[0.08]'
              : 'border-l-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Team Performance</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Quota vs realization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Report Visualization & Table */}
      {selectedReport === 'owner-enquiry' && (
        <div className="space-y-6">
          <GlassCard title="Pipeline Value by Account Owner" subtitle="Active enquiries distribution">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ownerEnquiryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={12}
                    tickFormatter={(v) => `₹${v / 100000}L`}
                  />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Enquiry Value']}
                  />
                  <Bar dataKey="enquiryValue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Breakdown by Representative">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="pb-3">Representative</th>
                  <th className="pb-3 text-center">Active Leads</th>
                  <th className="pb-3 text-right">Total Pipeline Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ownerEnquiryData.map((row) => (
                  <tr key={row.name}>
                    <td className="py-3 font-semibold text-white">{row.name}</td>
                    <td className="py-3 text-center text-white/80">{row.leads}</td>
                    <td className="py-3 text-right font-mono font-semibold text-blue-400">
                      ₹{row.enquiryValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      )}

      {selectedReport === 'won-value' && (
        <div className="space-y-6">
          <GlassCard title="Monthly Won Order Revenue" subtitle="Completed contracts and orders">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wonValueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={12}
                    tickFormatter={(v) => `₹${v / 100000}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Won Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="wonValue"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedReport === 'lead-conversion' && (
        <div className="space-y-6">
          <GlassCard title="Pipeline Stage Conversion Funnel">
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionFunnelData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="stage" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedReport === 'team-performance' && (
        <GlassCard title="Representative Quota Realization">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="pb-3">Representative</th>
                <th className="pb-3 text-right">Target Quota</th>
                <th className="pb-3 text-right">Achieved Value</th>
                <th className="pb-3 text-right">Realization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamPerformanceData.map((row) => (
                <tr key={row.name}>
                  <td className="py-3 font-semibold text-white">{row.name}</td>
                  <td className="py-3 text-right font-mono text-white/70">
                    ₹{row.target.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-emerald-400">
                    ₹{row.achieved.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-right font-bold text-white">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
};
