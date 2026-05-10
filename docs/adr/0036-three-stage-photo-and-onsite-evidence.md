# ADR 0036 — 工單回報必要欄位：三段式拍照 + GPS + 簽名 + 工時 + 故障原因

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-final-technician-statement.html` 決議 B13 |
| Related ADR | ADR-0042 |

## Context

派工結案報告（B31）與對帳單（B34）皆以工單回報資料為依據。若資料品質低（無時間戳照片、無到場證明、無客戶確認），對帳爭議無法收斂、保險理賠無依據、B14 評分也缺乏客觀基礎。

## Decision

工單回報 MVP 必要欄位：

1. **三段式拍照** — 到場前 / 維修中 / 完工後（各至少 1 張）
2. **GPS 到場簽到** — 技師抵達時自動取座標
3. **客戶現場簽名** — HTML5 canvas（A1 簽核點，B20）
4. **工時** — 開工 / 結束時間戳
5. **故障原因** — 結構化選單（給 AI 訓練資料）+ 文字補充

任一缺漏 = 無法切 case 狀態到 Pending Review（ADR-0053）。

## Consequences

- ✅ 對帳爭議低、評分有依據、AI 訓練資料完整
- ⚠️ 技師端摩擦增加（3 張照片 + 簽名）— 用 PWA 離線快取緩解（ADR-0033）
- 🔮 結構化故障原因可累積為設備故障熱點報表（B26 之一）

## References

- `docs/superpowers/brainstorm/q7-final-technician-statement.html`
