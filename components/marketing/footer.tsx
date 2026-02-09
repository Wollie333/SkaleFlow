import Link from 'next/link';

export function MarketingFooter() {
  return (
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
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-[13px] text-stone hover:text-cream transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[13px] text-stone hover:text-cream transition-colors">Terms of Service</Link>
          <p className="text-[13px] text-stone">SkaleFlow&trade; is a trademark of Mana Marketing</p>
        </div>
      </div>
    </footer>
  );
}
