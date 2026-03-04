# Human Pending Items

Items in this file require human attention or are tracked for awareness.
Updated by agent workflows. Remove items once resolved.

---

## Phase 1: API Foundation & Database

**Status: No blocking items — proceed with implementation.**

All Phase 1 dependencies are READY. No credentials, API keys, or human-provided
configuration are required before implementation can start.

### Awareness: Missing npm packages (non-blocking)

The implement agent will add these packages during Phase 1 implementation:

| Package | Reason |
|---------|--------|
| `postgres` | postgres.js driver for Drizzle ORM |
| `@hono/node-server` | Hono adapter for Node.js runtime |
| `@hono/standard-validator` | Peer dependency for hono-openapi request validation |

Install command:
```bash
pnpm --filter @snc/api add postgres @hono/node-server @hono/standard-validator
```

### Awareness: Future phases will require credentials

These are **not needed for Phase 1** but will require human-provided secrets:

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 2 | Better Auth | `BETTER_AUTH_SECRET` env var (random secret) |
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

---

## Phase 2: Authentication & Authorization

**Status: No blocking items — proceed with implementation.**

All Phase 2 dependencies are READY or resolvable with inline test constants. No
credentials or external service configuration are required before implementation starts.

### Action Required: Provide `BETTER_AUTH_SECRET` before running the dev server

The API will refuse to start without a `BETTER_AUTH_SECRET` value of at least 32
characters. Before running `pnpm --filter @snc/api dev`, set this environment variable:

```bash
# Generate a secure random secret (run once, save the output):
openssl rand -base64 32

# Add to your local .env file (never commit this):
BETTER_AUTH_SECRET=<output from above>
BETTER_AUTH_URL=http://localhost:3000
```

This is **not needed for unit tests** — the test suite uses a fixed test value in
`TEST_CONFIG`. It is only needed to run the live dev server or production deployment.

| Variable | Required For | How to Get |
|----------|-------------|-----------|
| `BETTER_AUTH_SECRET` | Dev/production server startup | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Dev/production server startup | Set to your API's base URL (default: `http://localhost:3000`) |

### Awareness: Future phases will still require credentials

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

---

*Last updated by: evaluate-deps agent, phase-2-authentication-authorization*

---

## Phase 3: Frontend Shell & Auth UI

**Status: No blocking items — proceed with implementation.**

All Phase 3 dependencies are READY. No external credentials, API keys, or human-provided
secrets are required before implementation can start. The web app's existing `package.json`
already declares the core dependencies (`@tanstack/react-start`, `better-auth`, `react`,
`@zod/mini`, `@snc/shared`).

### Awareness: Missing npm packages (non-blocking)

The implement agent will add these packages during Phase 3 implementation:

| Package | Reason |
|---------|--------|
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | DOM assertion matchers for Vitest |
| `jsdom` | DOM environment for Vitest component tests |

Install command:
```bash
pnpm --filter @snc/web add -D @testing-library/react @testing-library/jest-dom jsdom
```

### Awareness: Local env file for dev server (non-blocking)

Create `apps/web/.env.local` with the API base URL before running the web dev server:

```
VITE_API_URL=http://localhost:3000
```

This is **not a secret** — it is the local development API URL. It defaults to
`http://localhost:3000` in the code if not set.

### Awareness: Future phases will still require credentials

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

> **Note**: Phase 4 uses local filesystem storage only — no WebDAV credentials needed.
> WebDAV/S3 credentials are a post-Phase-4 concern.

---

*Last updated by: evaluate-deps agent, phase-3-frontend-shell-auth-ui*

---

## Phase 4: Content Management & Storage Provider

**Status: No blocking items — proceed with implementation.**

All Phase 4 dependencies are READY. Local filesystem storage uses only Node.js 24+ built-ins
(`node:fs`, `node:path`, `node:crypto`, `node:stream/web`) — no external service credentials
are required before implementation starts.

### Correction: WebDAV credentials NOT needed for Phase 4

Previous entries in this file listed `STORAGE_URL`, `STORAGE_USER`, `STORAGE_PASS` as Phase 4
requirements. This was incorrect. Phase 4 implements **local filesystem storage only**. The
VISION.md explicitly excludes WebDAV and S3 implementations: "S3-compatible or WebDAV storage
implementations (future — only local filesystem in this phase)."

