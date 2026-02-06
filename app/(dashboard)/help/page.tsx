'use client';

import { Card } from '@/components/ui';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  SparklesIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'What is the Brand Engine?',
    answer: 'The Brand Engine is an AI-guided system that walks you through 12+ phases of brand strategy development. It helps you define your ideal customer, brand voice, positioning, and messaging framework.',
  },
  {
    question: 'What is the Content Engine?',
    answer: 'The Content Engine uses your brand strategy to generate a full month of content. It uses our 4-axis framework (StoryBrand, Funnel Stage, Weekly Angle, Format) to ensure every piece of content is strategically aligned.',
  },
  {
    question: 'How does AI content generation work?',
    answer: 'Once your Brand Engine is complete, the AI uses your locked brand outputs (voice, ICP, messaging) to generate content that sounds authentically like your brand. You can generate individual pieces or entire weeks at once.',
  },
  {
    question: 'Can I edit the AI-generated content?',
    answer: 'Yes! AI-generated content is a starting point. Click any content item in the calendar to open the editor and customize it to your liking.',
  },
  {
    question: 'How do I export my content?',
    answer: 'Use the "Export CSV" button on the calendar page to download all your content items. You can import this into scheduling tools like Buffer, Later, or Hootsuite.',
  },
  {
    question: 'What happens if I want to change my brand strategy?',
    answer: 'You can unlock any phase in the Brand Engine to revise it. Note that changes may affect the relevance of previously generated content.',
  },
];

const guides = [
  {
    title: 'Getting Started',
    description: 'Learn how to navigate SkaleFlow and start building your brand.',
    icon: BookOpenIcon,
  },
  {
    title: 'Brand Engine Guide',
    description: 'Deep dive into each of the 12+ brand strategy phases.',
    icon: SparklesIcon,
  },
  {
    title: 'Content Calendar Guide',
    description: 'Learn how to create, generate, and manage your content calendar.',
    icon: CalendarIcon,
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-display-md text-charcoal">Help Center</h1>
        <p className="text-body-lg text-stone mt-1">
          Get answers to common questions and learn how to use SkaleFlow
        </p>
      </header>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:border-teal/30 transition-colors cursor-pointer"
          onClick={() => window.location.href = 'mailto:support@manamarketing.co.za'}
        >
          <EnvelopeIcon className="w-8 h-8 text-teal mb-3" />
          <h3 className="font-semibold text-charcoal mb-1">Email Support</h3>
          <p className="text-sm text-stone">
            Get help from our team
          </p>
        </Card>

        <Card className="hover:border-teal/30 transition-colors cursor-pointer">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal mb-3" />
          <h3 className="font-semibold text-charcoal mb-1">Live Chat</h3>
          <p className="text-sm text-stone">
            Coming soon
          </p>
        </Card>

        <Card className="hover:border-teal/30 transition-colors cursor-pointer">
          <BookOpenIcon className="w-8 h-8 text-teal mb-3" />
          <h3 className="font-semibold text-charcoal mb-1">Documentation</h3>
          <p className="text-sm text-stone">
            Browse guides and tutorials
          </p>
        </Card>
      </div>

      {/* Guides */}
      <section>
        <h2 className="text-heading-lg text-charcoal mb-4">Guides</h2>
        <div className="space-y-3">
          {guides.map((guide, index) => (
            <Card
              key={index}
              className="flex items-center gap-4 hover:border-teal/30 transition-colors cursor-pointer"
            >
              <div className="p-3 bg-teal/10 rounded-xl">
                <guide.icon className="w-6 h-6 text-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">{guide.title}</h3>
                <p className="text-sm text-stone">{guide.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-heading-lg text-charcoal mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <div className="flex items-start gap-3">
                <QuestionMarkCircleIcon className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-charcoal mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-stone">{faq.answer}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <Card className="bg-teal/5 border-teal/20">
        <div className="text-center">
          <h2 className="text-heading-md text-charcoal mb-2">
            Still Need Help?
          </h2>
          <p className="text-stone mb-4">
            Our team is here to help you succeed with SkaleFlow.
          </p>
          <a
            href="mailto:support@manamarketing.co.za"
            className="inline-flex items-center gap-2 bg-teal text-cream px-6 py-3 rounded-xl font-medium hover:bg-teal-light transition-colors"
          >
            <EnvelopeIcon className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </Card>
    </div>
  );
}
