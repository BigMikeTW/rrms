# ADR 0076 — audit_log Append-only 事件溯源

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § D 決議 D2 |
| Related ADR | ADR-0075, ADR-0077, ADR-0078, ADR-0088, ADR-0133 |

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

- 個人資料保護法施行細則第 12 條第 2 項第 10 款（使用紀錄、軌跡資料及證據保存）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- 個人資料保護法施行細則第 21 條（業務必須例外，4 個窄門）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=21
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 30 Records of processing activities: https://gdpr-info.eu/art-30-gdpr/
- 商業會計法第 38 條（憑證保存 5 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- 民法第 125 條（請求權時效 15 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=125
- Martin Fowler, Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html

## Amendments

| Date | PR | Reason | Change |
|---|---|---|---|
| 2026-05-11 | TBD (Phase 4) | Round-3 deep-dive 確認原 ADR 隱含「永久保留」會違反台灣個資法（憲法法庭 111 憲判字第 13 號 + 法務部 法律字第 10303513040/10603512680 號）；append-only 紀律不變，但 retention 必須有界 | 加 references（施行細則第 21 條 + 商業會計法 + 民法 125 條）；Related ADR 加 ADR-0088、ADR-0133；Phase 1 retention bound = 7 年（取商業會計法 + 民法 125 條較短整合值），到期整列刪除；user 表匿名化時須同步真匿名化 audit_log 內 user_id（per ADR-0133）|
| 2026-05-11 | TBD (Phase 4 hotfix) | Round-4 evidence verification（2026-05-11 獨立研究員）發現前一列 amendment Reason 引用的「法務部 法律字第 10303513040 號 (2014)」於 mojlaw.moj.gov.tw 站內字號搜尋查無此函釋條目；同段引用的「10603512680 號 (2017)」實質採「呈現方式說」立場，與本 amendment 之援引方向相反。經獨立驗證，前一列 amendment 的**實質結論**（永久保留違反個資法 → 7 年保留 + 整列刪除 + user 表匿名化時同步處理 audit_log）仍由憲法法庭 111 憲判字第 13 號「代碼化僅大幅降低非完全消滅」+ 個資法施行細則第 21 條 + 商業會計法 + 民法 125 條獨立支撐，不受影響。前一列 amendment row 文本保留不修改（歷史紀錄完整）。 | (a) 本列為元層更正紀錄，標示前一列 amendment 函釋引用已 superseded by Round-4 verification；(b) 同步連帶處理 ADR-0088 / ADR-0133 / spec §6.3.2 同樣錯誤；(c) `scripts/audit-docs.mjs` deprecated-term hint ADR ref 修正（與本主題無關但同 PR 處理） |