WebDAV/S3 credentials are a future-phase concern, not Phase 4.

### Awareness: Local uploads directory (non-blocking)

The local storage implementation creates `./uploads/` (relative to the API working directory)
at runtime using `mkdir({ recursive: true })`. No manual setup is required — the directory is
created automatically on first upload.

To customize the upload directory, set:
```
STORAGE_TYPE=local
STORAGE_LOCAL_DIR=./uploads
```

Both variables have safe defaults and are **not required** in `.env` for development.

### Awareness: Multipart parsing may require busboy (non-blocking)

The implement agent will research whether Hono's built-in `c.req.parseBody()` streams or
buffers multipart file uploads. If buffering is confirmed, `busboy` or `@fastify/busboy` will
be added as an npm dependency. No human action required — this is a library selection decision.

### Awareness: Future phases will require credentials

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

---

*Last updated by: evaluate-deps agent, phase-4-content-management-storage-provider*

---

## Phase 5: Content Feed & Media Playback

**Status: No blocking items — proceed with implementation.**

All Phase 5 dependencies are READY. No new packages, credentials, API keys, or external
services are required. Every dependency is already installed and integrated from Phases 1–4.

### No Action Required

Phase 5 uses only:
- Packages already in `package.json` (`drizzle-orm`, `hono`, `zod`, `@tanstack/react-router`, etc.)
- Browser native APIs (`<video>`, `<audio>`, React context)
- Node.js built-ins (`node:buffer` for Base64 cursor encoding)
- Existing infrastructure (PostgreSQL via Docker Compose, local filesystem storage)
- Existing environment variables (no new vars needed)

### Awareness: Future phases will require credentials

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

---

*Last updated by: evaluate-deps agent, phase-5-content-feed-media-playback*

---

## Phase 6: Creator Pages & Profiles

**Status: No blocking items — proceed with implementation.**

All Phase 6 dependencies are READY. No new packages, credentials, API keys, or external
services are required before implementation starts. Every dependency is already installed
and integrated from Phases 1–5.

### No Action Required

Phase 6 uses only:
- Packages already in `package.json` (`drizzle-orm`, `hono`, `hono-openapi`, `zod`,
  `@tanstack/react-router`, `@testing-library/react`, etc.)
- Existing infrastructure (PostgreSQL via Docker Compose, local filesystem storage)
- Existing middleware (`requireAuth`, `requireRole` from Phase 2)
- Existing components (`ContentCard`, `FilterBar` from Phase 5)
- Existing environment variables (no new vars needed)

### Awareness: Future phases will require credentials

| Phase | Service | What's needed |
|-------|---------|---------------|
| Phase 7 | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Phase 8 | Shopify | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

---

*Last updated by: evaluate-deps agent, phase-6-creator-pages-profiles*

---

## Phase 7: Subscriptions & Content Gating

**Status: No blocking items — proceed with implementation.**

All Phase 7 dependencies are either READY (already installed/running) or MOCK (unit tests
mock the Stripe SDK; no real credentials needed for tests). Zero PAUSE items.

### Action Required: Provide Stripe credentials before running the dev server

