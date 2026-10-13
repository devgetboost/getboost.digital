import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

const THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * R20.1 — scroll-depth tracker. Renders nothing. Fires each threshold once
 * per page load (25/50/75/100), guarded so re-renders and back-navigation
 * never duplicate. Passive listener, removed on unmount.
 *
 * @param location  Stable page id for the taxonomy (e.g. 'homepage').
 */
export const ScrollDepth = ({ location }: { location: string }) => {
  const { pathname } = useLocation();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current.clear();
    let ticking = false;

    const check = () => {
      ticking = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.min(100, Math.round(((window.scrollY || 0) / scrollable) * 100));
      for (const threshold of THRESHOLDS) {
        if (depth >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          analytics.trackScrollDepth(location, threshold, pathname);
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    check(); // short pages may already qualify on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, [location, pathname]);

  return null;
};
