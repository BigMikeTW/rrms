# ADR 0032 — 技師端 UI 零訓練 / 零安裝

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html` 決議 B9 |
| Related ADR | ADR-0030, ADR-0033 |

## Context

外包技師流動率高（B7），且每位外包技師同時為多家服務商工作，已被多套不同系統「強制安裝」。若 RRMS 也要求安裝專屬 App + 訓練，外包接案意願大幅下降。

## Decision

技師端 UI 為**強需求 = 零訓練、零安裝**：

- 進入路徑只有 LINE 推播 → 點連結 → 進工單頁
- 不要求 App Store / Play Store 安裝
- 不舉辦訓練（UI 必須直觀到不需訓練）

任何違反此原則的需求（例如要求技師主動打開 App、登入、改密碼）都必須先重新檢視。

## Consequences

- ✅ 外包技師接受度最高；流失率影響系統最小
- ⚠️ 限制了部分原生 App 功能（推播深度、後台 GPS）— 用 PWA 折衷（ADR-0033）
- 🔮 若未來改為內部技師為主，可放寬此限制

## References

- `docs/superpowers/brainstorm/q7-deepdive.html`
