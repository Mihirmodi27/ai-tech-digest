import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
});

/**
 * Fetch today's digest (or a specific date).
 * Returns { data, error, isLoading }
 */
export function useDigest(date = 'latest') {
  return useSWR(`/api/digest/${date}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, // don't re-fetch within 1 min
  });
}

/**
 * Fetch weekly summary.
 * @param {'current' | 'previous'} week
 */
export function useWeeklySummary(week = 'current') {
  return useSWR(`/api/digest/week/${week}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // 5 min cache
  });
}

/**
 * Fetch the list of available digest dates (for calendar).
 */
export function useDigestDates() {
  return useSWR('/api/digest/dates', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}

/**
 * Fetch categories (with counts for a given date).
 */
export function useCategories() {
  return useSWR('/api/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  });
}
