# ADR 0054 — 兩種 PDF 報告對應 Resolved / Closed 兩個里程碑

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-two-stage-closure.html` 決議 B31 |
| Related ADR | ADR-0053, ADR-0055, ADR-0058 |

## Context

業主 / 樓管在「Resolved」就想拿到「修好了的證明」（給住戶交差），但**這時還沒對帳**，不能含費用否則洩漏 P&L。對帳完才出含費用對帳單。一張 PDF 兩用 = 兩邊都不滿意。

## Decision

兩種 PDF 報告對應兩個里程碑：

| 報告 | 觸發里程碑 | 內容 | 給誰 |
|---|---|---|---|
| **派工結案報告** | Resolved | 不含費用；含三段照片、簽名、工時、故障原因 | 業主 / 樓管 |
| **完整結案報告 / 對帳單** | Closed | 含費用 + 對帳 | 業主結帳窗口 |

兩者皆走 immutable snapshot（ADR-0056 / B33）；皆可從客戶端後台或內部後台產生（ADR-0055 / B32）。

## Consequences

- ✅ 兩個場景需求各自被滿足；P&L 機密保護
- ⚠️ PDF 模板需維護兩套
- 🔮 Phase 2 對帳單可附派工結案報告為附件（B34 / ADR-0057）

## References

- `docs/superpowers/brainstorm/q8-two-stage-closure.html`
