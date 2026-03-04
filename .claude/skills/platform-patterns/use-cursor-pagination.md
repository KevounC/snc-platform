# Pattern: useCursorPagination Hook

Generic React hook that accumulates paginated items across pages; `buildUrl(cursor)` callback decouples API details; `deps` array triggers full reset when filters change.

## Rationale
Three pages in the app (feed, creators list, creator detail) all need the same "load more" UX: show items, detect if more exist, append next page on button click, and reset when filter state changes. Extracting this into a generic hook with a `buildUrl` callback avoids duplicating fetch + state + reset logic at every call site.

## Examples

### Example 1: Hook implementation
**File**: `apps/web/src/hooks/use-cursor-pagination.ts:3`
```typescript
export function useCursorPagination<T>({
  buildUrl,
  deps = [],
}: {
  buildUrl: (cursor: string | null) => string;
  deps?: readonly unknown[];
}): {
  items: T[];
  nextCursor: string | null;
  isLoading: boolean;
  loadMore: () => void;
} {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep latest buildUrl in a ref — avoids stale closure without re-creating fetchPage
  const buildUrlRef = useRef(buildUrl);
  buildUrlRef.current = buildUrl;

  // deps controls when fetchPage is recreated (i.e., when to reset and refetch)
  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      setIsLoading(true);
      try {
        const url = buildUrlRef.current(cursor);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as { items: T[]; nextCursor: string | null };
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setNextCursor(data.nextCursor);
      } finally {
        setIsLoading(false);
      }
    },
    [...deps],  // deps triggers fetchPage recreation → effect fires → reset+refetch
  );

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    void fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor) void fetchPage(nextCursor, true);
  }, [fetchPage, nextCursor]);

  return { items, nextCursor, isLoading, loadMore };
}
```

### Example 2: Feed page — simple usage without deps
**File**: `apps/web/src/routes/feed.tsx:21`
```typescript
const { items, nextCursor, isLoading, loadMore } =
  useCursorPagination<FeedItem>({
    buildUrl: (cursor) =>
      buildFeedUrl({ filter: activeFilter, cursor, limit: 12 }),
    deps: [activeFilter],  // reset when filter changes
  });
```

### Example 3: Creator detail — deps reset on filter + creatorId
**File**: `apps/web/src/routes/creators/$creatorId.tsx:34`
```typescript
const { items, nextCursor, isLoading, loadMore } =
  useCursorPagination<FeedItem>({
    buildUrl: (cursor) =>
      buildContentUrl({
        creatorId: creator.userId,
        filter: activeFilter,
        cursor,
        limit: 12,
      }),
    deps: [activeFilter, creator.userId],
  });
```

### Example 4: Creators list — no deps (static URL)
**File**: `apps/web/src/routes/creators/index.tsx:15`
```typescript
const { items, nextCursor, isLoading, loadMore } =
  useCursorPagination<CreatorListItem>({
    buildUrl: (cursor) => buildCreatorsUrl({ cursor, limit: 24 }),
  });
```

## When to Use
- Any component that fetches a paginated list and needs "load more" UX
- When the list should reset and re-fetch from page 1 when filter state changes — pass filter values in `deps`
- The API endpoint must return `{ items: T[]; nextCursor: string | null }`

## When NOT to Use
- Fixed-size lists with no pagination (just fetch directly in a loader or effect)
- When items should *replace* rather than *accumulate* on filter change — this hook handles that via the `deps` reset

## Common Violations
- **Omitting `deps` when filters exist**: If the URL depends on component state (filters, IDs) but those are not in `deps`, changing a filter won't reset the accumulated items list, showing stale data from the old filter.
- **Putting `buildUrl` in `deps`**: `buildUrl` is an inline arrow function that changes on every render; it's stored in a ref intentionally. Only put stable external dependencies (filter values, IDs) in `deps`.
- **Calling `loadMore` when `isLoading` is true**: The UI should disable the load-more button when `isLoading` is true to prevent duplicate in-flight requests.
