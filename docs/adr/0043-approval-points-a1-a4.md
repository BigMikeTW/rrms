# ADR 0043 — 簽核點 A1-A4 全部進 MVP；A4 第二階段升級合法電簽

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B20 |
| Related ADR | ADR-0036, ADR-0044 |

## Context

維保案件涉及 4 個簽核點，缺一個就會出現「誰負責」爭議。延後其中任何一個到 Phase 2 = Phase 1 線上跑時某段必須走線下，反而拖慢整體流程。

## Decision

MVP 包含 4 個簽核點：

| 點 | 名稱 | 實作 |
|---|---|---|
| A1 | 客戶現場簽名 | HTML5 canvas（B13） |
| A2 | 內部結案核可 | 後台按鈕 + audit log |
| A3 | 費用核可 | 後台按鈕 + 雙人覆核可選 |
| A4 | 客戶簽核對帳單 | **MVP**：簡單電子簽名圖；**Phase 2**：升級為合法電簽（DocuSign / 法 OK） |

每個簽核點皆寫入 `signature` 表（含 timestamp、IP、簽核人 ID、PNG 簽名）。

## Consequences

- ✅ 流程完整線上化；無線下空窗
- ⚠️ A4 MVP 階段法律證據力較弱（簡單簽名圖），但可接受爭議成本
- 🔮 Phase 2 A4 升級時 schema 已預留 `signature_method` 欄位（'simple' / 'docusign' / 'fa_ok'）

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
- 電子簽章法
