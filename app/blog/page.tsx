'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';

const categories = ['All', 'Clarity', 'Systems', 'Growth', 'Mindset'];

const posts = [
  {
    title: 'The Clarity Shortcut Everyone Ignores',
    category: 'Clarity',
    readTime: '5 min',
    excerpt:
      'Most founders skip the one step that would save them months of wasted effort. Here\'s what clarity actually looks like in practice.',
  },
  {
    title: 'Tactics vs. Systems: Why One Fails and One Compounds',
    category: 'Systems',
    readTime: '7 min',
    excerpt:
      'You don\'t have a marketing problem. You have a systems problem. Learn why tactics expire and systems compound.',
  },
  {
    title: 'From R0 to R291K: The Wholistic Case Study',
    category: 'Growth',
    readTime: '10 min',
    excerpt:
      'A deep dive into how one founder-led brand went from zero to R291K in revenue using the SkaleFlow methodology.',
  },
  {
    title: 'You\'re Not the Problem. The Advice Was.',
    category: 'Mindset',
    readTime: '4 min',
    excerpt:
      'Why most business advice fails founder-led brands -- and what to listen to instead.',
  },
  {
    title: 'The 3 Things Every Founder-Led Brand Needs',
    category: 'Clarity',
    readTime: '6 min',
    excerpt:
      'Before you hire, before you scale, before you spend another cent on ads -- get these three things right.',
  },
  {
    title: 'Hard Work Isn\'t the Answer (Structured Smart Work Is)',
    category: 'Mindset',
    readTime: '5 min',
    excerpt:
      'Hustle culture lied to you. Here\'s what actually moves the needle when you\'re building something real.',
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* 1. Navigation */}
      <MarketingNav />

      {/* 2. Hero */}
      <Hero
        label="Insights & Resources"
        title="Insights for founders who refuse to stay stuck."
        subtitle="Strategy, clarity, and growth -- without the fluff."
      />

      {/* 3. Main Content */}
      <section className="bg-cream py-20">
        <div className="max-w-[1060px] mx-auto px-6">
          {/* Category Filter */}
          <div className="flex gap-3 flex-wrap mb-12 items-center">
            <span className="text-stone text-xs font-semibold">Filter by:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-teal text-cream'
                    : 'border border-teal/15 text-charcoal hover:bg-teal hover:text-cream'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Post + Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 mb-16">
            {/* Featured Post Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-teal/[0.08]">
              <div className="h-[280px] bg-dark relative">
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="inline-block px-3 py-1 bg-gold text-dark text-[11px] font-bold uppercase tracking-wider rounded">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-serif text-xl font-bold text-charcoal mb-3 leading-snug">
                  <Link href="#" className="hover:text-teal transition-colors">
                    Why Most Founders Stay Stuck (And How to Break Free)
                  </Link>
                </h3>
                <p className="text-sm text-[#666] leading-relaxed mb-5">
                  The real reason growth stalls isn&apos;t a lack of effort -- it&apos;s a lack of
                  structure. In this deep-dive, we break down the patterns that keep
                  founder-led brands spinning their wheels and the system that changes
                  everything.
                </p>
                <Link
                  href="#"
                  className="text-sm font-semibold text-teal hover:text-teal-light transition-colors"
                >
                  Read Article &rarr;
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Categories Card */}
              <div className="bg-white rounded-xl p-7 border border-teal/[0.08] mb-6">
                <h4 className="text-[13px] font-semibold text-charcoal tracking-wider uppercase mb-4">
                  Categories
                </h4>
                <ul className="space-y-2.5">
                  {['Clarity', 'Systems', 'Growth', 'Mindset'].map((cat) => (
                    <li key={cat}>
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveCategory(cat);
                        }}
                        className="text-sm text-stone hover:text-teal transition-colors"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Articles Card */}
              <div className="bg-white rounded-xl p-7 border border-teal/[0.08]">
                <h4 className="text-[13px] font-semibold text-charcoal tracking-wider uppercase mb-4">
                  Popular Articles
                </h4>
                <ul className="space-y-3">
                  {[
                    'From R0 to R291K: The Wholistic Case Study',
                    'Tactics vs. Systems: Why One Fails and One Compounds',
                    'The Clarity Shortcut Everyone Ignores',
                  ].map((title) => (
                    <li key={title}>
                      <Link
                        href="#"
                        className="text-sm text-stone hover:text-teal transition-colors leading-relaxed"
                      >
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {filteredPosts.map((post) => (
              <div
                key={post.title}
                className="bg-white rounded-xl overflow-hidden border border-teal/[0.08] hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                {/* Image Area */}
                <div className="h-[180px] bg-dark-light relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block px-2.5 py-1 bg-dark/80 text-cream text-[10px] font-bold uppercase tracking-widest rounded">
                      {post.category}
                    </span>
                  </div>
                </div>
                {/* Body */}
                <div className="p-6">
                  <h3 className="text-[18px] font-semibold text-charcoal leading-snug mb-2">
                    <Link href="#" className="hover:text-teal transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-[14px] text-[#666] leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <p className="text-[12px] text-stone">
                    {post.readTime} read
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Newsletter Section */}
      <section className="bg-cream-warm py-20">
        <div className="max-w-[780px] mx-auto px-6">
          <div className="bg-dark rounded-2xl p-12 text-center">
            <h2 className="font-serif text-[clamp(24px,3.5vw,36px)] font-bold text-cream mb-4">
              Want clarity delivered to your inbox?
            </h2>
            <p className="text-cream/70 text-base mb-8 max-w-[480px] mx-auto leading-relaxed">
              Subscribe for insights that help founder-led brands grow with structure, not guesswork. No spam. Just signal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-[460px] mx-auto">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 px-5 py-3.5 rounded-lg bg-dark-light text-cream border border-teal/15 text-sm placeholder:text-stone focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 transition-all"
              />
              <button className="px-7 py-3.5 bg-gold text-dark font-semibold text-sm rounded-lg hover:bg-gold-light hover:-translate-y-px transition-all whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA */}
      <section className="bg-cream-warm py-20 border-t border-teal/[0.08]">
        <div className="max-w-[780px] mx-auto px-6 text-center">
          <h2 className="font-serif text-[clamp(26px,4vw,40px)] font-bold text-charcoal mb-4">
            Ready for more than insights?
          </h2>
          <p className="text-base text-stone max-w-[480px] mx-auto leading-relaxed mb-8">
            If you&apos;re done reading and ready to build, let&apos;s talk.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center px-8 py-4 rounded-md font-semibold text-base bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* 6. Footer */}
      <MarketingFooter />
    </div>
  );
}