The API will fail to start without `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Before
running `pnpm --filter @snc/api dev`, obtain these from your Stripe dashboard and add them
to your local `.env` file:

```bash
# .env (never commit this file)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx   # Stripe Dashboard → API Keys
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx # Stripe Dashboard → Webhooks → signing secret
```

These are **not needed for unit tests** — the test suite mocks the `stripe` module entirely.
They are only required to run the live dev server.

| Variable | Required For | How to Get |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | Dev/production server startup | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Stripe Dashboard → Developers → Webhooks → signing secret |

### Action Required: Create Stripe products/prices and seed the database

The `subscription_plans` table stores `stripePriceId` values that reference real Stripe
Price objects. Before real payment flows work, you must:

1. In the [Stripe Dashboard](https://dashboard.stripe.com), create Products and Prices for:
   - Platform-wide subscription (e.g., "S/NC All Access", $9.99/month and/or $99/year)
   - At least one per-creator subscription plan (optional for initial testing)
2. Copy the resulting Price IDs (format: `price_xxxxxxxx`)
3. Seed them into the `subscription_plans` table via a migration or admin script

**This is not needed for unit tests** — tests use fake Price IDs like `"price_test_platform_monthly"`.
It is required before end-to-end checkout flows work in the dev server.

### Awareness: Webhook testing locally (non-blocking)

To test the webhook handler end-to-end with real Stripe events locally, install the
[Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This is optional tooling — **not required** for any unit tests or the implementation to be
complete.

### Mock Locations (generated by generate-mock agent)

The following mock implementations have been created and are ready for use:

| Mock | Location | Purpose |
|------|----------|---------|
| Stripe env config additions | `apps/api/src/config.ts` | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` added to `ENV_SCHEMA` |
| Test config mock values | `apps/api/tests/helpers/test-constants.ts` | `sk_test_mock_key_for_testing_only` + `whsec_mock_webhook_secret_for_testing` added to `makeTestConfig()` |
| API DB fixtures | `apps/api/tests/helpers/subscription-fixtures.ts` | `makeMockPlan()`, `makeMockSubscription()`, and 5 webhook event fixture factories |
| Web response fixtures | `apps/web/tests/helpers/subscription-fixtures.ts` | `makeMockPlanResponse()`, `makeMockUserSubscriptionResponse()` |

**Note**: `apps/web/tests/helpers/subscription-fixtures.ts` uses locally-defined types.
Once the implement agent adds `SubscriptionPlanResponse` and `UserSubscriptionResponse` to
`packages/shared/src/subscription.ts`, update the web fixture file to import from `@snc/shared`.

**Note**: The vi.hoisted Stripe SDK mock (see DEPS-ASSESSMENT.md Mock 1) is a per-test-file
pattern, not a standalone file. The test agent will add it directly in:
- `apps/api/tests/services/stripe.test.ts`
- `apps/api/tests/routes/subscription.routes.test.ts`
- `apps/api/tests/routes/webhook.routes.test.ts`

---

*Last updated by: generate-mock agent, phase-7-subscriptions-content-gating*

---

## Phase 8: Shopify Merch Storefront

**Status: No blocking items — proceed with implementation (mocks cover all tests).**

All Phase 8 dependencies are READY or MOCK. The only new external dependency is the Shopify
Storefront API. Tests mock the `shopify.ts` service module using the same `vi.doMock` pattern
as Stripe in Phase 7. Zero PAUSE items.

### Action Required: Provide Shopify credentials before running the dev server

The Shopify service returns 503 "MERCH_NOT_CONFIGURED" when env vars are absent (the API still
starts successfully). To see live merch data in the dev server, obtain these from your Shopify
admin and add them to your local `.env` file:

```bash
# .env (never commit this file)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com          # Shopify Admin → Settings → Domains
SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token  # Shopify Admin → Apps → Headless → Storefront API
```

These are **not needed for unit tests** — the test suite mocks the `shopify.ts` service module
entirely. They are only required to run the live dev server with real product data.

| Variable | Required For | How to Get |
|----------|-------------|-----------|
| `SHOPIFY_STORE_DOMAIN` | Live merch data in dev/production | Shopify Admin → Settings → Domains (use the `.myshopify.com` domain, not a custom domain) |
| `SHOPIFY_STOREFRONT_TOKEN` | Storefront API authentication | Shopify Admin → Apps → Develop apps → Create app → Configure Storefront API → enable `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts` |

### Awareness: Shopify product setup (non-blocking)

For merch data to appear per-creator, Shopify products must be tagged with the format
`snc-creator:<userId>` (e.g., `snc-creator:user_abc123`). The `vendor` field should be set
to the creator's display name. This is managed in the Shopify admin panel — no code changes
required.

**Tag format**: `snc-creator:<userId>` where `<userId>` is the user's ID in the S/NC database.

### Mock Locations (generated by generate-mock agent)

