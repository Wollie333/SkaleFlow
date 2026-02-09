'use client';

import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

export default function TermsOfServicePage() {
  return (
    <>
      <MarketingNav />

      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            Legal
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-cream leading-[1.2] mb-6">
            Terms of Service
          </h1>
          <p className="text-stone text-sm mb-2">Last updated: February 2026</p>
        </div>
      </section>

      <section className="bg-cream py-16 px-6">
        <div className="max-w-[780px] mx-auto prose prose-charcoal">
          <h2 className="font-serif text-2xl font-bold text-charcoal mt-0">1. Acceptance of Terms</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            By accessing or using SkaleFlow (&quot;the Platform&quot;), operated by Mana Marketing (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">2. Description of Service</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            SkaleFlow is a brand strategy and social media management platform that enables users to build brand strategies, create content with AI assistance, schedule and publish content to social media platforms, and track content performance through analytics.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">3. Account Registration</h2>
          <ul className="text-[17px] leading-[1.9] text-[#555] space-y-2">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 18 years of age to use the Platform.</li>
            <li>Accounts are subject to approval by Mana Marketing.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">4. Subscriptions & Payments</h2>
          <ul className="text-[17px] leading-[1.9] text-[#555] space-y-2">
            <li>Access to certain features requires a paid subscription.</li>
            <li>Subscription fees are billed in South African Rand (ZAR) through Paystack.</li>
            <li>Monthly AI credits are allocated based on your subscription tier and do not roll over to the next billing period.</li>
            <li>Top-up credit packs are available for purchase and do not expire.</li>
            <li>All prices include 15% South African VAT where applicable.</li>
            <li>Refunds are handled on a case-by-case basis. Contact us for refund requests.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">5. Social Media Integrations</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            The Platform allows you to connect third-party social media accounts (Facebook, Instagram, LinkedIn, TikTok, X/Twitter). By connecting these accounts, you:
          </p>
          <ul className="text-[17px] leading-[1.9] text-[#555] space-y-2">
            <li>Authorize us to publish content to your connected accounts on your behalf.</li>
            <li>Acknowledge that you have the authority to connect and manage these accounts.</li>
            <li>Agree to comply with each platform&apos;s terms of service.</li>
            <li>Understand that you can disconnect any account at any time from your settings.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">6. Content & Intellectual Property</h2>
          <ul className="text-[17px] leading-[1.9] text-[#555] space-y-2">
            <li>You retain ownership of all content you create and publish through the Platform.</li>
            <li>AI-generated content suggestions are provided as starting points and should be reviewed before publishing.</li>
            <li>You are solely responsible for the content you publish through the Platform.</li>
            <li>You must not use the Platform to publish content that is illegal, defamatory, infringing, or violates third-party rights.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">7. Acceptable Use</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">You agree not to:</p>
          <ul className="text-[17px] leading-[1.9] text-[#555] space-y-2">
            <li>Use the Platform for any unlawful purpose.</li>
            <li>Attempt to gain unauthorized access to the Platform or its systems.</li>
            <li>Interfere with the proper functioning of the Platform.</li>
            <li>Use automated tools to scrape or extract data from the Platform.</li>
            <li>Resell or redistribute access to the Platform without authorization.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">8. Limitation of Liability</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            The Platform is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to content publishing errors, social media account issues, or loss of data. Our total liability shall not exceed the amount you paid for the Platform in the preceding 12 months.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">9. Termination</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            We reserve the right to suspend or terminate your account at any time for violation of these terms. You may cancel your account at any time. Upon termination, your data will be deleted in accordance with our Privacy Policy.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">10. Changes to Terms</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            We may update these Terms of Service from time to time. Continued use of the Platform after changes constitutes acceptance of the updated terms. We will notify registered users of material changes via email.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">11. Governing Law</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the courts of South Africa.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">12. Contact Us</h2>
          <p className="text-[17px] leading-[1.9] text-[#555]">
            For questions about these terms, contact us at:<br />
            <strong>Email:</strong> hello@manamarketing.co.za<br />
            <strong>Location:</strong> Sabie, Mpumalanga, South Africa
          </p>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
