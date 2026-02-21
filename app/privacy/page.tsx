'use client';

import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <MarketingNav />

      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            Legal
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-cream leading-[1.2] mb-6">
            Privacy Policy
          </h1>
          <p className="text-stone text-sm mb-2">Last updated: February 2026</p>
        </div>
      </section>

      <section className="bg-cream py-16 px-6">
        <div className="max-w-[780px] mx-auto prose prose-charcoal">
          <h2 className="font-serif text-2xl font-bold text-charcoal mt-0">1. Introduction</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            Mana Marketing (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates SkaleFlow (&quot;the Platform&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. We are committed to protecting your personal information in compliance with the Protection of Personal Information Act (POPIA) of South Africa and applicable international privacy laws.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">2. Information We Collect</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">We collect the following types of information:</p>
          <ul className="text-[17px] leading-[1.9] text-charcoal/80 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, password, and organization details provided during registration.</li>
            <li><strong>Social Media Data:</strong> When you connect social media accounts (Facebook, Instagram, LinkedIn, TikTok, X/Twitter), we store access tokens, profile information, and page/account identifiers necessary to publish content and retrieve analytics on your behalf.</li>
            <li><strong>Content Data:</strong> Content you create, schedule, or publish through the Platform, including text, images, videos, and associated metadata.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the Platform, including pages visited, features used, and timestamps.</li>
            <li><strong>Payment Information:</strong> Billing details processed through our payment provider (Paystack). We do not store full payment card details.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">3. How We Use Your Information</h2>
          <ul className="text-[17px] leading-[1.9] text-charcoal/80 space-y-2">
            <li>To provide and maintain the Platform, including publishing content to your connected social media accounts.</li>
            <li>To authenticate your identity and manage your account.</li>
            <li>To process payments and manage your subscription.</li>
            <li>To provide analytics and insights about your content performance.</li>
            <li>To communicate with you about your account, updates, and support requests.</li>
            <li>To improve and optimize the Platform.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">4. Social Media Integrations</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            When you connect a social media account, we request only the permissions necessary to provide our services. We store access tokens securely and use them solely to publish content, retrieve analytics, and manage your connected accounts. You can disconnect any social media account at any time from your settings page, which will revoke our access and delete the stored tokens.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">5. Data Sharing</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="text-[17px] leading-[1.9] text-charcoal/80 space-y-2">
            <li><strong>Service Providers:</strong> Third-party services that help us operate the Platform (hosting, payment processing, email delivery).</li>
            <li><strong>Social Media Platforms:</strong> Content and necessary data sent to platforms you have connected for publishing purposes.</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">6. Data Security</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            We implement appropriate technical and organizational measures to protect your personal information, including encryption of data in transit and at rest, secure token storage, and access controls. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">7. Data Retention</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            We retain your personal information for as long as your account is active or as needed to provide services. When you delete your account or disconnect a social media integration, we delete the associated data within 30 days.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">8. Your Rights</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">Under POPIA and applicable laws, you have the right to:</p>
          <ul className="text-[17px] leading-[1.9] text-charcoal/80 space-y-2">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your personal information.</li>
            <li>Object to the processing of your information.</li>
            <li>Withdraw consent at any time.</li>
            <li>Lodge a complaint with the Information Regulator of South Africa.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-charcoal">9. Facebook & Instagram Data</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            If you connect your Facebook or Instagram account, you can request deletion of your data at any time by disconnecting your account in Settings, or through Facebook&apos;s app settings. We also provide a data deletion callback endpoint that automatically processes deletion requests from Meta.
          </p>

          <h2 className="font-serif text-2xl font-bold text-charcoal">10. Contact Us</h2>
          <p className="text-[17px] leading-[1.9] text-charcoal/80">
            For privacy-related inquiries, contact us at:<br />
            <strong>Email:</strong> hello@manamarketing.co.za<br />
            <strong>Location:</strong> Sabie, Mpumalanga, South Africa
          </p>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
