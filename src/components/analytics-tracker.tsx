'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { eventsForPath, flushAnalytics, track } from '@/lib/analytics';

/**
 * Counts page views (and the service a page belongs to) and any press on an element marked
 * data-track="group:name". Mounted once in the root layout; it draws nothing.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => { if (pathname) eventsForPath(pathname).forEach(track); }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-track]');
      if (el?.dataset.track) track(el.dataset.track);
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flushAnalytics(); };
    document.addEventListener('click', onClick, true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushAnalytics);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushAnalytics);
    };
  }, []);

  return null;
}
