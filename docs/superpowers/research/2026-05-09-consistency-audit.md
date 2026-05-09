<!--
What:  Cross-document consistency audit of RRMS Phase 1 spec, plans, research,
       coding standards, and continue.md against canonical decisions locked
       through commit 7d5bda8 (Better Auth, Next.js 16, subdomain architecture).
Why:   The user worries that residual inconsistencies will mislead future AI
       subagents and derail Plan 1 Task 1 onward. This report enumerates every
       deviation so the controller can fix them in a single batched commit.
Where: Companion to the spec/plans under docs/superpowers/. No source files
       were modified by this audit; only this report was added.
When:  Generated 2026-05-09 before any feature implementation begins.
-->

# RRMS Documentation Consistency Audit

**Date:** 2026-05-09
**Method:** Cross-reference all spec / plan / research / standards / continue.md / memory files against canonical decisions established in continue.md (commit 7d5bda8) and the cross-plan version research (commit 40d664b).
**Files audited:** 13
- 1 spec: `docs/superpowers/specs/2026-05-07-rrms-phase1-design.md`
- 8 plans: `docs/superpowers/plans/2026-05-08-rrms-phase1-plan-{1..8}-*.md`
- 2 research: `docs/superpowers/research/2026-05-08-bootstrap-versions.md`, `docs/superpowers/research/2026-05-08-cross-plan-versions.md`
- 1 standard: `docs/CODING_STANDARDS.md`
- 1 handoff: `continue.md`
- Memory files at `C:\Users\Mike Lin\.claude\projects\c--APP-Project-RRMS\memory\` (12 files: MEMORY.md + 1 user + 7 feedback + 3 project)

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical (will mislead implementer / cause failure) | 7 |
| ⚠️ Important (creates confusion / docs internally disagree) | 8 |
| 🟡 Minor (typo / style / outdated reference but recoverable) | 6 |
| ℹ️ Note (no fix needed, just observation) | 4 |

The single largest pattern: **the spec was never updated after the Auth.js → Better Auth pivot**, and the older Plan 1 + Plan 8 files were never re-aligned to the new auth library, env-var names, or `users` → `user` table rename. Plan 6 still imports from `@/auth/auth` (the rejected path) and from a `users` symbol that does not exist in the locked schema.

---

## 🔴 Critical Inconsistencies

### Issue 1: Plan 6 imports rejected `@/auth/auth` path and non-existent `users` symbol

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-6-admin-and-line-push.md` line 441: `` import { auth } from "@/auth/auth"; ``
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-6-admin-and-line-push.md` line 355: `` import { cases, caseStatusHistory, caseMedia, users } from "@/db/schema"; ``
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-6-admin-and-line-push.md` line 374: `u: users,`
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-6-admin-and-line-push.md` line 377: `.leftJoin(users, eq(caseStatusHistory.changedByUserId, users.id))`
- **Canonical value:**
  - Auth import path: `@/lib/auth` (Plan 3 file structure section, line 53–66; Plan 3 line 590 declares `src/lib/auth.ts`).
  - Schema export: `user` (singular) per Better Auth defaults (Plan 3 lines 283, 226–228 explicitly state `user / session / account / verification` singular).
- **Why critical:** A subagent running Plan 6 will get TypeScript module-not-found errors on both imports. Plan 6 uses the symbol four times in `case detail page` and again in Plan 7's `customerRequests` table FK declaration (Plan 7 line 741: `references(() => users.id)` — same broken reference).
- **Suggested fix:** Replace `@/auth/auth` with `@/lib/auth`; replace every `users` symbol/`users.id` reference with `user`/`user.id` in Plans 6 and 7.

### Issue 2: Plan 7 `customer_requests.closed_by_user_id` FK uses uuid type but Better Auth `user.id` is text

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-7-line-oa-query.md` line 741: `closedByUserId: uuid("closed_by_user_id").references(() => users.id),`
- **Canonical value:** Plan 3 line 286 (`id: text("id").primaryKey()`) and Plan 3 line 363 explicitly note "因為 `user.id` 改成 `text`（Better Auth 字串 PK），下面 RRMS 自有表中所有指向 `user.id` 的 FK（`caseStatusHistory.changedByUserId`）也改用 `text`." Plan 3 line 417 implements this for `caseStatusHistory.changedByUserId: text(...)`.
- **Why critical:** Postgres will reject the FK at migration time because uuid ≠ text.
- **Suggested fix:** Change `uuid("closed_by_user_id")` to `text("closed_by_user_id")` and `users.id` to `user.id`.

