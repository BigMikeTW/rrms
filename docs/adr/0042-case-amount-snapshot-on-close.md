# ADR 0042 — 案件結案金額快照（rate_card_id + amount_snapshot）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `rate-card-design.html` 決議 B19 |
| Related ADR | ADR-0041, ADR-0046 |

## Context

即使費率 SCD2（B18）保留歷史版本，若 case 表只存 `rate_card_id` 而不存當時計算金額，未來查詢仍要 JOIN + recompute。一旦 schema 變動或計算邏輯改了，舊案的金額會「漂移」。法遵硬要求結案金額**永不變動**。

## Decision

案件結案時做雙重快照：

```sql
case.rate_card_id        UUID NOT NULL  -- reference (SCD2 版本)
case.amount_snapshot     NUMERIC NOT NULL  -- 當時計算結果，永不更新
case.amount_calculated_at TIMESTAMPTZ NOT NULL
```

即使 `compensation_rate_card` 表壞了 / 費率改了 / 計算邏輯改了，每張結案工單仍知**當時金額**。對帳單與報告皆讀 `amount_snapshot` 而非 recompute。

## Consequences

- ✅ 法遵硬要求滿足；對帳爭議鎖定；資料不可被無聲改變
- ⚠️ 若費率有 bug（例如算錯）需新開「沖正單」而非直接修改快照
- 🔮 Phase 2 動態費率（B40）的快照需擴充 adjustment chain JSON

## References

- `docs/superpowers/brainstorm/rate-card-design.html`
