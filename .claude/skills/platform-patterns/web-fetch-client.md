# Pattern: Web Fetch Client

Thin async functions in `apps/web/src/lib/` wrap each API endpoint using `apiGet<T>()` / `apiMutate<T>()` generic helpers from `fetch-utils.ts`. Both helpers handle URL construction, session-cookie forwarding, and structured error extraction.

## Rationale

All API calls from the frontend need consistent session-cookie forwarding (`credentials: "include"`), URL construction with optional query params, and structured error extraction matching the `{ error: { message } }` response body shape. `apiGet`/`apiMutate` eliminate per-caller boilerplate; `throwIfNotOk` underlies both and can still be imported directly for edge cases.

## Examples

### Example 1: apiGet and apiMutate helpers in fetch-utils.ts
**File**: `apps/web/src/lib/fetch-utils.ts:17`
```typescript
/** GET with optional query params. Always sends session cookie. */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url.toString(), { credentials: "include" });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}

/** POST/PATCH/DELETE with JSON body. Always sends session cookie. */
export async function apiMutate<T>(
  endpoint: string,
  options: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method ?? "POST",
    credentials: "include",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : {},
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}
```

### Example 2: Dashboard lib uses both helpers
**File**: `apps/web/src/lib/dashboard.ts:14`
```typescript
import { apiGet, apiMutate } from "./fetch-utils.js";

export async function fetchRevenue(): Promise<RevenueResponse> {
  return apiGet<RevenueResponse>("/api/dashboard/revenue");
}

export async function fetchPendingBookings(params?: {
  cursor?: string;
  limit?: number;
}): Promise<PendingBookingsResponse> {
  return apiGet<PendingBookingsResponse>("/api/bookings/pending", params);
}

export async function reviewBooking(
  id: string,
  data: ReviewBookingRequest,
): Promise<BookingWithService> {
  const result = await apiMutate<{ booking: BookingWithService }>(
    `/api/bookings/${encodeURIComponent(id)}/review`,
    { method: "PATCH", body: data },
  );
  return result.booking;
}
```

### Example 3: Merch lib follows same structure
**File**: `apps/web/src/lib/merch.ts:7`
```typescript
import { apiGet, apiMutate } from "./fetch-utils.js";

export async function fetchProducts(params?: {
  creatorId?: string; limit?: number; cursor?: string;
}): Promise<MerchListResponse> {
  return apiGet<MerchListResponse>("/api/merch", params);
}

export async function createMerchCheckout(
  variantId: string, quantity?: number,
): Promise<string> {
  const data = await apiMutate<{ checkoutUrl: string }>(
    "/api/merch/checkout",
    { body: { variantId, quantity } },
  );
  return data.checkoutUrl;
}
```

## When to Use
- Every function in `apps/web/src/lib/` that calls a backend API endpoint
- Use `apiGet<T>(endpoint, params?)` for GET requests with optional query params
- Use `apiMutate<T>(endpoint, { method, body })` for POST/PATCH/DELETE

## When NOT to Use
- TanStack Start `loader` functions that construct their own fetch — `apiGet`/`apiMutate` are for lib modules consumed by hooks/components
- Server-side fetch calls (Node.js API layer) — those return `Result<T, AppError>` instead
- `useCursorPagination` hook constructs its own URL via `buildUrl()` callback — use `fetchOptions: { credentials: "include" }` there instead

## Common Violations
- Forgetting `credentials: "include"` — session cookie won't be sent, causing 401 on protected endpoints
- Importing `throwIfNotOk` directly when `apiGet`/`apiMutate` would suffice — adds unnecessary boilerplate
- Reading `response.json()` before calling `throwIfNotOk` — body stream is consumed and error message extraction fails
