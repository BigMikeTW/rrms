<!--
What:  五階段 (Phase 1-5) 整體執行計畫，把 2026-05-10 pre-Plan-2 audit 發現的 12 條
       finding 全部以「最嚴謹版」（per 2026-05-10 use 裁示）落地。每階段對應 1 個 PR、
       1 組 commits、1 次 mini-audit。Phase 1-4 為 Plan 2 動工前的基礎建設；Phase 5
       併入 Plan 2 PR。
Why:   使用者 2026-05-10 明示判準：「以架構完整性 + 資安為邊界、最嚴謹方式修正、不在
       基礎不穩時往前推」。對應 audit 報告 12 條 finding 的處置決定：
       - F-C1, F-H1, F-L1：Plan 2 計畫文件修補（資安 + 架構描述一致）
       - F-H2：Vercel Pro plan 文件化（商業 TOS 合規）
       - F-H3：Phase 1 接 Resend（採 B 最嚴謹）
       - F-M1：Hexagonal Phase 1 補骨架（採 A 最嚴謹）
       - F-M2：Audit log 完整版 Phase 1 補做（採 A 強化）
       - F-M3：Event Stream + jsonb 預留（採 A 部分）
       - F-M4：multi-tenant Level 3 (schema + proxy + repository + ESLint rule)
       - F-L2/L3/L4：小修
       - 額外：ADR 系統 + 文件結構重構 + 4 招文件債緩解
Where: docs/superpowers/plans/。本檔為 Phase 1-5 的 master plan，Phase 5 內的
       具體 task 寫進 plan 2 (cross-cutting-security)；其餘 Phase 在本檔展開。
       本檔依 superpowers:writing-plans skill 撰寫。
When:  2026-05-10 寫入；預估 4-6 週逐 phase 執行。每 phase 完成後做 mini-audit、
       merge 後才進下一 phase；不一氣呵成。
-->

# RRMS Pre-Plan-2 Rigorous Foundation Plan

**日期**：2026-05-10
**作者**：Claude Opus 4.7（per 使用者 2026-05-10 裁示）
**對應 audit**：[2026-05-10-pre-plan-2-audit.md](../research/2026-05-10-pre-plan-2-audit.md)
**裁示原則**：以架構完整性 + 資安為邊界，最嚴謹方式修正，不留技術債
**整體預估**：42-60 小時（5-8 個全職工作天，建議分散 4-6 週）
**PR 數**：5（Phase 1-4 各 1 PR + Phase 5 併入 Plan 2 PR）

---

## 整體目標

把 pre-Plan-2 audit 的 12 條 finding 全部處理完、額外建立 ADR 系統與 4 招文件債緩解機制，讓 Plan 2 / 3 / ... 開始時站在乾淨基礎上。

完成後系統具備：

| 項目                                                   | 落地形式                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Hexagonal architecture（brainstorm F7-F11）            | `src/adapters/` + 5 個 adapter interface + ESLint 強制 rule                                                   |
| 全系統 Audit Trail（brainstorm D2-D4, D8, D9, D13）    | `audit_log` 表 + Postgres trigger 強制 append-only + Change Reason Catalog                                    |
| Multi-tenant Level 3 預留（brainstorm A17, E1, F3-F6） | schema 全表帶 `tenant_id NOT NULL` + tenant context proxy（`src/proxy.ts`）+ repository pattern + ESLint rule |
| AI 三道地基預留（brainstorm C8）                       | Event Stream（用 audit_log + LISTEN/NOTIFY）+ jsonb 欄位預留 + change_reason_catalog                          |
| Resend 整合（F-H3）                                    | Phase 1 啟用，admin magic-link 邀請信走 Resend，不再手動貼連結                                                |
| Vercel Pro 文件化（F-H2、brainstorm A14, H1）          | spec / Plan 1 / Plan 8 / memory 全部標明                                                                      |
| ADR 系統                                               | `docs/adr/` + 131 個 ADR + 自動化 `audit-docs.mjs` script + CI                                                |
| 文件結構重構                                           | spec / plans / runbook 各司其職、廢除 continue.md、research 加歷史 banner                                     |
| 4 招文件債緩解                                         | doc-audit script + PR template + 結構簡化 + per-Plan mini-audit                                               |

