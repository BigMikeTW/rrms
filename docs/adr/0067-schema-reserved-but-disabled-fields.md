# ADR 0067 — MVP schema 預留但不啟用的欄位

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html` 決議 C4 |
| Related ADR | ADR-0066, ADR-0069 |

## Context

部分功能（動態費率、合約模板、技師費率歷史）MVP 不做（per ADR-0066），但若 schema 完全不預留，Phase 2 啟用時會遭遇大規模 migration 與資料回填困難。Brainstorm `contract-and-dynamic-rate` 與 `q7-rating-and-tech-debt`（AI 三道地基 — 彈性 schema）一致建議：MVP 階段 schema 先放欄位，僅 UI / 邏輯不啟用。

## Decision

MVP schema **預留但不啟用**以下欄位 / 表（程式不寫入、UI 不顯示，但 DDL 已建立）：

1. `technician_rate_history`（技師費率歷史表）
2. `rate_adjustment_factor`（加成因子欄位）
3. `contract_template`（合約模板表）
4. `contract_instance`（合約實例表）
5. 合約相關欄位：`rate`、`validity`（生效起迄）、`regions`（適用區域）、`services`（適用服務類別）、`hours`（適用時段）

## Consequences

- ✅ Phase 2 啟用動態費率與合約自動化時，免大規模 schema migration
- ✅ 對應 AI 三道地基「彈性 schema（jsonb + catalog）」紀律（ADR-0071）
- ⚠️ MVP 開發者需了解「這些欄位存在但目前無人寫入」— 透過 4W 註解 + DB constraint（NOT NULL DEFAULT 或 nullable）防誤用
- 🔮 Phase 2 啟用時，由 ADR-0068 對應決議引用本 ADR，作為「欄位早已預留」的根據

## References

- `docs/superpowers/brainstorm/contract-and-dynamic-rate.html`
- ADR-0066 — MVP 排除清單
- ADR-0069 — Phase 3 動態費率引擎
- ADR-0071 — AI 三道地基