| Mock | Location | Purpose |
|------|----------|---------|
| Shopify env config additions | `apps/api/src/config.ts` | `SHOPIFY_STORE_DOMAIN?` + `SHOPIFY_STOREFRONT_TOKEN?` added to `ENV_SCHEMA` as optional |
| Test config additions | `apps/api/tests/helpers/test-constants.ts` | Both Shopify vars set to `undefined` in `makeTestConfig()`; override in Shopify service tests |
| Shared merch types | `packages/shared/src/merch.ts` | `MerchProduct`, `MerchProductDetail`, `MerchVariant` schemas + inferred types; re-exported from `@snc/shared` |
| API merch fixtures | `apps/api/tests/helpers/merch-fixtures.ts` | `makeMockVariant()`, `makeMockProduct()`, `makeMockProductDetail()` (normalized); `makeMockShopifyProductNode()`, `makeMockShopifyProductsResponse()`, `makeMockShopifyProductByHandleResponse()`, `makeMockShopifyCartResponse()`, `makeMockShopifyCartErrorResponse()` (raw GraphQL shapes) |
| Web merch fixtures | `apps/web/tests/helpers/merch-fixtures.ts` | `makeMockMerchProduct()`, `makeMockMerchProductDetail()` |

The `vi.doMock` Shopify service mock is a per-test-file pattern (not a standalone file). The
implement/test agent will add it directly in:
- `apps/api/tests/services/shopify.test.ts` (mocks `globalThis.fetch`)
- `apps/api/tests/routes/merch.routes.test.ts` (mocks `shopify.ts` module wholesale)

---

*Last updated by: generate-mock agent, phase-8-shopify-merch-storefront*

---

## Phase 9: Service Booking

**Status: No blocking items — proceed with implementation.**

All Phase 9 dependencies are READY. No new external services, credentials, API keys, or
environment variables are required. Every dependency is already installed and integrated
from Phases 1–8.

### No Action Required

Phase 9 uses only:
- Packages already in `package.json` (`drizzle-orm`, `hono`, `hono-openapi`, `zod`,
  `@tanstack/react-start`, `@zod/mini`, `better-auth`, etc.)
- Node.js 24+ built-in (`crypto.randomUUID()`) — no imports needed
- Existing infrastructure (PostgreSQL via Docker Compose, already running)
- Existing middleware (`requireAuth`, `AuthEnv` from Phase 2)
- Existing utilities (`encodeCursor`/`decodeCursor` from Phase 6, `throwIfNotOk` from
  Phase 8, `useCursorPagination` from Phase 6)
- Existing shared CSS (`listing-page.module.css` from Phase 6)
- Existing environment variables (no new vars needed)

### Awareness: Services table requires seeding (non-blocking)

After the Drizzle migration runs, the `services` table will be empty. To see real services
on the `/services` page in the dev server, insert rows manually or via a seed script:

```sql
INSERT INTO services (id, name, description, pricing_info, active, sort_order)
VALUES
  (gen_random_uuid(), 'Recording Session', 'Professional studio recording session with our in-house engineer.', 'Starting at $50/hour', true, 1),
  (gen_random_uuid(), 'Mixing & Mastering', 'Full mix and master for your project.', 'Starting at $200/track', true, 2),
  (gen_random_uuid(), 'Label Services', 'Distribution, licensing, and promotional support.', 'Contact for pricing', true, 3);
```

This is **not needed for unit tests** — tests mock the `db` module entirely.

---

*Last updated by: evaluate-deps agent, phase-9-service-booking*

---

## Phase 10: Cooperative Dashboard

**Status: No blocking items — proceed with implementation.**

All Phase 10 dependencies are READY. No new external services, credentials, API keys, npm
packages, or database migrations are required before implementation can start. Every
dependency is already installed and integrated from Phases 1–9.

### No Action Required

Phase 10 uses only:
- Stripe SDK already in `package.json` (`stripe`) — `STRIPE_SECRET_KEY` already in config
- New `stripe.invoices.list()` call in `revenue.ts` service uses same credentials as Phase 7
- Packages already in `package.json` (`drizzle-orm`, `hono`, `hono-openapi`, `zod`,
  `@tanstack/react-start`, `@zod/mini`, `better-auth`, etc.)
- Existing infrastructure (PostgreSQL via Docker Compose, already running)
- All required DB columns exist from Phase 9 (`status`, `reviewedBy`, `reviewNote` on
  `booking_requests`; `booking_requests_status_created_idx` index)