### Issue 3: Spec §4.3, §6.5, §7.1 still mandate Auth.js v5 + bcrypt — directly contradicts locked Better Auth decision

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` line 122: `**Library**：Auth.js v5（Next.js App Router 適配版）`
  - line 128: `Email + 密碼 | Credentials provider | 帳號統一用 Email；密碼用 bcrypt 雜湊`
  - line 134: `**Session**：Auth.js 預設 JWT in cookie；TTL = 30 天滑動。`
  - line 141: `Auth.js 自訂 OAuth provider 串 https://access.line.me/oauth2/v2.1/`
  - line 386: `| 密碼雜湊 | bcrypt | — |`
  - line 418: `| 伺服器機密 | DB 密碼、LINE Channel Secret、Dropbox refresh token、OAuth client_secret、Auth.js secret、Webhook 簽章 | …`
  - line 424: `Auth.js session cookie 必須設定：…`
  - line 600: `| 認證 | Auth.js v5 |`
- **Canonical value:** continue.md line 46 + 159: "Better Auth ^1.6 (NOT Auth.js v5 beta — 已改)"; Plan 3 lines 22–24 "Why Better Auth (and not Auth.js v5)"; locked decision documented after spec was written.
- **Why critical:** Spec is the source-of-truth for product decisions; an implementer reading spec first will pick the wrong library, the wrong hash function (bcrypt instead of scrypt), and the wrong session strategy (JWT instead of DB token) — exactly the rejected paths.
- **Suggested fix:** Patch spec §4.3 (Library/Email row), §6.5 (密碼雜湊 row → "Better Auth scrypt 內建"), §6.7.2 (mention "Better Auth secret" not "Auth.js secret"), §6.7.3 (rename to "Better Auth session cookie"), §7.1 (table row "認證 | Better Auth ^1.6").

### Issue 4: Plan 1 + Plan 8 use Auth.js env vars (`AUTH_SECRET` / `AUTH_URL`) — wrong names

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` lines 1130–1132:
    ```
    # Auth.js
    AUTH_SECRET=
    AUTH_URL=
    ```
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md` lines 607–608, 624, 627–628:
    ```
    AUTH_SECRET                           ← Plan 3
    AUTH_URL                              ← Plan 3 (改為正式 domain)
    ...
    - [ ] Step 2：確認 AUTH_URL 改為正式網域
    vercel env rm AUTH_URL production
    vercel env add AUTH_URL production
    ```
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md` line 521 (incident response playbook): `| AUTH_SECRET | …`
- **Canonical value:** Better Auth uses `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (Plan 3 lines 559–569; continue.md line 159).
- **Why critical:** Plan 8 explicitly tells the user to `vercel env rm AUTH_URL production` and re-add `AUTH_URL` — but no such variable will exist (Plan 3 never created it). The cutover step will skip what should be `BETTER_AUTH_URL`. The incident-response playbook's secret-rotation table will fail to match what's actually in Vercel.
- **Suggested fix:** In Plans 1, 2, and 8, replace every `AUTH_SECRET` → `BETTER_AUTH_SECRET` and `AUTH_URL` → `BETTER_AUTH_URL`. Update Plan 1 `.env.example` comment from `# Auth.js` to `# Better Auth`.

