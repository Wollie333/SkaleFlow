'use client';

import { useState, useEffect, use } from 'react';

interface BookingPageData {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  available_durations: number[];
  available_hours: { start: string; end: string; timezone: string; days: number[] };
  buffer_minutes: number;
  max_advance_days: number;
  intake_questions: Array<{ id: string; label: string; type: string; required: boolean }>;
  branding: { logo_url?: string; primary_color?: string; accent_color?: string; company_name?: string };
  default_call_type: string;
  is_active: boolean;
}

interface TimeSlot {
  start: string;
  end: string;
}

type BookingStep = 'date' | 'time' | 'details' | 'confirmed';

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState<BookingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>('date');

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [intakeResponses, setIntakeResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Load booking page
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/calls/booking-pages/public?slug=${slug}`);
        if (!res.ok) throw new Error('Booking page not found');
        const data = await res.json();
        setPage(data);
        if (data.available_durations?.length > 0) {
          setSelectedDuration(data.available_durations[0]);
        }
      } catch {
        setError('This booking page is not available.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Load slots when date + duration selected
  useEffect(() => {
    if (!selectedDate || !page) return;
    setSlotsLoading(true);
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    fetch(`/api/calls/bookings/availability?bookingPageId=${page.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&duration=${selectedDuration}`)
      .then(r => r.json())
      .then(data => {
        setSlots(Array.isArray(data) ? data : []);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlots([]);
        setSlotsLoading(false);
      });
  }, [selectedDate, selectedDuration, page]);

  // Generate 14 days
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < (page?.max_advance_days || 14); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Only include days that are in the available_hours.days config
    if (page?.available_hours?.days?.includes(d.getDay())) {
      days.push(d);
    }
    if (days.length >= 14) break;
  }

  async function handleSubmit() {
    if (!page || !selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/calls/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingPageId: page.id,
          guestName,
          guestEmail,
          guestCompany: guestCompany || undefined,
          guestNotes: guestNotes || undefined,
          scheduledTime: selectedSlot.start,
          durationMin: selectedDuration,
          intakeResponses,
        }),
      });
      if (!res.ok) throw new Error('Booking failed');
      const data = await res.json();
      setRoomCode(data.roomCode);
      setStep('confirmed');
    } catch {
      setError('Failed to book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const primaryColor = page?.branding?.primary_color || '#1E6B63';
  const accentColor = page?.branding?.accent_color || '#C9A84C';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="animate-pulse text-[#1E6B63] text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2A2A28] mb-2">Page Not Found</h1>
          <p className="text-[#8A8A7A]">{error || 'This booking page does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      {/* Header */}
      <div className="bg-[#0F1F1D] py-6">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {page.branding?.logo_url && (
            <img src={page.branding.logo_url} alt="" className="h-10 mx-auto mb-3" />
          )}
          <h1 className="text-xl font-serif font-bold text-[#FAF9F5]">
            {page.branding?.company_name || page.title}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-[#1E6B63]/10 shadow-sm overflow-hidden">
          {/* Title */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#2A2A28]">{page.title}</h2>
            {page.description && (
              <p className="text-sm text-[#8A8A7A] mt-1">{page.description}</p>
            )}
          </div>

          <div className="p-6">
            {/* Step: Date Selection */}
            {step === 'date' && (
              <div>
                {/* Duration selector */}
                {page.available_durations.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#2A2A28] mb-2">Duration</label>
                    <div className="flex gap-2">
                      {page.available_durations.map((d: number) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDuration(d)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedDuration === d
                              ? 'text-white'
                              : 'bg-gray-100 text-[#555] hover:bg-gray-200'
                          }`}
                          style={selectedDuration === d ? { backgroundColor: primaryColor } : {}}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar grid */}
                <label className="block text-sm font-medium text-[#2A2A28] mb-2">Select a date</label>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedSlot(null);
                        }}
                        className={`p-2 rounded-lg text-center text-sm transition-colors ${
                          isSelected
                            ? 'text-white font-semibold'
                            : 'hover:bg-gray-100 text-[#555]'
                        }`}
                        style={isSelected ? { backgroundColor: primaryColor } : {}}
                      >
                        <div className="text-xs opacity-70">
                          {day.toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                        <div className="font-medium">{day.getDate()}</div>
                        <div className="text-xs opacity-70">
                          {day.toLocaleDateString('en', { month: 'short' })}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-[#2A2A28] mb-2">
                      Available times for {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </label>
                    {slotsLoading ? (
                      <div className="text-sm text-[#8A8A7A] animate-pulse">Loading available times...</div>
                    ) : slots.length === 0 ? (
                      <div className="text-sm text-[#8A8A7A]">No available times on this date.</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          const time = new Date(slot.start);
                          return (
                            <button
                              key={slot.start}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setStep('details');
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : 'border border-gray-200 text-[#555] hover:border-[#1E6B63]/30'
                              }`}
                              style={isSelected ? { backgroundColor: primaryColor } : {}}
                            >
                              {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step: Details Form */}
            {step === 'details' && (
              <div>
                <button
                  onClick={() => setStep('date')}
                  className="text-sm text-[#1E6B63] hover:underline mb-4 inline-flex items-center gap-1"
                >
                  &larr; Back to dates
                </button>

                {selectedSlot && (
                  <div className="mb-6 p-3 rounded-lg bg-[#1E6B63]/5 text-sm text-[#2A2A28]">
                    <strong>{new Date(selectedSlot.start).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    {' at '}
                    <strong>{new Date(selectedSlot.start).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
                    {' \u00B7 '}{selectedDuration} min
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A28] mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A28] mb-1">Email *</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A28] mb-1">Company</label>
                    <input
                      type="text"
                      value={guestCompany}
                      onChange={(e) => setGuestCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                    />
                  </div>

                  {/* Custom intake questions */}
                  {page.intake_questions?.map((q: { id: string; label: string; type: string; required: boolean }) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-[#2A2A28] mb-1">
                        {q.label} {q.required && '*'}
                      </label>
                      {q.type === 'textarea' ? (
                        <textarea
                          value={intakeResponses[q.id] || ''}
                          onChange={(e) => setIntakeResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                          rows={3}
                          required={q.required}
                        />
                      ) : (
                        <input
                          type="text"
                          value={intakeResponses[q.id] || ''}
                          onChange={(e) => setIntakeResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                          required={q.required}
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-[#2A2A28] mb-1">Additional Notes</label>
                    <textarea
                      value={guestNotes}
                      onChange={(e) => setGuestNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                      rows={3}
                      placeholder="Anything you'd like us to know before the call..."
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!guestName || !guestEmail || submitting}
                    className="w-full py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColor, color: '#0F1F1D' }}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Confirmation */}
            {step === 'confirmed' && selectedSlot && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                  <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2A2A28] mb-2">You&apos;re booked!</h3>
                <p className="text-sm text-[#8A8A7A] mb-4">
                  {new Date(selectedSlot.start).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {new Date(selectedSlot.start).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="text-sm text-[#555] mb-6">
                  A confirmation email has been sent to <strong>{guestEmail}</strong>.
                  You&apos;ll receive a reminder 30 minutes before the call.
                </p>
                {roomCode && (
                  <a
                    href={`/call/${roomCode}`}
                    className="inline-block px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
                    style={{ backgroundColor: accentColor, color: '#0F1F1D' }}
                  >
                    Save Call Link
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