- Existing middleware (`requireAuth`, `requireRole("cooperative-member")` from Phase 2)
- Existing utilities (`encodeCursor`/`decodeCursor` from Phase 6, `useCursorPagination`
  from Phase 6, `throwIfNotOk` from Phase 8, `formatPrice` from Phase 7,
  `wrapExternalError` from Phase 7)
- CSS-only bar chart — no external charting library added
- Existing environment variables (no new vars needed)

### Awareness: Stripe invoice data requires real credentials to test end-to-end

The `GET /api/dashboard/revenue` endpoint calls `stripe.invoices.list()`. This works with
the existing `STRIPE_SECRET_KEY` already set up in Phase 7. No new credentials needed.
Unit tests mock the Stripe module via `vi.doMock` — same pattern as Phase 7 tests.

---

*Last updated by: evaluate-deps agent, phase-10-cooperative-dashboard*

---

## Phase 11: Bandcamp Integration

**Status: No blocking items — proceed with implementation.**

All Phase 11 dependencies are READY. No new external services, credentials, API keys, npm
packages, database migrations, or environment variables are required before implementation
can start. Every dependency is already installed and integrated from Phases 1–10.

### No Action Required

Phase 11 uses only:
- Packages already in `package.json` (`drizzle-orm`, `hono`, `hono-openapi`, `zod`,
  `@tanstack/react-start`, `@zod/mini`, `better-auth`, `@testing-library/react`, etc.)
- Standard HTML `<iframe>` elements for Bandcamp embed rendering — no external library
- Existing infrastructure (PostgreSQL via Docker Compose, already running)
- Existing DB columns: `bandcamp_url` and `bandcamp_embeds` already in `creator_profiles`
  table from Phase 6 migration
- Existing constant: `BANDCAMP_URL_REGEX` already in `packages/shared/src/creator.ts`
- Existing middleware (`requireAuth`, `requireRole("creator")` from Phase 2)
- Existing fetch utilities (`apiGet`, `apiMutate`, `throwIfNotOk` from Phase 8)
- Existing CSS patterns (`settings-page.module.css` from Phase 7, design tokens from Phase 3)
- Existing environment variables (no new vars needed)

### Awareness: Bandcamp has no official API (informational)

Bandcamp does not offer a public API. Phase 11 is intentionally limited to:
- Profile URL links (`https://<band>.bandcamp.com/`) stored as text
- Iframe embed URLs (`https://bandcamp.com/EmbeddedPlayer/...`) stored as JSONB array

No Bandcamp account, credentials, or API token is needed. Users generate embed codes
directly from Bandcamp's embed generator UI and paste them into the creator settings form.

---

*Last updated by: evaluate-deps agent, phase-11-bandcamp-integration*

---

## Phase 12: Landing Page & Polish

**Status: No blocking items — proceed with implementation.**

All Phase 12 dependencies are READY. This is a frontend-only phase with no new external
services, credentials, API keys, npm packages, database migrations, or environment
variables required. Every dependency is already installed and integrated from Phases 1–11.

### No Action Required

Phase 12 uses only:
- All existing API endpoints (`GET /api/creators`, `GET /api/content`,
  `GET /api/subscriptions/plans`, `GET /api/subscriptions/mine`) — no changes needed
- Existing React components (`ContentCard`, `CreatorCard`, `PlanCard`) — reused as-is
- Existing auth hooks (`useSession`) and fetch utilities (`apiGet`) — no changes needed
- Existing CSS design tokens in `global.css` — minor additive skip-link styles only
- Existing npm packages (`@testing-library/react`, `@tanstack/react-start`, etc.)
- Existing environment variables (`VITE_API_URL`) — no new vars needed
- Existing Stripe credentials (documented in Phase 7) — the Subscribe CTA uses the
  existing `createCheckout` helper; no new Stripe setup required

### Awareness: All prior credential requirements still apply

No new credentials are introduced. The credentials documented in Phase 7 (Stripe) and
Phase 8 (Shopify) are still required to run the live dev server end-to-end, but are not
needed for the Phase 12 unit tests.

---

*Last updated by: evaluate-deps agent, phase-12-landing-page-polish*
