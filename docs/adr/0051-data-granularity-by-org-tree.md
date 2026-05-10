# ADR 0051 — 業主資料粒度依組織樹層級自動決定

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B28 |
| Related ADR | ADR-0027, ADR-0089 |

## Context

樓管只負責一棟，看到所有大樓會洩漏其他客戶資料；物業 PM 負責整個 owner 旗下所有大樓，若每次切換要選大樓會降低效率。最佳做法是「使用者在組織樹的位置」自動決定可見範圍。

## Decision

業主端使用者的資料可見範圍由**組織樹層級**自動決定：

- **樓管**（在 building 節點下）→ 只看自己大樓
- **物業 PM**（在 owner 節點下）→ 看整個 owner 旗下所有大樓

實作方式：使用 PostgreSQL ltree（A17）+ row-level filter（ADR-0089 RBAC），查詢時自動 `WHERE building_path <@ user_scope_path`。

## Consequences

- ✅ 使用者無需手動切換 scope；資料安全自動套用
- ⚠️ ltree path 維護需正確（建大樓 / 移轉 owner 時 path 要 cascade）
- 🔮 多租戶（A17）擴張時此模型同樣適用

## References

- PostgreSQL ltree: https://www.postgresql.org/docs/current/ltree.html
