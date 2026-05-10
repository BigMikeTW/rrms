/**
 * What:  CronAdapter port — the Hexagonal interface for scheduled job
 *        request-time authentication.
 * Why:   Per ADR-0009 RRMS uses Vercel Cron Jobs (configured in vercel.ts
 *        + endpoints under /api/cron/[name]). The endpoints must verify
 *        the CRON_SECRET Bearer header before running. This port keeps
 *        that verification pluggable so a future move to GitHub Actions
 *        cron / self-hosted node-cron / Temporal is a one-file change.
 *        Schedule registration itself stays in vercel.ts (platform-native
 *        config) — only the runtime side needs an abstraction.
 * Where: Consumed by /api/cron/* route handlers (verifyRequest) and by
 *        Plan 8 anonymization cron. The concrete VercelCronAdapter lands
 *        in Plan 8 and reads CRON_SECRET from environment.
 * When:  Port-only in Phase 1. verifyRequest runs once per inbound cron
 *        HTTP request before the handler executes any business logic.
 */

/** Information about the inbound cron HTTP request that the adapter inspects. */
export interface CronRequest {
  /** Header bag (case-insensitive lookup is the adapter's responsibility). */
  headers: Headers | Record<string, string | string[] | undefined>;
}

/** Result of `verifyRequest`. */
export interface CronVerifyResult {
  ok: boolean;
  /** Reason string when ok=false (for audit log; never user-facing). */
  reason?: string;
}

/**
 * Hexagonal port for cron job runtime concerns. Schedule registration
 * itself is platform config (vercel.ts) — this port covers the
 * verification surface that business code touches.
 */
export interface CronAdapter {
  /**
   * Verify an inbound cron HTTP request originated from the platform
   * scheduler (e.g. by checking the CRON_SECRET Bearer header per
   * ADR-0009). MUST run before any handler business logic.
   */
  verifyRequest(request: CronRequest): CronVerifyResult;
}
