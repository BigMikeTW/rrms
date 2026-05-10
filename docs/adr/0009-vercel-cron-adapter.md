# ADR 0009 — Cron 排程採用 Vercel Cron Jobs，透過 cron adapter 抽象包裝

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `migration-and-ai-governance.html` 決議 A9 |
| Related ADR | ADR-0002, ADR-0006 |

## Context

RRMS 排程需求：(a) 案件 SLA 逾期檢查；(b) 月報自動生成；(c) Audit log 歸檔；(d) 過期 attachment 清理；(e) 健康檢查 ping。Vercel Cron Jobs 直接以 `vercel.json` 宣告 + endpoint URL，無額外基礎設施。但屬 Vercel-specific —  須以 adapter 包裝以保未來退路。

## Decision

Phase 1 採用 **Vercel Cron Jobs** 排程；schedule 與 endpoint 對應於 `vercel.json` `crons` 陣列。Cron handler 統一走 `lib/cron/cron-adapter.ts` 介面（`registerJob(name, schedule, handler)`），實際 endpoint 為 `/api/cron/[name]/route.ts`，以 `CRON_SECRET` 環境變數做 Bearer token 驗證（防外部誤觸）。未來若離開 Vercel → 可切換到 GitHub Actions cron 或 self-host 的 node-cron / Temporal。

## Consequences

### ✅ 好處
- Phase 1 零額外基礎設施成本
- Adapter 層讓未來換 cron 平台只需重實作 adapter
- `CRON_SECRET` 驗證確保 endpoint 不被外部濫用

### ⚠️ 代價
- Vercel Cron 最小頻率 = 1 分鐘；不支援秒級
- Pro Plan cron job 數量上限（須監控）

### 🔮 未來影響
- 若需更精細排程（second-level、distributed lock）→ 走 Temporal / Inngest

## References

- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
