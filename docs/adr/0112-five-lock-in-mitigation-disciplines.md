# ADR 0112 — 5 條 lock-in 緩解紀律寫進 spec

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `vendor-lockin-analysis.html` 決議 F9 |
| Related ADR | ADR-0104, ADR-0110, ADR-0111, ADR-0113, ADR-0114 |

## Context

腦力激盪 `vendor-lockin-analysis.html` 整理出五條互補的紀律：單獨任一條不足以壓低 lock-in，必須同時實施。歷史經驗顯示 vendor lock-in 不是「上線那一刻決定的」，而是「後續每次新功能開發累積的」— 因此紀律必須寫進 spec，並由 PR / CI 流程強制執行，避免被個別 commit 偷渡破壞。

## Decision

以下 **5 條 lock-in 緩解紀律**寫入 spec 「Platform Dependencies」章節（ADR-0111）開頭，並由 `scripts/audit-docs.mjs` 檢核：

| # | 紀律 | 實作位置 |
|---|---|---|
| 1 | **Hexagonal 架構** — 業務層只 import port | `/adapters` 資料夾 + CI lint（ADR-0110） |
| 2 | **Adapter 介面用通用契約** — 不偷渡 Vercel-only 語意 | port 介面 review checklist |
| 3 | **避免直接 import Vercel 招牌新產品** — Edge Config、Workflow、Sandbox 等先評估替代 | spec 「Platform Dependencies」章節 + ADR 提案 |
| 4 | **定期 export 備份** — DB 每天 dump、Blob 每週同步、user 每月 export | cron job + 異地存放（出 Vercel） |
| 5 | **spec 中明確標示「平台依賴」** | spec「Platform Dependencies」章節（ADR-0111） |

## Consequences

### ✅ 好處
- 五條紀律互補，覆蓋設計層、實作層、運維層、文件層
- export 備份提供 last-resort 遷移路徑（即使 Vercel 突停服）
- 整體 lock-in 從 ~30%（無紀律）壓到 5-8%（ADR-0114）

### ⚠️ 代價
- 持續紀律成本：CI lint 設定、定期備份監控、新功能評估
- 紀律 4（定期備份）的儲存成本（異地 S3 / R2）

### 🔮 未來影響
- 紀律 4 的 export 在 Phase 2+ 升級為災難復原（DR）演練
- 紀律 3 形塑團隊文化 — Vercel 新產品引入須走 ADR 提案，不是直接拿來用

## References

- Brainstorm: `vendor-lockin-analysis.html` 決議 F9
- Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
- 12-Factor App (backing services): https://12factor.net/backing-services
