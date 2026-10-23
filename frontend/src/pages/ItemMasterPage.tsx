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
  Image as ImageIcon,
  ZoomIn,
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
import { OurProductsMenu } from '../components/items/OurProductsMenu';
import { PRODUCT_CATEGORIES } from '../lib/productCategories';

const itemSchema = z.object({
  itemCode: z.string().min(1, 'Product code is required'),
  description: z.string().min(2, 'Description is required'),
  category: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

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
    queryKey: ['items', { page, limit, search, category: selectedCategory }],
    queryFn: () =>
      itemsApi.list({
        page,
        limit,
        search: search || undefined,
        category: selectedCategory || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      category: '',
      unit: 'PCS',
      currency: 'INR',
      status: 'ACTIVE',
      currentStock: 0,
      imageUrl: '',
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setValue('imageUrl', dataUrl, { shouldDirty: true });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      itemCode: '',
      description: '',
      category: selectedCategory || '',
      imageUrl: '',
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
      category: item.category || '',
      imageUrl: item.imageUrl || '',
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
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to delete item.');
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
        alert('Selected CSV file is empty or missing data rows.');
        return;
      }

      // Detect separator: comma or semicolon or tab
      const firstNonEmpty = lines[0];
      const sep = firstNonEmpty.includes(';') ? ';' : firstNonEmpty.includes('\t') ? '\t' : ',';

      // Find the header row containing "Product code" or "Item Code" or "Product" or "Code"
      let headerLineIdx = lines.findIndex((l) => {
        const lower = l.toLowerCase();
        return (
          lower.includes('product code') ||
          lower.includes('item code') ||
          lower.includes('itemcode') ||
          lower.includes('product description') ||
          lower.includes('standard price')
        );
      });

      if (headerLineIdx === -1) {
        headerLineIdx = 0;
      }

      const splitRow = (rowStr: string): string[] => {
        const values: string[] = [];
        let inQuote = false;
        let cur = '';
        for (let i = 0; i < rowStr.length; i++) {
          const c = rowStr[i];
          if (c === '"') {
            inQuote = !inQuote;
          } else if (c === sep && !inQuote) {
            values.push(cur.trim().replace(/^"|"$/g, ''));
            cur = '';
          } else {
            cur += c;
          }
        }
        values.push(cur.trim().replace(/^"|"$/g, ''));
        return values;
      };

      const headers = splitRow(lines[headerLineIdx]).map((h) => h.toLowerCase().trim());
      const getIndex = (names: string[]) =>
        headers.findIndex((h) => names.some((n) => h === n || h.includes(n)));

      let codeIdx = getIndex(['product code', 'item code', 'itemcode', 'code', 'part no', 'part', 'model']);
      let descIdx = getIndex(['product description', 'description', 'desc', 'product name', 'item name', 'name']);
      const catIdx = getIndex(['category', 'product category', 'type']);
      const picIdx = getIndex(['picture', 'image', 'photo']);
      const supIdx = getIndex(['supplier', 'vendor']);
      const bomIdx = getIndex(['bom', 'ppq']);
      const costIdx = getIndex(['standard cost', 'cost']);
      const currIdx = getIndex(['currency']);
      const unitIdx = getIndex(['unit', 'uom']);
      const landedIdx = getIndex(['landed cost', 'landed']);
      const priceIdx = getIndex(['standard price', 'price', 'rate']);
      const leadIdx = getIndex(['lead time', 'lead']);
      const statusIdx = getIndex(['status']);

      // If code column not found by name, fallback intelligently
      if (codeIdx === -1) {
        // If column 1 has S.no / Sno, then column 2 is usually Product Code
        if (headers.length > 2 && (headers[0].includes('s.no') || headers[1].includes('s.no') || headers[0] === '')) {
          codeIdx = headers[0] === '' ? 2 : 1;
        } else {
          codeIdx = 0;
        }
      }
      if (descIdx === -1 && headers.length > codeIdx + 1) {
        descIdx = codeIdx + 1;
      }

      const existingCodes = new Set((itemsResponse?.data || []).map((i) => i.itemCode.toLowerCase().trim()));
      const seenInCsv = new Set<string>();
      const duplicatesFound: string[] = [];
      const parsed: any[] = [];

      for (let r = headerLineIdx + 1; r < lines.length; r++) {
        const line = lines[r];
        const values = splitRow(line);

        let rawCode = (codeIdx >= 0 && values[codeIdx]) ? values[codeIdx].trim() : '';
        const rawDesc = (descIdx >= 0 && values[descIdx]) ? values[descIdx].trim() : '';

        // Skip blank rows or legend/template instruction rows
        if (
          (!rawCode && !rawDesc) ||
          rawCode.toLowerCase().includes('part no is') ||
          rawCode.toLowerCase().includes('supplier name') ||
          rawCode.toLowerCase().includes('material code') ||
          rawDesc.toLowerCase().includes('material description')
        ) {
          continue;
        }

        if (!rawCode && rawDesc) {
          rawCode = `ITEM-${r}`;
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
          description: rawDesc || 'Item ' + rawCode,
          category: (catIdx >= 0 && values[catIdx]) ? values[catIdx].trim() : undefined,
          imageUrl: (picIdx >= 0 && values[picIdx]) ? values[picIdx].trim() : undefined,
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

      if (parsed.length === 0) {
        alert(
          'CSV file me koi valid product data row nahi mili. Kripya file me kam se kam ek product ka Code ya Description likhein aur dobara upload karein.'
        );
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
    const validItems = previewItems.filter((i) => !previewDuplicates.includes(i.itemCode));
    if (validItems.length === 0) {
      alert('Import karne ke liye koi naya unique item nahi mila. Duplicate ya empty rows skip ho chuki hain.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await itemsApi.importItems(validItems);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowPreviewModal(false);

      if (res.data) {
        setImportSummary(res.data);
      } else {
        setImportSummary({
          total: previewItems.length,
          imported: validItems.length,
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
          {(page - 1) * limit + idx + 1}
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
      accessorKey: 'imageUrl',
      render: (item) => (
        <div className="flex items-center">
          {item.imageUrl ? (
            <div
              className="relative group cursor-pointer"
              onClick={() => setSelectedImageModal(item.imageUrl || null)}
              title="Click to view full image"
            >
              <img
                src={item.imageUrl}
                alt={item.itemCode}
                className="w-9 h-9 rounded-lg object-cover border border-emerald-200 shadow-xs hover:ring-2 hover:ring-emerald-500 transition-all bg-white"
              />
              <div className="absolute inset-0 bg-slate-900/20 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow-sm" />
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          )}
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

      {/* Search Bar & Our Products Category Dropdown */}
      <GlassCard padding={false} className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by Product code, Description, or Category..."
              value={search}
              onSearch={(val) => {
                if (val !== search) {
                  setSearch(val);
                  setPage(1);
                }
              }}
            />
          </div>

          <OurProductsMenu
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
            }}
          />
        </div>

        {/* Active Category Filter Tag */}
        {selectedCategory && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Filtered by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{selectedCategory}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setPage(1);
                }}
                className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-700 transition-colors ml-1"
                title="Clear category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setPage(1);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2 cursor-pointer"
            >
              Clear & View All Products
            </button>
          </div>
        )}
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false} className="p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={itemsResponse?.data || []}
          isLoading={isLoading}
          pagination={itemsResponse?.pagination}
          onPageChange={(newPage) => {
            setPage(newPage);
          }}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100, 200, 500]}
          exportTitle="Item Master Catalog"
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

            {/* Product Picture Upload / Link Option */}
            <div className="md:col-span-2 p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Product Picture (Photo)
                </label>
                <div className="flex items-center gap-1 text-[11px] bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      imageInputMode === 'upload'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      imageInputMode === 'url'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Image Link
                  </button>
                </div>
              </div>

              {watch('imageUrl') ? (
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-xs">
                  <img
                    src={watch('imageUrl') || ''}
                    alt="Product preview"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-xs bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Product Picture Attached
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      Ready to save and display in catalog
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('imageUrl', '', { shouldDirty: true })}
                    className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 border border-rose-200 transition-colors"
                    title="Remove picture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ) : imageInputMode === 'upload' ? (
                <label className="flex flex-col items-center justify-center py-5 px-3 border border-dashed border-emerald-300 rounded-xl bg-white hover:bg-emerald-50/50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Click to browse product picture
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    PNG, JPG, WEBP (Auto-optimized for crisp display)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    placeholder="Paste image URL (e.g. https://.../product.jpg)"
                    value={watch('imageUrl') || ''}
                    onChange={(e) => setValue('imageUrl', e.target.value, { shouldDirty: true })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Provide any direct web image URL from your product catalog or drive.
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category / Product Line (Our Products)
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Select Category / Subcategory (Optional) --</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

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
                        <th className="p-2">Picture</th>
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
                          <td className="p-2">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-7 h-7 rounded-md object-cover border border-slate-200" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
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
                  disabled={previewItems.length - previewDuplicates.length <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {previewItems.length - previewDuplicates.length > 0
                    ? `Confirm & Import (${previewItems.length - previewDuplicates.length} Items)`
                    : 'No Items to Import (0 Items)'}
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
      {/* FULL PICTURE PREVIEW LIGHTBOX MODAL */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-4 border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Product Picture Preview</h3>
              </div>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2">
              <img
                src={selectedImageModal}
                alt="Product Picture"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
