'use client';

import { PencilIcon, GlobeAltIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface CompanyDetailHeaderProps {
  company: Company;
  onEdit: () => void;
  contactsCount: number;
  dealsValue: number;
  activeDeals: number;
}

export default function CompanyDetailHeader({
  company,
  onEdit,
  contactsCount,
  dealsValue,
  activeDeals,
}: CompanyDetailHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-cream-warm rounded-lg border border-stone/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-charcoal mb-3">{company.name}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {company.industry && (
                <span className="px-3 py-1 bg-teal/10 text-teal rounded-full text-sm font-medium">
                  {company.industry}
                </span>
              )}
              {company.size && (
                <span className="px-3 py-1 bg-cream text-charcoal rounded-full text-sm font-medium">
                  {company.size}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-stone hover:text-teal transition-colors"
                >
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="text-sm">{company.website}</span>
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 text-stone hover:text-teal transition-colors"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  <span className="text-sm">{company.email}</span>
                </a>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-2 text-stone hover:text-teal transition-colors"
                >
                  <PhoneIcon className="h-5 w-5" />
                  <span className="text-sm">{company.phone}</span>
                </a>
              )}
            </div>

            {company.notes && (
              <div className="mt-4 p-4 bg-cream rounded-lg">
                <p className="text-sm text-stone">{company.notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 border border-stone/10 rounded-lg hover:bg-cream/50 transition-colors text-charcoal"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream-warm rounded-lg border border-stone/10 p-6">
          <div className="text-sm font-medium text-stone mb-1">Contacts</div>
          <div className="text-3xl font-bold text-charcoal">{contactsCount}</div>
        </div>
        <div className="bg-cream-warm rounded-lg border border-stone/10 p-6">
          <div className="text-sm font-medium text-stone mb-1">Total Deal Value</div>
          <div className="text-3xl font-bold text-teal">{formatCurrency(dealsValue)}</div>
        </div>
        <div className="bg-cream-warm rounded-lg border border-stone/10 p-6">
          <div className="text-sm font-medium text-stone mb-1">Active Deals</div>
          <div className="text-3xl font-bold text-gold">{activeDeals}</div>
        </div>
      </div>
    </div>
  );
}
