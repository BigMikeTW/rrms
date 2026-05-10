# ADR 0041 — 費率每筆獨立 UUID + Type 2 SCD versioning

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `rate-card-design.html` 決議 B18 |
| Related ADR | ADR-0040, ADR-0042 |

## Context

費率調整無可避免（市場價變動、合約週年調整）。若直接 UPDATE 同一列 → 過去案件的費率記錄被覆蓋，B19 結案金額快照沒法回溯，且符合勞動爭議 / 稅務查核的審計需求。

## Decision

費率採 **Type 2 SCD（Slowly Changing Dimension）versioning**：

- 每筆費率 = 獨立 UUID（永不重用）
- 修改費率 → **新增一列**（新 UUID + 新 effective_from），舊列標 `archived = true` 並寫 `effective_to`
- 查詢「現行費率」= `WHERE archived = false AND effective_from <= now() <= COALESCE(effective_to, 'infinity')`

`compensation_rate_card` 表為 append-only（與 audit_log D2 同精神）。

## Consequences

- ✅ 任意時點皆可重建當時費率快照；B19 結案快照有 stable reference
- ⚠️ 表會增長（但每年費率調整次數有限，PG 完全吃得下）
- 🔮 動態費率（B40）的調整因子表可沿用同一 SCD2 模型

## References

- Kimball, "The Data Warehouse Toolkit" — Type 2 SCD
