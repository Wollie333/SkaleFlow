'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { featureCategories } from '@/data/feature-categories';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/skaleflow', label: 'SkaleFlow' },
  { href: '/problems', label: 'Problems We Solve' },
  { href: '/results', label: 'Results' },
  { href: '/blog', label: 'Blog' },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [whatWeDoOpen, setWhatWeDoOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-dark/98 backdrop-blur-md overflow-y-auto">
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" onClick={onClose} className="font-serif font-bold text-[17px] text-cream tracking-wide">
            MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
          </Link>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navLinks.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`block py-3 text-[16px] font-medium transition-colors ${
                pathname === link.href ? 'text-cream' : 'text-cream/70 hover:text-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* What We Do Accordion */}
          <div>
            <button
              onClick={() => setWhatWeDoOpen(!whatWeDoOpen)}
              className="w-full flex items-center justify-between py-3 text-[16px] font-medium text-cream/70 hover:text-cream transition-colors"
            >
              What We Do
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${whatWeDoOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {whatWeDoOpen && (
              <div className="pl-4 pb-2 space-y-0.5">
                {featureCategories.map((category) => (
                  <div key={category.name}>
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category.name ? null : category.name
                        )
                      }
                      className="w-full flex items-center justify-between py-2.5 text-[14px] font-medium text-gold/80 hover:text-gold transition-colors"
                    >
                      {category.name}
                      <ChevronDownIcon
                        className={`w-3.5 h-3.5 transition-transform ${
                          expandedCategory === category.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedCategory === category.name && (
                      <div className="pl-4 pb-1 space-y-0.5">
                        {category.features.map((feature) => (
                          <Link
                            key={feature.slug}
                            href={`/features/${feature.slug}`}
                            onClick={onClose}
                            className="block py-2 text-[14px] text-cream/60 hover:text-cream transition-colors"
                          >
                            {feature.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`block py-3 text-[16px] font-medium transition-colors ${
                pathname === link.href ? 'text-cream' : 'text-cream/70 hover:text-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="mt-10 pt-6 border-t border-teal/[0.08]">
          <Link
            href="/apply"
            onClick={onClose}
            className="w-full flex items-center justify-center px-7 py-3.5 rounded-md text-[15px] font-semibold bg-teal text-cream hover:bg-teal-light transition-all"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
