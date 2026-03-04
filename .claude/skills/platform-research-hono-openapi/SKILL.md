---
name: platform-research-hono-openapi
description: "Research findings on hono-openapi + Zod 4 integration. Auto-loads when working
  with hono-openapi, describeRoute, resolver, validator, openAPIRouteHandler, @hono/zod-openapi,
  OpenAPI 3.1 spec generation, hono-openapi/zod subpath, @hono/standard-validator,
  @hono/node-server serve graceful shutdown, Zod meta ref components schemas."
user-invocable: false
---

# Research: hono-openapi + Zod 4

See [findings.md](findings.md) for the complete analysis.

## Key Recommendation

Use `hono-openapi` (rhinobase, v1.2.0, Jan 2025) — already in `package.json`. It works with
the standard `Hono` class (no `OpenAPIHono` substitution), has native Zod 4 support via
Standard Schema, and auto-includes request validation schemas in the spec via `validator()`.
Add `@hono/standard-validator` as the only extra peer dependency.

## Quick Reference

- **Imports**: `{ describeRoute, resolver, validator, openAPIRouteHandler }` from `'hono-openapi'`
- **`@hono-openapi/zod` is NOT a separate package** — it's the `hono-openapi/zod` subpath
  export; `import { resolver, validator } from 'hono-openapi/zod'` also works
- **Serve spec**: `app.get('/api/openapi.json', openAPIRouteHandler(app, { documentation: { info: {...} } }))`
- **Request auto-spec**: `validator('json'|'query'|'param', schema)` after `describeRoute()` is
  auto-included in the spec — don't duplicate in `describeRoute({ request: {...} })`
- **Zod 4 component refs**: `.meta({ ref: 'SchemaName' })` — no `zod-openapi@4` needed
- **Graceful shutdown**: `serve()` returns `http.Server`; use `server.close(callback)` on SIGTERM
- **Query/path coercion**: Use `z.coerce.number()` not `z.number()` for numeric URL params