### Issue 5: Plan 1 ESLint `no-server-sdk-in-client` blacklist omits Better Auth

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` lines 421–428 (`SERVER_ONLY_PACKAGES` array):
    ```
    "@line/bot-sdk",
    "dropbox",
    "drizzle-orm/node-postgres",
    "@neondatabase/serverless",
    "bcrypt",
    "argon2",
    ```
- **Canonical value:** Better Auth has both server (`better-auth`, `better-auth/adapters/drizzle`, `better-auth/plugins`, `better-auth/next-js`) and client (`better-auth/react`, `better-auth/client/plugins`) entry points. Plan 3 line 591–597 imports server-side; Plan 3 line 647 imports client-side. The server entry must be banned in `'use client'` files.
- **Why critical:** A future client component that accidentally `import { betterAuth } from "better-auth"` will not be flagged, defeating Layer 1 of the spec 6.7.5 defense. This is exactly the kind of regression the rule was designed to catch.
- **Suggested fix:** Add `"better-auth"`, `"better-auth/adapters/drizzle"`, `"better-auth/plugins"`, `"better-auth/next-js"` to the blacklist. Also remove `"bcrypt"` and `"argon2"` (rejected; replaced by Better Auth scrypt) since they will no longer be installed and are dead entries.

### Issue 6: Plan 8 Cron endpoint mismatches Plan 1 vercel.ts skeleton — `/api/cron/anonymize-expired` vs sample without crons

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md` lines 78–90 (sets `crons: [{ path: "/api/cron/anonymize-expired", schedule: "0 19 * * *" }]`)
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` lines 1391–1399 (vercel.ts skeleton "// crons / rewrites / headers 在後續 plan 加入")
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md` line 392: `closedAt: timestamp("closed_at", { withTimezone: true })`
- **Canonical value:** spec §6.3 + §7.4 confirm `/api/cron/anonymize-expired` and 03:00 Asia/Taipei.
- **Why critical (sub-issue):** Plan 1 + Plan 8 import `@vercel/config/v1` (subpath `/v1`), but the cross-plan research (line 129) shows the actual usage as `import type { VercelConfig } from '@vercel/config'` (no `/v1`). If `@vercel/config@0.3.0` does not export a `/v1` subpath, Plan 1 Task 14 Step 2 and Plan 8 Task 1 Step 1 will fail at TypeScript resolution.
- **Files affected (subpath issue):**
  - `c:/APP_Project/RRMS/docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` line 627: `import { type VercelConfig } from '@vercel/config/v1';`
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 1394: `import type { VercelConfig } from '@vercel/config/v1';`
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md` line 79: `import type { VercelConfig } from "@vercel/config/v1";`
- **Suggested fix:** Either (a) verify the `/v1` subpath actually exists on `@vercel/config@0.3.0` and update the research note, or (b) change all three imports to `from '@vercel/config'` (matching the research-doc form). **Requires user/research verification before fixing.**

### Issue 7: Plan 6 references rejected `users` table from `@/db/schema` (FK join broken)

- **Files affected:** Same as Issue 1 (lines 355, 374, 377 of Plan 6).
- **Canonical value:** schema exports `user` (Plan 3 lines 283, 226). The export name in `src/db/schema.ts` is `user`.
- **Why critical:** Listed separately because the impact in Plan 6 is two-fold — both the named import fails AND the join `caseStatusHistory.changedByUserId === users.id` would, even if `users` existed, type-mismatch (uuid vs text — see Issue 2).
- **Suggested fix:** As Issue 1, batched.

---

## ⚠️ Important Inconsistencies

### Issue 8: Spec §7.1 lists Next.js 15 + Node.js 24 — both wrong

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` line 596: `| Framework | Next.js 15 App Router |`
  - `c:/APP_Project/RRMS/docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` line 603: `| Hosting | Vercel Functions（Fluid Compute，Node.js 24） |`
- **Canonical value:** Next.js 16.x, Node.js 22 LTS (continue.md line 41–42; bootstrap-versions.md line 13, 169, 173; Plan 1 line 14 + ci.yml `node-version: 22`).
- **Why important:** The spec is the first artefact a fresh implementer reads. Next.js 16 has different `next build` semantics (no auto-lint) and Tailwind v4 / React 19 / Turbopack defaults. Saying Node 24 in the spec invites someone to set `node-version: '24'` in CI, which contradicts every plan's `node-version: 22`.
- **Suggested fix:** spec §7.1 → "Next.js 16 App Router" and "Node.js 22 LTS"; consider also updating the user-facing prose mentions of Next.js 15.

