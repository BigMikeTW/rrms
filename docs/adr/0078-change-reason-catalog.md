# ADR 0078 — 變更理由分類庫（Change Reason Catalog）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D4 |
| Related ADR | ADR-0076, ADR-0077, ADR-0082, ADR-0088, ADR-0133 |

## Context

ITIL 4 Change Enablement 與 SOC 2 CC7.3 都要求變更需有 documented reason；自由文字 reason 在內稽時無法分類聚合（「為什麼上個月封存 47 個節點？」答不出來）。需要「結構化 + 可選文字補充」雙軌制。

## Decision

建立 `change_reason_catalog` 表，由內部超管維護；每筆 audit_log 寫入時 `reason_code` 必填（FK 到 catalog），`reason_note` 文字補充可選。Catalog 預設條目包含：

- `NODE_ARCHIVED_DUPLICATE`、`NODE_ARCHIVED_TENANT_LEFT`、`NODE_ARCHIVED_REORG`
- `CONTRACT_TERMINATED_EXPIRED`、`CONTRACT_TERMINATED_DEFAULT`
- `RATE_CARD_UPDATE`、`POST_RESOLUTION_ADJUSTMENT`、`DISPUTED_RESOLUTION`
- `CASE_REOPENED_CUSTOMER_REQUEST`、`CASE_REOPENED_QC_REJECT`
- `USER_ANONYMIZED_RETENTION_EXPIRED`、`USER_ANONYMIZED_RIGHTS_REQUEST`（per ADR-0133 audit_log 真匿名化兩種觸發情境）

新增 reason_code 屬於設定變更，本身亦寫入 audit_log。

## Consequences

### ✅ 好處
- 內稽報表可按 reason_code 聚合（GROUP BY）
- 強制操作者「思考分類」，降低誤操作機率
- 對齊 ITIL 4 Change Enablement 結構化變更紀錄要求

### ⚠️ 代價
- 初期需投入時間建立完整 catalog（預估 30-50 條）
- 操作者需學習選對 code（UI 加搜尋過濾協助）

### 🔮 未來影響
- Phase 2 可基於 reason_code 分布做風險評分
- 多租戶啟用時，部分 reason_code 可允許各租戶自訂（base + custom 雙層）

## References

- 個人資料保護法施行細則第 12 條第 2 項第 10 款（使用紀錄、軌跡資料及證據保存）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30 Records of processing activities: https://gdpr-info.eu/art-30-gdpr/
- ITIL 4 Change Enablement Practice Guide: https://www.axelos.com/certifications/itil-service-management/itil-4-foundation
- AICPA SOC 2 CC7.3: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services

## Amendments

| Date | PR | Reason | Change |
|---|---|---|---|
| 2026-05-11 | TBD (Phase 4) | ADR-0133 引入「audit_log 真匿名化」策略，新增兩種匿名化觸發情境須有對應 reason_code | 預設條目補 `USER_ANONYMIZED_RETENTION_EXPIRED` 與 `USER_ANONYMIZED_RIGHTS_REQUEST`；Related ADR 加 ADR-0088、ADR-0133 |
