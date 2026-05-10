# ADR 0069 — 第三階段啟用功能路線圖

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html`, `contract-and-dynamic-rate.html` 決議 C6 |
| Related ADR | ADR-0067, ADR-0068, ADR-0070, ADR-0071 |

## Context

Phase 3 對應 AI 派工與動態定價的成熟階段，需要 Phase 1 + Phase 2 累積足夠的結構化案件資料（brainstorm `q7-deepdive` 估算 5000+ 案件）才能訓練 ML 模型與定義動態費率規則。本 ADR 鎖定 Phase 3 啟用清單。

## Decision

Phase 3 啟用以下功能：

1. **動態費率引擎（rule engine）** — 用 Phase 2 累積的合約 / 加成因子資料驅動
2. **ML 預測派工** — 需 5000+ 案件後（per ADR-0070 第③階段）
3. **預測性維護** — 用維修頻率推估設備壽命
4. **業主自然語言查詢**（LLM-on-data）
5. **跨案件趨勢洞察**（同型故障在不同樓的分布）
6. **線上考核 / 內稽考試系統**

## Consequences

- ✅ AI / ML 功能延後到資料量足夠後再啟用，避免「無資料硬上 AI」的失敗模式
- ⚠️ Phase 3 啟用前的「資料地基 + Event Stream」紀律（ADR-0071）必須在 MVP 就做對，否則 Phase 3 訓練資料品質不足
- 🔮 **Soft commitment, scope/timing may shift** — 啟用時點依案件累積速度；若 Phase 1 + Phase 2 合計 18 個月仍未達 5000 案件，ML 階段可能延後或改規則引擎

## References

- `docs/superpowers/brainstorm/q7-deepdive.html`
- `docs/superpowers/brainstorm/contract-and-dynamic-rate.html`
- ADR-0067 — schema 預留欄位
- ADR-0068 — Phase 2 路線圖
- ADR-0070 — AI 派工 4 階段路線圖
- ADR-0071 — AI 三道地基
