'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Global navigation progress bar.
 * Shows a thin animated teal bar at the top of the viewport immediately
 * when the user clicks an internal link, hiding the 2-3s server fetch delay.
 *
 * Works by intercepting click events on <a> tags with internal hrefs,
 * then waiting for the pathname to change (navigation complete).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  // When pathname changes, navigation is complete — hide the bar
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      // Quick fill to 100% then hide
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(hideTimer);
    }
  }, [pathname, searchParams]);

  // Start navigation: show bar immediately
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setProgress(15);

    // Simulate progress ticking up (slows down as it approaches 90%)
    if (timerRef.current) clearInterval(timerRef.current);
    let p = 15;
    timerRef.current = setInterval(() => {
      if (p < 30) p += 5;
      else if (p < 60) p += 3;
      else if (p < 80) p += 1;
      else if (p < 90) p += 0.3;
      else {
        // Stall at 90 — waiting for server
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setProgress(Math.min(p, 90));
    }, 200);
  }, []);

  // Clean up interval on navigation complete
  useEffect(() => {
    if (!isNavigating && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isNavigating]);

  // Intercept clicks on internal <a> links
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Only handle internal navigation (starts with /)
      if (!href.startsWith('/')) return;

      // Skip if modifier keys held (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Skip if target="_blank"
      if (target.target === '_blank') return;

      // Skip if same path
      if (href === pathname) return;

      // Skip hash links
      if (href.startsWith('#')) return;

      startNavigation();
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, startNavigation]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-teal transition-all duration-300 ease-out shadow-[0_0_8px_rgba(0,200,180,0.4)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
