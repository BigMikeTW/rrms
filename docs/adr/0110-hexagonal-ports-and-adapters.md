# ADR 0110 — Hexagonal / Ports-and-Adapters 為強制紀律：所有外部依賴包在 /adapters

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `vendor-lockin-analysis.html`, `docker-vs-serverless.html`, `migration-and-ai-governance.html` 決議 F7 |
| Related ADR | ADR-0004, ADR-0006, ADR-0009, ADR-0022, ADR-0104, ADR-0111, ADR-0112, ADR-0113, ADR-0132 |

## Context

Bundle B（ADR-0104）使用大量 Vercel-specific SDK：`@vercel/blob`、`@vercel/cron`（via `vercel.json`）、Vercel KV、Vercel AI SDK 等。若業務邏輯直接 `import` 這些 SDK，未來若 Vercel 漲價、停服、或 RRMS 客戶要求 multi-cloud，遷移成本將從「換一個檔」變成「全 codebase 改寫」。Alistair Cockburn 1994 提出的 Hexagonal / Ports-and-Adapters 架構正解此問題：業務邏輯（domain）只 import port（介面），實作（adapter）放隔離資料夾。

## Decision

**Hexagonal / Ports-and-Adapters 為 RRMS 強制紀律**：

1. 所有 Vercel-specific SDK 與外部依賴（DB driver、blob、queue、AI、cron、email、LINE API…）的具體呼叫**必須**包在 `/adapters` 資料夾下，例如：
   - `adapters/storage/VercelBlobAdapter.ts`（實作 `StorageAdapter` port）
   - `adapters/queue/VercelQueueAdapter.ts`（實作 `QueueAdapter` port）
   - `adapters/ai/VercelAIAdapter.ts`（實作 `AIAdapter` port）
   - `adapters/cron/VercelCronAdapter.ts`（實作 `CronAdapter` port）
2. 業務邏輯（`/domain`、`/services`、Server Actions）**只** `import` port（介面），**不** `import` 任何 `@vercel/*` 或 SDK 具體類別
3. CI lint 規則禁止業務層 import `@vercel/*`（白名單只有 `/adapters` 路徑）

## Consequences

### ✅ 好處
- 平台換家成本被壓在 adapter 層 — 換 storage 只改一個檔
- 單元測試業務邏輯時可注入 mock adapter，不需要 mock 整個 SDK
- 對應 brainstorm 5 條 lock-in 紀律的核心（ADR-0112）
- Auth.js → Better Auth pivot（ADR-0132）為此紀律的首次實證

### ⚠️ 代價
- 每個外部依賴須先設計 port 介面（小幅前期成本）
- AI 寫 code 時容易直接 import SDK — 須靠 CI lint + code review 守紀律
- adapter 介面設計若沒抓對抽象，反而增加 boilerplate

### 🔮 未來影響
- Phase 2+ 評估 multi-cloud / 部分服務遷移時，可逐 port Strangler Fig（ADR-0113）
- 整體 lock-in 從 ~30%（無紀律 bundle B）壓到 5-8%（ADR-0114）

## Implementation

Phase 3（pre-Plan-2 rigorous foundation）2026-05-10 落地：

### 落地檔案

| 路徑 | 內容 |
|---|---|
| `src/adapters/README.md` | 5 條紀律 + Phase 1 status 表 + 例外清單（auth / messaging）|
| `src/adapters/storage/index.ts` | `StorageAdapter` port（對應 ADR-0006，concrete impl 於 Plan 5）|
| `src/adapters/queue/index.ts` | `QueueAdapter` port（無 Phase 1 consumer；防 ad-hoc 使用 `@vercel/queue`）|
| `src/adapters/cron/index.ts` | `CronAdapter` port（對應 ADR-0009，concrete impl 於 Plan 8）|
| `src/adapters/ai/index.ts` | `AIAdapter` port（對應 ADR-0022，concrete impl 於 Phase 3+）|
| `src/adapters/line/index.ts` | `LineAdapter` port（concrete impl 於 Plan 6）|
| `eslint-rules/no-platform-sdk-outside-adapter.mjs` | 自訂 ESLint rule，黑名單見下表 |
| `__tests__/__fixtures__/violation-platform-sdk-outside-adapter.tsx` | 紅隊 fixture，驗證 4 條 value-import 觸發 + 2 條 type-only import 不觸發 |

### 結構選型（folder per port）

每個 port 為獨立子目錄（`storage/`, `queue/`, …），`index.ts` 為 port interface；concrete impl 未來加入同目錄（如 `storage/DropboxAdapter.ts`）。理由：(1) 與 AWS Prescriptive Guidance Hexagonal pattern 與 Cockburn 社群實作指南對齊；(2) ESLint white-list 路徑用 `src/adapters/*/` 比 flat 單檔更精準；(3) Phase 5/6/8 加 concrete 時零重構成本。研究員分析：`docs/superpowers/research/2026-05-10-pre-plan-2-audit.md` 衍生討論 + 2026-05-10 session Q1。