### Issue 9: Plan 1 self-numbering says "1/7" but every other plan says "X/8"

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 5: `本計畫為 Phase 1 第 1/7 份計畫`
  - line 1479 of same file: `Plan 1 完成後依序進入（總共 8 份計畫，本計畫為第 1 份）` — internally inconsistent
  - Plans 2, 3, 4, 5, 6, 7, 8 all say `X/8`
- **Canonical value:** 8 plans total (continue.md line 17–25 enumerates all 8).
- **Why important:** Cosmetic but confusing — Plan 1 implies a 7-plan plan set that does not exist.
- **Suggested fix:** Change "1/7" to "1/8".

### Issue 10: Spec §5 schema uses plural `users` table name; Plan 3 uses singular `user`

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` line 231: `### 5.1 users（後台同事）`
  - line 277: `| changed_by_user_id | uuid | FK → users |`
  - Plan 3 lines 220–225 explain the deliberate decision to use Better Auth's singular default `user`.
- **Canonical value:** `user` (Plan 3 design rationale line 220–227).
- **Why important:** Spec disagrees with the actual schema. A subagent given the spec to implement would create a `users` table; Better Auth would then fail to find its expected `user` table at runtime. Also `changed_by_user_id` is `uuid` in spec but `text` in Plan 3 schema.
- **Suggested fix:** Update spec §5.1 heading from `users` → `user`; update §5.3 `changed_by_user_id` type uuid → text and FK `users` → `user`. Or add a note "see Plan 3 §Why Better Auth for canonical schema".

### Issue 11: Plan 1 Task 5 + Task 7 still mention `Auth.js secret` in gitleaks rules + bundle scanner

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 599–602:
    ```
    [[rules]]
    id = "authjs-secret"
    description = "Auth.js / NextAuth secret"
    regex = '''(?i)(NEXTAUTH_SECRET|AUTH_SECRET)[\s=]+["']?([A-Za-z0-9+/=]{32,})["']?'''
    ```
  - line 757: `{ name: "Auth.js secret", regex: /(NEXTAUTH_SECRET|AUTH_SECRET)\s*=\s*["']?[A-Za-z0-9+/=]{32,}/ },`
  - Plan 1 Task 5 header line 560: `## Task 5: gitleaks 設定（含 LINE / Dropbox / Auth.js 客製 pattern）`
- **Canonical value:** Pattern names should reference `BETTER_AUTH_SECRET`.
- **Why important:** The detection regex won't match a leaked `BETTER_AUTH_SECRET=...` string. A real leak would slip past gitleaks AND past `check-bundle-secrets.mjs`.
- **Suggested fix:** Change `(NEXTAUTH_SECRET|AUTH_SECRET)` → `(BETTER_AUTH_SECRET|AUTH_SECRET|NEXTAUTH_SECRET)` to cover both old and new names; rename rule id `authjs-secret` → `auth-secret`; rename Task 5 heading.

### Issue 12: Plan 1 Spec-coverage table says "6.7.3 Cookie 設定 — 由 Plan 2 處理（Auth.js 設定時）"; Plan 2 doesn't cover this

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 38: `| 6.7.3 認證 Cookie 設定 | 由 Plan 2 處理（Auth.js 設定時） |`
  - Plan 2's `Spec 對照` (lines 25–30) does NOT mention 6.7.3 at all.
  - Plan 3 line 35: `| 6.7.3 認證 Cookie 設定 | Task 7 + Task 11 |` — actually covered by Plan 3.
- **Canonical value:** Plan 3 (Task 7 Step 3 advanced.cookies) covers spec 6.7.3.
- **Why important:** Plan 1's coverage hand-off goes to the wrong plan. If a reviewer audits Plan 2 looking for spec 6.7.3 they'll mark it missing.
- **Suggested fix:** Plan 1 line 38 → "由 Plan 3 處理（Better Auth 設定時）".

