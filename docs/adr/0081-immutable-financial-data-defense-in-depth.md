# ADR 0081 — 不可變財務資料三道防禦深度

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `rate-card-design.html` § D 決議 D7 |
| Related ADR | ADR-0076, ADR-0082, ADR-0084 |

## Context

報修案件的計價資料（rate card / compensation_amount）涉及對下游廠商請款憑證效力與對客戶的對帳金額；SOX 404 要求財務相關資料的 integrity 控制；台灣《商業會計法》第 38 條要求會計憑證保存 5 年以上。單一保護機制（如 audit_log）不足以對抗 schema migration / 直接 SQL 修改 / 重新計算覆寫。

## Decision

財務相關資料採三道防禦深度：

1. **UUID 主鍵**：所有財務記錄主鍵為 UUID v7（時間排序），避免序號被預測 / 仿造
2. **版本管理**：rate_card / 對帳單 / 案件結案金額採 `version` 欄位 + 不可刪改的歷史版本表（v1, v2, v3...）
3. **案件結案金額快照**：案件 resolved 時將當下費率 snapshot 寫入 `cases.resolved_amount_snapshot`（jsonb）；後續 rate_card 變動不影響歷史案件金額

## Consequences

### ✅ 好處
- 三層獨立保護，符合 SOX 404 內控原則與 ISO 27001 A.8.15
- 歷史案件金額永遠可重現（即使費率表完全改寫）
- 對應台灣《商業會計法》第 38 條會計憑證保存要求

### ⚠️ 代價
- 儲存膨脹：每張 rate card 變動產生新版本 row
- 應用層需處理「查當下費率 vs 查案件當時費率」兩種讀取模式

### 🔮 未來影響
- Phase 2 可加數位簽章（每版本 row hash + private key sign）強化請款憑證法律效力
- Phase 3 整合電子發票時，snapshot 可直接成為 e-invoice 對帳憑據

## References

- SOX Section 404: https://www.sec.gov/spotlight/sarbanes-oxley.htm
- 商業會計法第 38 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- ISO/IEC 27001:2022 A.8.15: https://www.iso.org/standard/82875.html
- UUID v7 RFC 9562: https://www.rfc-editor.org/rfc/rfc9562
