<!--
What:  Pre-Plan-2 全面 audit。系統性比對 brainstorm 鎖定決議、spec、Plan 1-8 計畫文件、
       Plan 1 實際落地實作（package.json / configs / scripts / src / .github / .claude /
       .husky）、3 份 research 報告，盤點一切尚未對齊的缺失、矛盾、與 brainstorm 鎖定決議
       的偏離。本報告為 Plan 2 動工前的最後檢查 gate；每條 finding 標 spec/plan 章節 + 嚴
       重度 + 建議處置；使用者勾選哪幾條要修，後續會在 1 個 PR 一次完成。
Why:   feedback_evidence_required.md 規範每個說法都要附引用源；本 audit 依此規範遍訪 13
       份計畫/規範/研究 + 30 份 brainstorm HTML + Plan 1 全部落地檔，確保 Plan 2 不會踩到
       上游遺漏的地雷。同時也回應使用者於 2026-05-10 的明確指示：「以系統架構完整及資安為
       最高原則，全面修復、嚴謹檢討」。
Where: 與 2026-05-08-bootstrap-versions.md、2026-05-08-cross-plan-versions.md、
       2026-05-09-consistency-audit.md、2026-05-10-red-team-test-result.md 並列為
       「決策／驗證 paper trail」。本 audit 是這條 paper trail 的第 4 份（time order 3rd /
       4th 之分際在於同日紅隊測試報告的 commit 時間）。
When:  Generated 2026-05-10，Plan 1 已 merged 後、Plan 2 Task 0 動工之前。每條 finding 在
       後續 PR 中被處理時應追加 commit 連結到本檔下方的「處置追蹤」區。
-->

# RRMS Pre-Plan-2 Audit Report

