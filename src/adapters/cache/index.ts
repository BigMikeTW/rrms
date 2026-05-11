/**
 * What:  TenantCache port — the Hexagonal interface for tenant-resolution
 *        cache (subdomain → tenant_id lookup) and any other small,
 *        per-region key-value cache RRMS needs in Phase 1.
 * Why:   Per ADR-0110 + ADR-0112, RRMS commits to Hexagonal architecture
 *        so the future swap from in-memory → Upstash Redis (per Round-2
 *        research Q6: Vercel KV is no longer offered as of 2024-12) → some
 *        other regional cache is a one-folder change. Phase 1 RRMS expects
 *        ~100 tenants × ~200 bytes each = ~20 KB cache footprint, well
 *        within Fluid Compute warm-instance memory; no external cache
 *        needed yet. The port nonetheless lands in Phase 4 so business
 *        code can NEVER directly import a future Upstash SDK without an
 *        ADR + the corresponding adapter.
 * Where: Consumed by src/lib/tenant-resolver.ts (subdomain → tenant_id
 *        lookup invoked by src/proxy.ts on every request). Concrete
 *        implementation lives in src/adapters/cache/InMemoryCacheAdapter.ts
 *        for Phase 1; UpstashCacheAdapter.ts may land in Phase 2+ when
 *        the in-memory footprint outgrows Fluid Compute warm reuse.
 * When:  Phase 4 (rigorous foundation) — 2026-05-11. Methods are invoked
 *        on every inbound HTTP request through src/proxy.ts (cache-warm
 *        path is sub-millisecond; cache-miss falls back to DB SELECT).
 */

/** Options accepted by `set`. */
export interface CacheSetOptions {
  /** Time-to-live in seconds. Adapter MAY ignore (e.g. in-memory has no TTL). */
  ttlSeconds?: number;
}

/**
 * Hexagonal port for a small, per-region key-value cache. Concrete
 * adapters live in this same folder (e.g. InMemoryCacheAdapter.ts,
 * future UpstashCacheAdapter.ts) and must not be imported by business
 * code — only this interface should be.
 *
 * Phase 1 contract: best-effort cache. `get` returning `null` is normal
 * (cache miss); caller is responsible for the source-of-truth fallback
 * (typically a Postgres SELECT). `set` MAY silently drop oldest entries
 * (in-memory adapter uses bounded capacity).
 */
export interface TenantCachePort {
  /** Look up a value by key. Returns null on cache miss. */
  get<T>(key: string): Promise<T | null>;

  /** Store a value by key. May overwrite existing entry. */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  /** Remove a key. No-op if key doesn't exist. */
  invalidate(key: string): Promise<void>;
}
