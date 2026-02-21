'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { OrgMemberRole } from '@/types/database';

interface InviteRow {
  email: string;
  role: OrgMemberRole;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitesSent: () => void;
  isOwner: boolean;
}

function parseEmails(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export function BulkInviteModal({
  isOpen,
  onClose,
  onInvitesSent,
  isOwner,
}: BulkInviteModalProps) {
  const [pasteInput, setPasteInput] = useState('');
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const handleParse = useCallback(() => {
    const emails = parseEmails(pasteInput);
    const unique = Array.from(new Set(emails));
    setRows(unique.map(email => ({ email, role: 'member' as OrgMemberRole })));
    setPasteInput('');
  }, [pasteInput]);

  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const emails = parseEmails(text);
      const unique = Array.from(new Set(emails));
      setRows(prev => {
        const existing = new Set(prev.map(r => r.email));
        const newRows = unique
          .filter(email => !existing.has(email))
          .map(email => ({ email, role: 'member' as OrgMemberRole }));
        return [...prev, ...newRows];
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleRemoveRow = useCallback((email: string) => {
    setRows(prev => prev.filter(r => r.email !== email));
  }, []);

  const handleRoleChange = useCallback((email: string, role: OrgMemberRole) => {
    setRows(prev => prev.map(r => r.email === email ? { ...r, role } : r));
  }, []);

  const handleSend = async () => {
    setSending(true);
    setResults(null);

    try {
      const res = await fetch('/api/team/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invites: rows.map(r => ({ email: r.email, role: r.role })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResults({ sent: 0, failed: rows.length });
        return;
      }

      // Update row statuses from results
      const resultMap = new Map<string, { success: boolean; error?: string }>();
      for (const r of data.results || []) {
        resultMap.set(r.email, r);
      }

      let sent = 0;
      let failed = 0;
      setRows(prev =>
        prev.map(row => {
          const result = resultMap.get(row.email);
          if (result?.success) {
            sent++;
            return { ...row, status: 'success' as const };
          } else {
            failed++;
            return { ...row, status: 'error' as const, error: result?.error || 'Failed' };
          }
        })
      );
      setResults({ sent, failed });
      if (sent > 0) onInvitesSent();
    } catch {
      setResults({ sent: 0, failed: rows.length });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setPasteInput('');
    setResults(null);
    onClose();
  };

  if (!isOpen) return null;

  const pendingRows = rows.filter(r => !r.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-cream-warm rounded-2xl border border-teal/10 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="font-serif text-xl font-bold text-charcoal">Bulk Invite</h2>
          <button type="button" onClick={handleClose} className="text-stone hover:text-charcoal">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Paste area */}
          {rows.length === 0 && (
            <div className="space-y-3">
              <textarea
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="Paste email addresses (comma, semicolon, or newline separated)..."
                rows={5}
                className="w-full px-3 py-2 border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm bg-white"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleParse}
                  disabled={!pasteInput.trim()}
                  className="bg-teal hover:bg-teal-light text-white text-sm"
                  size="sm"
                >
                  Parse Emails
                </Button>
                <span className="text-xs text-stone">or</span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-teal hover:text-teal-light transition-colors">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="border border-stone/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone/5">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-stone">Email</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-stone w-32">Role</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-stone w-20">Status</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/5">
                  {rows.map(row => (
                    <tr key={row.email} className="hover:bg-stone/[0.02]">
                      <td className="px-4 py-2 text-charcoal">{row.email}</td>
                      <td className="px-4 py-2">
                        <select
                          value={row.role}
                          onChange={(e) => handleRoleChange(row.email, e.target.value as OrgMemberRole)}
                          disabled={!!row.status}
                          className="w-full px-2 py-1 border border-stone/10 rounded text-xs bg-cream-warm disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                          {isOwner && <option value="admin">Admin</option>}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.status === 'success' && (
                          <span className="text-xs font-semibold text-green-600">Sent</span>
                        )}
                        {row.status === 'error' && (
                          <span className="text-xs font-semibold text-red-600" title={row.error}>
                            Failed
                          </span>
                        )}
                        {!row.status && (
                          <span className="text-xs text-stone">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {!row.status && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.email)}
                            className="text-stone hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results summary */}
          {results && (
            <div className="rounded-lg bg-stone/5 p-3 text-sm">
              <span className="font-semibold text-green-600">{results.sent} sent</span>
              {results.failed > 0 && (
                <span className="font-semibold text-red-600 ml-3">{results.failed} failed</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10">
          <p className="text-xs text-stone">
            {pendingRows.length} email{pendingRows.length !== 1 ? 's' : ''} ready to send
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {results ? 'Done' : 'Cancel'}
            </Button>
            {pendingRows.length > 0 && (
              <Button
                onClick={handleSend}
                isLoading={sending}
                disabled={sending}
                className="bg-teal hover:bg-teal-light text-white text-sm"
                size="sm"
              >
                Send {pendingRows.length} Invite{pendingRows.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
