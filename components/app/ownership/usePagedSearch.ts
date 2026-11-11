'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { describeOwnershipError, type OwnershipError, type Paged } from '@/lib/ownership';

// The app's search loop (LandedStreetScreen / LandedGcbScreen / CondoIntelScreen / LandedLogScreen):
// a new `run` (new filters) restarts at page 0, a counter drops answers that arrive after a newer search
// started, and `loadMore` appends the next page. `run` must be a memoised function of the filters.

export interface PagedSearch<T, R extends Paged<T>> {
  items: T[];
  total: number;
  /** The last page-0 response (for outdated_since, data_as_of, users…). */
  last: R | null;
  loading: boolean;
  more: boolean;
  error: OwnershipError | null;
  loadMore: () => void;
}

export function usePagedSearch<T, R extends Paged<T> = Paged<T>>(run: (page: number) => Promise<R>, fallback?: string): PagedSearch<T, R> {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<OwnershipError | null>(null);
  const seq = useRef(0);
  const page = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    // Start from a cancellable timer so the effect body itself sets no state (react-hooks lint).
    const t = setTimeout(() => {
      page.current = 0;
      setLoading(true);
      setError(null);
      run(0)
        .then((r) => { if (mine !== seq.current) return; setItems(r.items); setTotal(r.total); setLast(r); })
        .catch((e) => {
          if (mine !== seq.current) return;
          const err = describeOwnershipError(e, fallback);
          if (err.kind === 'session') { router.replace('/login?reason=session'); return; }
          setError(err);
        })
        .finally(() => { if (mine === seq.current) setLoading(false); });
    }, 0);
    return () => clearTimeout(t);
  }, [run, fallback, router]);

  const loadMore = () => {
    if (loading || more || items.length >= total) return;
    const mine = seq.current;
    setMore(true);
    run(page.current + 1)
      .then((r) => { if (mine !== seq.current) return; page.current += 1; setItems((cur) => [...cur, ...r.items]); })
      .catch(() => {})
      .finally(() => setMore(false));
  };

  return { items, total, last, loading, more, error, loadMore };
}
