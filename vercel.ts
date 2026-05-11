/**
 * 4W Documentation
 *
 * What:
 *   Vercel project configuration in TypeScript form. Replaces the legacy
 *   `vercel.json` declarative file with a type-checked TypeScript module.
 *   Phase 1 sets `framework: 'nextjs'` and a custom `buildCommand` that
 *   appends the client-bundle secret scan (`pnpm scan:bundle`) after the
 *   Next.js build — this is defense-in-depth Layer 5 (spec §6.7.4): the
 *   build itself blocks a deploy if a secret leaked into client JS.
 *   Future fields (crons, rewrites, headers, redirects) are added in
 *   Plan 8 Task 1.
 *
 * Why:
 *   spec §7.4 specifies `vercel.ts` over `vercel.json` so that platform
 *   configuration is type-checked at build time. A misconfigured field
 *   (e.g. an invalid `framework` literal, a malformed cron schedule) is
 *   caught locally by `tsc --noEmit` before the deploy pipeline ever
 *   runs, instead of failing silently on Vercel.
 *
 *   `buildCommand` is set so the platform runs `pnpm build && pnpm
 *   scan:bundle` instead of the auto-detected `next build`. This makes
 *   Layer 5 of spec §6.7.4's defense-in-depth secret-leak strategy a
 *   *build-time* gate: even if a secret bypasses L1 (Claude hooks), L2
 *   (Husky pre-commit), L3 (pre-push, Phase 2), and L4 (CI gitleaks +
 *   Client bundle scan jobs — both required status checks), the Vercel
 *   build still runs `scan:bundle` on the compiled `.next/static/**`
 *   output and exits non-zero (deploy aborted) if a secret-shaped string
 *   is found. `pnpm install` is intentionally NOT in buildCommand —
 *   Vercel's pipeline already installs deps from the lockfile before the
 *   build step. `gitleaks` is intentionally NOT in buildCommand — it is
 *   a Go binary not present in the Vercel build image, and source-file
 *   secret scanning is already covered by the L4 CI `gitleaks` required
 *   check (every push); L5's marginal value is the post-build bundle
 *   scan, which `scan:bundle` provides.
 *
 * Where:
 *   Lives at the repo root (alongside `next.config.ts`). Vercel's deploy
 *   pipeline reads this file in place of `vercel.json` — they MUST NOT
 *   coexist.
 *
 * When:
 *   Read by Vercel on every build (preview + production). The exported
 *   `config` object affects how the platform routes requests, schedules
 *   cron jobs (Plan 8), applies headers, selects the framework preset,
 *   and (Phase 1) runs the post-build secret scan via `buildCommand`.
 *
 * Notes:
 *   The import path `@vercel/config/v1` is required by the `exports`
 *   map in `@vercel/config@0.3.0`'s package.json — the bare specifier
 *   `@vercel/config` is not exposed at runtime. If you upgrade the
 *   package, re-verify the available subpath exports.
 */
import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Layer 5 (spec §6.7.4): post-build client-bundle secret scan. If
  // `pnpm scan:bundle` exits non-zero (secret found in .next/static),
  // the build fails and Vercel does not deploy. `pnpm install` omitted
  // (Vercel installs deps before buildCommand). See Why block above.
  buildCommand: "pnpm build && pnpm scan:bundle",
  // crons / rewrites / headers 在後續 plan (Plan 8 Task 1) 加入
};
