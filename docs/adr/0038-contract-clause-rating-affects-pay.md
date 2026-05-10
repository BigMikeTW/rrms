# ADR 0038 — 外包合約須明示評分影響工資（法務合規）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-rating-and-tech-debt.html` 決議 B15 |
| Related ADR | ADR-0037 |

## Context

B14 內部評分若用於工資調整（Phase 2 ADR-0061/B38），事後告知會被勞工法視為突然變更給付條件。事前在合約寫清楚 = 雙方有意思表示合意，符合民法 153 與勞基法相關規範。

## Decision

外包技師合約模板必須包含條款：

> 乙方（技師）同意甲方（服務商）對其服務品質進行多維度評分，評分結果作為甲方調整工資 / 派工優先權之依據。

合約模板由內部法務審閱定稿；技師上線前簽署生效。

## Consequences

- ✅ 工資調整有合約依據；勞動爭議風險低
- ⚠️ 部分技師可能因此條款拒絕簽約 — 但與其他平台慣例相符
- 🔮 ADR-0062/B39 onboarding 自動化（DocuSign 等）後合約簽署可數位化

## References

- 民法 153 條（契約合意成立）
- 勞動基準法工資定義