---

## 5 個 Phase 路線圖

| Phase    | PR #          | 主題                                    | 預估工時       | 依賴           |
| -------- | ------------- | --------------------------------------- | -------------- | -------------- |
| 1        | TBD           | 必修紅線 + Vercel Pro doc + Low fixes   | 4-6 小時       | 無             |
| 2        | TBD           | ADR 系統 + 文件結構重構 + 4 招緩解      | 13-18 小時     | Phase 1 merged |
| 3        | TBD           | Hexagonal 骨架 (Plan 1 Task 11.5)       | 6-10 小時      | Phase 2 merged |
| 4        | TBD           | Audit log + jsonb + tenant Level 3 預留 | 16-22 小時     | Phase 3 merged |
| 5        | （Plan 2 PR） | doc-audit CI job + L5 build check       | 3-4 小時       | Phase 4 merged |
| **合計** | 5 PRs         |                                         | **42-60 小時** |                |

每 PR 之間有依賴 — **不能並行**。每 PR merge 後才能進下一 Phase。

---

## Phase 1 詳細任務

**Branch**：`feat/rigorous-foundation-phase-1`
**對應 finding**：F-C1, F-H1, F-H2, F-L1, F-L2, F-L3, F-L4
**外加**：把 pre-Plan-2 audit 報告本身 commit 進 main

### 任務清單

#### 1.1 Plan 2 計畫文件修正（F-C1 + F-H1）

**動的檔**：`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md`

- [ ] **F-H1**：在 `## Pre-Tasks: 確認 Plan 1 已完成` 之後、`## Task 0` 之前插入 `## Plan 2 整體分支策略` 段，含 `git checkout -b feat/plan-2-cross-cutting-security` 指引
- [ ] **F-C1**：刪除 Task 3 Step 4「把 npm-audit 加進 Branch Protection required checks」整個子步驟
- [ ] **F-C1**：Task 3 結尾加註「branch protection 統一在 Task 10 設定。理由：GitHub PUT 是整物件取代，多次 PUT 容易因省略欄位誤關保護」
- [ ] 確認 Task 10 Step 1 的 PUT 指令含完整 `enforce_admins=true` + `required_pull_request_reviews.dismiss_stale_reviews=true` + `restrictions=null`（已有，僅 sanity check）
- [ ] **附帶（Phase 5 預告）**：在 Plan 2「## Self-Review 結果」之後、「## 後續計畫」之前加入 `## Phase 5 任務（pre-Plan-2 rigorous foundation 並行加入）`，列出 Task 11（vercel.ts buildCommand 加 secret 掃描，對應 spec 6.7.4 Layer 5）+ Task 12（doc-audit script + CI integration）的標題與 acceptance criteria；具體 step 在 Plan 2 實作期才寫詳細

#### 1.2 ci.yml 4W 註解 L3 定義修正（F-L1）

**動的檔**：`.github/workflows/ci.yml`

- [ ] 把第 12-13 行「Layer 3 is the protected-branch rule on `main` that requires these checks to pass」改成 `Layer 4's enforcement on PRs is made mandatory by the protected-branch rule on main (which lists these jobs as required status checks). Layer 3 (pre-push hook) itself is deferred to Phase 2 per spec §6.7.4.`

#### 1.3 Vercel Pro plan 文件化（F-H2 — Mike 大親自動）

**動的檔**：使用者 + spec / Plans / memory

- [ ] **Mike 大親自動**：登入 https://vercel.com/dashboard → rrms 專案 → Settings → Billing 確認當前 plan tier
  - 若 Hobby Free：**立即升 Pro**（[Vercel Hobby 禁商用 TOS](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)）
  - 完成後回報「已升 Pro / 早就是 Pro」
