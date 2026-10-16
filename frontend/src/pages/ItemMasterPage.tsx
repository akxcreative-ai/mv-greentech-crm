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
      'Item Code,Description,Unit,Standard Cost,Standard Price,Current Stock,Lead Time (Days),Supplier Code,Status\r\n' +
      'WLI-SNS-001,Water Level Magnetic Float Sensor (SS316),PCS,1200,2450,150,5,SUP-IND-01,ACTIVE\r\n' +
      'WLI-DSP-002,Digital LED Tank Indicator Display 4-20mA,PCS,2500,4800,45,7,SUP-IND-02,ACTIVE\r\n' +
      'WLI-VAL-003,Automatic Solenoid Inlet Valve 1-inch,PCS,850,1750,80,3,SUP-IND-03,ACTIVE\r\n';

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

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const getIndex = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));

      const codeIdx = getIndex(['item code', 'itemcode', 'code', 'part']);
      const descIdx = getIndex(['description', 'desc', 'name']);
      const unitIdx = getIndex(['unit', 'uom']);
      const costIdx = getIndex(['cost', 'standard cost']);
      const priceIdx = getIndex(['price', 'standard price', 'rate']);
      const stockIdx = getIndex(['stock', 'quantity', 'qty']);
      const leadIdx = getIndex(['lead time', 'lead']);
      const supIdx = getIndex(['supplier', 'vendor']);

      const existingCodes = new Set((itemsResponse?.data || []).map((i) => i.itemCode.toLowerCase().trim()));
      const seenInCsv = new Set<string>();
      const duplicatesFound: string[] = [];

      const parsed = lines.slice(1).map((line, idx) => {
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

        const itemCode = (codeIdx >= 0 ? values[codeIdx] : values[0]) || `ITEM-${idx + 1}`;
        const normalized = itemCode.trim().toLowerCase();

        if (existingCodes.has(normalized) || seenInCsv.has(normalized)) {
          duplicatesFound.push(itemCode);
        } else {
          seenInCsv.add(normalized);
        }

        return {
          itemCode,
          description: (descIdx >= 0 ? values[descIdx] : values[1]) || 'No description',
          unit: (unitIdx >= 0 ? values[unitIdx] : 'PCS') || 'PCS',
          standardCost: costIdx >= 0 ? parseFloat(values[costIdx]) || 0 : 0,
          standardPrice: priceIdx >= 0 ? parseFloat(values[priceIdx]) || 0 : 0,
          currentStock: stockIdx >= 0 ? parseInt(values[stockIdx], 10) || 0 : 0,
          leadTimeDays: leadIdx >= 0 ? parseInt(values[leadIdx], 10) || 7 : 7,
          supplierCode: supIdx >= 0 ? values[supIdx] : '',
          currency: 'INR',
          status: 'ACTIVE',
        };
      });

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
      header: 'Item Code',
      accessorKey: 'itemCode',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-blue-400">
          {item.itemCode}
        </span>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      render: (item) => (
        <div>
          <p className="text-sm font-semibold text-white">{item.description}</p>
          {item.ppq && <p className="text-[11px] text-white/40">PPQ: {item.ppq}</p>}
        </div>
      ),
    },
    {
      header: 'Unit',
      accessorKey: 'unit',
      render: (item) => <span className="text-xs text-white/70">{item.unit || 'PCS'}</span>,
    },
    {
      header: 'Standard Price',
      accessorKey: 'standardPrice',
      render: (item) => (
        <span className="text-xs font-semibold text-emerald-400">
          {item.standardPrice ? `₹${Number(item.standardPrice).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      accessorKey: 'currentStock',
      render: (item) => (
        <span className="text-xs font-medium text-white/90">
          {item.currentStock ?? 0} {item.unit || 'PCS'}
        </span>
      ),
    },
    {
      header: 'Lead Time',
      accessorKey: 'leadTimeDays',
      render: (item) => (
        <span className="text-xs text-white/70">
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
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-blue-400 transition-colors"
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
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-rose-400 transition-colors"
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
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Item Master</h1>
              <p className="text-xs text-white/60">
                Products, bill-of-materials components, standard costs, and inventory thresholds
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-teal-400" />}
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
            leftIcon={<Upload className="w-4 h-4 text-blue-400" />}
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
          placeholder="Search by Item Code or Description..."
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
              label="Item Code / Part #"
              placeholder="e.g. WLI-SENS-01"
              required
              error={errors.itemCode?.message}
              {...register('itemCode')}
            />
            <Select label="Unit of Measure" {...register('unit')}>
              <option value="PCS">PCS (Pieces)</option>
              <option value="SET">SET</option>
              <option value="MTR">MTR (Meters)</option>
              <option value="KG">KG (Kilograms)</option>
              <option value="NOS">NOS (Numbers)</option>
            </Select>

            <div className="md:col-span-2">
              <Input
                label="Description"
                placeholder="Product title and material specifications"
                required
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            <Input
              label="Standard Cost (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('standardCost')}
            />
            <Input
              label="Standard Selling Price (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('standardPrice')}
            />

            <Input
              label="Current Stock"
              type="number"
              placeholder="0"
              {...register('currentStock')}
            />
            <Input
              label="Lead Time (Days)"
              type="number"
              placeholder="7"
              {...register('leadTimeDays')}
            />

            <Input
              label="Supplier Code"
              placeholder="e.g. SUP-901"
              {...register('supplierCode')}
            />
            <Select label="Catalog Status" {...register('status')}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISCONTINUED">DISCONTINUED</option>
              <option value="SUPERSEDED">SUPERSEDED</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full p-6 border border-white/15 relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Item Master CSV Import Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-white/50 block">Total Rows Found</span>
                  <span className="text-lg font-bold text-white">{previewItems.length}</span>
                </div>
                <div>
                  <span className="text-white/50 block">New Unique Items</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {previewItems.length - previewDuplicates.length}
                  </span>
                </div>
                <div>
                  <span className="text-white/50 block">Duplicates Detected</span>
                  <span className="text-lg font-bold text-amber-400">
                    {previewDuplicates.length}
                  </span>
                </div>
              </div>

              {previewDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Notice: Duplicate item codes will be skipped</p>
                    <p className="text-[11px] text-amber-300/80">
                      Codes: {previewDuplicates.slice(0, 5).join(', ')}
                      {previewDuplicates.length > 5 ? ` (+${previewDuplicates.length - 5} more)` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-white mb-1.5">First 5 Sample Records Preview:</p>
                <div className="border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/50">
                      <tr>
                        <th className="p-2">Item Code</th>
                        <th className="p-2">Description</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {previewItems.slice(0, 5).map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-teal-400">{p.itemCode}</td>
                          <td className="p-2 truncate max-w-[200px]">{p.description}</td>
                          <td className="p-2 font-mono">₹{p.standardPrice}</td>
                          <td className="p-2">{p.currentStock} {p.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmImport}
                  isLoading={isImporting}
                  className="bg-emerald-600 hover:bg-emerald-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full p-6 border border-white/15 relative">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Import Execution Report</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                <div>
                  <span className="text-white/50 block">Processed</span>
                  <span className="text-base font-bold text-white">{importSummary.total}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Imported</span>
                  <span className="text-base font-bold text-emerald-400">{importSummary.imported}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Skipped / Rej.</span>
                  <span className="text-base font-bold text-amber-400">{importSummary.skipped}</span>
                </div>
              </div>

              {importSummary.errors && importSummary.errors.length > 0 && (
                <div>
                  <p className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Rejection & Warning Log:
                  </p>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-300">
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
