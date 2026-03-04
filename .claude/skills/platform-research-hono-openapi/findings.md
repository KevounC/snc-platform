# Research: hono-openapi + Zod 4 Integration

## Context

Phase 1 establishes the API foundation. Every route must register Zod 4 input/output schemas
with OpenAPI 3.1 documentation. The project already specifies `hono-openapi: "latest"` in
`apps/api/package.json`. This research verifies the correct API surface for that package
(rhinobase/hono-openapi), evaluates it against the alternative (`@hono/zod-openapi`), and
documents exact usage patterns for Zod 4.

## Questions

1. What is the current `hono-openapi` API for `describeRoute`, `resolver`, `validator`, and
   serving the OpenAPI JSON endpoint?
2. Does `hono-openapi` support Zod 4 natively — and are any extra packages required?
3. What is `@hono-openapi/zod` — a separate npm package or a subpath export?
4. How does `hono-openapi` compare to `@hono/zod-openapi` for this project?
5. What is the correct `@hono/node-server` `serve()` return type and graceful shutdown pattern?

## Options Evaluated

### Option 1: `hono-openapi` (rhinobase/hono-openapi) — CHOSEN

**Version**: v1.2.0 (January 26, 2025) — actively maintained
**NPM**: `hono-openapi` (already in `apps/api/package.json` as `"latest"`)
**GitHub**: https://github.com/rhinobase/hono-openapi
**Downloads**: ~50k/week

- **Pros**:
  - Works with the standard `Hono` class — no app-class substitution required
  - Validator-agnostic (Zod, Valibot, ArkType, TypeBox, any Standard Schema library)
  - Zod 4 support native since v1.0.0 (September 2024) via Standard Schema compliance
  - Request validation via `validator()` is **automatically** included in the OpenAPI spec —
    no duplication needed
  - `openAPIRouteHandler(app, { documentation: {...} })` serves OpenAPI 3.1 JSON in one line
  - Already selected for this project; no migration cost
  - ESM-native, zero Node.js dependency
  - `.meta({ ref: "Name" })` on Zod 4 schemas creates reusable `$ref` components natively

- **Cons**:
  - Younger project (v1.0.0 Sept 2024); less battle-tested than `@hono/zod-openapi`
  - Documentation is still evolving (some API samples across the web use older patterns)
  - `@hono/standard-validator` is a required peer dependency that must be added manually

- **Maturity**: Active — v1.2.0 released Jan 2025 with bug fixes; v1.0.0–v1.2.0 within 5 months

### Option 2: `@hono/zod-openapi` (official Hono middleware)

**Version**: v1.2.2 (February 2026, 11 days ago at time of research)
**NPM**: `@hono/zod-openapi` — 256k weekly downloads
**GitHub**: https://github.com/honojs/middleware/tree/main/packages/zod-openapi

- **Pros**:
  - More widely adopted (5× more downloads than hono-openapi)
  - Officially maintained by the Hono team
  - Zod 4 support added June 2025 (resolved after `@asteasolutions/zod-to-openapi` merged Zod 4 PR)
  - Tight TypeScript integration via `createRoute()` generics
