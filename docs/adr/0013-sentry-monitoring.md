# ADR 0013 — 監控採用 Sentry Free Plan（推薦, soft）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 A13 |
| Related ADR | — |

## Context

RRMS 需 error tracking / performance monitoring：候選 Sentry / Datadog / New Relic / Vercel Observability。Sentry Free Plan 提供 5K errors/月、1 user、30 天 retention，對 Phase 1 流量足夠。Datadog 太重（成本與複雜度）；Vercel Observability 內建但僅基本 metrics。Sentry SDK 與 Next.js / Vercel 有官方整合（auto source map upload、release tagging）。

## Decision

監控（推薦, **soft** — Phase 1 可選用、後續再評估）採用 **Sentry Free Plan**。整合 Next.js SDK（client + server）；errors 捕捉與 source map 自動上傳走 CI step。PII scrubbing 規則由 `sentry.client.config.ts` / `sentry.server.config.ts` 集中管理（避免違反 PDPA — `project_pdpa.md`）。

## Consequences

### ✅ 好處
- 免費起步、整合官方支援
- Source map 上傳讓 production 錯誤可讀
- Release tagging 與 Vercel deploy 自動關聯

### ⚠️ 代價
- 5K errors/月 對中型流量可能不夠 → 須升級或砍 noise
- ⚠️ **Soft 決議：Phase 1 可選，後續流量 / 預算明朗後可改 Datadog / Highlight / Vercel Observability**
- PII scrubbing 規則須持續維護（PDPA 風險）

### 🔮 未來影響
- 若改用 Datadog → SDK / config 全換；切換成本中等
- Sentry Performance / Replay 模組可後續開啟（但 Free Plan 配額會吃緊）

## References

- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry pricing: https://sentry.io/pricing/
