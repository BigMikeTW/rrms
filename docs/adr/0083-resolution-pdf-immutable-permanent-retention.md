# ADR 0083 — 結案報告 PDF 永久保留與下載軌跡

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-pdf-report.html` § D 決議 D9 |
| Related ADR | ADR-0076, ADR-0077, ADR-0086, ADR-0087 |

## Context

結案報告 PDF 是案件完成的法定文件（含技師簽名、結案金額、客戶確認），對下游廠商請款 / 對客戶申訴抗辯 / 內稽 / 司法調查均屬關鍵證據。台灣《商業會計法》第 38 條要求憑證保存 5 年；《公司法》第 20 條要求公司年度書表保存 10 年；ISO 27001 A.8.15 要求 logs 留存週期符合法規。

## Decision

1. 所有歷史結案報告 PDF **永久保留**，不可修改、不可刪除（immutable）
2. 案件即使 reopened 後產生新版報告，舊版仍保留（v1, v2, v3...）
3. 每次「下載 PDF 報告」動作寫入 audit_log，含 `who`、`when`、`target`（report_id + version）、`ip_address`、`user_agent`
4. 報告儲存於 Vercel Blob，啟用 versioning + immutability flag

## Consequences

### ✅ 好處
- 滿足台灣法規憑證保存最長要求（10 年），永久保留更安全
- 下載軌跡可偵測異常（同人短時間下載大量報告 → 資料外洩警訊）
- 對齊 GDPR Art. 30 與 ISO 27001 A.8.15

### ⚠️ 代價
- Blob 儲存成本長期累積；需 Phase 2 加 cold storage 移轉策略
- 下載動作每次寫 audit_log，高頻場景需 batch insert 優化

### 🔮 未來影響
- Phase 2 可加數位簽章（PDF/A + qualified signature），提升司法證據力
- Phase 3 可整合 immutable 雲端封存服務（如 AWS S3 Object Lock WORM）

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- 商業會計法第 38 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- 公司法第 20 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080001&flno=20
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30: https://gdpr-info.eu/art-30-gdpr/
