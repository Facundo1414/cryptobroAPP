'use client';

import { useState, useMemo, ReactNode } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  sortable?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  idKey?: keyof T;
  emptyMessage?: string;
  actions?: ReactNode;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  stickyHeader?: boolean;
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  sortable = true,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  idKey = 'id' as keyof T,
  emptyMessage = 'No data found',
  actions,
  onRowClick,
  isLoading = false,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || searchKeys.length === 0) return data;

    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchQuery);
        }
        return false;
      })
    );
  }, [data, searchQuery, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allIds = paginatedData.map((item) => item[idKey] as string | number);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    
    if (allSelected) {
      const newSet = new Set(selectedIds);
      allIds.forEach((id) => newSet.delete(id));
      onSelectionChange(newSet);
    } else {
      const newSet = new Set([...selectedIds, ...allIds]);
      onSelectionChange(newSet);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (!onSelectionChange) return;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const allCurrentSelected = paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(item[idKey] as string | number));

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header Actions */}
      {(searchable || actions) && (
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-900/50 ${stickyHeader ? 'sticky top-0' : ''}`}>
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 
                               text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key.toString()}
                  className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider
                              ${column.sortable !== false && sortable ? 'cursor-pointer hover:text-gray-300' : ''}
                              ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key.toString())}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={`w-3 h-3 -mb-1 ${
                            sortConfig?.key === column.key.toString() && sortConfig?.direction === 'asc'
                              ? 'text-blue-400'
                              : 'text-gray-600'
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 ${
                            sortConfig?.key === column.key.toString() && sortConfig?.direction === 'desc'
                              ? 'text-blue-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className="px-4 py-4">
                      <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key.toString()} className="px-4 py-4">
                      <div className="h-4 bg-gray-700 rounded animate-pulse" style={{ width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item[idKey] as string | number}
                  className={`hover:bg-gray-700/30 transition-colors
                              ${onRowClick ? 'cursor-pointer' : ''}
                              ${selectedIds.has(item[idKey] as string | number) ? 'bg-blue-500/10' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item[idKey] as string | number)}
                        onChange={() => handleSelectRow(item[idKey] as string | number)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 
                                   text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key.toString()}
                      className={`px-4 py-4 text-sm text-gray-300
                                  ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {column.render
                        ? column.render(item, index)
                        : (item[column.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-700/50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                ${currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700/50 text-gray-400 hover:text-white'
                                }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORT BUTTON
// ============================================

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  columns?: { key: string; header: string }[];
}

export function ExportCSVButton({ data, filename = 'export', columns }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);
    const headers = columns ? columns.map(c => c.header) : keys;

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        keys.map(key => {
          const value = row[key];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg
                 text-gray-400 hover:text-white text-sm transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