**日期**：2026-05-10
**Audit 範圍**：Plan 2 動工前已 push 到 `main` 的全部內容；對照 brainstorm 鎖定決議、spec、Plans 1-8、Plan 1 實作落地、3 份既有 research 報告
**Audit 方法**：cross-reference 每一條 brainstorm hard 決議 → spec → plan → implementation；任何中斷或偏離標為 finding
**已讀 source**（44 份）：
- 30 份 brainstorm HTML（`c:\APP_Project\Pro080\.superpowers\brainstorm\292-1777764498\content\`，由 sub-agent 萃取）
- 1 份 spec（`docs/superpowers/specs/2026-05-07-rrms-phase1-design.md`）
- 8 份 plans（`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-{1-8}-*.md`）
- 4 份 research（`docs/superpowers/research/`：bootstrap-versions、cross-plan-versions、consistency-audit、red-team-test-result）
- 1 份 coding standards（`docs/CODING_STANDARDS.md`）
- Plan 1 實作落地：`package.json`、`tsconfig.json`、`next.config.ts`、`eslint.config.mjs`、`eslint-rules/*.mjs`、`.gitleaks.toml`、`vercel.ts`、`.env.example`、`.gitignore`、`.prettierignore`、`.lintstagedrc.json`、`.husky/pre-commit`、`.claude/settings.json`、`scripts/*.{sh,mjs}`、`src/app/{layout,page}.tsx`、`.github/workflows/ci.yml`、`README.md`
- Git history `git log --oneline -50`、`gh api branches/main/protection`

---

## 摘要

| 嚴重度 | 數量 | 說明 |
|---|---|---|
| 🔴 Critical | 1 | 阻擋 Plan 2 進行（會誤關現有 branch protection）|
| 🟠 High | 3 | 有資安／合約風險，建議 Plan 2 一併修 |
| 🟡 Medium | 4 | brainstorm hard 決議未落地到 Phase 1 spec/plan，需使用者決定 Phase 1 / Phase 2 邊界 |
| 🟢 Low | 4 | 文字描述不一致／待補小細節，可順手修 |
| ℹ️ Info | 3 | 已知狀態，無須修但記錄存證 |

**最關鍵發現**：
1. 🔴 **Plan 2 Task 3 Step 4** 的 branch protection PUT 指令會誤關現有 `enforce_admins=true` 與 `dismiss_stale_reviews=true`，需在 Plan 2 動工前修正計畫文字（**必修**）
2. 🟠 **Plan 2 缺「在 plan 開始時 checkout feature branch」指示**，依現有 main branch protection + `feedback_pr_flow.md` 直接照 plan 跑會卡 push（**必修**）
3. 🟠 **Vercel 計畫等級**（brainstorm A14 hard rule：Phase 1 必 Pro plan，Hobby Free **禁商用**）在 spec / plan / 任何文件中**完全沒提**；當前 `rrms-black.vercel.app` 部署等級需向使用者確認
4. 🟡 **Hexagonal / Ports-and-Adapters 架構**（brainstorm F7-F11 hard rule，含 5 條 lock-in 緩解紀律）**完全沒進** Phase 1 spec/plan/實作；Plan 5/6/8 直接 import Vercel-specific SDK，違反 brainstorm 對 lock-in 緩解的鎖定決議

**已驗證為已修**（無須再動）：
- `2026-05-09-consistency-audit.md` 列的 21 條 issue（critical 7 + important 8 + minor 6）目前**全部已修**（透過 PR #1 commits `6d79d46` + `38639a6`，以及 Plan 1 實作階段順手修；2026-05-10 PR #4 commit `3902405` 又補 3 條）。grep 確認：active spec / Plan 1-8 中已無 `Auth.js` 規範性引用、無 `AUTH_SECRET`/`AUTH_URL`、無 `users.id` FK、無 `@/auth/auth` import、無 `vitest` install、Plan 6/7 用 `text` 不是 `uuid` FK 到 `user.id`。consistency-audit 報告本身為歷史 paper trail，不需動。

---

## 嚴重度說明

| 等級 | 定義 | 對應動作 |
|---|---|---|
| 🔴 Critical | 直接阻擋 Plan 2 進行；或會默默削弱現有資安 | **必修** — Plan 2 開始前要先處理 |
| 🟠 High | 有資安／合約／TOS 風險；雖不立即崩，但越晚修代價越大 | 強烈建議 Plan 2 階段一併修 |
| 🟡 Medium | brainstorm hard 決議與 Phase 1 spec / plan 之間有未明示的鴻溝；不修不會崩，但決議軌跡會斷 | 由使用者裁示「Phase 1 補做 / 移到 Phase 2 並文件化 / 推翻原 brainstorm 決議」 |
| 🟢 Low | 文字描述／註解錯字；可在順手 PR 修掉 | 隨手修 |
| ℹ️ Info | 已知、已被處理過、或為歷史 paper trail | 不修，僅紀錄存證 |

---

## 🔴 Critical Findings

### F-C1：Plan 2 Task 3 Step 4 的 branch protection PUT 會誤關現有保護

**對應**：
- Plan 2 計畫文件 [docs/superpowers/plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md:255-261](../plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md#L255)
- 現況 `gh api repos/BigMikeTW/rrms/branches/main/protection`：`enforce_admins=true`、`required_pull_request_reviews.dismiss_stale_reviews=true`、`required_status_checks.contexts` 含 4 個（`gitleaks`、`ESLint + tsc`、`Client bundle scan`、`semgrep OWASP`）

**現象**：Plan 2 Task 3 Step 4 的指令只列了 `required_status_checks.contexts[]` 與 `strict=true`，省略了 `enforce_admins`、`required_pull_request_reviews.*`、`restrictions=null`。GitHub branch protection PUT API 是**整個物件取代**（per [GitHub REST API docs](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection)），省略的欄位會被 reset 成預設值（`enforce_admins=false`、`dismiss_stale_reviews=false`）。執行後現有兩道保護**會被默默關掉**。

Plan 2 Task 10 Step 1 同一指令的版本是**對的**（含 `enforce_admins=true`、`required_pull_request_reviews.dismiss_stale_reviews=true`、`restrictions=null`）。

**為什麼是 Critical**：
- 違反使用者設下的「資安為最高原則」
- Plan 2 計畫文件本身內部矛盾（Task 3 Step 4 vs Task 10 Step 1）
- 一旦在 Plan 2 階段執行，下次紅隊測試才發現保護被弱化、難以歸因

**建議處置**（兩擇一）：
- (A，**推薦**)：把 Plan 2 Task 3 Step 4「加 npm-audit 進 required checks」的子步驟**整段刪掉**；改成「Task 10 Step 1 一次把全部 6 個 checks + 完整 enforce_admins / dismiss_stale_reviews / restrictions=null 一起 PUT 進去」。文字加註：「為避免兩次 PUT 之間因省略欄位而誤關保護，本 plan 中 branch-protection 設定**僅在 Task 10 動一次**。」
- (B)：把 Plan 2 Task 3 Step 4 的指令補完整（加 `enforce_admins=true`、`required_pull_request_reviews.dismiss_stale_reviews=true`、`restrictions=null`），並在註解明寫「本 PUT 是整個物件取代，所有現有欄位都必須複述」。

---

## 🟠 High Findings

### F-H1：Plan 2 缺「在 Plan 動工時 checkout 一條 feature branch」指示

**對應**：
- Plan 2 [Task 2 Step 2](../plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md#L194-L198)、[Task 3 Step 3](../plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md#L246-L249)、[Task 5 Step 2](../plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md#L398-L405)、[Task 7 Step 2](../plans/2026-05-08-rrms-phase1-plan-2-cross-cutting-security.md#L539-L545) 全都直接 `git push`，Plan 開頭沒任何 `git checkout -b feat/plan-2-...`
- `feedback_pr_flow.md` 工作規則：1 PR per Plan、Plan 2-7 走 auto-merge、**禁直接 push main**
- 現況 main branch protection：`required_status_checks.strict=true` + 4 必過 checks，直接 push main 會被拒

**為什麼是 High**：
- implementer subagent 不知道要先 checkout 分支，會在 Task 2 第一個 push 直接卡住
- 卡住後 subagent 可能誤判要動 branch protection（這就連動 F-C1 的危險）
- 這是 process gap，不是技術 bug，但實作體感上等於 plan 不可執行

**建議處置**：
在 Plan 2 開頭（Pre-Tasks 之後、Task 0 之前）加一段：

```markdown
## Plan 2 整體分支策略

依 `feedback_pr_flow.md`：1 PR per Plan + auto-merge for Plans 2-7。

整個 Plan 2（Task 1-10 + 紅隊驗證）在**單一** feature branch 上做，最後開 1 個 PR：

```powershell
git checkout main
git pull --ff-only
git checkout -b feat/plan-2-cross-cutting-security
```

Task 4/6/8/9 中**另外開**的「test PR」是短命的 red-team branch（如 `test/zap-pipeline`、`red-team/dependabot`、`red-team/zap-xss`），驗證後 `gh pr close --delete-branch` 關掉，不 merge。它們和主 implementation branch 無關。

最後：
```powershell
git push -u origin feat/plan-2-cross-cutting-security
gh pr create --title "feat: Plan 2 — Cross-Cutting Security Platform" --body "..."
gh pr merge <PR#> --auto --merge
```
```

### F-H2：Vercel 計畫等級（Pro vs Hobby）在所有文件中皆未提及

**對應**：
- brainstorm 決議 A14（hard）：「Vercel 計畫必須 = Pro（US$20/seat/月）；**Hobby Plan 禁商用**，不可用 Free 跑 production」（來源：`platform-registration.html`）
- brainstorm 決議 H1（hard）：「MVP 必註冊：... Vercel（**必 Pro**）」（同源）
- spec [§7 技術架構](../specs/2026-05-07-rrms-phase1-design.md#L589-L637)、[§8 外部相依](../specs/2026-05-07-rrms-phase1-design.md#L641-L655) 完全沒提 Vercel plan tier
- Plan 1 [Task 14](../plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md#L1369-L1446) 連 Vercel、跑 preview deploy，沒提需 Pro
- Plan 8 [Task 1-10](../plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md) 上線、設 cron、設 DNS、切 production，也沒提需 Pro
- continue.md、`project_overview.md`（memory）皆無

**為什麼是 High**：
- Vercel Hobby Free [TOS 禁商業用途](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)；RRMS 是商業營運系統（公司內部 + 客戶報修）
- 當前 deploy `rrms-black.vercel.app` 不知是 Pro 還是 Hobby — **若是 Hobby 已違規**
- 部分功能（多 region、preview commenting、increased function execution）需 Pro 才解鎖；Plan 5（Dropbox 媒體）+ Plan 8（cron 多次/日）可能踩到 Hobby 限額
- brainstorm 預估 H4 顯示 100 業主滿載 ≈ NT$5,000-6,000/月，已假設 Pro 方案

**建議處置**：
1. **使用者先確認**：當前 `rrms-black.vercel.app` 部署是哪個 plan？到 https://vercel.com/dashboard → 專案 → Settings → Billing 看
2. 若是 Hobby：**馬上**升 Pro（防止 TOS 違規）
3. 把 Vercel Pro 寫進 spec §7 技術棧表格、Plan 1 P-2 帳號授權清單、Plan 8 Task 8 上線檢查清單
4. 把月費預估（per brainstorm H4：NT$5,000-6,000）寫進 spec §11 或新增 §12「平台費用估算」

### F-H3：Plan 8 Resend 自我矛盾，且無對應 Task

**對應**：
- Plan 8 [Goal 段 line 7](../plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md#L7)：「設定 production 環境（網域 DNS、production LINE channel + Webhook、Dropbox prod app、Google OAuth prod credentials、**Resend email**）」← 寫進 Phase 1
- Plan 8 [Tech Stack line 13](../plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md#L13)：「Resend（透過 Vercel Marketplace；**Phase 2 Plan 已預留**）」← 標 Phase 2
- Plan 8 [Acceptance line 695](../plans/2026-05-08-rrms-phase1-plan-8-anonymization-and-cutover.md#L695)：「⚠️ Resend / 啟用信寄送在 Plan 3 標 TODO，**Phase 2 補**（Phase 1 用手動貼連結）」← 標 Phase 2
- Plan 3 [line 974](../plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md#L974)：「Phase 1 暫不接 Resend」
- Plan 3 [line 984](../plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md#L984)：「Plan 8 will swap this for Resend」← 標 Phase 1 / Plan 8
- Plan 3 [line 1431](../plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md#L1431)：「Resend / 真正寄邀請信延後到 **Plan 8（cutover）**」
- Plan 8 Task 0-10 列表中**無**任何 Resend 相關 task

**為什麼是 High**：
- Plan 3 期望 Plan 8 接手 Resend；Plan 8 自己內部分歧（Goal 寫 yes、Tech Stack & Acceptance 寫 no），且根本沒 task
- 實務後果：Plan 8 implementer 看 Goal 想加 Resend，但找不到 task、找不到 Resend 教學步驟，只好略過或瞎猜
- magicLink 邀請流程沒 email 寄送在 Phase 1 是 **使用者明示同意**的妥協（Plan 3 line 974：「admin 自己貼給同事」），**這個共識需要在 Plan 8 與 spec 中對齊**

**建議處置**（兩擇一）：
- (A，推薦) **承認 Phase 1 不接 Resend**：把 Plan 8 Goal line 7 的 `Resend email` 字樣移除；Tech Stack 維持「Phase 2 預留」；Acceptance 維持。spec §10 Phase 2 預留 list 加一條「Resend email integration（admin 邀請信、結案通知）」
- (B) **改為 Phase 1 收尾接 Resend**：Plan 8 加 Task 11「Resend 整合（透過 Vercel Marketplace 安裝、`auth.options.plugins[magicLink].sendMagicLink` 換成 Resend SDK call）」；Plan 3 line 974 註明「在 Plan 8 Task 11 切換」；Tech Stack 改回「Phase 1 啟用」

---

## 🟡 Medium Findings（brainstorm hard 決議與 Phase 1 spec/plan 的鴻溝）

下列 4 條都是 brainstorm 鎖定為 hard 的決議，但 Phase 1 spec / Plans 1-8 完全沒覆蓋。需要使用者裁示「Phase 1 補做 / 移到 Phase 2 並明寫 / 推翻原 brainstorm 鎖定」。

### F-M1：Hexagonal / Ports-and-Adapters 架構未進 Phase 1

**對應**：
- brainstorm F7（hard）：「Hexagonal / Ports-and-Adapters 架構為強制紀律：所有 Vercel 特定 SDK / 外部依賴包在 `/adapters` 資料夾（StorageAdapter、QueueAdapter、AIAdapter、CronAdapter…）；業務邏輯只 import interface」（來源：`vendor-lockin-analysis.html`、`docker-vs-serverless.html`、`migration-and-ai-governance.html`）
- brainstorm F8（hard）：「spec 必含『Platform Dependencies』章節」
- brainstorm F9（hard）：5 條 lock-in 緩解紀律全部寫進 spec
- spec [§7](../specs/2026-05-07-rrms-phase1-design.md#L589) 沒有 `/adapters` 也沒有「Platform Dependencies」章節
- Plan 5（Dropbox）、Plan 6（LINE Messaging）、Plan 8（Vercel Cron）都直接 import 第三方 SDK，無 adapter wrapper
- grep 整個 docs/：`adapter` 字樣只出現在 Drizzle adapter（不同概念）

**為什麼是 Medium**：
- 現在不修不會崩；但 Phase 2 想換 storage（Dropbox → R2）、換 cron（Vercel Cron → 自管 worker）時，每處都要拆，遷移成本高
- brainstorm 算過 hexagonal 紀律可把 lock-in 從 10-15% 降到 5-8%；省的是未來、不是現在
- 但這違反「使用者明示鎖定」：F7 鎖定後 spec 還是省略 = 決議軌跡被截斷

**建議處置**（三擇一）：
- (A) **Phase 1 補做**：spec 加「§12 平台依賴與 Hexagonal 紀律」章節；Plan 1 加 Task 「建立 `src/adapters/` 骨架 + 5 條 lock-in 紀律 README」；Plan 5/6/8 改寫為 import 自家 adapter 介面（會多寫 ~3-5 個檔，耗 ~半天到 1 天）
- (B，推薦) **Phase 2 並明寫**：spec §10 Phase 2 預留 list 加「Hexagonal 重構（拆 StorageAdapter / QueueAdapter / CronAdapter / AIAdapter；對應 brainstorm F7-F11）」；continue.md / project_overview memory 標 Phase 2 任務
- (C) **推翻 brainstorm**：使用者明示「Phase 1/2 都不做 hexagonal」，理由附上（例：團隊只有自己 + Claude，認知負擔比 lock-in 風險大）

### F-M2：全系統 Audit Trail（append-only event sourcing）未進 Phase 1

**對應**：
- brainstorm D2（hard）：「audit_log 表為 append-only、不可修改、不可刪除（事件溯源 / Event Sourcing 模式）」（來源：`audit-trail.html`）
- brainstorm D3（hard）：audit_log 強制欄位 who/when/what/target/before(jsonb)/after(jsonb)/reason_code/reason_note/approval_chain/ip_address/user_agent
- brainstorm D4（hard）：變更理由分類庫（Change Reason Catalog）
- brainstorm D8（hard）：「compensation_amount 列為高敏感欄位，任何變更必須走 audit_log」
- brainstorm D9（hard）：「結案報告 PDF 全部歷史報告永久保留... 下載動作記入 audit_log」
- brainstorm D13（hard）：自動產生 4 種內稽報表
- spec §5 schema 中只有 `case_status_history`（狀態變更）+ `query_attempts`（LINE OA 查詢嘗試）兩種小型 audit；無全系統 `audit_log` 表
- Plan 3-8 也未建立 `audit_log`

**為什麼是 Medium**：
- Phase 1 不做也能上線；但 brainstorm D1 引用 ISO/IEC 27001、SOC 2、GDPR Art. 30、SOX 404 為合規依據，全系統 audit_log 是合規基底
- 一旦 Phase 1 累積客戶資料後再回頭加 audit_log，**之前的歷史變更無法回填**（事件溯源的本質就是要「從一開始就記」）
- Phase 1 預期 100 業主、累積 1-2 年才到 Phase 2，這段時間沒 audit 等於合規空窗

**建議處置**（三擇一）：
- (A) **Phase 1 補做最小版 audit_log**：spec §5 加 `audit_log` 表（只有 D3 的核心欄位，先不做 D4 reason_code catalog 與 D13 內稽報表）；Plan 3 加 Task 加表 + Drizzle schema；Plan 4/5/6/7/8 各加「TX 內寫一筆 audit」步驟
- (B) **Phase 2 並明寫**：spec §10 加「Audit Trail event sourcing（對應 brainstorm D2-D4、D8、D9、D13）」；強調「Phase 1 雖無 audit_log，但已用 case_status_history + query_attempts 涵蓋兩個高敏感場景」
- (C) **使用者裁示「不做」並推翻 brainstorm 鎖定**

### F-M3：AI 三道地基（C8）未進 Phase 1

**對應**：
- brainstorm C8（hard）：「AI 三道地基（**必在 MVP 做對**）：①資料地基（features 完整 + 結構化派工決策）②Event Stream（業務邏輯 → 發 event → 分析訂閱，不直打 OLTP）③彈性 schema（jsonb + catalog）」（來源：`q7-rating-and-tech-debt.html`）
- spec / Plans 1-8 完全沒提 Event Stream、jsonb attributes、catalog table

**為什麼是 Medium**：
- 同 F-M2，這是「以後沒辦法回填」類的決議
- 但 Phase 1 範圍（公開報修表單 + 簡易後台 + LINE）距離派工/AI 場景仍遠 — Phase 1 上線後 6-12 個月才會用到 AI 派工，期間還會有 Phase 2 大改

**建議處置**（推薦 B）：
- (B) **Phase 2 並明寫**：spec §10 加「AI 三道地基（對應 brainstorm C8）— Phase 2 Plan 之 Task 0 必含資料地基 readiness 評估」
- (A) Phase 1 補做：太重，不建議
- (C) 推翻：與 brainstorm 衝突，需慎重

### F-M4：5 層位置 hierarchy + 動態 RBAC + ltree（F3-F6、E2-E5）未進 Phase 1

**對應**：
- brainstorm F3（hard）：「五層位置 hierarchy：owner → building → floor → unit → sub_unit；owner 為多租戶頂層 namespace」
- brainstorm A16（hard）：「樹狀資料結構 = PostgreSQL ltree extension」
- brainstorm A17（hard）：「多租戶資料隔離 = AWS Pool 模式（共享 DB + tenant_id 過濾 + Postgres Row Level Security）」
- brainstorm E2-E5：四種角色 + 動態 RBAC（jsonb attributes + catalog；Casbin / OpenFGA 設計理念）
- spec §5 只有平面 `cases` 表 + `tenant_id uuid` 預留欄位（spec 5.2 line 267）+ `role enum staff/admin`
- spec [§2.2](../specs/2026-05-07-rrms-phase1-design.md#L45-L56)：明示排除「客戶公司管理員角色（多租戶）」「後台敏感資料遮罩 + JIT 授權」

**為什麼是 Medium**（最像「Phase 1 / Phase 2 邊界決定」）：
- spec §2.2 已明示排除多租戶層 → 此項為**已明示 Phase 2 deferral**，不是 brainstorm 偏離
- 但 spec 沒明寫「對應 brainstorm F3-F6、A16-A17、E2-E5」，未來 Phase 2 啟動時不容易拼回 brainstorm 軌跡
- ltree extension、RLS、ltree-aware schema 設計如果 Phase 1 完全不留口，Phase 2 改 schema 會很痛苦

**建議處置**：
- (B) **明寫 Phase 2 對應**：spec §10 改寫為條列「Phase 2 啟用項目」並逐條註明 brainstorm 來源（如：F3 5-層 hierarchy → spec §10.X；A17 RLS → spec §10.Y...）
- 額外建議：Plan 3 Task 5 結束時，在 `tenant_id` 欄位旁加 4W 註解寫明「Phase 2 啟用 RLS + ltree（對應 brainstorm A16-A17、F3）」

---

## 🟢 Low Findings（描述／註解小問題）

### F-L1：continue.md 「L3 + L5 為 Phase 2」與 ci.yml 4W 註解矛盾

**對應**：
- [`continue.md` line 244](../../../continue.md#L244)：「Plan 1 五層防線：L1（Claude hooks）、L2（Husky pre-commit）、L4（GitHub Actions CI 4 jobs）全活；L3 + L5 為 Phase 2」
- [`.github/workflows/ci.yml` line 12-13](../../../.github/workflows/ci.yml#L12-L13)：「Layer 3 is the **protected-branch rule on `main`** that requires these checks to pass.」
- spec [§6.7.4](../specs/2026-05-07-rrms-phase1-design.md#L486-L491)：「Layer 3：Pre-push hook（本機端，Phase 2）」
- README [line 84](../../../README.md#L84)：「L3 | `git push`（本機；Phase 2） | — |」

**現象**：spec 與 README 把 L3 定義為「Pre-push hook」（Phase 2）；ci.yml 4W 註解把 L3 定義為「protected-branch rule」（已啟用）。兩個定義不一致。

**建議處置**：
- (A，推薦) 改 ci.yml 4W 註解：把「Layer 3 is the protected-branch rule」改成 `Layer 4's enforcement is the protected-branch rule on main` 或更精確的 `The branch protection rule on main is what makes Layer 4 mandatory`
- (B) 接受 ci.yml 的定義、改 spec/README/continue.md 的 L3 定義為「branch protection」、把 pre-push hook 重新編號為 L6 — **不建議**（衝擊大）

### F-L2：cross-plan-versions.md research 報告含過時的 Auth.js 風險警告

**對應**：
- [`docs/superpowers/research/2026-05-08-cross-plan-versions.md` lines 27-28、69-78、137-141、149-151、201-205、227、239-240](../research/2026-05-08-cross-plan-versions.md)：標 `next-auth`、`@auth/drizzle-adapter`、`Auth.js v5 maintainership` 為 high-risk
- 現況：Plan 3 已切換 Better Auth；Auth.js 風險已 N/A

**為什麼是 Low**：research 報告是歷史 paper trail（per `2026-05-09-consistency-audit.md` line 8 自述：「historical decision-snapshots, not specifications」），不應該改。但**新的 implementer 讀到這份還是會混淆**。

**建議處置**：在 cross-plan-versions.md 開頭加 1 行 `> **2026-05-10 update**: Auth.js v5 path was rejected; see Plan 3 for Better Auth choice.`

### F-L3：Plan 1 line 1302 README 段 tech stack 列「Better Auth」但 Plan 1 不裝它

**對應**：
- [Plan 1 Task 13 README 範本 line 1302](../plans/2026-05-08-rrms-phase1-plan-1-bootstrap-and-security.md#L1302)：列出「... Drizzle · Neon · Better Auth · LINE Messaging API · Dropbox API ...」
- 落地 [README.md line 48](../../../README.md#L48)：實際 commit 內容相同
- Plan 1 本身不裝 Better Auth、不裝 Drizzle、不裝 Neon driver、不裝 LINE/Dropbox SDK（首次 install 是 Plan 3 / 5 / 6）

**為什麼是 Low**：README 是「目標 tech stack」非「當前已裝」，consistency-audit Issue 14 已評估「acceptable as forward-looking」。

**建議處置**：可選 — 在 README 加一行「（部分套件在後續 Plans 才安裝；見 [docs/superpowers/plans/](docs/superpowers/plans/)）」

### F-L4：spec §6.7.4 引用 `(NEXTAUTH_SECRET|AUTH_SECRET)` 但 Plan 1 已換 Better Auth

**對應**：
- spec §6.7.4 五層共用掃描清單表 [line 528](../specs/2026-05-07-rrms-phase1-design.md#L528)：「`NEXT_PUBLIC_*_SECRET / *_KEY / *_TOKEN`」← OK，這條沒問題
- 但 spec 沒列 `BETTER_AUTH_SECRET` 為偵測對象；只有 Plan 1 落地的 `.gitleaks.toml` 與 `scripts/check-bundle-secrets.mjs` 有
- 不影響實作，僅文件描述不對等

**建議處置**：可選 — spec §6.7.4 加列「`BETTER_AUTH_SECRET / AUTH_SECRET / NEXTAUTH_SECRET` env 名稱誤洩」對應掃描

---

## ℹ️ Info（已驗證、無須處理）

### F-I1：consistency-audit 21 條 issue 全部已修

詳見摘要段「已驗證為已修」。grep `Auth\.js|bcrypt[^j]|next-auth|@auth/drizzle-adapter|argon2` 結果：active spec / Plan 1-8 中沒有規範性引用，所有引用都是「歷史脈絡」「曾經考慮」型敘述。grep `users\.id|@/auth/auth|AUTH_SECRET|AUTH_URL|vitest`：完全無命中。

### F-I2：Plan 1 落地 vs Plan 1 文件 fidelity 高

逐項比對：
- `package.json`：`@vercel/config@0.3.0` exact ✅、ESLint 9 / Husky 9 / lint-staged 17 / Prettier 3 / Tailwind 4 / shadcn 4.7 / next 16.2.6 ✅
- `tsconfig.json`：strict + 6 條 strict 補強 + `__tests__/__fixtures__/**` exclude ✅
- `eslint.config.mjs`：兩條 RRMS rule + globalIgnores fixtures ✅
- `eslint-rules/*.mjs`：Better Auth + drizzle-orm/neon-http 已加入 blacklist（**比 Plan 1 文件 line 421-428 還更新**，落地版多 4 條）
- `.gitleaks.toml`：4 條 RRMS rule + 5 條 allowlist（含 `.next/` 與 plan-1 自身 plan 檔，避免自我循環誤觸）
- `.husky/pre-commit`：Husky 9 風格、無 deprecated shebang ✅、3 道 guard（gitleaks → lint-staged → typecheck，note: 順序與 Plan 1 文件 line 700 順序略不同 — 落地把 gitleaks 提到第一道避免 prettier --write 後 staged 變動，4W 註解中已說明此 trade-off）
- `vercel.ts`：`@vercel/config/v1` subpath ✅、4W 註解 + import 路徑說明 ✅
- `.env.example`：BETTER_AUTH_* / 共 15 個 env 命名與 spec §6.7.2 / Plan 3 一致 ✅
- `scripts/post-review-scan.sh`：使用 `set -uo pipefail` 不短路、`require_tool` 區分 missing vs violation、`$CLAUDE_PROJECT_DIR` fallback、4W 註解完整 ✅
- `scripts/red-team-test.sh`：`PAYLOAD_HI/LO` 拆字串避開自己 gitleaks 規則 + `LOG_DIR` portable + `git ls-files --error-unmatch` 防呆 ✅
- `scripts/check-bundle-secrets.mjs`：5 條 pattern 與 .gitleaks.toml 同步 ✅
- `.claude/settings.json`：schemastore.org 正確 schema URL（PR #5 修正）+ `$CLAUDE_PROJECT_DIR` 路徑 ✅
- `src/app/layout.tsx`：4W header + 真實 metadata（PR #3 final polish 修）✅
- `src/app/page.tsx`：4W header + RRMS placeholder + Button smoke test ✅
- `.github/workflows/ci.yml`：4 jobs + permissions + concurrency + action versions（v6 checkout、v4 setup-node、Node 22）✅
- `README.md`：4W + 5 層防線表 + scripts 對照 ✅

**結論**：Plan 1 實作品質高於 Plan 1 文件本身（多處主動加固，例 ESLint blacklist + gitleaks allowlist + post-review-scan portable）。

### F-I3：PDPA 未鎖定項仍 open（`project_pdpa.md` 已記）

memory `project_pdpa.md` 已記「discussion in progress; rules to be locked into spec」。brainstorm fork-in-the-road #1 列出 PDPA 細節未鎖（保存期限數字、匿名化規則、L1 報修人留 LINE id 處理、DSAR SOP）。spec §6 已有部分（保存 2 年、匿名化欄位 6.3 表、權利 6.4 表），但細節（如 BFG 復原預演、L1 留 LINE id 詳細處理）尚未鎖定。Plan 4 + Plan 8 才會碰到。**Plan 2 不依賴 PDPA 細節，本 audit 不阻擋。**

---

## 不在本 audit 範圍但記錄存證的觀察

### O-1：brainstorm B 段（業務規則 1-40 條）多數**正確**地排除在 Phase 1 spec 外

brainstorm 業務規則（派工模組、評分機制、PDF 生成、簽核 A1-A4、結帳週期 B3、6 大客製查詢報表、技師月度對帳、外包技師合約自動化、動態費率、case 10 階段流、PDF immutable snapshot）共 40 條，spec §2.2 明示排除大部分；project_overview memory 確認 Phase 1 = 「公開報修表單 + 後台 + LINE」。本 audit 不視之為偏離。

### O-2：Plan 4 ratelimit 用 PG-backed 實作但無 GC

Plan 4 [Task 5 ratelimit](../plans/2026-05-08-rrms-phase1-plan-4-public-form-and-pdpa.md) 用 PG bucket 表，無 GC cron。`2026-05-09-consistency-audit.md` Issue 21 已記為「Phase 2 problem」。Plan 2 不影響。

### O-3：Plan 6 `MediaGallery.tsx` 文件已標 Phase 2

Plan 6 [File Structure line 49](../plans/2026-05-08-rrms-phase1-plan-6-admin-and-line-push.md#L49) 已加註「（MediaGallery.tsx 延後到 Phase 2 — Phase 1 只列 dropbox path 文字）」，consistency-audit Issue 19 已修。

---

## 修復順序建議

依「資安為最高原則 + 最小 PR churn」：

1. **F-C1 + F-H1**（Plan 2 計畫文字修）— 動 1 份 plan 文件
2. **F-L1**（continue.md / ci.yml 4W 註解小修）— 動 2 份檔
3. **F-H2 + F-H3**（Vercel Pro 文件化、Plan 8 Resend 對齊）— 動 spec + Plan 8
4. **F-M1 / F-M2 / F-M3 / F-M4**（brainstorm hard 決議的 Phase 1/2 邊界裁示）— 使用者逐條決定後動 spec §10
5. **F-L2/L3/L4**（小修 / 順手）— 任何方便時點

預期 1 個 PR 涵蓋 1-3 + 5；4 條視使用者裁示拆 1-2 個 commit 進同 PR。

---

## 處置追蹤（修完才填）

| Finding | 處置決定（A/B/C） | Commit | 處置者 | 日期 |
|---|---|---|---|---|
| F-C1 | _待裁示_ | | | |
| F-H1 | _待裁示_ | | | |
| F-H2 | _待裁示_ | | | |
| F-H3 | _待裁示_ | | | |
| F-M1 | _待裁示_ | | | |
| F-M2 | _待裁示_ | | | |
| F-M3 | _待裁示_ | | | |
| F-M4 | _待裁示_ | | | |
| F-L1 | _待裁示_ | | | |
| F-L2 | _待裁示_ | | | |
| F-L3 | _待裁示_ | | | |
| F-L4 | _待裁示_ | | | |

---

## Sources（本 audit 直接引用）

- brainstorm 30 HTML（萃取為決議清單，sub-agent run 2026-05-10）
- spec：[`docs/superpowers/specs/2026-05-07-rrms-phase1-design.md`](../specs/2026-05-07-rrms-phase1-design.md)
- 8 plans：[`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-{1-8}-*.md`](../plans/)
- bootstrap-versions：[`docs/superpowers/research/2026-05-08-bootstrap-versions.md`](2026-05-08-bootstrap-versions.md)
- cross-plan-versions：[`docs/superpowers/research/2026-05-08-cross-plan-versions.md`](2026-05-08-cross-plan-versions.md)
- consistency-audit：[`docs/superpowers/research/2026-05-09-consistency-audit.md`](2026-05-09-consistency-audit.md)
- red-team-test-result：[`docs/superpowers/research/2026-05-10-red-team-test-result.md`](2026-05-10-red-team-test-result.md)
- coding standards：[`docs/CODING_STANDARDS.md`](../../CODING_STANDARDS.md)
- continue.md（session handoff）：[`continue.md`](../../../continue.md)
- Plan 1 落地：`package.json`、`tsconfig.json`、`next.config.ts`、`eslint.config.mjs`、`eslint-rules/{no-public-secret-vars,no-server-sdk-in-client}.mjs`、`.gitleaks.toml`、`vercel.ts`、`.env.example`、`.gitignore`、`.prettierignore`、`.lintstagedrc.json`、`.husky/pre-commit`、`.claude/settings.json`、`scripts/{check-bundle-secrets.mjs,post-review-scan.sh,red-team-test.sh}`、`src/app/{layout,page}.tsx`、`.github/workflows/ci.yml`、`README.md`
- Vercel branch protection 現況：`gh api repos/BigMikeTW/rrms/branches/main/protection`（拉於 2026-05-10）
- Vercel Hobby TOS：https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage
- GitHub branch protection PUT API：https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection
