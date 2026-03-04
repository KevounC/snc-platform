# Pattern: use-section-data

Generic hook for fetching an async list in a landing section. Manages loading/success/error
states with cancellation, and silently hides the section on empty or failed results.

## Rationale

Landing sections display supplementary content (creators, recent content, plans) that should
appear when data is available and silently disappear when it isn't — no error UI needed.
`useSectionData<T>` centralises the `useState` + `useEffect` + cancellation flag boilerplate
so each section component is reduced to a single hook call.

## Examples

### Example 1: Hook implementation

**File**: `apps/web/src/hooks/use-section-data.ts:1`
```typescript
interface SectionDataState<T> {
  readonly status: "idle" | "loading" | "success" | "error";
  readonly items: readonly T[];
}

export function useSectionData<T>(
  fetcher: () => Promise<readonly T[]>,
): SectionDataState<T> {
  const [state, setState] = useState<SectionDataState<T>>({
    status: "idle",
    items: [],
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setState({ status: "loading", items: [] });
      try {
        const items = await fetcher();
        if (cancelled) return;
        if (items.length === 0) {
          setState({ status: "error", items: [] });   // empty = hide section
        } else {
          setState({ status: "success", items });
        }
      } catch {
        if (!cancelled) setState({ status: "error", items: [] });
      }
    };
    void fetchData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // fetcher must be stable — see note below

  return state;
}
```

### Example 2: Module-scope stable fetcher + section component

**File**: `apps/web/src/components/landing/featured-creators.tsx:12`
```typescript
// Defined at module scope to maintain referential stability (avoids re-renders)
async function fetchCreators(): Promise<CreatorListResponse["items"]> {
  const data = await apiGet<CreatorListResponse>("/api/creators", { limit: 8 });
  return data.items;
}

export function FeaturedCreators(): React.ReactElement | null {
  const { status, items } = useSectionData(fetchCreators);

  if (status === "idle" || status === "error") {
    return null;   // silent hide — no error UI
  }

  return (
    <section className={sectionStyles.section}>
      <h2 className={sectionStyles.heading}>Featured Creators</h2>
      {status === "loading" ? (
        <p className={sectionStyles.loading}>Loading creators...</p>
      ) : (
        <div className={styles.scrollContainer}>
          {items.map((creator) => (
            <div key={creator.userId} className={styles.scrollItem}>
              <CreatorCard creator={creator} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

### Example 3: Same pattern in RecentContent section

**File**: `apps/web/src/components/landing/recent-content.tsx:13`
```typescript
async function fetchRecentContent(): Promise<FeedItem[]> {
  const data = await apiGet<FeedResponse>("/api/content", { limit: 6 });
  return data.items;
}

export function RecentContent(): React.ReactElement | null {
  const { status, items } = useSectionData(fetchRecentContent);

  if (status === "idle" || status === "error") return null;
  // ... same structure as FeaturedCreators
}
```

### Example 4: Testing — never-resolving promise for loading state

**File**: `apps/web/tests/unit/components/landing/featured-creators.test.tsx:45`
```typescript
it("renders loading state while data is being fetched", async () => {
  mockApiGet.mockReturnValue(new Promise(() => {}));   // never resolves
  render(<FeaturedCreators />);
  expect(screen.getByText("Loading creators...")).toBeInTheDocument();
});

it("returns null when fetch returns empty array", async () => {
  mockApiGet.mockResolvedValue({ items: [] });
  render(<FeaturedCreators />);
  await waitFor(() => {
    expect(document.body.innerHTML).toBe("<div></div>");
  });
});
```

## When to Use

- Any page section that fetches a list and should silently hide on empty/error
- Supplementary content where showing an error state would degrade UX
- Multiple independent sections on a single page (each fetches autonomously)

## When NOT to Use

- Primary page data (use TanStack `loader` + `Route.useLoaderData()` instead)
- Data that must show an error message (use local state with explicit error UI)
- Single items rather than lists (the hook always returns an array)

## Common Violations

- **Inline fetcher defined inside component**: causes infinite re-renders because the
  `fetcher` reference changes on every render. Always define fetchers at module scope
  or wrap with `useCallback`.
- **Showing error UI**: the pattern intentionally returns `null` on error — sections are
  supplementary and should disappear gracefully rather than show broken states.
- **Using `useSectionData` for auth-dependent data**: use `useSubscriptions` (which keys
  on `session.data`) for data that depends on the current user's auth state.
