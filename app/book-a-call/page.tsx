'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface SlotsByDate {
  [date: string]: { time: string; iso: string }[];
}

interface AvailabilityData {
  durationMinutes: number;
  slots: SlotsByDate;
}

type Step = 'select' | 'form' | 'success';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BookACallPage() {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [step, setStep] = useState<Step>('select');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [meetLink, setMeetLink] = useState('');

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch('/api/book-a-call/availability');
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to load available times'); return; }
      setData(json);
      const dates = Object.keys(json.slots).sort();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        const d = new Date(dates[0] + 'T00:00:00');
        setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    let startDow = new Date(year, month, 1).getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calendarMonth]);

  const availableDates = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(Object.keys(data.slots));
  }, [data]);

  const dateStr = (day: number) => {
    const { year, month } = calendarMonth;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  const navMonth = (dir: -1 | 1) => {
    setCalendarMonth(prev => {
      let m = prev.month + dir, y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/book-a-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), selectedSlot, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to book call'); setConfirming(false); return; }
      setMeetLink(json.meetLink || '');
      setStep('success');
    } catch {
      setError('Network error. Please try again.');
      setConfirming(false);
    }
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayStr = new Date().toISOString().split('T')[0];
  const slots = selectedDate && data?.slots[selectedDate] ? data.slots[selectedDate] : [];

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">

      {/* Page background */}
      <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8 sm:py-12">

        {/* Logo */}
        <Link href="/" className="mb-8 font-serif font-bold text-[18px] text-dark tracking-wide">
          MANA<span className="font-sans text-[11px] font-normal text-stone ml-1.5 tracking-normal">MARKETING</span>
        </Link>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-9 h-9 border-[3px] border-stone/15 border-t-teal rounded-full animate-spin mx-auto mb-3" />
              <p className="text-stone text-[13px]">Loading available times...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && step !== 'success' && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/[0.06] p-8 text-center">
            <ExclamationCircleIcon className="w-12 h-12 mx-auto text-stone/25 mb-4" />
            <p className="text-charcoal font-medium text-[15px] mb-4">{error}</p>
            <button
              onClick={() => { setError(''); fetchAvailability(); }}
              className="px-5 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal-light transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/[0.06] p-8 text-center">
            <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-7 h-7 text-teal" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-1">You&apos;re booked!</h2>
            <p className="text-stone text-sm mb-5">
              A calendar invite has been sent to <span className="font-medium text-charcoal">{email}</span>
            </p>
            {selectedSlot && (
              <div className="bg-[#f5f5f0] rounded-xl p-4 mb-5 inline-block">
                <p className="text-charcoal font-medium text-sm">
                  {new Date(selectedSlot).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-teal font-bold text-xl mt-0.5">
                  {new Date(selectedSlot).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {meetLink && (
              <div className="mt-2">
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal-light transition-colors"
                >
                  <VideoCameraIcon className="w-4 h-4" />
                  Join Google Meet
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main booking card */}
        {!loading && !error && step !== 'success' && data && (
          <div className="w-full max-w-[540px]">
            <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">

              {/* Profile header */}
              <div className="px-6 pt-6 pb-5 bg-teal text-center rounded-t-2xl">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <span className="font-serif font-bold text-[15px] text-white">M</span>
                </div>
                <p className="text-white/70 text-[12px] font-medium tracking-wide uppercase mb-0.5">Mana Marketing</p>
                <h1 className="font-serif text-[22px] font-bold text-white leading-tight mb-3">
                  SkaleFlow Session
                </h1>
                <div className="flex items-center justify-center gap-4 text-white/70 text-[13px]">
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {data.durationMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <VideoCameraIcon className="w-3.5 h-3.5" />
                    Google Meet
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GlobeAltIcon className="w-3.5 h-3.5" />
                    {timezone.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* STEP: Select date & time */}
              {step === 'select' && (
                <div className="p-6">
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors">
                      <ChevronLeftIcon className="w-4 h-4 text-charcoal" />
                    </button>
                    <span className="text-[15px] font-semibold text-charcoal">{monthLabel}</span>
                    <button onClick={() => navMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors">
                      <ChevronRightIcon className="w-4 h-4 text-charcoal" />
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map(d => (
                      <div key={d} className="text-center text-[11px] font-semibold text-stone/60 uppercase tracking-wider py-2">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {calendarDays.map((day, i) => {
                      if (day === null) return <div key={`e-${i}`} className="h-10" />;
                      const ds = dateStr(day);
                      const available = availableDates.has(ds);
                      const selected = selectedDate === ds;
                      const today = ds === todayStr;

                      return (
                        <div key={ds} className="flex items-center justify-center h-10">
                          <button
                            disabled={!available}
                            onClick={() => { setSelectedDate(ds); setSelectedSlot(null); }}
                            className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all relative ${
                              selected
                                ? 'bg-teal text-white font-semibold shadow-sm'
                                : available
                                  ? 'text-charcoal hover:bg-teal/8 cursor-pointer'
                                  : 'text-stone/25 cursor-default'
                            }`}
                          >
                            {day}
                            {/* Availability dot */}
                            {available && !selected && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal" />
                            )}
                            {/* Today ring */}
                            {today && !selected && (
                              <span className="absolute inset-0 rounded-full ring-1 ring-teal/30 pointer-events-none" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  {selectedDate && slots.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-black/[0.06]">
                      <p className="text-[13px] font-semibold text-charcoal mb-3">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                        {slots.map(slot => (
                          <button
                            key={slot.iso}
                            onClick={() => { setSelectedSlot(slot.iso); setStep('form'); }}
                            className={`py-2.5 rounded-lg text-[13px] font-semibold border transition-all ${
                              selectedSlot === slot.iso
                                ? 'bg-teal text-white border-teal'
                                : 'text-teal border-teal/20 hover:border-teal hover:bg-teal/[0.04]'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && slots.length === 0 && (
                    <div className="mt-5 pt-5 border-t border-black/[0.06]">
                      <p className="text-stone text-[13px] text-center">No available times on this date.</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: Enter details */}
              {step === 'form' && (
                <div className="p-6">
                  <button
                    onClick={() => setStep('select')}
                    className="inline-flex items-center gap-1 text-[13px] text-stone font-medium mb-5 hover:text-charcoal transition-colors"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    Back
                  </button>

                  {/* Selected time summary */}
                  {selectedSlot && (
                    <div className="bg-[#f5f5f0] rounded-xl p-4 mb-6 text-center">
                      <p className="text-[13px] text-stone mb-0.5">
                        {new Date(selectedSlot).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-teal font-bold text-lg">
                        {new Date(selectedSlot).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}

                  <h2 className="text-[16px] font-bold text-charcoal mb-1">Enter your details</h2>
                  <p className="text-stone text-[13px] mb-5">We&apos;ll send the calendar invite to your email.</p>

                  <form onSubmit={handleConfirm} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-[13px] font-medium text-charcoal mb-1.5">Name *</label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-black/[0.12] bg-white text-charcoal placeholder:text-stone/35 text-[14px] focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-[13px] font-medium text-charcoal mb-1.5">Email *</label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-black/[0.12] bg-white text-charcoal placeholder:text-stone/35 text-[14px] focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={confirming}
                      className="w-full py-3 rounded-lg font-semibold text-[14px] bg-teal text-white hover:bg-teal-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {confirming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Event'
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Footer */}
            <p className="text-center text-stone/40 text-[11px] mt-5">
              Powered by <span className="text-teal/50 font-medium">Mana Marketing</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
