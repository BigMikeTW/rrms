/**
 * 4W Documentation
 * ----------------
 * What:  Red-team fixture for the custom ESLint rule
 *        `rrms/no-direct-db-query`. This file lives outside any
 *        allowlisted infrastructure path and intentionally imports
 *        `@/db/client` and several `drizzle-orm` runtime helpers — both
 *        of which the rule MUST flag because they bypass the
 *        tenant-scoped repository layer mandated by ADR-0017 multi-
 *        tenant Level 3. Type-only imports MUST NOT trigger.
 * Why:   We need a known-bad input to prove the linter detects the
 *        forbidden patterns. Without a fixture, a future regression in
 *        the rule (e.g. a typo in the blacklist, a broken file-path
 *        check, or breakage of the `import type` exemption) would
 *        silently pass CI. The fixture is the canary for the multi-
 *        tenant data-isolation discipline mandated by ADR-0017 +
 *        ADR-0133.
 * Where: Lives under `__tests__/__fixtures__/`, which is added to
 *        ESLint's global ignores so this file does NOT fail
 *        `pnpm lint`. It is only linted via
 *        `pnpm exec eslint --no-ignore __tests__/__fixtures__/`,
 *        which is the manual verification step (Phase 4 task 8.6 +
 *        same convention as Phase 1 Task 4 + Phase 3).
 * When:  Use whenever you change `eslint-rules/no-direct-db-query.mjs`
 *        — re-run the --no-ignore command and confirm exactly four
 *        errors fire on this file (one per forbidden value-import).
 *        The two `import type` lines below are NOT violations and must
 *        stay quiet.
 *
 * !!! INTENTIONAL VIOLATIONS — DO NOT "FIX" THIS FILE !!!
 * The forbidden imports below are the test subjects. Removing or
 * "fixing" them would silently break the multi-tenant data-isolation
 * guard required by ADR-0017 + ADR-0133.
 */

// Value imports — each one MUST produce a `no-direct-db-query` error
// (4 errors total).
import { db } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { exists } from "drizzle-orm/expressions";

// Type-only imports — types disappear at compile time, so these are
// EXEMPTED. They must NOT produce a violation. If they do, the
// `importKind === "type"` early-exit in the rule has regressed.
import type { Case } from "@/db/schema";
import type { eq as eqType } from "drizzle-orm";

export const sink = { db, eq, and, sql, exists };
export type Sink = { c: Case; e: typeof eqType };
