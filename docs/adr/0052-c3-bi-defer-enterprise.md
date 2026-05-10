# ADR 0052 — C3 完全自訂報表 / BI 留給 Enterprise tier

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B29 (soft) |
| Related ADR | ADR-0049 |

## Context

完全自訂報表（拖拉欄位、SQL builder、Pivot Table）= 商業 BI 工具（Metabase、Superset）等級工程量。Phase 1 業主用不到；少數 Enterprise tier 客戶才會要求。

## Decision

C3（完全自訂報表 / BI 工具）**延後到 Phase 2 / 3**，且**僅開放 Enterprise tier**訂閱。Phase 1 / 2 一般業主走 C2 路線（B26 / ADR-0049）。

## Consequences

- ✅ Phase 1 工期不被吃；Enterprise 定價有差異化籌碼
- ⚠️ 想要完全自訂的客戶 Phase 1/2 需自行匯出 Excel
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1（可能直接接 Metabase 而非自建）

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
