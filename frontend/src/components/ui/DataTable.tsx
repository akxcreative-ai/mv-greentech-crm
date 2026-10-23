import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  FileDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  pageSizeOptions?: number[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  exportTitle?: string;
}

// ---------------------------------------------------------------------------
// PDF Export helper
// ---------------------------------------------------------------------------
function exportTableToPDF<T>(
  columns: Column<T>[],
  data: T[],
  title: string,
  pageSize: string,
  orientation: string
) {
  const actionCols = new Set<number>();
  columns.forEach((col, i) => {
    const key = String(col.accessorKey || col.header).toLowerCase();
    if (key === 'actions' || key === 'action') actionCols.add(i);
  });

  const visibleCols = columns.filter((_, i) => !actionCols.has(i));

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: ${pageSize} ${orientation}; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 11px; }
  .header { text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #059669; }
  .header h1 { font-size: 16px; font-weight: 700; color: #059669; }
  .header .meta { font-size: 10px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #059669; color: white; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; white-space: nowrap; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #94a3b8; padding: 4px; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
<div class="header"><h1>${title}</h1>
<div class="meta">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Total Records: ${data.length}</div></div>
<table><thead><tr>`;

  visibleCols.forEach((col) => {
    html += `<th>${col.header}</th>`;
  });
  html += `</tr></thead><tbody>`;

  data.forEach((row) => {
    html += '<tr>';
    visibleCols.forEach((col) => {
      let val = '';
      if (col.accessorKey) {
        const raw = (row as Record<string, unknown>)[col.accessorKey as string];
        val = raw !== undefined && raw !== null ? String(raw) : '—';
      }
      html += `<td>${val}</td>`;
    });
    html += '</tr>';
  });

  html += `</tbody></table>
<div class="footer">MV GREENTECH PVT LTD • ${title}</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 400);
  }
}

