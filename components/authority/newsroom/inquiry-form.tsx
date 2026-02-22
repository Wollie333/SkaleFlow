'use client';

import { useState } from 'react';

interface InquiryFormProps {
  organizationId: string;
  orgName: string;
  storyAngles: Array<{ id: string; title: string }>;
  primaryColor?: string;
  darkBase?: string;
  accentColor?: string;
}

export function InquiryForm({ organizationId, orgName, storyAngles, primaryColor = '#14b8a6', darkBase = '#0a0f0e', accentColor }: InquiryFormProps) {
  const accent = accentColor || primaryColor;
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
    honeypot: '',
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

  const inputClass =
    'w-full px-4 py-3 text-sm bg-white border border-stone/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone/20 focus:border-stone/20 transition-all duration-200 placeholder:text-stone/30 text-charcoal';

  if (submitted) {
    return (
      <section
        id="inquiry"
        className="relative py-20 md:py-24 px-5 overflow-hidden"
        style={{ backgroundColor: darkBase }}
      >
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">Thank You!</h2>
          <p className="text-sm sm:text-base text-white/50">
            Your inquiry has been received. We will get back to you shortly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="inquiry"
      className="relative py-16 md:py-24 px-5 overflow-hidden"
      style={{ backgroundColor: darkBase }}
    >
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* Info Panel */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <span
              className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3 block"
              style={{ color: primaryColor }}
            >
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Press Inquiries
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              Interested in covering {orgName}? We would love to hear from you.
              Fill out the form and our team will respond within 24 hours.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 lg:justify-start justify-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-white/40">Response within 24 hours</span>
              </div>
              <div className="flex items-center gap-3 lg:justify-start justify-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-sm text-white/40">Available for interviews</span>
              </div>
              <div className="flex items-center gap-3 lg:justify-start justify-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <span className="text-sm text-white/40">Press kits and assets ready</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 md:p-8 rounded-2xl border border-white/15"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
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

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.journalist_name}
                      onChange={(e) => setForm({ ...form, journalist_name: e.target.value })}
                      className={inputClass}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Outlet / Publication *</label>
                    <input
                      type="text"
                      required
                      value={form.journalist_outlet}
                      onChange={(e) => setForm({ ...form, journalist_outlet: e.target.value })}
                      className={inputClass}
                      placeholder="The Times"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.journalist_email}
                      onChange={(e) => setForm({ ...form, journalist_email: e.target.value })}
                      className={inputClass}
                      placeholder="jane@publication.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.journalist_phone}
                      onChange={(e) => setForm({ ...form, journalist_phone: e.target.value })}
                      className={inputClass}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Topic of Interest *</label>
                  <input
                    type="text"
                    required
                    value={form.topic_of_interest}
                    onChange={(e) => setForm({ ...form, topic_of_interest: e.target.value })}
                    className={inputClass}
                    placeholder="What would you like to cover?"
                  />
                </div>

                {storyAngles.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Related Story Angle</label>
                    <select
                      value={form.story_angle_id}
                      onChange={(e) => setForm({ ...form, story_angle_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select an angle (optional)</option>
                      {storyAngles.map((a) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Preferred Format</label>
                    <select
                      value={form.preferred_format}
                      onChange={(e) => setForm({ ...form, preferred_format: e.target.value })}
                      className={inputClass}
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
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Deadline</label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Additional Notes</label>
                  <textarea
                    rows={3}
                    value={form.additional_notes}
                    onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder="Any additional context for your inquiry..."
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 text-sm font-semibold text-white rounded-xl transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Inquiry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
