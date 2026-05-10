# ADR 0061 — Phase 2 擴充：客戶端評分 + 低評分自動 review + 工資分級

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-rating-and-tech-debt.html` 決議 B38 (soft) |
| Related ADR | ADR-0037, ADR-0038 |

## Context

Phase 1 內部評分（B14）累積一段時間後，Phase 2 才有基礎開放客戶端評分（樓管 / 總務）並建立工資分級機制（B15 已先簽合約預告）。直接 Phase 1 推 = 政治壓力 + 資料不足無法分級。

## Decision

Phase 2 擴充項目：

- **客戶端評分** — 樓管 / 總務於案件 Closed 後可選 1-5 星 + 文字
- **低評分自動 review** — < 3 星案件自動進派工主管儀表板審視
- **工資分級** — 評分平均對應工資係數（B15 合約已預告）

Phase 1 schema 中 `rating` 表已含 `rater_role`, `is_visible_to_customer` 等欄位以利 Phase 2 開啟。

## Consequences

- ✅ Phase 1 累積資料；Phase 2 開放時有 baseline
- ⚠️ Phase 2 開啟前需訓練樓管 / 總務評分一致性
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1

## References

- `docs/superpowers/brainstorm/q7-rating-and-tech-debt.html`
