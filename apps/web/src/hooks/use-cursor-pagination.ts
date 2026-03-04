import { useCallback, useEffect, useRef, useState } from "react";

export function useCursorPagination<T>({
  buildUrl,
  deps = [],
  fetchOptions,
}: {
  buildUrl: (cursor: string | null) => string;
  deps?: readonly unknown[];
  fetchOptions?: RequestInit;
}): {
  items: T[];
  nextCursor: string | null;
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
} {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest buildUrl and fetchOptions in refs so fetchPage always
  // calls the current versions without needing them as useCallback dependencies
  const buildUrlRef = useRef(buildUrl);
  buildUrlRef.current = buildUrl;

  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      setError(null);
      setIsLoading(true);
      try {
        const url = buildUrlRef.current(cursor);
        const res = await fetch(url, fetchOptionsRef.current);
        if (!res.ok) {
          setError("Failed to load");
          return;
        }
        const data = (await res.json()) as {
          items: T[];
          nextCursor: string | null;
        };
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setNextCursor(data.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    },
    // deps controls when fetchPage is recreated (i.e., when to reset and refetch)
    [...deps],
  );

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    void fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor) {
      void fetchPage(nextCursor, true);
    }
  }, [fetchPage, nextCursor]);

  return { items, nextCursor, isLoading, error, loadMore };
}
