'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface SlotsByDate {
  [date: string]: { time: string; iso: string }[];
}

interface AvailabilityData {
  applicantName: string;
  businessName: string;
  durationMinutes: number;
  slots: SlotsByDate;
}

export default function BookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [meetLink, setMeetLink] = useState('');

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/availability?token=${token}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load booking page');
        if (json.meetLink) setMeetLink(json.meetLink);
        return;
      }

      setData(json);

      // Auto-select first date with slots
      const dates = Object.keys(json.slots).sort();
      if (dates.length > 0) setSelectedDate(dates[0]);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selectedSlot,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to book meeting');
        setConfirming(false);
        return;
      }

      setMeetLink(json.meetLink || '');
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
      setConfirming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.toLocaleDateString('en-ZA', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-ZA', { month: 'short' }),
    };
  };

  const sortedDates = data ? Object.keys(data.slots).sort() : [];

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-teal/10">
        <div className="max-w-[1060px] mx-auto flex items-center justify-between h-[60px] px-6">
          <Link href="/" className="font-serif font-bold text-[17px] text-cream tracking-wide">
            MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
          </Link>
          <span className="inline-flex items-center px-5 py-2 rounded-md text-sm font-semibold bg-teal text-cream tracking-wide">
            Book a Call
          </span>
        </div>
      </nav>

      <main className="pt-[60px]">
        {/* Loading */}
        {loading && (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-[3px] border-stone/15 border-t-teal rounded-full animate-spin mx-auto mb-4" />
              <p className="text-stone text-sm">Loading available times...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && !success && (
          <div className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <ExclamationCircleIcon className="w-16 h-16 mx-auto text-stone/30 mb-6" />
              <h2 className="font-serif text-2xl font-bold text-charcoal mb-3">{error}</h2>
              {meetLink && (
                <div className="mt-4">
                  <p className="text-stone text-sm mb-3">Your meeting is already booked. Here&apos;s your link:</p>
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-cream rounded-lg font-semibold hover:bg-teal-light transition-colors"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                    Join Google Meet
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-teal" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-charcoal mb-3">You&apos;re booked!</h2>
              <p className="text-stone text-[15px] mb-2">
                Your onboarding call has been confirmed. You&apos;ll receive a calendar invite shortly.
              </p>
              {selectedSlot && (
                <p className="text-charcoal font-semibold mb-6">
                  {new Date(selectedSlot).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {meetLink && (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-cream rounded-lg font-semibold hover:bg-teal-light transition-colors"
                >
                  <VideoCameraIcon className="w-5 h-5" />
                  Open Google Meet Link
                </a>
              )}
              <p className="text-stone/60 text-xs mt-6">
                Save this Meet link — you&apos;ll also get it via email.
              </p>
            </div>
          </div>
        )}

        {/* Booking UI */}
        {!loading && !error && !success && data && (
          <>
            {/* Hero */}
            <section className="bg-dark relative overflow-hidden">
              <div className="absolute -top-[40%] -left-[25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.06)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <div className="hidden md:block absolute top-6 left-6 w-[60px] h-[60px] border-t-2 border-l-2 border-gold/15 pointer-events-none" />
              <div className="hidden md:block absolute bottom-6 right-6 w-[60px] h-[60px] border-b-2 border-r-2 border-gold/15 pointer-events-none" />

              <div className="relative z-10 max-w-[780px] mx-auto px-6 py-16 text-center">
                <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-4">
                  Onboarding Call
                </div>
                <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.15] mb-4">
                  Hi {data.applicantName}, pick a time for your call.
                </h1>
                <div className="flex items-center justify-center gap-4 text-cream/60 text-sm">
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    {data.durationMinutes} minutes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VideoCameraIcon className="w-4 h-4" />
                    Google Meet
                  </span>
                </div>
              </div>
            </section>

            {/* Date/Slot Picker */}
            <section className="py-12 bg-cream">
              <div className="max-w-[700px] mx-auto px-6">
                {/* Day Pills */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                  {sortedDates.map((dateStr) => {
                    const { day, date, month } = formatDate(dateStr);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`flex flex-col items-center min-w-[72px] px-4 py-3 rounded-xl text-center transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-teal text-cream shadow-md'
                            : 'bg-white text-charcoal border border-stone/10 hover:border-teal/30'
                        }`}
                      >
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-cream/70' : 'text-stone'}`}>
                          {day}
                        </span>
                        <span className="text-lg font-bold">{date}</span>
                        <span className={`text-[11px] ${isSelected ? 'text-cream/70' : 'text-stone'}`}>
                          {month}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {selectedDate && data.slots[selectedDate] && (
                  <div>
                    <h3 className="text-sm font-semibold text-stone uppercase tracking-wider mb-3">
                      Available Times (SAST)
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {data.slots[selectedDate].map((slot) => {
                        const isSelected = selectedSlot === slot.iso;
                        return (
                          <button
                            key={slot.iso}
                            onClick={() => setSelectedSlot(slot.iso)}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-teal text-cream shadow-md'
                                : 'bg-white text-charcoal border border-stone/10 hover:border-teal/30 hover:bg-teal/5'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Confirm Button */}
                {selectedSlot && (
                  <div className="mt-8 text-center">
                    <div className="mb-4 p-4 bg-white rounded-xl border border-teal/10">
                      <p className="text-sm text-stone mb-1">Selected time:</p>
                      <p className="text-charcoal font-semibold">
                        {new Date(selectedSlot).toLocaleDateString('en-ZA', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-md font-semibold text-base bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin mr-2" />
                          Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 bg-dark border-t border-teal/[0.08]">
        <div className="max-w-[1060px] mx-auto text-center">
          <p className="text-[13px] text-stone">
            &copy; {new Date().getFullYear()} <span className="text-teal">Mana Marketing</span> &middot; Sabie, Mpumalanga, South Africa
          </p>
        </div>
      </footer>
    </div>
  );
}
