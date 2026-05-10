# ADR 0049 — 客製查詢 = 6 固定報表 + 自訂篩選 + 我的報表儲存

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B26 |
| Related ADR | ADR-0050, ADR-0052 |

## Context

完全自訂報表 / 拖拉式 BI（C3 路線，B29）對 Phase 1 不適合：開發成本高、學習曲線高、業主大多用不到。但純固定報表又會被嫌「不夠彈性」。中間路線 = 6 個高頻場景固定模板 + 各自開放篩選 + 儲存常用組合。

## Decision

報表模組（C2 路線）：

**6 大標準報表**：

1. 案件清單
2. SLA 達成率
3. 費用統計
4. 技師績效（內部用，B14）
5. 設備故障熱點
6. 月度摘要

每張報表開放自訂篩選（時間區間、大樓、案件類型、技師等）；可儲存組合為**「我的報表」**（saved_report 表）。

## Consequences

- ✅ 90% 報表需求覆蓋；UI 簡單
- ⚠️ 特殊查詢需求需新開報表模板
- 🔮 C3 完全自訂留給 Enterprise tier（B29 / ADR-0052）

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
