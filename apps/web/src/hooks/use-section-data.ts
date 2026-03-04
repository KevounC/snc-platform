import { useEffect, useState } from "react";

// ── Types ──

interface SectionDataState<T> {
  readonly status: "idle" | "loading" | "success" | "error";
  readonly items: readonly T[];
}

// ── Hook ──

/**
 * Generic hook for fetching a list of items in a landing section.
 * Manages loading, success, and error states with cancellation.
 *
 * The `fetcher` reference must be stable (defined outside the component
 * or wrapped with useCallback) to avoid infinite re-renders.
 */
export function useSectionData<T>(
  fetcher: () => Promise<readonly T[]>,
): SectionDataState<T> {
  const [state, setState] = useState<SectionDataState<T>>({
    status: "loading",
    items: [],
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setState({ status: "loading", items: [] });
      try {
        const items = await fetcher();
        if (cancelled) return;
        setState({ status: "success", items });
      } catch {
        if (!cancelled) {
          setState({ status: "error", items: [] });
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