- [ ] **AI 動**：`docs/superpowers/specs/2026-05-07-rrms-phase1-design.md` §7.1 表格加 1 列「Vercel plan tier | Pro（per brainstorm A14、H1；Hobby Free 禁商用 per Vercel TOS）」
- [ ] **AI 動**：`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` Pre-Tasks P-2「帳號授權」加 1 條「確認 Vercel 帳號為 Pro plan（非 Hobby Free）」
- [ ] **AI 動**：`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md` Task 8 上線檢查清單加 1 條「Vercel plan = Pro 已確認 + billing email 受監控」
- [ ] **AI 動**：memory 新增 `project_vercel_plan_tier.md` 記錄「Vercel 必 Pro plan、Phase 1+ 強制」+ MEMORY.md 加索引

#### 1.4 cross-plan-versions.md 加歷史 banner（F-L2）

**動的檔**：`docs/superpowers/research/2026-05-08-cross-plan-versions.md`

- [ ] 開頭加 update notice block：

```markdown
> **2026-05-10 update**: Auth.js v5 path was rejected; see Plan 3 for Better Auth choice.
> The Auth.js / next-auth / @auth/drizzle-adapter / bcryptjs entries below are
> historical and no longer applicable. This document is preserved as a paper trail
> of the decision moment, not as current guidance.
```

#### 1.5 README.md tech stack 加註（F-L3）

**動的檔**：`README.md`

- [ ] 在 Tech Stack 段尾加：「部分套件在後續 Plans 才實際安裝（Drizzle / Neon driver / Better Auth → Plan 3；LINE SDK → Plan 6；Dropbox SDK → Plan 5）。」

#### 1.6 spec §6.7.4 掃描清單補 BETTER_AUTH_SECRET（F-L4）

**動的檔**：`docs/superpowers/specs/2026-05-07-rrms-phase1-design.md`

- [ ] §6.7.4 五層共用掃描清單表加 1 列：`| BETTER_AUTH_SECRET / NEXTAUTH_SECRET / AUTH_SECRET 等 env 名稱誤洩 | gitleaks 自訂 rule + bundle scan regex | 6.7.1 |`

#### 1.7 audit 報告本身 commit

- [ ] `docs/superpowers/research/2026-05-10-pre-plan-2-audit.md` 加進 PR

#### 1.8 整體執行計畫本檔 commit

- [ ] `docs/superpowers/plans/2026-05-10-pre-plan-2-rigorous-foundation.md`（本檔）加進 PR

#### 1.9 Phase 1 mini-audit

- [ ] 改完所有檔後 grep 確認：
  - 無 dangling 引用（spec/plan 引用的章節是否存在）
  - 改的字樣前後一致（Vercel Pro 在 4 處用同樣措辭）
  - typecheck + lint 都過

#### 1.10 commit + push + PR + auto-merge

- [ ] 多 commit（每個 finding 一個 commit，commit message 含 finding ID）
- [ ] push to origin
- [ ] `gh pr create` + `gh pr merge --auto --merge`

### Phase 1 驗收條件

- [ ] PR CI 全綠
- [ ] PR auto-merge 成功
- [ ] 紅隊：開另一個小 PR 故意違反 F-C1（在新 plan 寫不完整的 protection PUT 指令），確認 reviewer flag 抓得到（人工 review 性質、本驗收不強制）
- [ ] Mike 大親自確認 Vercel plan tier 已是 Pro

---

## Phase 2 詳細任務

**Branch**：`feat/rigorous-foundation-phase-2`（Phase 1 merged 後才開）
**主題**：ADR 系統 + 文件結構重構 + 4 招文件債緩解

### 2.1 ADR 系統建立

- [ ] 建立 `docs/adr/` 目錄
- [ ] 建立 `docs/adr/0000-record-architecture-decisions.md`（meta-ADR；採用 [Michael Nygard 2011 ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)）
- [ ] 為 brainstorm 萃取的 131 條 hard 決議各寫 1 個 ADR：
  - ADR 0001-0023：A 段（技術棧）23 條
  - ADR 0024-0063：B 段（業務規則）40 條
  - ADR 0064-0074：C 段（Phase 範圍）11 條
  - ADR 0075-0088：D 段（法規 / 個資）14 條
  - ADR 0089-0103：E 段（資安 / RBAC）15 條
  - ADR 0104-0115：F 段（架構 / 部署）12 條
  - ADR 0116-0125：G 段（流程）10 條
  - ADR 0126-0131：H 段（平台註冊）6 條
