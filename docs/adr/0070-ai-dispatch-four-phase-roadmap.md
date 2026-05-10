# ADR 0070 — AI 派工 4 階段路線圖

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html` 決議 C7 |
| Related ADR | ADR-0065, ADR-0069, ADR-0071 |

## Context

AI 派工（自動把案件分派給最適合的技師）是 RRMS 長期願景。但 AI 模型若沒有結構化的歷史派工決策資料，根本無法訓練。Brainstorm `q7-deepdive` 拆出明確的 4 階段路線圖，本 ADR 鎖定階段定義；時程僅作 soft commitment。

## Decision

AI 派工演進採 4 階段路線圖：

| 階段 | 時點 | 內容 |
|---|---|---|
| ① | 0-6m（MVP） | **純人工派工** + 結構化記錄（每筆派工決策必含 features + 技師 + 結果） |
| ② | 6-12m | **規則建議**（Rule-based + LLM 解釋）— 系統建議候選技師，人工最終確認 |
| ③ | 12-24m | **半自動 ML 預測** — 模型主導，例外才人工 |
| ④ | 24m+ | **全自動 + 例外人工** |

階段定義（內容）為 hard 決議；時程為 soft（隨資料累積調整）。

## Consequences

- ✅ MVP 階段就以「未來能訓練 AI」為前提設計派工資料 schema（per ADR-0071 三道地基）
- ✅ 每階段都有明確 entry / exit 條件，避免「直接上 AI」的失敗模式
- ⚠️ 階段①必須執行得「乾淨」（結構化 features 完整），否則整條路線圖崩盤
- 🔮 **Soft commitment, scope/timing may shift** — 時程可能隨案件累積速度與 LLM 技術演進調整；階段順序與內容為 hard，不可跳階

## References

- `docs/superpowers/brainstorm/q7-deepdive.html`
- ADR-0065 — MVP 功能集（含「派工 = 純人工」）
- ADR-0069 — Phase 3 路線圖（ML 預測派工）
- ADR-0071 — AI 三道地基
