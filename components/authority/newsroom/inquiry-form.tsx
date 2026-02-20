'use client';

import { useState } from 'react';

interface InquiryFormProps {
  organizationId: string;
  storyAngles: Array<{ id: string; title: string }>;
  primaryColor?: string;
}

export function InquiryForm({ organizationId, storyAngles, primaryColor = '#14b8a6' }: InquiryFormProps) {
  const [form, setForm] = useState({
    journalist_name: '',
    journalist_outlet: '',
    journalist_email: '',
    journalist_phone: '',
    topic_of_interest: '',
    preferred_format: '',
    deadline: '',
    additional_notes: '',
    story_angle_id: '',
    honeypot: '', // Hidden field
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/authority/newsroom/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organization_id: organizationId }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit inquiry');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="inquiry" className="py-12 px-6 bg-cream">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Thank You!</h2>
          <p className="text-sm text-stone">Your inquiry has been received. We will get back to you shortly.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="inquiry" className="py-12 px-6 bg-cream">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2 text-center">Press Inquiries</h2>
        <p className="text-sm text-stone text-center mb-8">
          Interested in a story? Fill out the form below and we will be in touch.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot */}
          <input
            type="text"
            name="company"
            value={form.honeypot}
            onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={form.journalist_name}
                onChange={(e) => setForm({ ...form, journalist_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Outlet / Publication *</label>
              <input
                type="text"
                required
                value={form.journalist_outlet}
                onChange={(e) => setForm({ ...form, journalist_outlet: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.journalist_email}
                onChange={(e) => setForm({ ...form, journalist_email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Phone</label>
              <input
                type="tel"
                value={form.journalist_phone}
                onChange={(e) => setForm({ ...form, journalist_phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Topic of Interest *</label>
            <input
              type="text"
              required
              value={form.topic_of_interest}
              onChange={(e) => setForm({ ...form, topic_of_interest: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>

          {storyAngles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Related Story Angle</label>
              <select
                value={form.story_angle_id}
                onChange={(e) => setForm({ ...form, story_angle_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="">Select an angle (optional)</option>
                {storyAngles.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Preferred Format</label>
              <select
                value={form.preferred_format}
                onChange={(e) => setForm({ ...form, preferred_format: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="">Select format</option>
                <option value="interview">Interview</option>
                <option value="written_response">Written Response</option>
                <option value="podcast">Podcast</option>
                <option value="video">Video</option>
                <option value="panel">Panel / Speaking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Additional Notes</label>
            <textarea
              rows={3}
              value={form.additional_notes}
              onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </section>
  );
}
