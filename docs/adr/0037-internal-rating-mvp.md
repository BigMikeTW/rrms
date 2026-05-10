# ADR 0037 — 評分機制提前到 MVP（內部 4 維度，業主與技師端不可見）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-rating-and-tech-debt.html` 決議 B14 |
| Related ADR | ADR-0035, ADR-0038, ADR-0061 |

## Context

評分若延後到 Phase 2 才上，現有資料無法事後補；但業主端 / 技師端公開評分會引發政治問題（外包不接低評分案、業主互比評分）。Phase 1 提前但**僅內部可見**是最佳折衷。

## Decision

評分機制提前到 MVP，但**僅內部後台可見**：

- **4 維度** — 速度 / 品質 / 態度 / 整潔，各 1-5 星
- **文字補充** — 自由文字
- **可見性** — 僅內部後台（派工 / 主管以上）；業主端、技師端**完全不可見**

由內部結案核可（A2，B20）人員填寫；非客戶端公開評分。

## Consequences

- ✅ 評分資料從 Day 1 累積；未做給客戶看故無政治壓力
- ⚠️ 內部評分標準需訓練一致性（避免主觀差異）
- 🔮 Phase 2 客戶端評分（ADR-0061/B38）開放時有歷史內部資料對照

## References

- `docs/superpowers/brainstorm/q7-rating-and-tech-debt.html`