- [ ] 大部分 ADR 採短格式（5-15 行）：Status / Date / Brainstorm 來源 / Context / Decision / Consequences

### 2.2 doc-audit script

- [ ] 寫 `scripts/audit-docs.mjs`，含 6 條檢查（見 audit 報告 招式 1）
- [ ] 加 npm script `pnpm audit:docs`
- [ ] 4W comment header

### 2.3 文件結構重構

- [ ] spec 重寫為「引用 ADR 而非重述決策」（grep spec 中所有 brainstorm 引用 → 改為 ADR 編號引用）
- [ ] 廢除 `continue.md`，內容移至 git log + 最後 1 條 memory entry + ADR 中（保留 .gitignore 的 `continue.md` 規則）
- [ ] research 各檔加歷史 banner「historical, see ADR-XXXX」
- [ ] 新增 `docs/runbook/` 目錄（從 Plan 8 拆出 pre-launch-checklist / post-launch-monitoring / incident-response）

### 2.4 PR template

- [ ] 建立 `.github/pull_request_template.md`，含 doc impact checklist + ADR 引用 + `pnpm audit:docs` 通過 checkbox

### 2.5 mini-audit 規則寫入 feedback memory

- [ ] memory `feedback_per_plan_mini_audit.md` 新增「每 Plan PR 必含 mini-audit 報告」規則
- [ ] MEMORY.md 加索引

### Phase 2 驗收條件

- [ ] 131 個 ADR 全部存在、編號連續、`pnpm audit:docs` 通過
- [ ] spec 中所有 brainstorm 直引用都已改為 ADR 編號
- [ ] PR template 在 PR 開立時自動載入
- [ ] mini-audit 規則寫進 memory + MEMORY.md

---

## Phase 3 詳細任務

**Branch**：`feat/rigorous-foundation-phase-3`
**主題**：Hexagonal 骨架（F-M1）

### 3.1 Plan 1 加 Task 11.5（敘述性，不執行）

- [ ] `docs/superpowers/plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md` 在現有 Task 11（.env.example）之後、Task 12 之前插入 Task 11.5「Hexagonal architecture skeleton」

### 3.2 實作 adapter 骨架

- [ ] 建立 `src/adapters/` 目錄
- [ ] 5 個 adapter interface：
  - `src/adapters/storage.ts`（StorageAdapter — 對應 Dropbox / 未來 R2 / S3）
  - `src/adapters/queue.ts`（QueueAdapter — 對應 Vercel Queues / 未來 自管）
  - `src/adapters/cron.ts`（CronAdapter — 對應 Vercel Cron / 未來 自管）
  - `src/adapters/ai.ts`（AIAdapter — 對應未來 Claude / OpenAI / Gemini）
  - `src/adapters/auth.ts`（AuthAdapter — wrapper of Better Auth；防直接 import 第三方 auth lib）
- [ ] `src/adapters/README.md` 含 5 條 lock-in 緩解紀律（per brainstorm F9）+ 4W

### 3.3 ESLint custom rule：禁直接 import 平台 SDK

- [ ] `eslint-rules/no-platform-sdk-outside-adapter.mjs`：
  - 禁止 `src/app/**`、`src/lib/**`（除 `src/adapters/`）import 列在黑名單的平台特定 SDK：
    - `dropbox`
    - `@line/bot-sdk`、`@line/liff`
    - `@vercel/blob`、`@vercel/kv`、`@vercel/postgres`、`@vercel/queues`
    - 其他 Vercel 特定 package
- [ ] 註冊到 `eslint.config.mjs`
- [ ] 紅隊 fixture + 驗證

### 3.4 Plans 5/6/8 改寫對應段（敘述性，不執行）

- [ ] Plan 5：dropbox SDK 改成 import `@/adapters/storage`
- [ ] Plan 6：line bot-sdk 改成 import `@/adapters/auth` 與一個專屬 LINE adapter（`src/adapters/messaging.ts` 或併入既有 5 個之一）
- [ ] Plan 8：vercel cron 改成 import `@/adapters/cron`

### 3.5 ADR 補：F7 hexagonal 落地紀錄

