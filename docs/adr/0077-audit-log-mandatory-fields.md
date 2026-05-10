# ADR 0077 — audit_log 強制欄位 schema

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D3 |
| Related ADR | ADR-0075, ADR-0076, ADR-0078 |

## Context

GDPR Article 30(1) 列出 records of processing 必含項目（controller、purposes、categories、recipients、time limits、security measures）；ISO 27001 A.8.15 要求 logs 包含 user IDs、system activities、dates / times / details；PDPA 施行細則第 12 條第 2 項第 6 款要求「使用個人資料之紀錄、軌跡」。為避免每個模組各寫各的 audit schema 導致 drift，需統一強制欄位。

## Decision

`audit_log` 表強制欄位（NOT NULL，除註明外）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `who` | uuid | 操作者 user_id |
| `when` | timestamptz | 事件發生時間（DB 端 default `now()`）|
| `what` | text | 事件類型（如 `NODE_ARCHIVED`）|
| `target` | jsonb | 被影響的 node / 合約 / 案件識別 |
| `before` | jsonb | 變更前快照（INSERT 時可為 null）|
| `after` | jsonb | 變更後快照（DELETE 時可為 null）|
| `reason_code` | text | 來自 Change Reason Catalog（見 ADR-0078）|
| `reason_note` | text | 操作者文字補充（可選）|
| `approval_chain` | jsonb | 核可者鏈（高敏感事件必填）|
| `ip_address` | inet | 來源 IP |
| `user_agent` | text | 來源 UA |

## Consequences

### ✅ 好處
- 對齊 GDPR Art. 30 / ISO 27001 A.8.15 必含項目
- 全系統 audit 查詢一致，內稽報表可一條 SQL 跑完
- before/after jsonb 可重建任意時點狀態

### ⚠️ 代價
- jsonb 欄位無 schema 強約束，需應用層 validator（Zod）保證
- 每筆事件 row size 比 typed 欄位大（典型 1-3 KB）

### 🔮 未來影響
- Phase 2 可基於 before/after diff 自動產生變更說明文字（給內稽用）
- Phase 3 加入 hash chain（每筆 row hash = SHA256(prev_hash + this_row)）強化不可竄改證明

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30(1) Records of processing activities: https://gdpr-info.eu/art-30-gdpr/
- NIST SP 800-92 Guide to Computer Security Log Management: https://csrc.nist.gov/publications/detail/sp/800-92/final
