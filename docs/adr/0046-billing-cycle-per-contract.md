# ADR 0046 — 結帳週期每個合約 / owner 自訂

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B23 |
| Related ADR | ADR-0026, ADR-0042 |

## Context

不同 owner（業主）有不同會計慣例：大集團要月結、中型物業常季結、小型業主想案結即收。若全系統強制統一週期，會導致無法成交。

## Decision

每張合約獨立設定結帳週期：

```sql
contract.billing_cycle  ENUM('monthly', 'quarterly', 'per_case')
contract.cycle_anchor_day  INT  -- 月初/季初/契約日
```

結帳引擎（cron job）依此欄位決定何時對該 owner 跑出帳：

- `monthly` — 每月 cycle_anchor_day 跑
- `quarterly` — 每季首月 cycle_anchor_day
- `per_case` — 每案結案後立即觸發

## Consequences

- ✅ 銷售彈性最大；同一系統服務多種會計慣例
- ⚠️ Cron 邏輯需測試三種週期皆正確
- 🔮 業務線 1（原廠）與 3（零售）可能新增其他週期型態

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
