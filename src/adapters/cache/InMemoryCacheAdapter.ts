/**
 * What:  In-memory implementation of TenantCachePort. Backed by a single
 *        Map with bounded capacity (LRU-style eviction when full) and
 *        per-entry TTL enforcement. Lives inside the Vercel Function
 *        instance so values persist across requests handled by the same
 *        warm instance (per Vercel Fluid Compute reuse).
 * Why:   Per ADR-0133 + Round-2 research Q6: Phase 1 RRMS has ~100
 *        tenants × ~200 bytes per entry = ~20 KB cache footprint, far
 *        below the Vercel Function memory limit. Installing Upstash
 *        Redis (or any external cache) for this volume is over-engineering
 *        — adds a dependency, an env secret, a fail point, monthly cost.
 *        The in-memory adapter is the correct Phase 1 default; Phase 2+
 *        can swap to UpstashCacheAdapter via the port (Hexagonal — per
 *        ADR-0110) when tenant count or cross-instance consistency demands.
 * Where: Wired in src/lib/tenant-resolver.ts (the only Phase 1 consumer).
 *        Per ADR-0110, business code must NOT import this concrete adapter
 *        directly — they should depend on the TenantCachePort interface
 *        and receive an injected instance via the resolver helper.
 *        ESLint rule rrms/no-platform-sdk-outside-adapter does not block
 *        Map (it is built-in JavaScript), so the discipline here is purely
 *        architectural; reviewers must enforce.
 * When:  Phase 4 (rigorous foundation) — 2026-05-11. Methods are invoked
 *        once per inbound HTTP request through src/proxy.ts → tenant
 *        resolver → this adapter.
 */

import "server-only";
import type { CacheSetOptions, TenantCachePort } from "./index";

interface Entry {
  value: unknown;
  expiresAt: number; // ms epoch; Number.POSITIVE_INFINITY for no TTL
}

/** Bounded LRU-ish in-memory cache. Eviction = oldest insertion order. */
export class InMemoryCacheAdapter implements TenantCachePort {
  private readonly store = new Map<string, Entry>();
  private readonly capacity: number;

  constructor(capacity = 1024) {
    if (capacity < 1) throw new Error("capacity must be >= 1");
    this.capacity = capacity;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    // Touch: re-insert to mark as recently used.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    const ttl = options?.ttlSeconds;
    const expiresAt =
      typeof ttl === "number" && Number.isFinite(ttl) && ttl > 0
        ? Date.now() + ttl * 1000
        : Number.POSITIVE_INFINITY;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.capacity) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt });
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Module-level singleton. Vercel Fluid Compute reuses the function
 * instance, so this Map persists across requests handled by the same
 * warm instance. Cold starts begin with an empty cache (acceptable —
 * cache is best-effort by design).
 */
export const inMemoryTenantCache: TenantCachePort = new InMemoryCacheAdapter();
