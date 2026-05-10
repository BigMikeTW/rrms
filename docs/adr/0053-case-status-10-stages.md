# ADR 0053 — 案件狀態 10 階段機

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-two-stage-closure.html` 決議 B30 |
| Related ADR | ADR-0036, ADR-0054 |

## Context

維保案件並非「open / closed」二元。派工結案（技師完工）與帳務結案（對帳收款）是**兩個不同里程碑**，且中間需簽核緩衝。若狀態機過簡，無法呈現「技師做完了但還沒收錢」這種常見情形。

## Decision

案件狀態 = **10 階段**：

| # | 狀態 | 說明 |
|---|---|---|
| 1 | Open | 報修建立 |
| 2 | Assigned | 已派工 |
| 3 | In Progress | 技師處理中 |
| 4 | Pending Review | 技師回報完，待 A2 內部結案 |
| 5 | Resolved | 派工結案（不含費用，B31） |
| 6 | Pending Billing | 等待結帳週期到（B23） |
| 7 | Billed | 對帳單已出 |
| 8 | Closed | 完整結案（含對帳收款） |
| 9 | Cancelled | 案件取消 |
| 10 | Reopened | 重啟（B35） |

狀態轉換受 RBAC 與必填欄位（B13）拘束，存於 `case_status_history` append-only 表。

## Consequences

- ✅ 真實業務流程完整呈現；報表 / 報告各自對應正確里程碑
- ⚠️ 10 階段對 UI 設計挑戰（需良好標籤色彩體系）
- 🔮 業務線 1、3 套用同一狀態機

## References

- `docs/superpowers/brainstorm/q8-two-stage-closure.html`
