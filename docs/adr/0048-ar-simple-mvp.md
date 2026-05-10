# ADR 0048 — 應收帳款 MVP 簡單版（入帳日 + 狀態三態）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B25 |
| Related ADR | ADR-0047 |

## Context

完整 AR（Accounts Receivable）系統含老帳分齡、信用額度、催收流程、自動沖銷，是專門 ERP 模組工作量。Phase 1 把這項做完 = 主軸延後。但完全不做 = 無法看到誰沒繳。

## Decision

AR 模組 MVP 簡單版：

- **欄位** — `received_at`（入帳日）+ `status`（'unpaid' / 'paid' / 'overdue'）+ `amount`
- **逾期判斷** — `due_date < now() AND status = 'unpaid'` 自動標 'overdue'（cron）
- **不做** — 分齡、信用額度、自動催收、沖銷拆分

## Consequences

- ✅ 結帳人員看得到誰沒繳，每月手動催收即可
- ⚠️ 無自動催收；客戶數規模化後人工負擔重
- 🔮 Phase 2 完整 AR 系統時本 ADR Superseded；schema 加 `aging_bucket`, `credit_limit` 欄位

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
