# ADR 0035 — 派工模組結構化記錄派工決策（為未來 AI 訓練）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html` 決議 B12 |
| Related ADR | ADR-0034 |

## Context

Phase 1 是純人工派工（B11），但 Phase 2/3 要做 AI 派工。如果 Phase 1 不主動結構化記錄派工決策，到了 Phase 2 才回頭想抓資料 = 都是非結構文字，無法訓練。事先設計 schema 等於零成本未來投資。

## Decision

派工模組必須**結構化記錄**每筆派工決策：

| 欄位 | 說明 |
|---|---|
| dispatched_at | 指派時間 |
| case_features | 案件特徵（類型、急迫度、設備） |
| technician_load_at_dispatch | 技師當時負載（待處理案件數） |
| dispatch_reason | 選擇此技師的理由（結構化選單 + 文字） |
| resolved_duration | 結果耗時 |
| customer_satisfaction | 案件滿意度（B14 評分） |

存於 `dispatch_decision_log` 表（append-only，與 audit_log D2 同精神）。

## Consequences

- ✅ Phase 2/3 AI 派工有現成資料集
- ⚠️ 派工人員多輸入幾個欄位（用結構化選單降低摩擦）
- 🔮 與 B14 評分、B16 月度對帳資料合併可產出技師完整 profile

## References

- `docs/superpowers/brainstorm/q7-deepdive.html`
