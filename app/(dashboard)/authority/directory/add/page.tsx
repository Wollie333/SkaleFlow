'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DirectoryAddContactForm } from '@/components/authority/directory/directory-add-contact-form';
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function AddDirectoryContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/authority/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to add contact');
        return;
      }

      const contact = await res.json();
      router.push(`/authority/directory/${contact.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/authority/directory')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to PR Directory
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpenIcon className="h-7 w-7 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Contact to Directory</h1>
          <p className="text-sm text-gray-500">This contact will be visible to all SkaleFlow members</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DirectoryAddContactForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
