'use client';

import { useState } from 'react';
import CreateCallModal from '@/components/calls/create-call-modal';

export default function CallsPageClient() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 transition-colors"
      >
        New Call
      </button>
      <CreateCallModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
