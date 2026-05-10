# ADR 0045 — MVP 單關簽核；多關簽核延後 Phase 2

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B22 (soft) |
| Related ADR | ADR-0043 |

## Context

多關簽核（例如 A3 費用核可需先過一關副主管再到主管）會引入工作流引擎需求；但 3-4 人團隊（B8）在 Phase 1 用單關即可滿足。等規模擴張再補。

## Decision

MVP 簽核結構為**單關**：

- 每個簽核點（A1-A4）只需一人簽核即可進入下一狀態
- 簽核人由 RBAC 角色決定（派工主管以上等）

`approval` 表設計時保留 `step_index` 欄位（int 預設 1），未來擴充多關時不需 schema 變更。

## Consequences

- ✅ Phase 1 簡單可用；schema 已為多關預留
- ⚠️ 高風險操作 Phase 1 無雙人覆核（補強：可在 A3 加可選二人簽）
- 🔮 Phase 2/3 多關簽核：本 ADR Status 改為 Superseded by 新 ADR；schema 預留欄位避免 breaking change

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
