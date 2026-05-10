# ADR 0087 — 內稽報表自動產生

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D13 |
| Related ADR | ADR-0076, ADR-0077, ADR-0078, ADR-0079 |

## Context

audit_log 累積後需要可消費的視角；人工撈資料無法擴展。SOC 2 CC7.2 要求「the entity monitors system components for anomalies」，ISO 27001 A.8.16 要求「monitoring activities」。內稽 / 經營層需要每月 / 每季結構化報表 + 即時告警。

## Decision

基於 audit_log + change_reason_catalog 自動產生四份內稽報表：

1. **節點封存月報**：過去 30 天 archived nodes 清單（含原因碼、操作者、審核者、影響案件數）
2. **合約變動年報**：過去 365 天 contract status changes（啟用 / 終止 / 到期 / renew）
3. **個別操作者高風險動作日誌**：依角色 + reason_code 聚合（如某員工封存 / 金額調整次數突增）
4. **異常行為告警**：規則引擎觸發（同人 1 小時內封存 >10 個 node、同人 24 小時 >5 次 `POST_RESOLUTION_ADJUSTMENT` 等）

報表為自動排程（Vercel Cron）每日 02:00 重新計算，存入 `audit_reports` table；告警 channel 走 LINE / Email。

## Consequences

### ✅ 好處
- 對齊 SOC 2 CC7.2 anomaly monitoring 與 ISO 27001 A.8.16
- 內稽不需人工撈資料，可信度與時效性提升
- 異常告警形成「人在環內」防線，及早攔截內部威脅

### ⚠️ 代價
- 規則引擎需持續調校 threshold（過嚴 → noise；過鬆 → miss）
- 報表計算成本：audit_log 大表 GROUP BY 需建合適索引

### 🔮 未來影響
- Phase 2 可加 ML 異常偵測（user behaviour baseline + deviation）
- Phase 3 接入 SIEM（Splunk / Datadog）做跨系統 correlation

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- ISO/IEC 27001:2022 A.8.16 Monitoring activities: https://www.iso.org/standard/82875.html
- AICPA SOC 2 CC7.2: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services
- GDPR Article 30: https://gdpr-info.eu/art-30-gdpr/
