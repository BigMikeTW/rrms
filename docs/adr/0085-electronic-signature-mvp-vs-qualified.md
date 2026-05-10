# ADR 0085 — A4 對帳單電子簽核 MVP / Phase 2 升級路徑

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` § D 決議 D11 |
| Related ADR | ADR-0084 |

## Context

台灣《電子簽章法》第 9 條認可「電子簽章」具一般合約效力，第 10 條對「合格電子簽章」（憑證機構簽發）給予更高證據力。MVP 客戶為中小企業 + 非金融場景，使用純電子簽名圖（手寫板 / 觸控簽名）已足夠；Phase 2 服務金融 / 高敏感客戶時需升級。

## Decision

A4 客戶簽核對帳單分階段：

- **MVP（Phase 1）**：採「純電子簽名圖」— 客戶在裝置上手寫簽名，圖片嵌入 PDF；簽名 + 時間戳 + IP + 操作者寫 audit_log；於台灣具一般合約效力（《電子簽章法》第 9 條）
- **Phase 2 升級**：金融 / 高敏感客戶採「合格電子簽章」— 整合 DocuSign 或台灣本地服務（如「法 OK」），憑證機構簽發、不可否認性更高（《電子簽章法》第 10 條）

兩階段在資料庫 schema 共用 `signature` 欄位 + `signature_type` 標籤（`drawn_image` / `qualified_cert`）。

## Consequences

### ✅ 好處
- MVP 不被認證機構整合阻塞，可快速上線
- 法律效力符合台灣中小企業客戶實務需求
- Phase 2 升級不需 schema migration（僅切換 type）

### ⚠️ 代價
- 純簽名圖可被截圖偽造，爭議時舉證較弱
- 升級 DocuSign / 法 OK 需付費（~每份 NT$30-100）

### 🔮 未來影響
- Phase 2 整合 DocuSign 時可選 hybrid 模式（一般客戶用 MVP / 金融客戶強制 qualified）
- Phase 3 可加區塊鏈時間戳（如 OriginStamp）作為輔助證據

## References

- 電子簽章法第 9 條（一般電子簽章效力）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080037&flno=9
- 電子簽章法第 10 條（合格電子簽章）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080037&flno=10
- DocuSign Taiwan: https://www.docusign.com/zh-tw
- 法 OK（台灣本地電子簽章服務）: https://www.faok.com.tw/
