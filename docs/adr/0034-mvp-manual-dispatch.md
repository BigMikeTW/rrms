# ADR 0034 — MVP 派工方式為純人工派工

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-dispatch-technician.html`, `q7-deepdive.html` 決議 B11 |
| Related ADR | ADR-0035 |

## Context

AI 派工需要長期累積結構化資料（案件特徵、技師當時負載、結果耗時、滿意度）才有訓練基礎。Phase 1 沒有歷史資料，硬上 AI 等於規則式偽 AI。但派工儀表板若能呈現「誰有空 / 哪區 / 誰最近接過這棟」可大幅降低人工派工的認知負擔。

## Decision

MVP 派工方式 = **純人工派工**。後台儀表板提供決策參考資訊：

- 哪些技師當前案件數低 / 有空
- 哪些技師目前所在區域與案件位置相近
- 誰最近接過這棟大樓（隱性熟悉度）

**不**做自動派工 / 規則 routing / AI 派工。

## Consequences

- ✅ 派工人員對流程有完全掌控；可逐步累積資料給未來 AI（ADR-0035）
- ⚠️ 派工人員每筆案件需點擊指派
- 🔮 Phase 2/3 AI 派工接手（B11 後段、B12）

## References

- `docs/superpowers/brainstorm/q7-dispatch-technician.html`
