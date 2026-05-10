# ADR 0039 — 外包技師月度對帳進 MVP；技師僅看自己；業主完全看不到

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-final-technician-statement.html` 決議 B16 |
| Related ADR | ADR-0029, ADR-0040 |

## Context

外包技師最關心當月做了多少、領多少。若這項在 Phase 1 沒提供，技師仍需問人工，等於沒上系統。但對帳資料 = 我方 P&L 機密，業主絕不能看到（會推算我方利潤）。

## Decision

技師端月度對帳功能進 MVP：

- **技師可見** — 自己當月完成案件數 + 累積金額 + 明細列表
- **跨技師** — 不可見（只看自己）
- **業主端** — 完全不可見（P&L 機密）
- **內部後台** — 全部可見（派工 / 結帳人員）

走 RBAC + row-level filter（ADR-0089）。

## Consequences

- ✅ 技師留任率提升；對帳爭議下降；P&L 機密保留
- ⚠️ RBAC filter 必須測試完整（業主誤看到 = 重大事故）
- 🔮 Phase 2 加入工資分級（B38）後此頁同步顯示

## References

- `docs/superpowers/brainstorm/q7-final-technician-statement.html`
