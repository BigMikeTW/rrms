/**
 * 4W Documentation
 *
 * What:
 *   Vercel project configuration in TypeScript form. Replaces the legacy
 *   `vercel.json` declarative file with a type-checked TypeScript module.
 *   For Phase 1 this sets only `framework: 'nextjs'`. Future fields
 *   (crons, rewrites, headers, redirects) are added in Plan 8 Task 1.
 *
 * Why:
 *   spec §7.4 specifies `vercel.ts` over `vercel.json` so that platform
 *   configuration is type-checked at build time. A misconfigured field
 *   (e.g. an invalid `framework` literal, a malformed cron schedule) is
 *   caught locally by `tsc --noEmit` before the deploy pipeline ever
 *   runs, instead of failing silently on Vercel.
 *
 * Where:
 *   Lives at the repo root (alongside `next.config.ts`). Vercel's deploy
 *   pipeline reads this file in place of `vercel.json` — they MUST NOT
 *   coexist.
 *
 * When:
 *   Read by Vercel on every build (preview + production). The exported
 *   `config` object affects how the platform routes requests, schedules
 *   cron jobs (Plan 8), applies headers, and selects the framework
 *   preset for the build.
 *
 * Notes:
 *   The import path `@vercel/config/v1` is required by the `exports`
 *   map in `@vercel/config@0.3.0`'s package.json — the bare specifier
 *   `@vercel/config` is not exposed at runtime. If you upgrade the
 *   package, re-verify the available subpath exports.
 */
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  // crons / rewrites / headers 在後續 plan (Plan 8 Task 1) 加入
};
