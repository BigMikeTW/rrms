/**
 * What:  Next.js 16 Proxy (formerly known as Middleware until v16.0.0
 *        renamed it). Runs at the edge of every inbound request matching
 *        the matcher below. Phase 4 responsibility: extract tenant
 *        identity from the request (subdomain in Phase 2; pinned to
 *        DEFAULT_TENANT_ID in Phase 1) and inject `x-tenant-id` request
 *        header so server code (Server Components, Server Actions, Route
 *        Handlers) can resolve tenant via src/lib/tenant-context.ts
 *        without re-parsing the host themselves.
 * Why:   Per ADR-0017 multi-tenant Level 3, every DB query must filter
 *        by tenant_id. The single chokepoint where subdomain →
 *        tenant_id resolution happens MUST be the proxy — anywhere else
 *        risks duplication and drift (per Round-2 Q3 verified pattern +
 *        Vercel platforms-starter-kit reference). Phase 4 lands the
 *        skeleton + the `x-tenant-id` invariant; Phase 2 augments with
 *        real subdomain → tenant lookup using `src/adapters/cache/`
 *        (TenantCachePort). Until then the proxy still runs (so the
 *        invariant holds: every request has `x-tenant-id` set), it just
 *        always sets DEFAULT_TENANT_ID.
 * Where: Filename `src/proxy.ts` (NOT `middleware.ts`) per Next.js 16
 *        v16.0.0 file convention. Strips any incoming `x-tenant-id`
 *        header to prevent client spoofing, then sets the resolved
 *        value. Read on the server side via
 *        `await getCurrentTenantId()` (src/lib/tenant-context.ts).
 *        Auth-related routes (`/api/auth/*`) are excluded from the
 *        matcher — Better Auth sets its own context.
 * When:  Phase 4 (rigorous foundation) — 2026-05-11. Runs on every
 *        request not matched by exclusions in `config.matcher` below.
 *        Per Next.js Proxy docs, runs in Node.js runtime by default
 *        (v16.0.0+) so DB queries are technically possible — but Phase 1
 *        deliberately keeps this proxy DB-free to preserve the "Proxy
 *        is not intended for slow data fetching" guidance.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/tenant-context";

export async function proxy(request: NextRequest) {
  // Strip incoming x-tenant-id from the client (prevent spoofing).
  // Even though we will set it ourselves below, deletion first ensures
  // we never accept a client-provided value, which is an important
  // invariant for the audit trail (`audit_log.tenant_id` must always
  // come from server-side resolution, never user input).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-tenant-id");

  // Phase 1: pin all hosts to DEFAULT_TENANT_ID. Phase 2 replaces this
  // with: extract subdomain from host header → look up TenantCachePort
  // → fall back to Postgres SELECT on tenants table → cache result.
  const tenantId = DEFAULT_TENANT_ID;
  requestHeaders.set("x-tenant-id", tenantId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on every page / API route except:
  //   - Next.js static assets (_next/static, _next/image)
  //   - Favicon
  //   - Better Auth catch-all (it sets its own context per ADR-0132)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/[...all]).*)"],
};
