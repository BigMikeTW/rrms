# ADR 0086 — PDF/A ISO 19005 長期保存規範

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-billing-attachment.html` § D 決議 D12（soft 依據）|
| Related ADR | ADR-0083, ADR-0084 |

## Context

PDF 一般版本依賴外部字型 / 嵌入連結 / 動態元件，10 年後檔案可能無法正確開啟。PDF/A（ISO 19005）是 ISO 認可的 PDF 子集，要求字型嵌入、禁止外部依賴、限制 JavaScript / 加密，專為長期保存設計。RRMS 結案報告 + 對帳單需保存 5-10 年以上（見 ADR-0083 / ADR-0084），需採可長期開啟的格式。

## Decision

採 **PDF/A ISO 19005 規範作為設計依據（soft 規範，非強制認證）**：

- 結案報告 PDF 與對帳單 PDF 產出時，pdf-lib 設定遵循 PDF/A-2b 子集（字型嵌入、無外部資源、無 JS）
- MVP 不申請 PDF/A 正式驗證（VeraPDF 認證），但設計上滿足核心要求
- Phase 2 可導入 VeraPDF 自動驗證 pipeline，達成 PDF/A-2b conformance level

## Consequences

### ✅ 好處
- 結案報告與對帳單可在 10+ 年後仍正確開啟（字型 / 內容 / 簽名都嵌入）
- 對齊國際長期保存標準，未來客戶 / 內稽問檔案保存格式可直接答 ISO 19005

### ⚠️ 代價
- pdf-lib 設定限制較多（無動態欄位 / 無外部字型 CDN）
- 嵌入字型導致 PDF 檔案 size 增加 30-50%

### 🔮 未來影響
- Phase 2 加 VeraPDF CI 自動檢查，作為 deployment gate
- Phase 3 整合合格電子簽章時，PDF/A-3 規範允許嵌入完整簽章證據鏈

## References

- ISO 19005-2:2011 PDF/A-2: https://www.iso.org/standard/50655.html
- ISO 19005-3:2012 PDF/A-3 (with embedded files): https://www.iso.org/standard/57229.html
- VeraPDF (open-source PDF/A validator): https://verapdf.org/
- pdf-lib documentation: https://pdf-lib.js.org/
