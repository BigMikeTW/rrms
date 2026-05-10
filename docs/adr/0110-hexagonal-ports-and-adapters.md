# ADR 0110 — Hexagonal / Ports-and-Adapters 為強制紀律：所有外部依賴包在 /adapters

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `vendor-lockin-analysis.html`, `docker-vs-serverless.html`, `migration-and-ai-governance.html` 決議 F7 |
| Related ADR | ADR-0006, ADR-0009, ADR-0104, ADR-0111, ADR-0112, ADR-0113 |

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

## References

- Hexagonal Architecture (Alistair Cockburn): https://alistair.cockburn.us/hexagonal-architecture/
- Brainstorm: `vendor-lockin-analysis.html`; `docker-vs-serverless.html`; `migration-and-ai-governance.html` 決議 F7