### ESLint 黑名單

ESLint rule `rrms/no-platform-sdk-outside-adapter` 對 `src/adapters/` 以外的所有檔案禁止以下 import（type-only import 例外，types 編譯時消失，無 runtime lock-in）：

| 類型 | 套件 / pattern | 對應 port |
|---|---|---|
| 檔案儲存 | `dropbox` | `@/adapters/storage` |
| LINE | `@line/bot-sdk`, `@line/liff` | `@/adapters/line` |
| DB driver | `pg`, `postgres` | Drizzle (`@/db`，per ADR-0004) |
| Vercel 平台 | `@vercel/*`（除 `@vercel/og`、`@vercel/analytics`、`@vercel/config` 三個非平台耦合包） | 對應 port |
| 替代 auth lib | `next-auth`, `@auth/*`, `@clerk/*`, `lucia`, `@lucia-auth/*` | （見 Exceptions 段；應先開新 ADR）|

註：原 brainstorm 提到的 `@vercel/cron` 並無對應 npm 套件（Vercel Cron 是 `vercel.ts` 配置 + endpoint URL，非 SDK），已移除；`@vercel/queues`（複數）改為 `@vercel/queue`（單數，per 官方 npm 套件名）。研究員查證：2026-05-10 Q4 分析。

## Exceptions

並非每個外部依賴都需要再包一層 port — 以下兩類例外明文列出：

### Exception 1: Better Auth（無 `auth/` port）

Better Auth（per ADR-0132）自身即為 framework-agnostic abstraction（官方 framework page 列 Vue / Svelte / Astro / Solid / Nuxt / Remix / Express / Fastify 共用同一套 API；vendor-neutrality 為其 core value proposition）。在其上再包 thin wrapper 屬「false abstraction antipattern」（Mortoray）— wrapper API 與 Better Auth API 1:1，未來換 lib（Clerk / Lucia）時 wrapper 反而綁死，因換家時 auth 概念差異（hosted UI、JWT vs session token、organization model）大到 thin wrapper 抓不對。

**規則**：業務層直接 `import { auth } from '@/lib/auth'`；不另建 `src/adapters/auth/`。但 ESLint rule 仍黑名單 `next-auth` / `@auth/*` / `@clerk/*` / `lucia` / `@lucia-auth/*`，防止第二個 auth source 不經 ADR 直接被引入。若未來新增第二個 auth source（如企業 SSO），須先開新 ADR 評估是否引入 unified `AuthPort`。

研究員分析：2026-05-10 Q2。

### Exception 2: 不建廣義 `messaging/` port（每 channel 各自一 port）

LINE Messaging API 的 reply-token / Flex Message rich content / monthly push quota 模型與 Slack incoming webhook / SMS / Email 結構性差異過大：廣義 `MessagingPort` 必塌縮為「最小公分母」（純文字推送），LINE Flex Message 與 reply token 等核心能力反而要繞過 port。Phase 1 僅 LINE 一條通道（YAGNI）。

**規則**：每個 channel 各自一個 port — 本 Phase 落地 `src/adapters/line/`；Phase 4 加 Resend 時另開 `src/adapters/email/`，與 LINE 並列、各管各。**不**建 `src/adapters/messaging.ts`。Phase 7 LIFF 客戶查詢 UI 因屬 browser-side SDK，視 surface 大小決定併入 `line/liff.ts` 或獨立 `line-liff/`。

研究員分析：2026-05-10 Q3。

## References

- Hexagonal Architecture (Alistair Cockburn): https://alistair.cockburn.us/hexagonal-architecture/
- AWS Prescriptive Guidance — Hexagonal Architecture: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html
- Hexagonal Me — Project Structure Implementation Guide: https://jmgarridopaz.github.io/content/hexagonalarchitecture-ig/chapter2.html
- Mortoray — *The False Abstraction Antipattern*: https://mortoray.com/the-false-abstraction-antipattern/
- TheServerSide — *YAGNTI: You Aint Gonna Need That Interface*: https://www.theserverside.com/news/450304816/Fight-antipatterns-with-YAGNTI-You-aint-gonna-need-that-interface
- Better Auth — Framework-agnostic claim: https://www.better-auth.com/products/framework
- LINE Messaging API Overview: https://developers.line.biz/en/docs/messaging-api/overview/
- Slack Incoming Webhooks: https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/
- ESLint `no-restricted-imports`: https://eslint.org/docs/latest/rules/no-restricted-imports
- typescript-eslint `no-restricted-imports` (allowTypeImports): https://typescript-eslint.io/rules/no-restricted-imports/
- @vercel/queue (singular) npm: https://www.npmjs.com/package/@vercel/queue
- Brainstorm: `vendor-lockin-analysis.html`; `docker-vs-serverless.html`; `migration-and-ai-governance.html` 決議 F7