- **Cons**:
  - Requires replacing `Hono` with `OpenAPIHono` — significant structural change
  - Routes must be defined with `createRoute()` and registered via `app.openapi()` — different
    mental model from standard Hono routing
  - Zod 4 support was absent until June 2025 (issue #1177), meaning older docs use Zod 3
    patterns (`.openapi()` method via `@hono/zod-openapi`'s Zod extension)
  - More boilerplate per route
- **Maturity**: Mature — widely used, official team backing

## Recommendation

**Use `hono-openapi` (rhinobase).** It is already selected in `package.json`, requires no
structural changes to the Hono app, and has native Zod 4 support. The lower adoption compared
to `@hono/zod-openapi` is offset by the fact that `@hono/zod-openapi` only gained Zod 4 support
in June 2025 (too late to be the established choice at project start) and would require
rewriting route registration patterns.

## Implementation Notes

### Installation

`hono-openapi` is already in `apps/api/package.json`. Add the required peer dependency:

```bash
pnpm add @hono/standard-validator
```

> **No extra package needed for Zod 4.** Zod 4 implements Standard Schema natively.
> The `zod-openapi@4` package (by Sam Chung) is only needed for Zod 3 to get the `.openapi()`
> method. Do NOT install it for this project.

### Clarification: `@hono-openapi/zod` vs `hono-openapi/zod`

The VISION.md mentions "`@hono-openapi/zod` resolver" — this refers to importing from the
`hono-openapi/zod` **subpath export** of the `hono-openapi` package, not a separate npm package.
`@hono-openapi/zod` does not exist as a standalone scoped npm package.

The correct import pattern is:

```typescript
// Option A: import everything from the main package
import { describeRoute, resolver, validator, openAPIRouteHandler } from 'hono-openapi'

// Option B: Zod-specific imports from subpath (equivalent, may be preferred for clarity)
import { resolver, validator } from 'hono-openapi/zod'
import { describeRoute, openAPIRouteHandler } from 'hono-openapi'
```

Both patterns work. The hono.dev official examples use Option A (import from `'hono-openapi'`
directly).

### Core API Patterns

#### 1. Documenting a Route (`describeRoute` + `validator`)

```typescript
import { describeRoute, resolver, validator } from 'hono-openapi'
import { z } from 'zod'

const CreateUserBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const UserResponse = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
}).meta({ ref: 'User' })  // Zod 4: becomes $ref: '#/components/schemas/User'

app.post(
  '/users',
  describeRoute({
    description: 'Create a new user',
    tags: ['users'],
    responses: {
      201: {
        description: 'User created',
        content: {
          'application/json': { schema: resolver(UserResponse) },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: resolver(ErrorResponse) },
        },
      },
    },
  }),
  validator('json', CreateUserBody),   // auto-added to spec as requestBody
  async (c) => {
    const body = c.req.valid('json')   // typed as CreateUserBody
    // ...
  },
)
```

**Key**: `validator()` is added as a separate middleware argument after `describeRoute()`.
The request body schema is **automatically** included in the OpenAPI spec — no need to declare
it inside `describeRoute({ request: {...} })`.

#### 2. Serving the OpenAPI 3.1 Spec Endpoint

```typescript
import { openAPIRouteHandler } from 'hono-openapi'

app.get(
  '/api/openapi.json',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'S/NC API',
        version: '1.0.0',
        description: 'S/NC content platform API',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
      ],
    },
  }),
)
```

> **Important**: Pass the same `app` instance that has all routes mounted. Mount the OpenAPI
> endpoint **after** all routes are registered so it reflects the full spec.

#### 3. Zod 4 Schema Component References

For reusable schemas (appearing as `$ref` in the spec), add `.meta({ ref: 'Name' })`:

```typescript
// Zod 4 — native metadata, no extension needed
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
}).meta({ ref: 'User' })

// Zod 3 equivalent (NOT needed here):
// .openapi({ ref: 'User' })  ← requires zod-openapi@4 package
```

Schemas without `.meta({ ref })` are inlined in the spec. Schemas with `.meta({ ref })` are
extracted to `components.schemas` and referenced via `$ref`.

#### 4. Query and Path Parameters

```typescript
const ListUsersQuery = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
})

const UserParams = z.object({
  id: z.string().uuid(),
})

app.get(
  '/users',
  describeRoute({ description: 'List users', responses: { 200: {...} } }),
  validator('query', ListUsersQuery),   // → query parameters in spec
  (c) => {
    const { page, limit } = c.req.valid('query')
    // ...
  },
)

app.get(
  '/users/:id',
  describeRoute({ description: 'Get user by ID', responses: { 200: {...} } }),
  validator('param', UserParams),       // → path parameters in spec
  (c) => {
    const { id } = c.req.valid('param')
    // ...
  },
)
```

> **Coercion**: Query and path parameters arrive as strings. Use `z.coerce.number()` (or
> similar) for numeric params — NOT `z.number()` which will fail string input.

#### 5. `@hono/node-server` serve() + Graceful Shutdown

```typescript
import { serve } from '@hono/node-server'

const server = serve({
  fetch: app.fetch,
  port: config.PORT,
})

process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err)
      process.exit(1)
    }
    // Close DB pool here, then exit
    sql.end().then(() => process.exit(0))
  })
})
```

`serve()` returns an `http.Server` instance. `server.close()` stops accepting new connections
and calls the callback when all in-flight requests have drained. The `fetch` property accepts
the Hono app directly (Hono app is callable as a fetch handler).

### Common Pitfalls

1. **Don't declare request schemas twice**: `validator('json', schema)` auto-adds to spec.
   Avoid duplicating schema in `describeRoute({ request: { body: {...} } })`.

2. **Mount OpenAPI endpoint after all routes**: `openAPIRouteHandler` scans `app` at request
   time, but mounting after ensures no race conditions with route registration order.

3. **Don't use `z.number()` for query/path params**: Use `z.coerce.number()`. Raw query
   strings fail Zod's non-coercing `z.number()` validator.

4. **`@hono-openapi/zod` is NOT a separate npm package**: It's the `hono-openapi/zod`
   subpath export. Don't attempt `pnpm add @hono-openapi/zod` — it doesn't exist.

5. **`zod-openapi@4` is not needed for Zod 4**: Only install it if supporting Zod 3 schemas
   that use `.openapi()`. This project uses Zod 4 throughout.

6. **`validator()` middleware order matters**: Place `validator()` after `describeRoute()` in
   the middleware chain so metadata is attached before validation runs.

### OpenAPI 3.1 vs 3.0

`hono-openapi` generates **OpenAPI 3.1.0** by default (SPEC.md requirement). No configuration
needed; the output `openapi` field will be `"3.1.0"`.

## Migration Path

If switching from `hono-openapi` to `@hono/zod-openapi` later:
1. Replace `new Hono()` with `new OpenAPIHono()`
2. Replace `app.get/post(path, describeRoute(...), validator(...), handler)` with
   `app.openapi(createRoute({...}), handler)`
3. Replace `openAPIRouteHandler` with `app.doc31('/path', {...})`
4. Replace `.meta({ ref })` with `.openapi({ ref })` (after adding `@hono/zod-openapi`'s Zod
   extension)

Migration is mechanical but non-trivial (~15 min per route file). Avoid switching mid-phase.

## References

- [hono-openapi GitHub](https://github.com/rhinobase/hono-openapi)
- [hono-openapi on hono.dev examples](https://hono.dev/examples/hono-openapi)
- [HonoHub Zod docs](https://honohub.dev/docs/openapi/zod)
- [hono-openapi releases](https://github.com/rhinobase/hono-openapi/releases)
- [@hono/zod-openapi Zod v4 issue #1177](https://github.com/honojs/middleware/issues/1177)
- [@hono/node-server Node.js docs](https://hono.dev/docs/getting-started/nodejs)
- [Zod 4 release notes (.meta)](https://zod.dev/v4)
