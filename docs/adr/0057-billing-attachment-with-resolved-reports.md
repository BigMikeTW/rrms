# ADR 0057 — 對帳單可附區間派工結案報告（請款憑證）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-billing-attachment.html` 決議 B34 |
| Related ADR | ADR-0054, ADR-0056 |

## Context

業主結帳人員拿到對帳單時，常需要回查每筆案件的派工結案報告作為核對依據。若只給對帳單沒附明細，業主每筆都來信要報告，內部員工負擔大。

## Decision

結帳人員產對帳單時可勾選將區間內**派工結案報告**作為附件：

- 對帳單 + 附件**一旦生成皆 immutable**（與 ADR-0056 一致）
- 可選擇是否附**目錄頁**（列出附件所有案件編號）
- 對帳單 PDF 與附件 PDF 之間用 PDF bookmark 連結

## Consequences

- ✅ 業主一次拿到完整憑證；客戶滿意度提升
- ⚠️ 對帳單附件版本鎖定後若任一附件版本過期 → 整包以 v1 為準（不會 partial update）
- 🔮 Phase 2 電子發票 API（B24）整合時可附帶此目錄

## References

- `docs/superpowers/brainstorm/q8-billing-attachment.html`
