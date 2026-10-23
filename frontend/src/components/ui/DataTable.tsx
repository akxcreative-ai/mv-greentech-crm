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
  /** Title used in PDF export header */
  exportTitle?: string;
}

// ---------------------------------------------------------------------------
// Page-number-pills logic: compact display for many pages
// ---------------------------------------------------------------------------
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  const current = Math.max(1, Math.floor(Number(currentPage) || 1));
  const total = Math.max(1, Math.floor(Number(totalPages) || 1));

  if (total <= 1) return [1];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3)
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

// ---------------------------------------------------------------------------
// PDF Export helper — uses browser print to produce a clean PDF
// ---------------------------------------------------------------------------
function exportTableToPDF<T>(
  columns: Column<T>[],
  data: T[],
  title: string,
  pageSize: string,
  orientation: string
) {
  // Build HTML table from visible data
  const actionCols = new Set<number>();
  columns.forEach((col, i) => {
    const key = String(col.accessorKey || col.header).toLowerCase();
    if (key === 'actions' || key === 'action') actionCols.add(i);
  });

  const visibleCols = columns.filter((_, i) => !actionCols.has(i));

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: ${pageSize} ${orientation}; margin: 15mm; }
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

  data.forEach((row, rIdx) => {
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
  allData,
  title,
  pagination,
}: {
  isOpen: boolean;
  onClose: () => void;
  columns: Column<any>[];
  data: any[];
  allData?: any[];
  title: string;
  pagination?: PaginationInfo;
}) {
  const [pageSize, setPageSize] = React.useState('A4');
  const [orientation, setOrientation] = React.useState('portrait');
  const [dataRange, setDataRange] = React.useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const exportData = dataRange === 'all' && allData ? allData : data;

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

        {/* Data Range */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Data Range
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDataRange('current')}
              className={clsx(
                'flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                dataRange === 'current'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
              )}
            >
              Current Page ({data.length} rows)
            </button>
            <button
              type="button"
              onClick={() => setDataRange('all')}
              className={clsx(
                'flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                dataRange === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
              )}
            >
              All Records ({pagination?.total || data.length})
            </button>
          </div>
        </div>

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
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  pageSize === s
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                )}
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
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize',
                  orientation === o
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                )}
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
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              exportTableToPDF(columns, exportData, title, pageSize, orientation);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-colors shadow-md"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MAIN DataTable Component
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

  // Safe number extraction
  const currentPage = Math.max(1, Math.floor(Number(pagination?.page) || 1));
  const totalPages = Math.max(0, Math.floor(Number(pagination?.totalPages) || 0));
  const pageLimit = Math.max(1, Number(pagination?.limit) || 10);
  const totalRecords = Math.max(0, Number(pagination?.total) || 0);

  const handlePageChange = React.useCallback(
    (targetPage: number) => {
      const pageNum = Math.floor(Number(targetPage));
      if (!pagination || isNaN(pageNum)) return;
      if (pageNum < 1 || pageNum > totalPages || pageNum === currentPage) return;

      // Auto-scroll table to left so user sees Product Codes / first columns
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      // Scroll window to top of table for better UX
      tableContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      onPageChange?.(pageNum);
    },
    [pagination, totalPages, currentPage, onPageChange]
  );

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

      {/* ====== PAGINATION FOOTER ====== */}
      {/* Always show when pagination exists, even for 1 page (so rows-per-page is accessible) */}
      {pagination && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 px-4 py-3 text-xs text-slate-600 border border-t-0 border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-b-xl">
          {/* Left: Showing info + Rows per page + PDF */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Showing X to Y of Z */}
            <div className="flex items-center gap-1">
              <span>Showing</span>
              <span className="font-bold text-slate-900">{showingFrom}</span>
              <span>to</span>
              <span className="font-bold text-slate-900">{showingTo}</span>
              <span>of</span>
              <span className="font-extrabold text-emerald-700">{totalRecords}</span>
              <span>entries</span>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-4 bg-slate-300" />

            {/* Page X of Y */}
            {totalPages > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-slate-500">
                <span>Page</span>
                <span className="font-bold text-emerald-700">{currentPage}</span>
                <span>of</span>
                <span className="font-bold text-slate-900">{totalPages}</span>
              </div>
            )}

            {/* Separator */}
            {onLimitChange && (
              <div className="hidden sm:block w-px h-4 bg-slate-300" />
            )}

            {/* Rows per page dropdown */}
            {onLimitChange && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Rows:</span>
                <select
                  value={pageLimit}
                  onChange={(e) => {
                    if (tableContainerRef.current) {
                      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                    onLimitChange(Number(e.target.value));
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer text-xs min-w-[52px]"
                >
                  {(pageSizeOptions || [10, 20, 25, 50, 100, 200, 500]).map(
                    (size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Separator */}
            {exportTitle && (
              <div className="hidden sm:block w-px h-4 bg-slate-300" />
            )}

            {/* PDF Export button */}
            {exportTitle && (
              <button
                type="button"
                onClick={() => setShowPDFModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
                title="Export to PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
          </div>

          {/* Right: Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center flex-shrink-0">
              {/* First */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(1); }}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(currentPage - 1); }}
                disabled={currentPage <= 1}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Prev</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 mx-0.5">
                {getPageNumbers(currentPage, totalPages).map((pageNum, idx) => {
                  if (pageNum === 'ellipsis') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 select-none font-bold text-sm"
                      >
                        …
                      </span>
                    );
                  }
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(pageNum); }}
                      disabled={isActive}
                      className={clsx(
                        'min-w-[36px] h-9 px-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center flex-shrink-0',
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-1 cursor-default'
                          : 'bg-white border border-slate-300 text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400 cursor-pointer shadow-sm'
                      )}
                      style={isActive ? { backgroundColor: '#059669', color: '#ffffff' } : undefined}
                      title={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(currentPage + 1); }}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next page"
              >
                <span className="hidden sm:inline text-xs">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePageChange(totalPages); }}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