### Issue 13: Plan 4 dependency line says "Drizzle Postgres advisory lock" but Plan 1 ESLint blacklists `drizzle-orm/node-postgres`

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 423: `"drizzle-orm/node-postgres"` in SERVER_ONLY_PACKAGES blacklist
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md` line 203: `import { drizzle } from "drizzle-orm/neon-http";` (the actually-used driver path)
- **Canonical value:** RRMS uses `drizzle-orm/neon-http` (Plan 3 line 203), not `drizzle-orm/node-postgres`.
- **Why important:** The blacklist guards against importing the wrong driver. Better to blacklist `drizzle-orm/neon-http` and `drizzle-orm/node-postgres` both, or at minimum the one actually in use. As written, an attacker importing `drizzle-orm/neon-http` in a `'use client'` file would slip past the rule.
- **Suggested fix:** Add `drizzle-orm/neon-http` to the blacklist alongside `drizzle-orm/node-postgres`.

### Issue 14: Plan 1 README-task lists "Better Auth" but Plan 1 does not install it; first install is Plan 3

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` line 1302: `Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui · Drizzle · Neon · Better Auth · LINE Messaging API · Dropbox API · Vercel Functions`
  - Plan 1 itself never installs Better Auth (correct — it's Plan 3 line 546).
- **Canonical value:** README accurately represents current state of code at end of Plan 1 (no DB, no auth yet).
- **Why important:** Minor — but the README is committed in Plan 1, and a contributor reading it then `pnpm install`-ing won't get Better Auth (because it's not yet a dep). Acceptable if README is "tech stack target" rather than "what's installed today".
- **Suggested fix:** Either accept as forward-looking, or add "(installed in Plan 3)" annotations.

### Issue 15: Plan 1 Task 14 mentions "vercel.ts" cron path placeholder, but Plan 8 actually owns the cron registration — and Plan 8 still references AUTH_URL

- **Files affected:**
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` lines 1391–1399 — vercel.ts skeleton without crons, comment says "crons / rewrites / headers 在後續 plan 加入"
  - `c:/APP_Project/RRMS/docs/superpowers/plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md` lines 78–90 — adds the cron entry
- **Canonical value:** Cron registration in Plan 8 (spec §7.4 sample maps to Plan 8 Task 1).
- **Why important:** Inconsistency is mild — Plan 1 skeleton + Plan 8 amendment is correct. But if Plan 8 keeps writing the file from scratch (line 78 `修改 vercel.ts` shows full re-write), prior comments from Plan 1 are lost. Should clarify "modify Plan 1's vercel.ts to add crons" not "create vercel.ts".
- **Suggested fix:** Plan 8 Task 1 Step 1 → wording "Modify existing `vercel.ts` to add the `crons` field" (instead of full rewrite).

---

## 🟡 Minor Inconsistencies

### Issue 16: Plan 1 final post-codeblock outline says "8 份計畫，本計畫為第 1 份" with table of remaining 7 — labels them # 2–8 (correct), but the intro line says "Phase 1 第 1/7 份"

- **Files affected:** Plan 1 lines 5 vs 1479 (already covered in Issue 9). Repeating here only because the same file disagrees with itself.
- **Suggested fix:** As Issue 9.

### Issue 17: Plan 1 Step 5 commit "feat: initialize Next.js 16 + Tailwind + TypeScript scaffold" but Plan 1 P-2 still references "Auth.js" implicitly via env example task numbering

- **Files affected:** Cosmetic. Plan 1 Task 11 (line 1118) `.env.example` includes `# Auth.js` block.
- **Canonical value:** Should be `# Better Auth`.
- **Suggested fix:** Already covered by Issue 4.

### Issue 18: Plan 4 Task 5 — extends schema with `rate_limit_buckets` table, but Plan 3 §File Structure or any earlier audit point doesn't list it

- **Files affected:**
  - Plan 3 line 41–82 (file structure / schema overview) does not mention `rate_limit_buckets`
  - Plan 4 line 458–471 introduces it
  - Plan 7 introduces `oa_conversations` and `customer_requests` similarly without backref to Plan 3
- **Canonical value:** Plans are allowed to extend schema. No spec lists `rate_limit_buckets`/`oa_conversations`/`customer_requests` as Phase-1 tables either.
- **Why minor:** Behaviour is fine — incremental schema is normal — but Plan 3's own driver doc says "RRMS 7 + Better Auth 4 = 11" tables (later corrected to "10" because of the invitations→verification merge). After Plans 4 + 7, the count is 13 (10 + rate_limit_buckets + oa_conversations + customer_requests).
- **Suggested fix:** Plan 3 §後續 / Plan 8 acceptance criteria — note "Final Phase 1 table count = 13 (Better Auth 4 + RRMS 6 + 3 introduced by Plans 4/7)". Update Plan 3 line 1415 acceptance line ("10 張表") to reflect the trajectory.

