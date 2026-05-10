# ADR 0080 — node_type 刪除三道護欄

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` § D 決議 D6 |
| Related ADR | ADR-0079 |

## Context

node_type（節點類型，如「公司」「部門」「機房」）是 RRMS 結構基石；若被誤刪，所有引用該 type 的節點將孤兒化。需區分「系統內建」與「用戶自訂」並加多層阻擋。

## Decision

node_type 採三道刪除護欄：

1. **軟刪除**：所有刪除動作只設 `deleted_at`，不真正 DELETE
2. **強制阻擋有 reference 的硬刪**：DB 層 trigger 檢查 `nodes.node_type_id` 是否仍有引用；有引用 → reject
3. **system / custom 分類**：
   - `is_system = true`：內建型別（公司、部門、樓層、房間、設備）— 不可刪，只可改名
   - `is_system = false`：用戶自訂型別 — 可軟刪（無引用時）

刪除動作均寫入 audit_log 含 `reason_code`。

## Consequences

### ✅ 好處
- 三層獨立防禦，單層失誤不會導致資料災難
- system type 維持系統 invariant，跨租戶報表可信
- 對齊 ISO 27001 A.8.15 變更紀錄與防誤操作原則

### ⚠️ 代價
- DB trigger 增加寫入延遲（~1-2 ms/row，可接受）
- 需在 seed 階段標好 system flag

### 🔮 未來影響
- 多租戶啟用時，custom type 屬於各租戶；system type 全平台共用
- Phase 2 可加 type 版本（schema migration），rename 也走版本軌跡

## References

- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- PostgreSQL Triggers: https://www.postgresql.org/docs/current/triggers.html
- Defense in Depth (NIST): https://csrc.nist.gov/glossary/term/defense_in_depth