// ---------------------------------------------------------------------------
// PDF Export Modal
// ---------------------------------------------------------------------------
function PDFExportModal({
  isOpen,
  onClose,
  columns,
  data,
  title,
  pagination,
}: {
  isOpen: boolean;
  onClose: () => void;
  columns: Column<any>[];
  data: any[];
  title: string;
  pagination?: PaginationInfo;
}) {
  const [pageSize, setPageSize] = React.useState('A4');
  const [orientation, setOrientation] = React.useState('portrait');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileDown className="w-5 h-5 text-emerald-600" />
          Export to PDF
        </h3>

        {/* Page Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Page Size
          </label>
          <div className="flex gap-2 flex-wrap">
            {['A4', 'A3', 'Letter', 'Legal'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPageSize(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                style={{
                  backgroundColor: pageSize === s ? '#059669' : '#ffffff',
                  color: pageSize === s ? '#ffffff' : '#334155',
                  border: '1px solid ' + (pageSize === s ? '#059669' : '#cbd5e1'),
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Orientation
          </label>
          <div className="flex gap-2">
            {['portrait', 'landscape'].map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrientation(o)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize shadow-xs"
                style={{
                  backgroundColor: orientation === o ? '#059669' : '#ffffff',
                  color: orientation === o ? '#ffffff' : '#334155',
                  border: '1px solid ' + (orientation === o ? '#059669' : '#cbd5e1'),
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              exportTableToPDF(columns, data, title, pageSize, orientation);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-colors shadow-md"
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
          >
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MAIN DataTable Component — Printer-Style Custom Page & Row Finder
// ===========================================================================
export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  onLimitChange,
  pageSizeOptions,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = 'No records found',
  onRowClick,
  className,
  exportTitle,
}: DataTableProps<T>) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [showPDFModal, setShowPDFModal] = React.useState(false);

  // Custom Page & Row input states ("jaise printer ka hota hai")
  const [pageInput, setPageInput] = React.useState('');
  const [rowInput, setRowInput] = React.useState('');

  // Safe number extraction
  const currentPage = Math.max(1, Math.floor(Number(pagination?.page) || 1));
  const totalPages = Math.max(1, Math.floor(Number(pagination?.totalPages) || 1));
  const pageLimit = Math.max(1, Number(pagination?.limit) || 10);
  const totalRecords = Math.max(0, Number(pagination?.total) || 0);

  const handlePageChange = React.useCallback(
    (targetPage: number) => {
      const pageNum = Math.floor(Number(targetPage));
      if (!pagination || isNaN(pageNum)) return;
      if (pageNum < 1 || pageNum > totalPages || pageNum === currentPage) return;

      // Auto-scroll table to left column (S.no, Product code)
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      tableContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      onPageChange?.(pageNum);
    },
    [pagination, totalPages, currentPage, onPageChange]
  );

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setPageInput('');
    }
  };

  const handleRowJump = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseInt(rowInput, 10);
    if (!isNaN(r) && r >= 1 && r <= totalRecords) {
      const targetPage = Math.ceil(r / pageLimit);
      handlePageChange(targetPage);
      setRowInput('');
    }
  };

  // Showing X to Y of Z
  const showingFrom = totalRecords === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const showingTo = Math.min(currentPage * pageLimit, totalRecords);

  return (
    <div className={twMerge('w-full flex flex-col', className)}>
      {/* ====== TABLE ====== */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto rounded-t-xl border border-slate-200 bg-white shadow-xs"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              {columns.map((col, idx) => {
                const colKey = String(col.accessorKey || idx);
                const isCurrentSort = sortBy === colKey;
                return (
                  <th
                    key={colKey}
                    onClick={() => col.sortable && onSort && onSort(colKey)}
                    className={twMerge(
                      clsx(
                        'px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none whitespace-nowrap',
                        col.sortable &&
                          'cursor-pointer hover:text-slate-900 transition-colors',
                        col.headerClassName
                      )
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isCurrentSort ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: Math.min(pageLimit, 8) }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td
                      key={`skel-c-${cIdx}`}
                      className="px-4 py-4 whitespace-nowrap"
                    >
                      <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-10 h-10 text-slate-300 stroke-1" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const rowKey = row.id ? String(row.id) : `row-${rIdx}`;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={clsx(
                      'transition-colors duration-150',
                      onRowClick
                        ? 'cursor-pointer hover:bg-emerald-50/40'
                        : 'hover:bg-slate-50/50'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const colKey = String(col.accessorKey || cIdx);
                      let cellContent: React.ReactNode;
                      if (col.render) {
                        cellContent = col.render(row, rIdx);
                      } else if (col.accessorKey) {
                        const val = (row as Record<string, unknown>)[
                          col.accessorKey as string
                        ];
                        cellContent =
                          val !== undefined && val !== null ? String(val) : '—';
                      } else {
                        cellContent = null;
                      }

                      return (
                        <td
                          key={colKey}
                          className={twMerge(
                            clsx(
                              'px-4 py-3.5 text-sm text-slate-800 whitespace-nowrap align-middle',
                              col.className
                            )
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ====== PRINTER-STYLE CLEAN PAGINATION & CUSTOM PAGE/ROW FINDER ====== */}
      {pagination && (
        <div className="flex flex-col xl:flex-row items-center justify-between gap-3 px-4 py-3.5 text-xs text-slate-700 border border-t-0 border-slate-200 bg-white rounded-b-xl shadow-xs">
          {/* Left: Showing info + Rows per page + Custom Row Finder */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm font-semibold text-slate-700">
              Showing <span className="font-extrabold text-slate-900">{showingFrom}</span> to{' '}
              <span className="font-extrabold text-slate-900">{showingTo}</span> of{' '}
              <span className="font-extrabold text-emerald-700">{totalRecords}</span> entries
            </div>

            {onLimitChange && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-600 font-bold">Rows:</span>
                <select
                  value={pageLimit}
                  onChange={(e) => {
                    if (tableContainerRef.current) {
                      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                    onLimitChange(Number(e.target.value));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-emerald-600 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-xs"
                >
                  {(pageSizeOptions || [10, 20, 25, 50, 100, 200, 500]).map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Row Finder ("coustome page se row find karnae wala") */}
            <form onSubmit={handleRowJump} className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-600 font-bold">Find Row #:</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, totalRecords)}
                value={rowInput}
                onChange={(e) => setRowInput(e.target.value)}
                placeholder="e.g. 50"
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                title="Jump to row"
              >
                Find
              </button>
            </form>
          </div>

          {/* Right: Solid Green Buttons with White Letters + Printer-style Page Jumper */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* First Button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(1); }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4 text-white" />
              <span>First</span>
            </button>

            {/* Prev Button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(currentPage - 1); }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              <span>Prev</span>
            </button>

            {/* Printer-like Custom Page Jump: Page [ 1 ] of 12 [ Go ] */}
            <form onSubmit={handlePageJump} className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
              <span className="text-xs font-bold text-emerald-900">Page</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, totalPages)}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={String(currentPage)}
                className="w-14 px-2 py-1 bg-white border-2 border-emerald-600 rounded text-center text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-emerald-900">of {totalPages || 1}</span>
              <button
                type="submit"
                className="px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                title="Go to page"
              >
                Go
              </button>
            </form>

            {/* Next Button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(currentPage + 1); }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>

            {/* Last Button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(totalPages); }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              title="Last Page"
            >
              <span>Last</span>
              <ChevronsRight className="w-4 h-4 text-white" />
            </button>

            {/* PDF Export button */}
            {exportTitle && (
              <button
                type="button"
                onClick={() => setShowPDFModal(true)}
                className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                title="Export to PDF"
              >
                <FileDown className="w-4 h-4 text-white" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {exportTitle && (
        <PDFExportModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          columns={columns}
          data={data}
          title={exportTitle}
          pagination={pagination}
        />
      )}
    </div>
  );
}
