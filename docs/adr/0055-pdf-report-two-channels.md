# ADR 0055 — PDF 結案報告兩種生成管道（自助下載 + 內部生成）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-pdf-report.html` 決議 B32 |
| Related ADR | ADR-0054 |

## Context

業主 / 樓管常常臨時要報告（住戶問），不能每次都求助內部員工。但內部員工有時要主動寄報告（隨對帳單寄送）並留 audit trail。兩個管道都需要。

## Decision

PDF 結案報告兩個生成管道（皆 MVP）：

- **(a) 客戶端自助** — 業主 / 樓管後台按鈕即時產生並下載；不需內部介入
- **(b) 內部產出** — 後台員工產生並寄送業主，含**寄送紀錄**（誰寄、何時、寄到哪）存於 `case_report_dispatch_log`

兩個管道皆走 immutable snapshot（B33），所以不會因為產生點不同而導致內容不一致。

## Consequences

- ✅ 業主自助大幅降低內部支援負擔；audit trail 維持
- ⚠️ 客戶端 UI 與內部後台 UI 都需相同 PDF 生成入口
- 🔮 Phase 2 排程 email（B27 / ADR-0050）= 第三個自動化管道

## References

- `docs/superpowers/brainstorm/q8-pdf-report.html`
