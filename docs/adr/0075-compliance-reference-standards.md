# ADR 0075 — 合規參考標準清單

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D1 |
| Related ADR | ADR-0076, ADR-0077, ADR-0078 |

## Context

RRMS 為台灣中小企業報修管理系統，未來可能服務金融、醫療、政府客戶；後台異動軌跡 / 個資處理 / 變更管理需符合可被內稽 / 第三方稽核接受的國際標準。直接設計符合台灣《個人資料保護法》施行細則第 12 條，再對齊國際標準作為設計上限，可一次到位。

## Decision

採以下五項標準作為 RRMS audit / change-management / 內控的設計參考：

1. **ISO/IEC 27001:2022 Annex A.8.15** — Logging（事件紀錄、保護、留存）
2. **AICPA SOC 2 Type II CC7.2 / CC7.3** — System Operations（事件偵測 / 異常處理）
3. **ITIL 4 Change Enablement** — 變更核可流程
4. **EU GDPR Article 30** — Records of processing activities
5. **US SOX 404** — 內部控制評估（財務相關控制 hooks）

## Consequences

### ✅ 好處
- 國際標準對齊，未來客戶問「你們符合 ISO 27001 嗎」可直接出示 ADR 對應表
- 標準間有 80% 重疊，一次設計滿足多項合規

### ⚠️ 代價
- 設計上限拉高，部分 MVP 功能（如異常告警、近即時稽核儀表板）會延後到 Phase 2 才完整實作
- 需要持續追蹤標準版本（ISO 27001 2022 改版週期約 8-10 年）

### 🔮 未來影響
- Phase 3 若申請 SOC 2 Type II 認證，現有 audit_log 設計即可作為證據鏈
- 多租戶啟用後，可依客戶業別（金融、醫療）分層套用更嚴格控制

## References

- ISO/IEC 27001:2022 (Annex A.8.15 Logging): https://www.iso.org/standard/82875.html
- AICPA SOC 2 Trust Services Criteria: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services
- ITIL 4 Change Enablement: https://www.axelos.com/certifications/itil-service-management/itil-4-foundation
- GDPR Article 30 (Records of processing activities): https://gdpr-info.eu/art-30-gdpr/
- SOX Section 404: https://www.sec.gov/spotlight/sarbanes-oxley.htm
- 個人資料保護法施行細則第 12 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
