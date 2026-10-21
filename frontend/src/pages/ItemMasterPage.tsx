import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Upload,
  Pencil,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';
import { itemsApi } from '../lib/api';
import type { Item, Column } from '../lib/types';
import { DataTable } from '../components/ui/DataTable';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const itemSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().min(2, 'Description is required'),
  unit: z.string().optional(),
  standardCost: z.coerce.number().optional(),
  standardPrice: z.coerce.number().optional(),
  currency: z.string().optional(),
  ppq: z.string().optional(),
  currentStock: z.coerce.number().optional(),
  leadTimeDays: z.coerce.number().optional(),
  supplierCode: z.string().optional(),
  supplierCurrency: z.string().optional(),
  supplierCost: z.coerce.number().optional(),
  status: z.enum(['ACTIVE', 'DISCONTINUED', 'SUPERSEDED']).optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export const ItemMasterPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Import Preview & Summary state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewDuplicates, setPreviewDuplicates] = useState<string[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Fetch items
  const { data: itemsResponse, isLoading } = useQuery({
    queryKey: ['items', { page, search }],
    queryFn: () => itemsApi.list({ page, limit: 10, search: search || undefined }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      unit: 'PCS',
      currency: 'INR',
      status: 'ACTIVE',
      currentStock: 0,
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      itemCode: '',
      description: '',
      unit: 'PCS',
      standardCost: 0,
      standardPrice: 0,
      currency: 'INR',
      ppq: '',
      currentStock: 0,
      leadTimeDays: 7,
      supplierCode: '',
      supplierCurrency: 'INR',
      supplierCost: 0,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    reset({
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit || 'PCS',
      standardCost: Number(item.standardCost) || 0,
      standardPrice: Number(item.standardPrice) || 0,
      currency: item.currency || 'INR',
      ppq: item.ppq || '',
      currentStock: item.currentStock || 0,
      leadTimeDays: item.leadTimeDays || 7,
      supplierCode: item.supplierCode || '',
      supplierCurrency: item.supplierCurrency || 'INR',
      supplierCost: Number(item.supplierCost) || 0,
      status: item.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: ItemFormData) => {
      if (editingItem) {
        return itemsApi.update(editingItem.id, data);
      }
      return itemsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Download official CSV template
  const downloadCsvTemplate = () => {
    const csvContent =
      ',,,,,,,,,,,,,\r\n' +
      ',S.no,Product code,Product Description,Picture,Supplier,BOM,Standard Cost,Currency,Unit,Landed cost,Standard Price,Lead Time,Status\r\n' +
      ',,,,,KJT,Supplier Name,,,,,,,Part no is (Active)\r\n' +
      ',,,,,,Material code,,,,,,,(Obsolete)\r\n' +
      ',,,,,,Material Description,,,,,,,(Superceded)\r\n' +
      ',,,,,,Quantity per piece,,,,,,,\r\n' +
      ',,,,,,Unit,,,,,,,\r\n' +
      ',,,,,,Cost/ Unit,,,,,,,\r\n' +
      ',1,WLI-SNS-001,Water Level Magnetic Float Sensor (SS316),,KJT,Supplier Name,1200,INR,PCS,1350,2450,5,Active\r\n' +
      ',2,WLI-DSP-002,Digital LED Tank Indicator Display 4-20mA,,KJT,Material code,2500,INR,PCS,2700,4800,7,Active\r\n' +
      ',3,WLI-VAL-003,Automatic Solenoid Inlet Valve 1-inch,,KJT,Material Description,850,INR,PCS,950,1750,3,Active\r\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MV_GREENTECH_Item_Master_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV and display Preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('Selected CSV is empty or missing data rows.');
        return;
      }

      // Find the header row containing "Product code" or "Item Code"
      let headerLineIdx = lines.findIndex((l) => {
        const lower = l.toLowerCase();
        return lower.includes('product code') || lower.includes('item code');
      });

      if (headerLineIdx === -1) {
        headerLineIdx = 0;
      }

      const headers = lines[headerLineIdx].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const getIndex = (names: string[]) => headers.findIndex((h) => names.some((n) => h === n || h.includes(n)));

      const codeIdx = getIndex(['product code', 'item code', 'itemcode', 'code', 'part']);
      const descIdx = getIndex(['product description', 'description', 'desc', 'name']);
      const supIdx = getIndex(['supplier', 'vendor']);
      const bomIdx = getIndex(['bom', 'ppq']);
      const costIdx = getIndex(['standard cost', 'cost']);
      const currIdx = getIndex(['currency']);
      const unitIdx = getIndex(['unit', 'uom']);
      const landedIdx = getIndex(['landed cost', 'landed']);
      const priceIdx = getIndex(['standard price', 'price', 'rate']);
      const leadIdx = getIndex(['lead time', 'lead']);
      const statusIdx = getIndex(['status']);

      const existingCodes = new Set((itemsResponse?.data || []).map((i) => i.itemCode.toLowerCase().trim()));
      const seenInCsv = new Set<string>();
      const duplicatesFound: string[] = [];
      const parsed: any[] = [];

      for (let r = headerLineIdx + 1; r < lines.length; r++) {
        const line = lines[r];
        const values: string[] = [];
        let inQuote = false;
        let cur = '';
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') {
            inQuote = !inQuote;
          } else if (c === ',' && !inQuote) {
            values.push(cur.trim().replace(/^"|"$/g, ''));
            cur = '';
          } else {
            cur += c;
          }
        }
        values.push(cur.trim().replace(/^"|"$/g, ''));

        const rawCode = (codeIdx >= 0 && values[codeIdx]) ? values[codeIdx].trim() : '';

        // Skip blank rows or legend/template instruction rows
        if (!rawCode || rawCode.toLowerCase().includes('part no is') || rawCode.toLowerCase().includes('supplier name') || rawCode.toLowerCase().includes('material code')) {
          continue;
        }

        const normalized = rawCode.toLowerCase();
        if (existingCodes.has(normalized) || seenInCsv.has(normalized)) {
          duplicatesFound.push(rawCode);
        } else {
          seenInCsv.add(normalized);
        }

        const rawStatus = (statusIdx >= 0 && values[statusIdx] ? values[statusIdx] : 'Active').toLowerCase();
        let finalStatus = 'ACTIVE';
        if (rawStatus.includes('obsolete') || rawStatus.includes('discontinued')) {
          finalStatus = 'DISCONTINUED';
        } else if (rawStatus.includes('superceded') || rawStatus.includes('superseded')) {
          finalStatus = 'SUPERSEDED';
        }

        parsed.push({
          itemCode: rawCode,
          description: (descIdx >= 0 && values[descIdx]) ? values[descIdx] : 'Item ' + rawCode,
          supplierCode: (supIdx >= 0 && values[supIdx]) ? values[supIdx] : 'KJT',
          ppq: (bomIdx >= 0 && values[bomIdx]) ? values[bomIdx] : '',
          standardCost: costIdx >= 0 ? parseFloat(values[costIdx]) || 0 : 0,
          currency: (currIdx >= 0 && values[currIdx]) ? values[currIdx] : 'INR',
          unit: (unitIdx >= 0 && values[unitIdx]) ? values[unitIdx] : 'PCS',
          supplierCost: landedIdx >= 0 ? parseFloat(values[landedIdx]) || 0 : 0,
          standardPrice: priceIdx >= 0 ? parseFloat(values[priceIdx]) || 0 : 0,
          leadTimeDays: leadIdx >= 0 ? parseInt(values[leadIdx], 10) || 7 : 7,
          currentStock: 0,
          status: finalStatus,
        });
      }

      setPreviewItems(parsed);
      setPreviewDuplicates(duplicatesFound);
      setShowPreviewModal(true);
    } catch {
      alert('Could not parse CSV file. Please verify column formatting.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    setIsImporting(true);
    try {
      const res = await itemsApi.importItems(previewItems);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowPreviewModal(false);

      if (res.data) {
        setImportSummary(res.data);
      } else {
        setImportSummary({
          total: previewItems.length,
          imported: previewItems.length - previewDuplicates.length,
          skipped: previewDuplicates.length,
          errors: previewDuplicates.map((d) => `Duplicate item code skipped: ${d}`),
        });
      }
      setShowSummaryModal(true);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const columns: Column<Item>[] = [
    {
      header: 'S.no',
      accessorKey: 'sno',
      render: (_item, idx) => (
        <span className="text-xs text-slate-500 font-medium">
          {(page - 1) * 10 + idx + 1}
        </span>
      ),
    },
    {
      header: 'Product code',
      accessorKey: 'itemCode',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-emerald-700">
          {item.itemCode}
        </span>
      ),
    },
    {
      header: 'Product Description',
      accessorKey: 'description',
      render: (item) => (
        <div className="max-w-[220px]">
          <p className="text-sm font-semibold text-slate-900 truncate" title={item.description}>
            {item.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Picture',
      accessorKey: 'picture',
      render: () => (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <Package className="w-4 h-4" />
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessorKey: 'supplierCode',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.supplierCode || 'KJT'}
        </span>
      ),
    },
    {
      header: 'BOM',
      accessorKey: 'ppq',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.ppq || '—'}
        </span>
      ),
    },
    {
      header: 'Standard Cost',
      accessorKey: 'standardCost',
      render: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.standardCost ? `₹${Number(item.standardCost).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Currency',
      accessorKey: 'currency',
      render: (item) => (
        <span className="text-xs font-mono text-slate-600">
          {item.currency || 'INR'}
        </span>
      ),
    },
    {
      header: 'Unit',
      accessorKey: 'unit',
      render: (item) => <span className="text-xs text-slate-700 font-medium">{item.unit || 'PCS'}</span>,
    },
    {
      header: 'Landed cost',
      accessorKey: 'supplierCost',
      render: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.supplierCost ? `₹${Number(item.supplierCost).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Standard Price',
      accessorKey: 'standardPrice',
      render: (item) => (
        <span className="text-xs font-bold text-emerald-700">
          {item.standardPrice ? `₹${Number(item.standardPrice).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Lead Time',
      accessorKey: 'leadTimeDays',
      render: (item) => (
        <span className="text-xs text-slate-700">
          {item.leadTimeDays ? `${item.leadTimeDays} days` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (item) => <Badge status={item.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
            title="Edit Item"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete item ${item.itemCode}?`)) {
                deleteMutation.mutate(item.id);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Item Master</h1>
              <p className="text-xs text-slate-500">
                Products, bill-of-materials components, standard costs, and inventory thresholds
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
            onClick={downloadCsvTemplate}
            title="Download formatted CSV spreadsheet template"
          >
            CSV Template
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4 text-emerald-600" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <GlassCard padding={false} className="p-4">
        <SearchBar
          placeholder="Search by Product code or Product Description..."
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
          data={itemsResponse?.data || []}
          isLoading={isLoading}
          pagination={itemsResponse?.pagination}
          onPageChange={setPage}
          emptyMessage="No items found."
        />
      </GlassCard>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.itemCode}` : 'Create New Item'}
        subtitle="Catalog specifications and pricing structure"
        size="2xl"
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data as ItemFormData))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product code"
              placeholder="e.g. WLI-SNS-001"
              required
              error={errors.itemCode?.message}
              {...register('itemCode')}
            />
            <Input
              label="Supplier"
              placeholder="e.g. KJT"
              {...register('supplierCode')}
            />

            <div className="md:col-span-2">
              <Input
                label="Product Description"
                placeholder="Product description and specifications"
                required
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            <Input
              label="BOM"
              placeholder="e.g. Sensor Probe, Float Switch"
              {...register('ppq')}
            />
            <Select label="Unit" {...register('unit')}>
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
              <option value="MTR">MTR</option>
              <option value="KG">KG</option>
              <option value="NOS">NOS</option>
            </Select>

            <Input
              label="Standard Cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('standardCost')}
            />
            <Select label="Currency" {...register('currency')}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>

            <Input
              label="Landed cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('supplierCost')}
            />
            <Input
              label="Standard Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('standardPrice')}
            />

            <Input
              label="Lead Time (Days)"
              type="number"
              placeholder="7"
              {...register('leadTimeDays')}
            />
            <Select label="Status" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="DISCONTINUED">Obsolete</option>
              <option value="SUPERSEDED">Superceded</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV IMPORT PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Item Master CSV Import Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Rows Found</span>
                  <span className="text-lg font-bold text-slate-900">{previewItems.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">New Unique Items</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {previewItems.length - previewDuplicates.length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Duplicates Detected</span>
                  <span className="text-lg font-bold text-amber-600">
                    {previewDuplicates.length}
                  </span>
                </div>
              </div>

              {previewDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold">Notice: Duplicate item codes will be skipped</p>
                    <p className="text-[11px] text-amber-700">
                      Codes: {previewDuplicates.slice(0, 5).join(', ')}
                      {previewDuplicates.length > 5 ? ` (+${previewDuplicates.length - 5} more)` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-800 mb-1.5">First 5 Sample Records Preview:</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Product code</th>
                        <th className="p-2">Product Description</th>
                        <th className="p-2">Supplier</th>
                        <th className="p-2">Standard Price</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewItems.slice(0, 5).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2 font-mono font-semibold text-emerald-700">{p.itemCode}</td>
                          <td className="p-2 truncate max-w-[200px]">{p.description}</td>
                          <td className="p-2">{p.supplierCode || 'KJT'}</td>
                          <td className="p-2 font-mono font-semibold">₹{p.standardPrice || 0}</td>
                          <td className="p-2">{p.unit || 'PCS'}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-medium">
                              {p.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmImport}
                  isLoading={isImporting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirm & Import ({previewItems.length - previewDuplicates.length} Items)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT SUMMARY REPORT MODAL */}
      {showSummaryModal && importSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Import Execution Report</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-slate-500 block">Processed</span>
                  <span className="text-base font-bold text-slate-900">{importSummary.total}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Imported</span>
                  <span className="text-base font-bold text-emerald-600">{importSummary.imported}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Skipped / Rej.</span>
                  <span className="text-base font-bold text-amber-600">{importSummary.skipped}</span>
                </div>
              </div>

              {importSummary.errors && importSummary.errors.length > 0 && (
                <div>
                  <p className="font-semibold text-rose-600 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Rejection & Warning Log:
                  </p>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-700">
                    {importSummary.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-right pt-3">
                <Button
                  variant="primary"
                  onClick={() => setShowSummaryModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
