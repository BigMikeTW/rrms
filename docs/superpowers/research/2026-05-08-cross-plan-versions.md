<!--
What:  Dependency verification report for RRMS Phase 1 Plans 2-8.
Why:   Plans 2-8 introduce dependencies not covered by Plan 1's research gate.
       This report locks in verified versions before any plan-level Task 0 begins.
Where: Companion to 2026-05-08-bootstrap-versions.md (Plan 1 verification).
When:  Created 2026-05-08; valid until next plan amendment cycle.
-->

# RRMS Phase 1 Cross-Plan Dependency Verification

**Date:** 2026-05-08
**Purpose:** Verify dependencies introduced by Plans 2-8 (beyond Plan 1's bootstrap deps).
**Reference:** Companion report at `2026-05-08-bootstrap-versions.md` for Plan 1.
**Method:** Official docs + npm registry (`npm view`) + GitHub releases + targeted web search where docs pages were JS-gated.

---

## Summary Table

| # | Plan | Dependency | Plan said | Verified latest | Match? | Action needed |
|---|---|---|---|---|---|---|
| 1 | 2 | `zaproxy/action-baseline` | v0.13.0 | **v0.15.0** (2025-10-24, Node 24) | NO | Bump pin to v0.15.0 |
| 2 | 2 | `patrickedqvist/wait-for-vercel-preview` | v1.3.2 | **v1.3.3** (2026-01-21, active) | NO | Bump pin to v1.3.3 |
| 3 | 2 | Dependabot config schema | `version: 2` | **`version: 2`** still current; new optional fields added | YES | None (optionally adopt `cooldown`) |
| 4 | 3 | `drizzle-orm` | latest | **0.45.2** (latest); `1.0.0-rc.2` on `rc` tag | YES (with caveat) | Pin `^0.45.2`; do NOT use `@beta`/`@rc` |
| 5 | 3 | `drizzle-kit` | latest | **0.31.10** (latest); `1.0.0-rc.2` on `rc` tag | YES (with caveat) | Pin `^0.31.10` |
| 6 | 3 | `next-auth` (Auth.js v5) | `next-auth@beta` | **5.0.0-beta.31** (still beta tag); `latest`=4.24.14 | YES | Plan still installs `@beta`; document risk that maintainership transferred to Better Auth team (Sep 2025) |
| 7 | 3 | `@auth/drizzle-adapter` | latest | **1.11.2** | YES | Pin `^1.11.2` |
| 8 | 3 | `@neondatabase/serverless` | latest | **1.1.0** | YES | Pin `^1.1.0` (note: v1.x is recent major, plan likely assumed 0.x) |
| 9 | 3 | `bcryptjs` | latest | **3.0.3** (active, 2025-11-02) | YES | Pin `^3.0.3` |
| 10 | 4 | `zod` | 3.x | **4.4.3** (Zod 4 stable) | NO | Decide: bump plan to Zod 4 OR pin `^3` explicitly |
| 11 | 5 | Dropbox `/2/files/get_temporary_upload_link` | exists | **Exists; commit_info {path,mode,autorename,mute,strict_conflict} + duration (max 4h)** | YES | None |
| 12 | 5 | Vercel function body size | 4.5 MB | **4.5 MB confirmed (docs updated 2026-02)** | YES | None; client-direct upload pattern still required |
| 13 | 6 | `@line/bot-sdk` | latest | **11.0.0** (2026-04-03; Node 20+; axios dependency dropped) | YES | Pin `^11.0.0`; verify Node 20 baseline in workflow |
| 14 | 7 | `@line/liff` | v2.x | **2.28.0** (LIFF v2 still current; no v3) | YES | Pin `^2.28.0` |
| 15 | 7 | LINE Rich Menu schema | (assumed stable) | Schema unchanged (size, selected, name, chatBarText, areas) | YES | None |
| 16 | 8 | Vercel Cron Jobs | `vercel.json` `crons` array; `Authorization: Bearer ${CRON_SECRET}` | **Confirmed unchanged**; UTC only; `vercel-cron/1.0` UA | YES | None |
| 17 | 8 | `@vercel/config` package + `vercel.ts` | exists | **Exists; latest 0.3.0**; `vercel.ts` is the typed-config entrypoint | YES | Pin `^0.3.0`; note this is a v0 package (API may move) |

---

## Per-dependency details

### 1. zaproxy/action-baseline (Plan 2)
- URL: https://github.com/zaproxy/action-baseline/releases
- Latest: **v0.15.0** (2025-10-24)
- Notes: Now runs on Node 24. v0.13.0 ran on Node 20. Plan needs pin bump; behavior of the baseline scan itself is unchanged.

### 2. patrickedqvist/wait-for-vercel-preview (Plan 2)
- URL: https://github.com/patrickedqvist/wait-for-vercel-preview
- Latest: **v1.3.3** (2026-01-21)
- Notes: Project is actively maintained (175 commits, 14 releases, latest just ~3 months ago). Low risk.

### 3. Dependabot v2 schema (Plan 2)
- URL: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file
- Latest: **`version: 2`** still the only supported schema
- New optional fields (backward compatible): `multi-ecosystem-groups`, `cooldown`, `exclude-paths`, `group-by`. None of these are required.

### 4. drizzle-orm (Plan 3)
- URL: https://orm.drizzle.team/docs/get-started-postgresql + npm dist-tags
- Latest stable: **0.45.2** (`latest` tag); `1.0.0-rc.2` on `rc`; `1.0.0-beta.22` on `beta`
- Notes: Drizzle 1.0 is in RC. Plan should explicitly pin `^0.45.2` and not silently accept 1.0 (different RQB v2 schema, breaking changes documented).

### 5. drizzle-kit (Plan 3)
- URL: https://orm.drizzle.team/docs/kit-overview + npm
- Latest stable: **0.31.10**; `1.0.0-rc.2` on `rc`
- Commands current: `generate`, `migrate`, `push`, `pull`, `studio`, `check`, `up`. No removals.

### 6. next-auth / Auth.js v5 (Plan 3) — see HIGH-RISK below
- URL: https://authjs.dev/getting-started/installation + npm dist-tags
- Latest: `latest`=**4.24.14**, `beta`=**5.0.0-beta.31**
- v5 is still tagged `@beta` after ~2 years. Migration guide exists.
- **Critical context (web search):** As of Sep 2025, the Better Auth team took over Auth.js maintenance and the project is in security-patch mode. Auth.js docs themselves now point new projects toward Better Auth. v5 will likely never GA under the old maintainers.

### 7. @auth/drizzle-adapter (Plan 3)
- URL: https://authjs.dev/getting-started/adapters/drizzle + npm
- Latest: **1.11.2**
- Notes: Compatible with Auth.js v5 beta. Schema requires specific table shape (users/accounts/sessions/verificationTokens) — schema-design impact for Plan 3 Task on DB schema.

### 8. @neondatabase/serverless (Plan 3)
- npm: **1.1.0** on `latest`
- Notes: Major version 1.x is current. If plan was written assuming 0.10.x range, the API is broadly compatible (`neon()` and `Pool`) but check release notes for connection-pool changes.

### 9. bcryptjs (Plan 3)
- URL: https://github.com/dcodeIO/bcrypt.js
- Latest: **3.0.3** (2025-11-02). Actively maintained.
- argon2 note: argon2id is theoretically stronger, but `argon2` requires native bindings → won't run on Vercel Edge runtime and adds build complexity on Node runtime. **Stick with bcryptjs as plan states**; non-engineer ops also benefit from zero native deps.

### 10. Zod (Plan 4) — see HIGH-RISK below
- URL: https://zod.dev/ + npm
- Latest: **4.4.3** (Zod 4 stable; banner says "Zod 4 is now stable!")
- Plan said "Zod 3.x". Zod 4 has API changes (e.g. `z.string().email()` deprecation paths, error map changes, faster perf). Plan must decide.

### 11. Dropbox `/2/files/get_temporary_upload_link` (Plan 5)
- URL: https://www.dropbox.com/developers/documentation/http/documentation (page is JS-gated; verified via web search of `dropbox.tech` blog and SDK docs)
- Endpoint: **POST https://api.dropboxapi.com/2/files/get_temporary_upload_link**
- Body: `{ commit_info: { path, mode, autorename, mute, strict_conflict }, duration }` where `duration` is seconds (max 14400 = 4 hours)
- Response: `{ link: "https://content.dropboxapi.com/apitul/1/..." }`
- No breaking change since plan was written.

### 12. Vercel function body size limit (Plan 5)
- URL: https://vercel.com/docs/functions/limitations + KB article (verified via web search; KB doc updated 2026-02-24)
- Limit: **4.5 MB** for both request and response body (error code: 413 `FUNCTION_PAYLOAD_TOO_LARGE`)
- Fluid Compute does **not** raise this limit. Direct-to-Dropbox upload pattern in Plan 5 is still the right design.

### 13. @line/bot-sdk (Plan 6)
- URL: https://github.com/line/line-bot-sdk-nodejs + npm
- Latest: **11.0.0** (2026-04-03)
- Breaking changes from v9 era: dropped axios dependency (now uses native fetch), requires **Node.js 20+**, removed deprecated APIs.
- Plan likely assumed v9.x. Code change impact is small (push/multicast/replyMessage signatures unchanged) but Node 20 baseline must be confirmed in CI.

### 14. @line/liff (Plan 7)
- URL: https://www.npmjs.com/package/@line/liff (verified via `npm view`)
- Latest: **2.28.0** (LIFF v2 is still current major; no v3 release)
- Plan assumption holds.

### 15. LINE Rich Menu schema (Plan 7)
- URL: https://developers.line.biz/en/reference/messaging-api/#rich-menu-object
- Schema fields unchanged: `size {width,height}`, `selected`, `name`, `chatBarText`, `areas[].bounds`, `areas[].action`. Image upload PNG/JPG up to 1 MB. No 2025/2026 spec changes that would affect Plan 7.

### 16. Vercel Cron Jobs (Plan 8)
- URL: https://vercel.com/docs/cron-jobs (last_updated 2025-06-25)
- Schema: `vercel.json` `crons: [{ path, schedule }]` array. Triggered by HTTP GET. UA = `vercel-cron/1.0`. UTC only. Auth is conventionally `Authorization: Bearer ${CRON_SECRET}` — not enforced by platform, the function itself must check.
- Plan assumption fully valid.

### 17. `vercel.ts` + `@vercel/config` (Plan 8)
- URL: https://vercel.com/docs/project-configuration/vercel-ts (last_updated 2025-12-19)
- Package: **`@vercel/config` exists**, current version **0.3.0**.
- Usage: `import type { VercelConfig } from '@vercel/config'; export const config: VercelConfig = { ... }`
- Caveat: This is a v0.x package — semver-minor bumps may break types. Pin exact version in Plan 8 lockfile.

---

## Cross-cutting findings

1. **Two stable-major-version surprises** (Zod 4, Drizzle-ORM 1.0 RC, @neondatabase/serverless 1.x, @line/bot-sdk 11) the plans were written before. Zod 4 is the only one that affects multiple plans (4, 6, 7, 8 all import it).
2. **Auth.js maintainership change** is the single biggest project-level risk; it does not break code today but signals the v5 beta will likely never go GA. Plan 3 should document this and a fallback (Better Auth migration path) even if we proceed with Auth.js v5 beta.
3. **Node.js 20 baseline** is now required by both `@line/bot-sdk@11` (Plan 6) and `zaproxy/action-baseline@0.15` (Plan 2 runs Node 24). Confirm Plan 1's Node version pin is >= 20 LTS.
4. **No Vercel platform regressions.** Cron schema, function body limit, `vercel.ts` typed config all match plan assumptions.

---

## High-risk items requiring plan amendment BEFORE Task 0 of that plan

### HIGH 1 — Zod 4 vs Zod 3 (Plan 4, ripples to Plans 6/7/8)
- **Why HIGH:** Zod 4 has breaking API changes. If Plan 4 installs `zod@latest` it lands on 4.x; downstream plans inherit it. Schema/error-message/parse-async behavior differs.
- **Required:** Plan 4 must explicitly state "Zod 4.x" or "Zod 3.x with pin `zod@^3`". Recommend **Zod 4** (faster, better TS inference) and update PDPA validation snippets accordingly.

### HIGH 2 — Auth.js v5 maintainership (Plan 3)
- **Why HIGH:** Auth.js v5 has been beta for 2+ years and as of Sep 2025 was handed off to Better Auth team in security-patch mode.
- **Required:** Plan 3 must add a paragraph: "We accept Auth.js v5-beta.31 with eyes open. Migration to Better Auth is a documented exit; Phase 1 does not require it."

### HIGH 3 — Drizzle 1.0 RC drift (Plan 3)
- **Why HIGH:** `npm i drizzle-orm` on the docs page installs `latest`=0.45.2, but the upgrade banner pushes 1.0. If the user copy-pastes from docs assuming "latest is fine", they may end up with a 1.0 release between plan and execution.
- **Required:** Plan 3 must pin `drizzle-orm@^0.45.2` and `drizzle-kit@^0.31.10` explicitly in the install step.

---

## Medium / Low-risk items (handle during plan's own Task 0)

- Bump `zaproxy/action-baseline` v0.13.0 → v0.15.0 in Plan 2 (Node 24 runtime).
- Bump `patrickedqvist/wait-for-vercel-preview` v1.3.2 → v1.3.3 in Plan 2.
- Confirm `@line/bot-sdk@11` Node 20 baseline in Plan 6 CI.
- Pin `@vercel/config@0.3.0` (exact, not caret) in Plan 8 because it is v0.x.
- Adopt Dependabot `cooldown:` (optional, reduces noisy PRs) — Plan 2 nice-to-have.

---

## Recommendation to Project Manager (in plain Chinese)

依下列分類給 Mike 大決定：

### ✅ 不用動的部分（plans 寫的內容仍然正確，照表操課即可）

- **Plan 2 的 Dependabot 設定**：`version: 2` 還是現行版本，沒有需要改的欄位。
- **Plan 5 的 Dropbox API**：`get_temporary_upload_link` 端點完全沒變，回傳的 link 一樣是 4 小時內可用的一次性網址。
- **Plan 5 的 Vercel 4.5 MB 限制**：仍然存在；plan 用「客戶端直傳 Dropbox」的設計是正確的（不要改成讓使用者經過 server）。
- **Plan 6 的 LINE Push 機制**、**Plan 7 的 LIFF v2** 與 **Rich Menu schema**：都沒有規格變更。
- **Plan 8 的 Vercel Cron Job**：`vercel.json` 的 `crons` 陣列、`Authorization: Bearer ${CRON_SECRET}` 認證方式，都還是現行做法。

### ⚠️ 建議現在就微調 plan 文字的部分（小改動，避免之後執行時卡住）

舉例：plan 寫「使用 zaproxy/action-baseline@v0.13.0」應該改成「@v0.15.0」。

- **Plan 2**：把 `zaproxy/action-baseline` 從 v0.13.0 → **v0.15.0**（這版改用 Node 24 跑，效能更好）。
- **Plan 2**：把 `patrickedqvist/wait-for-vercel-preview` 從 v1.3.2 → **v1.3.3**。
- **Plan 6**：把 `@line/bot-sdk` 版本鎖定從 v8/v9 改成 **v11**，並在 CI 設 Node 20 以上（v11 把舊的 axios 拿掉了，改用 Node 內建的 fetch；好處是包裝變小，壞處是必須 Node 20 才能跑）。
- **Plan 8**：把 `@vercel/config` 鎖死在 **0.3.0**（不要用 `^0.3.0`，因為這是 v0.x，作者隨時可能改 API）。

### 🔴 風險偏高、建議現在就詳細修 plan 的部分

舉例：plan 寫「用 Zod 3.x」但 Zod 4 已經 stable，這會影響後面好幾個 plan。

1. **Plan 4 的 Zod 版本（影響 Plan 6/7/8）**：
   - Plan 寫「Zod 3.x」，但 Zod 4 已經 stable（4.4.3）。
   - 兩個選擇：
     - **建議 A（推薦）**：升級到 Zod 4，PDPA 驗證程式碼順手改寫。Zod 4 速度更快、TypeScript 提示更精準。
     - 選擇 B：強制鎖 `zod@^3`，文件中 4.x 的範例就不能照抄。
   - 需要 Mike 大決定走哪條路，因為 Plans 6/7/8 都會 import 同一個 zod，只能選一邊。

2. **Plan 3 的 Auth.js v5（重要警告）**：
   - 已查證：Auth.js v5 還是 `@beta`，且 2025 年 9 月已經把維護權交給 Better Auth 團隊，目前只做安全性修補，不做新功能。
   - **不影響 Phase 1 上線**（程式碼跑得起來），但要在 plan 裡加一段「我們知道這個風險，未來如果 Better Auth 必要時遷移」的文字，避免之後團隊以為踩到雷。
   - 不建議現在就改用 Better Auth：那會讓 Plan 3 整個重寫，Phase 1 會延後。

3. **Plan 3 的 Drizzle 版本鎖定**：
   - 目前 `drizzle-orm@latest` = **0.45.2**，但官網一直在推 1.0 RC。
   - 如果 plan 寫「裝最新版」，可能執行當天 1.0 已經 GA、結果裝到不一樣的版本（schema 寫法不同）。
   - 建議在 Plan 3 install 步驟明確寫「`drizzle-orm@^0.45.2`、`drizzle-kit@^0.31.10`」，不要依賴 `latest` tag。

### 預估執行 plans 仍會卡住的點

- **Plan 3 Task 0**：實際 `npm install` 時，`@neondatabase/serverless` 已經升到 v1.x（plan 寫的時候是 v0.x 區段）。連線寫法相容，但如果踩到連線池重構的細節要看 release notes，不是 5 分鐘可以 debug 的。
- **Plan 4 → Plan 6/7/8**：如果 Zod 版本沒先確定，Plan 4 安裝 4.x 後，Plan 6 拿 Plan 4 的 schema 來用會有 TypeScript 編譯錯誤（error map 形狀不同）。
- **Plan 6 CI**：如果 Plan 1 沒鎖 Node 20+，`@line/bot-sdk@11` 在 Node 18 會直接跑不起來。要在 Plan 1 或 Plan 6 任一處明確寫「Node 20 LTS」。

---

## Sources

1. https://github.com/zaproxy/action-baseline/releases
2. https://github.com/patrickedqvist/wait-for-vercel-preview
3. https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file
4. https://orm.drizzle.team/docs/get-started-postgresql
5. https://orm.drizzle.team/docs/kit-overview
6. https://authjs.dev/getting-started/installation
7. https://authjs.dev/getting-started/adapters/drizzle
8. https://github.com/neondatabase/serverless
9. https://github.com/dcodeIO/bcrypt.js
10. https://zod.dev/
11. https://www.dropbox.com/developers/documentation/http/documentation (JS-gated; supplemented with `https://dropbox.tech/developers/new-file-upload-link-api`)
12. https://vercel.com/docs/functions/runtimes
13. https://vercel.com/docs/functions/limitations
14. https://github.com/line/line-bot-sdk-nodejs
15. https://www.npmjs.com/package/@line/liff
16. https://developers.line.biz/en/reference/messaging-api/
17. https://vercel.com/docs/cron-jobs
18. https://vercel.com/docs/project-configuration/vercel-ts
19. npm registry (`npm view <pkg> dist-tags`) for: next-auth, drizzle-orm, drizzle-kit, zod, @line/liff, @line/bot-sdk, @neondatabase/serverless, @auth/drizzle-adapter, bcryptjs, @vercel/config
20. https://github.com/nextauthjs/next-auth/discussions/13252 (Auth.js maintainership transfer to Better Auth)
