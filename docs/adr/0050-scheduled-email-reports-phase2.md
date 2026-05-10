# ADR 0050 — 排程 email 報表延後 Phase 2

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B27 (soft) |
| Related ADR | ADR-0049 |

## Context

「每月自動寄報表給業主」需要 cron + email 模板 + 失敗重試 + 退信處理 + 取消訂閱機制；功能小但邊界多。Phase 1 業主可手動下載即可。

## Decision

排程 email 報表延後 **Phase 2**。Phase 1 業主透過後台手動匯出 PDF / Excel。

## Consequences

- ✅ Phase 1 工期收斂
- ⚠️ 業主每月需主動下載
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1（`saved_report` 表已預留 `schedule_cron`, `email_recipients` 欄位但 Phase 1 不啟用）

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
