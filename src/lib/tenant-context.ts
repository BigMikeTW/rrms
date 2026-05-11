/**
 * What:  Server-side tenant context helper. Reads the `x-tenant-id`
 *        header that src/proxy.ts injected per request and returns the
 *        current tenant UUID. Wrapped in React `cache()` so a single
 *        request that calls this from multiple Server Components / Server
 *        Actions only does the header read once.
 * Why:   Per ADR-0017 + ADR-0089 + ADR-0133 every DB query must carry
 *        tenant_id. The single chokepoint where subdomain → tenant_id
 *        resolution happens is src/proxy.ts (per Round-2 Q3 verified
 *        Next.js 16 pattern). This helper is the read side: any
 *        server-only code that needs the current tenant calls
 *        `await getCurrentTenantId()` and gets it without re-parsing
 *        the host. AsyncLocalStorage is intentionally NOT used —
 *        Next.js issue #69298 + discussion #67305 confirm middleware /
 *        proxy ALS context does not propagate to RSC / Route Handlers,
 *        and the `cache()` + `headers()` pattern is the official
 *        recommendation per Next.js 16 docs.
 * Where: Imported by Server Components, Server Actions, Route Handlers,
 *        and Plan 3 Task 8.5 repository factories. NOT for client
 *        components — `next/headers` throws in client context. The
 *        rrms/no-server-sdk-in-client ESLint rule does not block this
 *        file directly (no third-party SDK imported), but importing it
 *        from a "use client" file will fail at runtime.
 * When:  Phase 4 (rigorous foundation) — 2026-05-11. Phase 1 always
 *        returns DEFAULT_TENANT_ID because src/proxy.ts pins all hosts
 *        to it. Phase 2 multi-tenant activation will make this helper
 *        return the actual subdomain-resolved tenant.
 */

import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

/**
 * Phase 1 default tenant UUID. Pinned per ADR-0017 + ADR-0133:
 * `'00000000-0000-0000-0000-000000000001'`. Reserved sentinel
 * `'00000000-0000-0000-0000-ffffffffffff'` is for anonymized actors
 * (per ADR-0133 strategy A) — different value, different meaning.
 *
 * Exported for tests + DB seeds; runtime code should call
 * `getCurrentTenantId()` instead of importing this directly.
 */
export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001" as const;

/**
 * Returns the tenant UUID for the current request. Throws if the
 * `x-tenant-id` header is missing — that means src/proxy.ts did not run
 * (configuration error) and we MUST fail closed to avoid leaking data
 * across tenants.
 *
 * Wrapped in React `cache()` so multiple callers within the same render
 * pass share one header read.
 */
export const getCurrentTenantId = cache(async (): Promise<string> => {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) {
    throw new Error(
      "Missing tenant context (x-tenant-id header). Did src/proxy.ts run for this request?",
    );
  }
  return tenantId;
});