### Issue 19: Plan 6 mentions "media gallery" component but file structure shows `MediaGallery.tsx` while page renders Dropbox-path text only

- **Files affected:**
  - Plan 6 line 49: `│   │   │   │       ├── MediaGallery.tsx`
  - Plan 6 lines 401–410 — case detail page just lists `m.dropboxPath` strings; no `MediaGallery` import.
- **Canonical value:** Plan 6 explicitly notes "Phase 1 簡化：列出 dropbox path；Phase 2 加 thumbnail" (line 404). So `MediaGallery.tsx` is dead in Phase 1.
- **Why minor:** File-structure section over-promises. Implementer may waste time creating an empty file.
- **Suggested fix:** Remove `MediaGallery.tsx` from Plan 6 file structure (or mark "(Phase 2)").

### Issue 20: Plan 7 Task 9 mocks `query_attempts` but DB-side test infrastructure not described — and uses `vitest` while Plans 4-6 use `playwright`

- **Files affected:**
  - Plan 7 line 833: `import { test, expect } from "vitest";` (Tasks 9, 10, 11)
  - Plan 4 / 5 / 6 use `@playwright/test`
  - Plan 1 / 3 install Playwright but never install Vitest.
- **Canonical value:** Plan 1 Task 11 / Plan 3 Task 14 install Playwright. There is no Vitest install step anywhere in Phase 1.
- **Why minor:** Plan 7 Tasks 9–10 will fail at `pnpm exec vitest` (binary not installed). Marginally important — could be missed because tests run after install.
- **Suggested fix:** Either add a `pnpm add -D vitest` step in Plan 7 Task 9 (and a vitest config), or convert these tests to Playwright (talking to lib via `node` requires test-runner-side import; Playwright supports this with `import` from src too).

### Issue 21: Plan 5 Task 6 last red-team test names rate limit bucket "media-sign" with 30 / 600s; the actual code uses the same numbers but Plan 4 ratelimit.ts uses different default

- **Files affected:**
  - Plan 5 line 257: `await rateLimitByIp(ip, "media-sign", 30, 600);`
  - Plan 5 line 514–520: test asserts 31st blocked
  - Plan 4 line 408: `await rateLimitByIp(ip, "report-submit", 10, 3600);`
- **Canonical value:** Different buckets / limits per endpoint is intentional.
- **Why minor:** Not an inconsistency; flagged only because the rate-limit table grows unbounded — there is no GC/expiry cron. Pre-existing limitation; Phase 2 problem.

---

## ℹ️ Notes / Observations

### Note 1: Plan 6 docstring notes `users` table but spec §5.1 also uses `users` — both wrong vs Plan 3

Already covered (Issues 1, 7, 10) but worth reinforcing: the `user` vs `users` divergence is a single root cause spreading to 4 files (spec, Plan 6 ×3 lines, Plan 7 ×1 line). Fix all together to avoid re-fragmenting.

### Note 2: Plan 6 vercel preview log instruction uses placeholder

- Plan 6 line 680: `https://<your>.vercel.app/api/line/webhook` — uses `<your>` placeholder.
- continue.md says canonical Production URL is `https://rrms.pro080.com/api/line/webhook`. Plan 8 corrects this.
- Plan 6 line 680 placeholder is acceptable in context (shown as illustrative pre-DNS URL). No fix needed.

### Note 3: continue.md mentions 11 memory files but actual count is 12

- continue.md line 7 (header system reminder reference) and line 79 say "共 11 檔". Actual directory listing shows 12 (`MEMORY.md` + 1 user + 7 feedback + 3 project = 12).
- Likely undercount — `MEMORY.md` is the index file; counting only the data files (not the index) gives 11.
- No fix needed; matter of phrasing.

### Note 4: 14 attack scenarios from spec §6.7.4 are not explicitly enumerated as a numbered list