- [ ] 對應 ADR-0104（F7）的 Status 從 `Proposed` 改 `Accepted`、Implementation 段補本 Phase 落地

### Phase 3 驗收條件

- [ ] `pnpm typecheck` + `pnpm lint` 通過
- [ ] ESLint rule 抓得到 fixture 違規
- [ ] 5 個 adapter interface 各自有 4W 註解 + at least 1 unit test (skeleton OK)

---

## Phase 4 詳細任務

**Branch**：`feat/rigorous-foundation-phase-4`
**主題**：Audit log 完整版 + Event Stream 預留 + multi-tenant Level 3

### 4.1 Plan 3 schema 重寫（敘述性 — Plan 3 計畫文件修改）

- [ ] `docs/superpowers/plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md` 加新 Task：
  - Task 6.5：`audit_log` 表 + Postgres trigger 強制 append-only
  - Task 6.6：`change_reason_catalog` 表 + Phase 1 種子資料
  - Task 6.7：所有業務表加 `tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'`
  - Task 7.5：tenant context proxy（`src/proxy.ts`；解 subdomain 注入 `currentTenantId`）
  - Task 8.5：repository pattern（`src/db/repositories/*.ts`，所有 db query 過 repo、自動帶 tenant filter）
  - Task 8.6：ESLint rule `no-direct-db-query`：禁 `src/app/**`、`src/lib/**` 直接 import `@/db/client`，必須過 `@/db/repositories/*`
  - Task 14.5：紅隊 — Playwright 跨租戶資料隔離測試
- [ ] `audit_log` 13 欄位（per brainstorm D3）+ jsonb before/after 預留 Event Sourcing
- [ ] `cases.metadata jsonb` 預留欄位（per brainstorm C8 jsonb 彈性 schema）
- [ ] `cases.building_node_id uuid NULL` 預留（per brainstorm F3 5-層 hierarchy）

### 4.2 Plans 4/5/6/7/8 修改 — 每 Plan 加 audit insert step

- [ ] Plan 4：表單提交、consent 紀錄
- [ ] Plan 5：媒體上傳、刪除
- [ ] Plan 6：admin 狀態變更、LINE webhook 接收
- [ ] Plan 7：LINE 查詢成功 / 失敗（取代或併入 query_attempts）
- [ ] Plan 8：每筆匿名化動作 + Resend 整合（F-H3）

### 4.3 spec §10 重寫

- [ ] 改寫為 8 大主題、每條註明對應 ADR 編號（per audit 報告 ⑤ 的骨架）

### 4.4 ADR 對應更新

- [ ] D2-D4, D8, D9, D13（audit trail）狀態 → Accepted + Phase 1 落地紀錄
- [ ] C8（AI 三道地基）狀態 → 部分 Accepted（Event Stream + jsonb + catalog Phase 1 落地；資料地基 Phase 2）
- [ ] A17, E1, E2-E5, F3-F6（multi-tenant + RBAC + ltree）狀態 → Accepted（Phase 1 schema 預留 Level 3、Phase 2 啟用）

### Phase 4 驗收條件

- [ ] schema 改完 `pnpm db:generate` 產出 migration
- [ ] tenant context proxy（`src/proxy.ts`）+ repository pattern 寫好
- [ ] ESLint rule 抓得到違規 fixture
- [ ] Playwright 跨租戶測試 PASS（Phase 1 預設只有 default tenant，但 proxy + repository 能正確過濾）
- [ ] `pnpm audit:docs` 通過

---

## Phase 5 詳細任務（併入 Plan 2 PR）

**Branch**：`feat/plan-2-cross-cutting-security`（Plan 2 的 branch）
**主題**：doc-audit script CI 整合 + L5 build check

### 5.1 Plan 2 Task 11：vercel.ts buildCommand 加 secret 掃描（L5）

- [ ] 改 `vercel.ts` 加 `buildCommand: 'pnpm scan:bundle && pnpm build && gitleaks dir . --no-banner'`
- [ ] 對應 spec §6.7.4 Layer 5 標 Phase 1 啟用

### 5.2 Plan 2 Task 12：doc-audit CI integration

- [ ] `.github/workflows/ci.yml` 加 `doc-audit` job
- [ ] 把 `doc-audit` 加進 branch protection required checks（per Plan 2 Task 10 統一動 protection）

