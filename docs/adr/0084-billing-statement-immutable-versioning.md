# ADR 0084 — 對帳單 + 附件 immutable 版本管理

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-billing-attachment.html` § D 決議 D10 |
| Related ADR | ADR-0076, ADR-0081, ADR-0083, ADR-0086 |

## Context

對帳單是雙方對請款金額認可的法律文件；台灣《民法》第 759-1 條認可電磁紀錄之證據力；《電子簽章法》第 4 條規定電子文件「於法律行為發生時，準用書面」。若對帳單可被覆寫，雙方爭議時無法回溯當時雙方確認的版本。

## Decision

對帳單與其附件版本均為 **immutable**：

1. 對帳單每次發送都產生新版本 row（v1, v2, v3...），舊版本永遠保留
2. 附件（佐證照片、施工紀錄、簽核截圖）綁定特定版本，跟隨版本不可變
3. 案件被 reopened 後再次產生對帳單為新版本，但 v1/v2/v3 全保留
4. 任何讀取（檢視 / 下載 / 列印）寫入 audit_log

## Consequences

### ✅ 好處
- 雙方爭議時可回溯各版本當時的金額 / 附件 / 雙方簽認狀態
- 對齊《電子簽章法》第 4 條「準用書面」要件
- 滿足《商業會計法》第 38 條會計憑證保存

### ⚠️ 代價
- 儲存量隨版本線性成長；需 Phase 2 加歸檔策略
- 應用層查詢需區分「最新版」vs「特定版本」

### 🔮 未來影響
- Phase 2 可加版本對比功能（v2 vs v3 diff 視覺化）
- Phase 3 整合電子簽章後，可成為法律效力強的請款憑證鏈

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- 電子簽章法第 4 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080037&flno=4
- 商業會計法第 38 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- ISO/IEC 27001:2022 A.8.15: https://www.iso.org/standard/82875.html
- GDPR Article 30: https://gdpr-info.eu/art-30-gdpr/
