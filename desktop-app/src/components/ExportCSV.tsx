'use client';

import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, Check, Loader2 } from 'lucide-react';

interface ExportCSVProps {
  data: Record<string, unknown>[];
  filename?: string;
  headers?: Record<string, string>; // key -> display name mapping
  className?: string;
}

export function ExportCSV({ 
  data, 
  filename = 'export', 
  headers,
  className = ''
}: ExportCSVProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const exportToCSV = useCallback(() => {
    if (data.length === 0) return;

    setLoading(true);

    try {
      // Get all unique keys from data
      const allKeys = Array.from(
        new Set(data.flatMap(item => Object.keys(item)))
      );

      // Create header row
      const headerRow = allKeys.map(key => {
        const displayName = headers?.[key] || key;
        // Escape quotes in header
        return `"${displayName.replace(/"/g, '""')}"`;
      }).join(',');

      // Create data rows
      const dataRows = data.map(item => {
        return allKeys.map(key => {
          const value = item[key];
          
          // Handle different types
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            if (value instanceof Date) {
              return `"${value.toISOString()}"`;
            }
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          if (typeof value === 'string') {
            // Escape quotes and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',');
      });

      // Combine header and data
      const csvContent = [headerRow, ...dataRows].join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  }, [data, filename, headers]);

  return (
    <button
      onClick={exportToCSV}
      disabled={loading || data.length === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-green-600 hover:bg-green-700 disabled:bg-gray-600
                  disabled:cursor-not-allowed transition-colors
                  text-white text-sm font-medium ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : success ? (
        <Check className="w-4 h-4" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      {loading ? 'Exporting...' : success ? 'Downloaded!' : 'Export CSV'}
    </button>
  );
}

// Export multiple datasets
interface MultiExportProps {
  datasets: {
    name: string;
    data: Record<string, unknown>[];
    headers?: Record<string, string>;
  }[];
  className?: string;
}

export function MultiExportCSV({ datasets, className = '' }: MultiExportProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-green-600 hover:bg-green-700 transition-colors
                    text-white text-sm font-medium ${className}`}
      >
        <Download className="w-4 h-4" />
        Export Data
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl z-50">
            {datasets.map((dataset, idx) => (
              <ExportCSV
                key={idx}
                data={dataset.data}
                filename={dataset.name}
                headers={dataset.headers}
                className="w-full justify-start bg-transparent hover:bg-gray-700 rounded-none"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Utility to convert table data for export
export function tableToExportData<T extends Record<string, unknown>>(
  items: T[],
  columns: { key: keyof T; label: string }[]
): { data: Record<string, unknown>[]; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  columns.forEach(col => {
    headers[String(col.key)] = col.label;
  });

  const data = items.map(item => {
    const row: Record<string, unknown> = {};
    columns.forEach(col => {
      row[String(col.key)] = item[col.key];
    });
    return row;
  });

  return { data, headers };
}
