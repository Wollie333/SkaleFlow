'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    website_url: '',
    team_size: '',
    annual_revenue: '',
    biggest_challenge: '',
    what_tried: '',
    why_applying: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setSubmitting(false);
        return;
      }

      router.push(`/apply/thank-you?email=${encodeURIComponent(formData.email)}`);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-teal/10">
        <div className="max-w-[1060px] mx-auto flex items-center justify-between h-[60px] px-6">
          <Link href="/" className="font-serif font-bold text-[17px] text-cream tracking-wide">
            MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-sm text-cream/70 hover:text-cream transition-colors">About</Link>
            <Link href="/skaleflow" className="text-sm text-cream/70 hover:text-cream transition-colors">SkaleFlow</Link>
            <Link href="/problems" className="text-sm text-cream/70 hover:text-cream transition-colors">Problems We Solve</Link>
            <Link href="/results" className="text-sm text-cream/70 hover:text-cream transition-colors">Results</Link>
          </div>
          <span className="inline-flex items-center px-5 py-2 rounded-md text-sm font-semibold bg-gold text-dark tracking-wide">
            Applying
          </span>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-[50vh] flex items-center bg-dark relative overflow-hidden pt-[60px]">
        {/* Radial glow */}
        <div className="absolute -top-[40%] -left-[25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.06)_0%,transparent_70%)] pointer-events-none" />
        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        {/* Corner marks */}
        <div className="hidden md:block absolute top-20 left-6 w-[60px] h-[60px] border-t-2 border-l-2 border-gold/15 pointer-events-none" />
        <div className="hidden md:block absolute bottom-6 right-6 w-[60px] h-[60px] border-b-2 border-r-2 border-gold/15 pointer-events-none" />

        <div className="relative z-10 max-w-[780px] mx-auto px-6 py-20 md:py-24 text-center">
          <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Apply for SkaleFlow
          </div>
          <h1 className="font-serif text-[clamp(34px,5vw,50px)] font-bold text-cream leading-[1.15] mb-5 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            Let&apos;s see if SkaleFlow is right for you.
          </h1>
          <p className="text-[17px] text-cream/70 max-w-[480px] mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.7s' }}>
            This is an application — not a sales call. We only work with founders who are ready to build something that lasts.
          </p>
        </div>
      </section>

      {/* QUALIFIER */}
      <section className="py-20 bg-cream">
        <div className="max-w-[780px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* YES card */}
            <div className="p-7 rounded-xl bg-white border border-teal/10">
              <h3 className="text-base font-semibold text-teal mb-4">SkaleFlow is for you if:</h3>
              <ul className="space-y-1.5">
                {[
                  "You're the founder of a business generating revenue",
                  'You have a team of 3-10 people depending on you',
                  'Growth has stalled and marketing feels like guesswork',
                  "You've invested in marketing before and been disappointed",
                  "You're ready for a system, not another tactic",
                ].map((item, i) => (
                  <li key={i} className="text-sm text-[#555] pl-6 relative">
                    <span className="absolute left-0 text-teal font-bold">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* NO card */}
            <div className="p-7 rounded-xl bg-cream-warm border border-charcoal/5">
              <h3 className="text-base font-semibold text-stone mb-4">This is NOT for you if:</h3>
              <ul className="space-y-1.5">
                {[
                  "You're just starting out with no revenue yet",
                  'You want magic — overnight results or viral hacks',
                  "You're looking for someone to blame when things get hard",
                  "You're not willing to invest seriously in your foundation",
                ].map((item, i) => (
                  <li key={i} className="text-sm text-[#555] pl-6 relative">
                    <span className="absolute left-0 text-stone font-bold">&times;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* STEPS */}
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">What happens next</div>
          <div className="flex flex-col gap-4 mb-12">
            {[
              { title: 'Submit your application', desc: 'Tell us about your business and where you\'re stuck.' },
              { title: 'We review it', desc: 'We look at every application personally. No bots. No assistants.' },
              { title: 'If it\'s a fit, we talk', desc: 'A short call to see if SkaleFlow is the right solution for you.' },
              { title: 'If not, no pressure', desc: 'We\'ll tell you honestly. No awkward sales tactics.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start p-5 bg-white rounded-xl border border-teal/[0.08]">
                <div className="w-8 h-8 bg-teal text-cream rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-charcoal mb-1">{step.title}</h4>
                  <p className="text-sm text-[#666] leading-relaxed m-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Submitting Modal */}
      {submitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-sm w-full mx-6 text-center">
            <div className="w-12 h-12 border-[3px] border-stone/15 border-t-teal rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Sending your application...</h3>
            <p className="text-sm text-stone">This will only take a moment.</p>
          </div>
        </div>
      )}

      {/* FORM */}
      <section className="py-20 bg-cream-warm">
        <div className="max-w-[560px] mx-auto px-6">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-teal/[0.08] shadow-[0_8px_40px_rgba(15,31,29,0.04)]">
              <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-bold text-center mb-8">Tell us about your business.</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-semibold text-charcoal mb-2">Your Name *</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      required
                      placeholder="Full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-charcoal mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="+27 ..."
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone"
                    />
                  </div>
                  <div>
                    <label htmlFor="business_name" className="block text-sm font-semibold text-charcoal mb-2">Business Name *</label>
                    <input
                      type="text"
                      id="business_name"
                      name="business_name"
                      required
                      placeholder="Your company"
                      value={formData.business_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="website_url" className="block text-sm font-semibold text-charcoal mb-2">Website URL (if you have one)</label>
                  <input
                    type="url"
                    id="website_url"
                    name="website_url"
                    placeholder="https://..."
                    value={formData.website_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="team_size" className="block text-sm font-semibold text-charcoal mb-2">How many people on your team? *</label>
                    <select
                      id="team_size"
                      name="team_size"
                      required
                      value={formData.team_size}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10"
                    >
                      <option value="">Select...</option>
                      <option value="1-2">Just me / 1-2 people</option>
                      <option value="3-5">3-5 people</option>
                      <option value="6-10">6-10 people</option>
                      <option value="10+">More than 10</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="annual_revenue" className="block text-sm font-semibold text-charcoal mb-2">Approximate annual revenue? *</label>
                    <select
                      id="annual_revenue"
                      name="annual_revenue"
                      required
                      value={formData.annual_revenue}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10"
                    >
                      <option value="">Select...</option>
                      <option value="<500k">Under R500K</option>
                      <option value="500k-1m">R500K - R1M</option>
                      <option value="1m-3m">R1M - R3M</option>
                      <option value="3m-10m">R3M - R10M</option>
                      <option value="10m+">R10M+</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="biggest_challenge" className="block text-sm font-semibold text-charcoal mb-2">What&apos;s your biggest challenge right now? *</label>
                  <textarea
                    id="biggest_challenge"
                    name="biggest_challenge"
                    required
                    placeholder="Be specific — what's keeping you stuck?"
                    value={formData.biggest_challenge}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone min-h-[120px] resize-y"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="what_tried" className="block text-sm font-semibold text-charcoal mb-2">What have you tried that didn&apos;t work?</label>
                  <textarea
                    id="what_tried"
                    name="what_tried"
                    placeholder="Agencies, courses, tactics — what fell short?"
                    value={formData.what_tried}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone min-h-[120px] resize-y"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="why_applying" className="block text-sm font-semibold text-charcoal mb-2">Why are you applying now? *</label>
                  <textarea
                    id="why_applying"
                    name="why_applying"
                    required
                    placeholder="What's changed? What made you reach out today?"
                    value={formData.why_applying}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border border-teal/15 rounded-lg font-sans text-[15px] text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone min-h-[120px] resize-y"
                  />
                </div>

                <div className="text-center mt-8">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center w-full max-w-[300px] px-8 py-4 rounded-md font-semibold text-base bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>

                <p className="text-center mt-5 text-[13px] text-stone leading-relaxed">
                  We read every application. If SkaleFlow isn&apos;t the right fit, we&apos;ll tell you — and point you in a better direction if we can. No pressure. No games.
                </p>
              </form>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 bg-dark border-t border-teal/[0.08]">
        <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12">
          <div>
            <div className="font-serif font-bold text-[17px] text-cream tracking-wide mb-4">
              MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
            </div>
            <p className="text-sm text-stone max-w-[280px] leading-relaxed">
              Strategic growth partner for founder-led brands. We build systems that work — so you can stop guessing and start growing.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-cream tracking-wider uppercase mb-5">Navigate</h4>
            <div className="flex flex-col gap-1.5">
              <Link href="/about" className="text-sm text-stone hover:text-cream transition-colors py-1">About</Link>
              <Link href="/skaleflow" className="text-sm text-stone hover:text-cream transition-colors py-1">SkaleFlow</Link>
              <Link href="/problems" className="text-sm text-stone hover:text-cream transition-colors py-1">Problems We Solve</Link>
              <Link href="/results" className="text-sm text-stone hover:text-cream transition-colors py-1">Results</Link>
              <Link href="/blog" className="text-sm text-stone hover:text-cream transition-colors py-1">Insights</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-cream tracking-wider uppercase mb-5">Connect</h4>
            <div className="flex flex-col gap-1.5">
              <Link href="/apply" className="text-sm text-stone hover:text-cream transition-colors py-1">Apply Now</Link>
              <a href="mailto:hello@manamarketing.co.za" className="text-sm text-stone hover:text-cream transition-colors py-1">Email Us</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1060px] mx-auto mt-10 pt-6 border-t border-teal/[0.08] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[13px] text-stone">&copy; 2026 <span className="text-teal">Mana Marketing</span> &middot; Sabie, Mpumalanga, South Africa</p>
          <p className="text-[13px] text-stone">SkaleFlow&trade; is a trademark of Mana Marketing</p>
        </div>
      </footer>
    </div>
  );
}
