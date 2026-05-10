# ADR 0063 — Phase 3 擴充：動態費率（schema 預留 / 不啟用）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html` 決議 B40 (hard schema / soft 時程) |
| Related ADR | ADR-0041, ADR-0042 |

## Context

工資不只是「基本費率 × 數量」。實務上有夜間加成、急單加成、技師熟練度加成、區域偏遠加成、合約特殊加成等。MVP 全套上線會吃工期且初期數據不足無法調校；但若 schema 不預留 → Phase 3 開啟時要全表重建。

## Decision

動態費率 = `base × (1 + Σ adjustments)` 模型：

- **schema 預留**（Phase 1 必建）：
  - `technician_rate_history`（與 B18 同 SCD2）
  - `rate_adjustment_factor`（夜間、急單、區域、熟練度等加成因子定義）
  - `case.applied_adjustments` JSONB（結案快照含套用的加成鏈，與 B19 一致）
- **規則引擎與 UI**：**Phase 3 才實作**
- **Phase 1 / 2** 結案 `applied_adjustments` 一律存空陣列 `[]`，金額 = base × quantity

## Consequences

- ✅ Phase 3 開啟動態費率時 zero schema migration；歷史資料不需 backfill
- ⚠️ Phase 1 多建幾個空表 / 欄位（成本極低）
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1（schema 預留為 hard 決議；時程開啟為 Phase 3 soft）

## References

- `docs/superpowers/brainstorm/contract-and-dynamic-rate.html`
