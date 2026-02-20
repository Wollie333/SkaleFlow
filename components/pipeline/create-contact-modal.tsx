'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateContactModalProps {
  isOpen: boolean;
  stageId: string;
  stageName: string;
  pipelineType?: string;
  onClose: () => void;
  onCreate: (data: {
    full_name: string;
    email: string;
    phone: string;
    company: string;
    value_cents: number;
    stage_id: string;
    custom_fields?: Record<string, string>;
  }) => Promise<void>;
}

export function CreateContactModal({ isOpen, stageId, stageName, pipelineType, onClose, onCreate }: CreateContactModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Application-specific fields
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [whatTried, setWhatTried] = useState('');
  const [whyApplying, setWhyApplying] = useState('');

  const isApplication = pipelineType === 'application';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    if (isApplication && !email.trim()) return;
    setLoading(true);
    try {
      const custom_fields = isApplication
        ? {
            website_url: websiteUrl.trim(),
            team_size: teamSize,
            annual_revenue: annualRevenue,
            biggest_challenge: biggestChallenge.trim(),
            what_tried: whatTried.trim(),
            why_applying: whyApplying.trim(),
          }
        : undefined;

      await onCreate({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        value_cents: value ? Math.round(parseFloat(value) * 100) : 0,
        stage_id: stageId,
        custom_fields,
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setValue('');
      setWebsiteUrl('');
      setTeamSize('');
      setAnnualRevenue('');
      setBiggestChallenge('');
      setWhatTried('');
      setWhyApplying('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">
              {isApplication ? 'Add Applicant' : 'Add Contact'}
            </h2>
            <p className="text-xs text-stone mt-0.5">Adding to: {stageName}</p>
          </div>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Email {isApplication ? '*' : ''}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className={inputClass}
                required={isApplication}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 123 456 789"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                {isApplication ? 'Business Name' : 'Company'}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={isApplication ? 'Business name' : 'Acme Inc'}
                className={inputClass}
              />
            </div>
            {!isApplication && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Deal Value (R)</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Application-specific fields */}
          {isApplication && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Team Size *</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Just me">Just me</option>
                    <option value="2-5">2-5</option>
                    <option value="6-10">6-10</option>
                    <option value="11-25">11-25</option>
                    <option value="26-50">26-50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Annual Revenue *</label>
                  <select
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Pre-revenue">Pre-revenue</option>
                    <option value="R0 - R500K">R0 - R500K</option>
                    <option value="R500K - R2M">R500K - R2M</option>
                    <option value="R2M - R10M">R2M - R10M</option>
                    <option value="R10M+">R10M+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Biggest Challenge *</label>
                <textarea
                  value={biggestChallenge}
                  onChange={(e) => setBiggestChallenge(e.target.value)}
                  placeholder="What's the biggest challenge in your business right now?"
                  rows={2}
                  className={inputClass + ' resize-none'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">What Have You Tried?</label>
                <textarea
                  value={whatTried}
                  onChange={(e) => setWhatTried(e.target.value)}
                  placeholder="What have you already tried to solve this?"
                  rows={2}
                  className={inputClass + ' resize-none'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Why Applying? *</label>
                <textarea
                  value={whyApplying}
                  onChange={(e) => setWhyApplying(e.target.value)}
                  placeholder="Why are you applying to work with us?"
                  rows={2}
                  className={inputClass + ' resize-none'}
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim() || (isApplication && !email.trim())}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : isApplication ? 'Add Applicant' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
