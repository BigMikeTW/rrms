# ADR 0026 — 雙軌結帳：合約內向原廠 / 合約外向終端客戶

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `business-scope.html`, `users-and-painpoint.html` 決議 B3 |
| Related ADR | ADR-0025, ADR-0046 |

## Context

業務線 2 的合約案件向業主（終端客戶）請款；但同一棟大樓內，合約範圍**外**的零星修繕（例如住戶自費、設備升級）依然由我方執行。若統一向同一對象請款，會與合約付款方混淆並導致對帳困難。

## Decision

**雙軌結帳**：

- **合約內案件** → 跟業主（依 contract 設定）請款
- **合約外零星案件** → 直接跟終端使用者（住戶/管委會自費單位）請款

case 表必須記錄 `billing_target` 與對應的 `contract_id`（合約內）或 `ad_hoc_payer_id`（合約外）。

## Consequences

- ✅ 對帳清晰，原廠 / 業主 / 自費三方資金流分離
- ⚠️ UI 與 RBAC 需區分「合約內」「合約外」兩種案件建立流程
- 🔮 報表（B26）需支援按 billing_target 切分

## References

- `docs/superpowers/brainstorm/business-scope.html`
- `docs/superpowers/brainstorm/users-and-painpoint.html`
