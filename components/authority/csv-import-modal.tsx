'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onImportComplete: () => void;
}

const EXPECTED_COLUMNS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'outlet', label: 'Outlet' },
  { key: 'role', label: 'Role' },
  { key: 'beat', label: 'Beat' },
  { key: 'location', label: 'Location' },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
  { key: 'twitter_url', label: 'Twitter URL' },
  { key: 'notes', label: 'Notes' },
];

type Step = 'upload' | 'mapping' | 'result';

export function CsvImportModal({ isOpen, onClose, organizationId, onImportComplete }: CsvImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported_count: number; skipped_count: number; skipped: Array<{ name: string; reason: string }> } | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);

      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });
      setCsvData(rows);

      // Auto-map by name match
      const autoMapping: Record<string, string> = {};
      for (const col of EXPECTED_COLUMNS) {
        const match = headers.find((h) =>
          h.toLowerCase().replace(/[^a-z]/g, '').includes(col.key.replace(/_/g, ''))
        );
        if (match) autoMapping[col.key] = match;
      }
      setMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/authority/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contacts: csvData,
          mapping,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStep('result');
        onImportComplete();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal">Import Contacts (CSV)</h2>
          <button onClick={handleClose} className="p-1 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="text-center">
              <ArrowUpTrayIcon className="w-10 h-10 text-stone/40 mx-auto mb-3" />
              <p className="text-sm text-charcoal mb-1">Upload a CSV file with media contacts</p>
              <p className="text-xs text-stone mb-4">Expected columns: Name, Email, Outlet, Role, Phone, etc.</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-teal-dark transition-colors">
                <ArrowUpTrayIcon className="w-4 h-4" />
                Select CSV File
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-charcoal">
                Found <span className="font-semibold">{csvData.length}</span> rows. Map your CSV columns:
              </p>
              <div className="space-y-2">
                {EXPECTED_COLUMNS.map((col) => (
                  <div key={col.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-charcoal w-28">
                      {col.label} {col.required && <span className="text-red-500">*</span>}
                    </span>
                    <select
                      value={mapping[col.key] || ''}
                      onChange={(e) => setMapping({ ...mapping, [col.key]: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-stone/20 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal/30"
                    >
                      <option value="">— Skip —</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || !mapping.full_name}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Importing...' : `Import ${csvData.length} Contacts`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && result && (
            <div className="text-center space-y-3">
              <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm text-charcoal">
                <span className="font-semibold text-green-600">{result.imported_count}</span> contacts imported
                {result.skipped_count > 0 && (
                  <>, <span className="font-semibold text-amber-600">{result.skipped_count}</span> skipped</>
                )}
              </p>
              {result.skipped.length > 0 && (
                <div className="text-left max-h-32 overflow-y-auto bg-cream-warm/40 rounded-lg p-3">
                  {result.skipped.map((s, i) => (
                    <p key={i} className="text-xs text-stone">{s.name}: {s.reason}</p>
                  ))}
                </div>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
