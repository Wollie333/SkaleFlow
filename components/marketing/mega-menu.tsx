'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { featureCategories } from '@/data/feature-categories';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the trigger button
        const trigger = (e.target as Element)?.closest('[data-mega-trigger]');
        if (!trigger) onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 right-0 bg-dark-light border-t border-teal/10 border-b border-b-teal/10 shadow-2xl animate-fade-in"
    >
      <div className="max-w-[1060px] mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {featureCategories.map((category) => (
            <div key={category.name}>
              <h3 className="text-[11px] font-semibold text-gold tracking-[0.15em] uppercase mb-3">
                {category.name}
              </h3>
              <ul className="space-y-1.5">
                {category.features.map((feature) => (
                  <li key={feature.slug}>
                    <Link
                      href={`/features/${feature.slug}`}
                      onClick={onClose}
                      className="text-[13px] text-cream/70 hover:text-cream transition-colors block py-0.5"
                    >
                      {feature.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-5 border-t border-teal/[0.08] flex items-center justify-between">
          <p className="text-[13px] text-stone">
            One platform. Every tool your brand needs to grow.
          </p>
          <Link
            href="/apply"
            onClick={onClose}
            className="text-[13px] font-medium text-teal hover:text-teal-light transition-colors group flex items-center gap-1"
          >
            Get Started
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
