'use client';

import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

/**
 * Silently checks for due scheduled posts and publishes them.
 * Runs every 2 minutes while the user has the dashboard open.
 * This replaces the need for a frequent Vercel cron (Pro plan only).
 */
export function usePublishCheck() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await fetch('/api/content/publish/check');
      } catch {
        // Silent — don't disrupt the user
      }
    };

    // Run once on mount (with a small delay so it doesn't block page load)
    const initialTimeout = setTimeout(check, 5000);

    // Then every 2 minutes
    timerRef.current = setInterval(check, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