- Spec §6.7.4 (lines 430–576) describes layered defence but does not enumerate "14 attack scenarios" as a numbered list. continue.md line 14 says "14 條攻擊測試清單" but this number cannot be verified against the spec text — the spec just shows a table of "5 layers × 6 categories" of checks.
- Across plans 1–8, red-team tests count to roughly: Plan 1 (3 layers verified) + Plan 3 (2 cookie/privilege) + Plan 4 (4 XSS/SQLi/race/ratelimit) + Plan 5 (4 mime/size/path/ratelimit) + Plan 6 (3 webhook/permission/audit) + Plan 7 (3 brute/enum/server-side) + Plan 8 (1 anonymize) = ~20 red-team tests, not 14.
- Not a blocking issue; the 14 is a continue.md-side claim, not in spec.

---

## Cross-cutting patterns detected

1. **The spec was never updated after the Better Auth pivot.** Issues 3 + 8 + 10 all stem from the spec freezing at "Auth.js v5 / bcrypt / Next 15 / Node 24 / users plural" while every plan after Plan 3 moved on. Fix the spec in one batch and most cascade-issues disappear.

2. **Plan 6 + Plan 7 were not re-aligned to Plan 3's `user`/`text-PK` decision.** Issues 1 + 2 + 7. The fix is mechanical: replace `users` → `user` and `uuid` → `text` for any FK pointing to `user.id`.

3. **Plan 1 + Plan 8 were never re-aligned to Better Auth env names.** Issue 4. `AUTH_SECRET` → `BETTER_AUTH_SECRET`, `AUTH_URL` → `BETTER_AUTH_URL`. Plan 1 (.env.example), Plan 2 (incident playbook table), Plan 8 (Task 9 checklist + Task 9 Step 2) all need touching.

4. **Three security-pattern files (gitleaks rule, bundle scan regex, ESLint blacklist) inherited Auth.js / pre-Better-Auth content.** Issues 5 + 11 + 13. Each is independently necessary (different layers). Recommend updating gitleaks, scripts/check-bundle-secrets.mjs, and eslint-rules/no-server-sdk-in-client.mjs in the same PR.

5. **`@vercel/config/v1` import subpath is suspicious.** Issue 6 — three places import from `@vercel/config/v1`, but the cross-plan research's verified usage shows just `@vercel/config`. Either the subpath exists (and research is incomplete) or it doesn't (and three plans break). **Cannot self-resolve without re-fetching the npm package.**

---

## Recommendation to Controller

**Single batched commit feasible for items 1, 2, 4, 5, 7, 9, 10, 11, 12, 13** — these are mechanical replacements with no design ambiguity.

**Need user input before fixing:**
- **Issue 6** — verify whether `@vercel/config/v1` subpath actually exists on package version 0.3.0. Either fetch the npm tarball / docs or accept the form `@vercel/config` (without `/v1`).
- **Issue 18** — accept that final table count is 13 (not 11/10) and update Plan 3 acceptance criteria, OR formally move the 3 satellite tables (`rate_limit_buckets`, `oa_conversations`, `customer_requests`) into Plan 3's schema declaration. (Either is fine; user should pick one.)
- **Issue 20** — pick Vitest or Playwright for Plan 7 Tasks 9–10. If Vitest, add an install task; if Playwright, rewrite the three test files to use `@playwright/test` patterns. (Playwright is already installed, so probably the easier choice.)

**Suggested fix order:**

1. Spec patch (Issues 3, 8, 10) — biggest blast radius.
2. Plan 1 patch (Issues 4 partial, 5, 11, 12, 13, 14, 15) — touches `.env.example`, ESLint rule, gitleaks toml, bundle scan, README.
3. Plan 6 patch (Issues 1, 7, 19) — auth import path, schema symbol, MediaGallery cleanup.
4. Plan 7 patch (Issues 2, 18, 20) — FK type, test framework decision, table count alignment.
5. Plan 8 patch (Issues 4, 6, 15) — env var rename, vercel.ts subpath verification (pending user decision), cron-registration phrasing.
6. Trivia (Issue 9 — "1/7" → "1/8" in Plan 1 line 5).

After fixes, re-run a smaller follow-up audit on the patched files only to confirm no new drift was introduced.
