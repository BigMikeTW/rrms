# ADR 0022 — 未來 AI 整合走 ai-adapter 抽象（可切 Vercel AI SDK / Anthropic / OpenAI）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `migration-and-ai-governance.html` 決議 A22 |
| Related ADR | ADR-0006, ADR-0009 |

## Context

RRMS Phase 3+ 規劃 AI 派工 / AI 自動分類 / AI 客服等功能。AI provider 候選：(a) Vercel AI SDK — 整合 Vercel 平台、provider-agnostic、streaming 支援好；(b) Anthropic SDK 直連 — Claude 為主時最直接；(c) OpenAI SDK — GPT 為主時；(d) Vercel AI Gateway — 跨 provider 路由、failover、cost tracking。AI 領域演進極快（model / pricing / API 半年大變一次）— **絕對不能在 application code 直接 import vendor SDK**，否則換 provider = 大重構。

## Decision

所有 AI 呼叫走 **`lib/ai/ai-adapter.ts` 抽象介面**（`generateText`, `streamText`, `generateObject` 等），背後可切換 implementation：(i) Vercel AI SDK（預設）；(ii) Anthropic SDK 直連；(iii) OpenAI SDK 直連；(iv) Vercel AI Gateway。**禁止 application code 直接 import `@anthropic-ai/sdk` / `openai` / `ai`**（Phase 1 尚無 AI 功能 → 此 ADR 為**前瞻型**，待 Phase 3 啟用 AI 時生效；但 Phase 1 任何 spike / experiment 也守此紀律）。

## Consequences

### ✅ 好處
- AI provider 換手 / 同時跑多 provider A/B test 都不動主程式
- 集中管理 prompt / cost / latency / PII scrubbing（PDPA — `project_pdpa.md`）
- 與 storage adapter（ADR-0006）/ cron adapter（ADR-0009）一致的 hexagonal 思想

### ⚠️ 代價
- Adapter 層多一層抽象；spike 時要忍住直連衝動
- 須持續跟進各 SDK 演進、定期更新 adapter implementation

### 🔮 未來影響
- Phase 3 AI 派工 / 自動分類落地時直接消費 adapter，不重構
- 若引入多 model orchestration / agent workflow（如 Vercel Workflow DevKit）— 也走 adapter 之上的 layer

## References

- Vercel AI SDK: https://sdk.vercel.ai
- Vercel AI Gateway: https://vercel.com/docs/ai-gateway
- Anthropic SDK: https://docs.anthropic.com/en/api/client-sdks
