# ADR 0082 — compensation_amount 高敏感欄位審計

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-final-technician-statement.html` § D 決議 D8 |
| Related ADR | ADR-0076, ADR-0077, ADR-0078, ADR-0081 |

## Context

`compensation_amount`（技師回報金額 / 結案金額）直接連動下游廠商請款與客戶對帳，是 RRMS 最高敏感的數值欄位之一。SOX 404 與 ISO 27001 A.8.15 都要求此類欄位的所有變更需有完整軌跡與核可記錄。

## Decision

`compensation_amount` 列為高敏感欄位（標記 `data_sensitivity = 'HIGH'`）：

1. **任何變更必走 audit_log**（修改、複核、補單、撤銷）
2. **`reason_code` 為 NOT NULL** 且必須選自 catalog 內財務子類
3. Change Reason Catalog 必含三條目：
   - `RATE_CARD_UPDATE`（費率表更新導致重算）
   - `POST_RESOLUTION_ADJUSTMENT`（結案後人工調整）
   - `DISPUTED_RESOLUTION`（客戶爭議裁決）
4. 變更動作需經二級審核（approval_chain 必填，至少 1 位非操作者簽核）

## Consequences

### ✅ 好處
- 任何金額異動都有「誰、何時、為何、誰核可」完整四問軌跡
- 對齊 SOX 404 財務控制與 GDPR Art. 30 處理活動記錄
- 內稽可一條 SQL 撈出所有 `POST_RESOLUTION_ADJUSTMENT` 異常聚集

### ⚠️ 代價
- UI 上金額欄位變更體驗較重（需選 reason + 等核可）
- 需建二級審核工作流，超管不在線時可能阻塞

### 🔮 未來影響
- Phase 2 可加自動異常偵測（同人 24 小時內 >10 次調整觸發告警）
- Phase 3 整合電子簽章後，approval_chain 可帶法律效力

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30 Records of processing activities: https://gdpr-info.eu/art-30-gdpr/
- SOX Section 404 Internal Controls: https://www.sec.gov/spotlight/sarbanes-oxley.htm
