'use client';

import { useState, useRef, useEffect } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  onIconSelect: (icon: string) => void;
  className?: string;
}

// Popular emojis organized by category
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😊', '😎', '🤔', '😍', '🥳', '😇', '🤝', '👏', '💪'],
  'Hands & Gestures': ['👍', '👎', '✌️', '🤞', '👊', '🙌', '👋', '🤚', '✋', '🖐️'],
  'Objects': ['💡', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '📈', '📊', '💰'],
  'Symbols': ['✅', '❌', '⭐', '💫', '✨', '🔔', '📌', '🔗', '📍', '🎉'],
  'Arrows': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '🔄', '🔃', '⤴️', '⤵️'],
};

export function IconPicker({ onIconSelect, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleIconClick = (icon: string) => {
    onIconSelect(icon);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone hover:text-teal border border-stone/20 rounded-lg hover:border-teal/30 transition-colors"
      >
        <FaceSmileIcon className="w-4 h-4" />
        <span>Add Icon</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-stone/15 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-stone/10">
            <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
              Select Icon
            </h4>
          </div>

          <div className="max-h-96 overflow-y-auto p-3 space-y-3">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <div className="text-xs font-medium text-stone mb-2">{category}</div>
                <div className="grid grid-cols-10 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleIconClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-cream-warm rounded transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