### 5.3 spec §6.7.4 更新 Layer 5

- [ ] 從「Phase 2」改「Phase 1 啟用」+ 對應 ADR

---

## 跨 Phase 共通驗收條件（per Phase 都做）

每個 Phase merge 前：

- [ ] mini-audit 報告寫入 `docs/superpowers/research/2026-05-XX-phase-N-mini-audit.md`
- [ ] PR description 含 doc impact checklist（per Phase 2 建立的 PR template）
- [ ] CI 4 jobs（含 Phase 5 後的 5 jobs：`doc-audit`）全綠
- [ ] auto-merge 啟用

---

## 風險與緩解

| 風險                                             | 緩解                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| 5 個 PR 之間有依賴 → 中間 PR 卡住整個 chain      | 每 PR 獨立 review、若某 PR 需大改可 revert 從上一 phase 重來      |
| ADR 131 條一次寫太多會疲勞 → 品質下降            | Phase 2 內部再切 batch（每 batch ~25 條），分段 commit            |
| Phase 4 schema 大重寫破壞 Plan 1 既有測試        | 先在 staging Neon branch 試 migration、確認無破壞才合 main        |
| 工時估超出（>60 hr）                             | 每 Phase 完成後檢視實際 vs 估計、若偏差 >30% 暫停與使用者重議範圍 |
| 過度設計風險（D13 內稽報表沒人 review = 文件債） | Phase 4 限縮 D13 為 Phase 2；Phase 1 只做核心                     |
| Mike 大記憶遞延（半年後忘了為什麼這樣設計）      | ADR 系統 + memory + per-Phase mini-audit 三層保險                 |

---

## 進度追蹤

| Phase | Branch                             | PR # | Status      | Merged Commit | mini-audit |
| ----- | ---------------------------------- | ---- | ----------- | ------------- | ---------- |
| 1     | `feat/rigorous-foundation-phase-1` | TBD  | In Progress | —             | —          |
| 2     | `feat/rigorous-foundation-phase-2` | —    | Pending     | —             | —          |
| 3     | `feat/rigorous-foundation-phase-3` | —    | Pending     | —             | —          |
| 4     | `feat/rigorous-foundation-phase-4` | —    | Pending     | —             | —          |
| 5     | （Plan 2 PR）                      | —    | Pending     | —             | —          |

---

## 後續

Phase 5 完成（= Plan 2 PR merged）後：

1. 更新 `MEMORY.md` 與 `project_overview.md` 標明「Pre-Plan-2 rigorous foundation 完成、進入 Plan 3 階段」
2. Plan 3 Task 0 research gate 啟動
3. Plan 3-8 走原計畫 + 每 Plan 必含 mini-audit + 必過 `pnpm audit:docs` CI

---

## Sources（本計畫直接引用）

- pre-Plan-2 audit 報告：[`docs/superpowers/research/2026-05-10-pre-plan-2-audit.md`](../research/2026-05-10-pre-plan-2-audit.md)
- brainstorm 30 HTML：`c:\APP_Project\Pro080\.superpowers\brainstorm\292-1777764498\content\`
- spec：[`docs/superpowers/specs/2026-05-07-rrms-phase1-design.md`](../specs/2026-05-07-rrms-phase1-design.md)
- 8 plans：[`docs/superpowers/plans/`](../plans/)
- 4 research：[`docs/superpowers/research/`](../research/)
- coding standards：[`docs/CODING_STANDARDS.md`](../../CODING_STANDARDS.md)
- ADR template：[Michael Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- Hexagonal architecture：[Alistair Cockburn, 2005](https://alistair.cockburn.us/hexagonal-architecture/)
- Event Sourcing：[Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- Vercel TOS commercial use：https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage
- GitHub branch protection PUT API：https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection
- Postgres RLS：https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Postgres ALTER TABLE：https://www.postgresql.org/docs/current/sql-altertable.html
- OWASP Top 10:2021 A01：https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- ISO/IEC 27001:2022 A.8.15：https://www.iso.org/standard/82875.html
- 台灣個人資料保護法施行細則第 12 條：https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
