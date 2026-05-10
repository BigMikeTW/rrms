# ADR 0076 — audit_log Append-only 事件溯源

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D2 |
| Related ADR | ADR-0075, ADR-0077, ADR-0078 |

## Context

台灣《個人資料保護法》施行細則第 12 條第 2 項第 6 款要求「使用個人資料之紀錄、軌跡資料及證據保存」；ISO/IEC 27001:2022 A.8.15 要求 logs 必須「protected against unauthorized changes and operational issues」。可被修改的 audit log 在法律與稽核上等於沒有 audit log。

## Decision

全系統「狀態變更」事件（節點封存、合約啟停、案件結案、金額調整、使用者授權異動等）統一寫入單一 `audit_log` 表；該表為 **append-only、不可修改、不可刪除**，採事件溯源（Event Sourcing）模式。資料庫層以 trigger / RLS / role 權限三層阻擋 UPDATE / DELETE。

## Consequences

### ✅ 好處
- 滿足 PDPA 施行細則第 12 條軌跡保存與 ISO 27001 A.8.15 不可竄改性
- 任何時點可重建系統狀態（事件溯源回放）
- 全系統一套機制，開發者學一次即可

### ⚠️ 代價
- 表會持續成長，需 partitioning + cold storage 策略（Phase 2 處理）
- 資料修正只能用「補償事件」(reversal event) 不能直接改紀錄

### 🔮 未來影響
- Phase 2 加入 archival policy（>2 年資料移至 cold storage）
- Phase 3 可基於 audit_log 建即時稽核儀表板與異常偵測

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30 Records of processing activities: https://gdpr-info.eu/art-30-gdpr/
- Martin Fowler, Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
