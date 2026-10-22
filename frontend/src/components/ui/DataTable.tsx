import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
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
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

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
}: DataTableProps<T>) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (targetPage: number) => {
    const pageNum = Number(targetPage);
    if (!pagination || isNaN(pageNum)) return;
    if (pageNum < 1 || pageNum > Number(pagination.totalPages) || pageNum === Number(pagination.page)) return;

    // Auto-scroll table container back to the left so user immediately sees row numbers & product codes
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    onPageChange?.(pageNum);
  };

  return (
    <div className={twMerge('w-full flex flex-col', className)}>
      <div ref={tableContainerRef} className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
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
                        col.sortable && 'cursor-pointer hover:text-slate-900 transition-colors',
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
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-c-${cIdx}`} className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-10 h-10 text-slate-300 stroke-1" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rIdx) => {
                const rowKey = row.id ? String(row.id) : `row-${rIdx}`;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={clsx(
                      'transition-colors duration-150',
                      onRowClick ? 'cursor-pointer hover:bg-emerald-50/40' : 'hover:bg-slate-50/50'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const colKey = String(col.accessorKey || cIdx);
                      let cellContent: React.ReactNode;
                      if (col.render) {
                        cellContent = col.render(row, rIdx);
                      } else if (col.accessorKey) {
                        const val = (row as Record<string, unknown>)[col.accessorKey as string];
                        cellContent = val !== undefined && val !== null ? String(val) : '—';
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

      {/* Pagination Controls */}
      {pagination && (pagination.totalPages > 1 || onLimitChange) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-3 py-3.5 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {pagination.total === 0 ? 0 : (Number(pagination.page) - 1) * Number(pagination.limit) + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(Number(pagination.page) * Number(pagination.limit), Number(pagination.total))}
              </span>{' '}
              of <span className="font-bold text-emerald-800">{pagination.total}</span> entries
            </div>

            {onLimitChange && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-500">Rows per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    if (tableContainerRef.current) {
                      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                    onLimitChange(Number(e.target.value));
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs shadow-2xs"
                >
                  {(pageSizeOptions || [10, 25, 50, 100]).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {/* First Page */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePageChange(1);
                }}
                disabled={Number(pagination.page) <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePageChange(Number(pagination.page) - 1);
                }}
                disabled={Number(pagination.page) <= 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers(Number(pagination.page), Number(pagination.totalPages)).map((pageNum, idx) => {
                  if (pageNum === 'ellipsis') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none font-bold">
                        …
                      </span>
                    );
                  }
                  const isCurrent = pageNum === Number(pagination.page);
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePageChange(pageNum);
                      }}
                      className={clsx(
                        'min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center',
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-600'
                          : 'bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 shadow-2xs'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePageChange(Number(pagination.page) + 1);
                }}
                disabled={Number(pagination.page) >= Number(pagination.totalPages)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePageChange(Number(pagination.totalPages));
                }}
                disabled={Number(pagination.page) >= Number(pagination.totalPages)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
