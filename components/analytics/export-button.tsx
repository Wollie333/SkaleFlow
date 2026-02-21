'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { ArrowDownTrayIcon, DocumentTextIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  dateFrom: string;
  dateTo: string;
}

export function ExportButton({ dateFrom, dateTo }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    setOpen(false);
    try {
      const params = new URLSearchParams({ format, dateFrom, dateTo });
      const res = await fetch(`/api/content/analytics/export?${params}`);

      if (format === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateFrom}-to-${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateFrom}-to-${dateTo}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        isLoading={exporting}
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
        Export
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-cream-warm border border-stone/20 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-teal/5 transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4 text-stone" />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-teal/5 transition-colors"
          >
            <CodeBracketIcon className="w-4 h-4 text-stone" />
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}
