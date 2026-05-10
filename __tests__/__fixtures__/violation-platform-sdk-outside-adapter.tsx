/**
 * 4W Documentation
 * ----------------
 * What:  Red-team fixture for the custom ESLint rule
 *        `rrms/no-platform-sdk-outside-adapter`. This file lives outside
 *        `src/adapters/` and intentionally imports four platform / vendor
 *        SDKs that the rule MUST flag: `@vercel/blob` (matched by the
 *        `@vercel/*` prefix pattern), `@line/bot-sdk` (exact match), `pg`
 *        (raw Postgres driver, exact match), and `next-auth` (alternative
 *        auth library, exact match). Each import line must produce one
 *        ESLint error.
 * Why:   We need a known-bad input to prove the linter detects the
 *        forbidden patterns. Without a fixture, a future regression in
 *        the rule (e.g. a typo in the blacklist, a broken file-path
 *        check, or breakage of the `import type` exemption) would
 *        silently pass CI. The fixture is the canary for the Hexagonal
 *        / Ports-and-Adapters discipline mandated by ADR-0110.
 * Where: Lives under `__tests__/__fixtures__/`, which is added to
 *        ESLint's global ignores so this file does NOT fail `pnpm lint`.
 *        It is only linted via
 *        `pnpm exec eslint --no-ignore __tests__/__fixtures__/`,
 *        which is the manual verification step (Phase 3 task 3.3 +
 *        Plan 1 Task 4 Step 4 pattern).
 * When:  Use whenever you change
 *        `eslint-rules/no-platform-sdk-outside-adapter.mjs` — re-run the
 *        --no-ignore command and confirm exactly four errors fire on
 *        this file (one per forbidden value-import). The two `import
 *        type` lines below are NOT violations and must stay quiet.
 *
 * !!! INTENTIONAL VIOLATIONS — DO NOT "FIX" THIS FILE !!!
 * The forbidden imports below are the test subjects. Removing or
 * "fixing" them would silently break the Hexagonal lock-in guard
 * required by ADR-0110.
 */

// Value imports — each one MUST produce a `no-platform-sdk-outside-adapter`
// error (4 errors total).
import { put } from "@vercel/blob";
import { Client } from "@line/bot-sdk";
import { Pool } from "pg";
import NextAuth from "next-auth";

// Type-only imports — types disappear at compile time, so these are
// EXEMPTED. They must NOT produce a violation. If they do, the
// `importKind === "type"` early-exit in the rule has regressed.
import type { PutBlobResult } from "@vercel/blob";
import type { WebhookEvent } from "@line/bot-sdk";

export const sink = { put, Client, Pool, NextAuth };
export type Sink = { blob: PutBlobResult; line: WebhookEvent };
