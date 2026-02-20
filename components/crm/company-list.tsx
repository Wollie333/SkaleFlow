'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
}

interface CompanyListProps {
  organizationId: string;
  onCreateClick: () => void;
}

export default function CompanyList({ organizationId, onCreateClick }: CompanyListProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const limit = 25;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchCompanies();
  }, [organizationId, page, search, industryFilter]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (industryFilter) params.append('industry', industryFilter);

      const response = await fetch(`/api/crm/companies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch companies');

      const data = await response.json();
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRowClick = (companyId: string) => {
    router.push(`/crm/companies/${companyId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/60 focus:ring-2 focus:ring-teal focus:border-teal"
          />
        </div>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium"
        >
          Add Company
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 bg-cream-warm rounded-lg border border-stone/10">
          <p className="text-stone">No companies found</p>
          <button
            onClick={onCreateClick}
            className="mt-4 text-teal hover:underline font-medium"
          >
            Create your first company
          </button>
        </div>
      ) : (
        <>
          <div className="bg-cream-warm rounded-lg border border-stone/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-cream border-b border-stone/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => handleRowClick(company.id)}
                    className="hover:bg-cream/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-charcoal">{company.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">{company.industry || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">{company.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">{company.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-teal hover:underline"
                          >
                            {company.website}
                          </a>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">{formatDate(company.created_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-cream-warm rounded-lg border border-stone/10">
              <div className="text-sm text-stone">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} companies
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          page === pageNum
                            ? 'bg-teal text-white'
                            : 'border border-stone/10 text-charcoal hover:bg-cream/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
