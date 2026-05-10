# ADR 0071 — AI 三道地基（MVP 必做）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-rating-and-tech-debt.html` 決議 C8 |
| Related ADR | ADR-0065, ADR-0067, ADR-0070 |

## Context

ADR-0070 把 AI 派工延到 6 個月之後，但若 MVP 階段沒打好「資料地基」，未來無論做規則引擎還是 ML 都會卡住。Brainstorm `q7-rating-and-tech-debt` 拆出 3 道**必在 MVP 做對**的地基；不論未來 AI 是否成功，這三道地基本身就是好系統的特徵。

## Decision

MVP 階段必須建立以下三道地基（hard 決議，無例外）：

1. **資料地基** — features 欄位完整 + 結構化派工決策
   - 每筆派工：技師選擇的 features（地點 / 技能 / 評分 / 過去合作 / 工時 / 距離）必須明確記錄
   - 派工結果（接 / 拒 / 完工 / 評分）回寫至同一筆紀錄
2. **Event Stream** — 業務邏輯先發 event，分析訂閱 event；**不直打 OLTP**
   - 派工決策、評分、結案等業務事件透過 event bus（Phase 1 可用 outbox + cron 過渡，Phase 2 接 Tinybird / 真 event broker）
   - 分析查詢不能直接 SELECT 主表，必須訂閱 event 流
3. **彈性 schema** — `jsonb` + catalog 表
   - 不可預測欄位（不同業主特殊欄位、設備類型 metadata）走 jsonb
   - 可枚舉的選項走 catalog 表（不要 enum 寫死在 DDL）

## Consequences

- ✅ Phase 2、Phase 3 啟用 AI / 動態費率時，地基已就位，不需「補資料」或「重建 pipeline」
- ✅ Event Stream 紀律對應 brainstorm D2 audit_log append-only 與 Hexagonal F-M2 紀律
- ⚠️ MVP 開發成本增加（需多寫 event 發送、jsonb schema 設計、catalog 表）
- 🔮 三道地基本身**不是 AI 功能**，但 AI 功能完全建立在此之上；任何 PR 違反此紀律 = 直接拒絕

## References

- `docs/superpowers/brainstorm/q7-rating-and-tech-debt.html`
- ADR-0065 — MVP 功能集
- ADR-0067 — schema 預留欄位
- ADR-0070 — AI 派工 4 階段路線圖
