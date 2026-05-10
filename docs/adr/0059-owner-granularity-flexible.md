# ADR 0059 — 業主（owner）粒度由建立時自由決定（集團/公司/簽約方皆可）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `location-and-coverage-v2.html` 決議 B36 |
| Related ADR | ADR-0051 |

## Context

實務「業主」可能是：集團（一個母公司管 30 棟）、單一公司、單一大樓所有權人、單一簽合約自然人。若強制以某一層為粒度，不同型態客戶就要 schema 變形 / 多帳號重複建。

## Decision

`owner` 表的**粒度由內部員工建立時自由決定**：可以是集團、公司、單一大樓所有權人、簽約方等任一層次。技術上：

- `owner` = ltree 的根節點之一
- `building` = owner 的子節點
- 一個 owner 可有 1 棟到 N 棟大樓
- 集團型 owner 也可在其下再分子 owner（多層 ltree）

## Consequences

- ✅ 銷售與導入時不被 schema 限制；任何客戶結構皆可建模
- ⚠️ 內部員工建立 owner 時需一致性訓練（避免同一集團被多次建）
- 🔮 多租戶（A17）擴張延用同一彈性

## References

- `docs/superpowers/brainstorm/location-and-coverage-v2.html`
