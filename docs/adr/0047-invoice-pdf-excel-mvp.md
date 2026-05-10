# ADR 0047 — 發票流程 MVP = PDF + Excel；電子發票 API Phase 2

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B24 |
| Related ADR | ADR-0046, ADR-0048 |

## Context

藍新 / 綠界等電子發票 API 需要稅籍登記資料、API 串接、測試環境驗證、營業人申請等繁瑣流程。MVP 階段直接串會額外吃 1-2 週工期。會計手動匯入 Excel 是現有作業習慣，可立即上線。

## Decision

發票流程 MVP：

- 系統內產 **PDF 對帳單**（含明細、簽名、章戳）
- 同時產 **Excel** 給會計手動匯入會計系統
- **不串會計系統**（如鼎新、用友）
- **不串電子發票 API**（藍新 / 綠界）

Phase 2 加入電子發票 API 與會計系統 connector。

## Consequences

- ✅ Phase 1 上線快；會計適應原有流程
- ⚠️ 會計每月手動操作有錯誤風險（人為對帳）
- 🔮 Phase 2 schema 已含 `invoice_number`, `invoice_issued_at` 欄位，串 API 時不需大改

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
