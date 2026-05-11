# ADR 0088 — 報修者個資 PDPA 處理（Phase 1 細則 TBD）

| Field           | Value                                            |
| --------------- | ------------------------------------------------ |
| Status          | Accepted                                         |
| Date            | 2026-05-10                                       |
| Supersedes      | —                                                |
| Superseded by   | —                                                |
| Brainstorm 來源 | （隱含於整體 PDPA 討論）§ D 決議 D14             |
| Related ADR     | ADR-0075, ADR-0076, ADR-0077, ADR-0078, ADR-0133 |

## Context

報修者透過公開表單 / LINE 提交報修，留下姓名、電話、Email、所屬單位、地點、照片影片、LINE userId 等個資；依台灣《個人資料保護法》第 5 條（合理目的）、第 8 條（告知義務）、第 11 條（保有期限）、第 12 條（安全維護義務）需明訂處理規則。Phase 1 spec §6 已列舉告知事項與當事人權利機制（LINE OA 選單），但具體保存期限、匿名化規則尚未在 brainstorm 鎖定。

## Decision

Phase 1 報修者個資處理：

1. 適用《個人資料保護法》第 5、8、11、12 條與施行細則第 12 條
2. spec §6 已實作的：告知 7 項、查詢驗證雙重認證、權利請求 LINE 入口、外洩通報 SOP、跨境傳輸告知（美國 / 日本）
3. **尚未鎖定**（Phase 1 implementation TBD per memory `project_pdpa.md`）：
   - 結案後個資保存期限（建議 5-7 年對齊《商業會計法》第 38 條 + 《民法》請求權時效）
   - 期滿後匿名化 vs 刪除策略
   - 兒童個資特殊處理（若報修者未滿 14 歲）
   - 跨境傳輸的 SCC / 個資傳輸協議文本

## Consequences

### ✅ 好處

- spec §6 已具備 PDPA 基本義務與當事人權利機制
- 對齊 GDPR Art. 5 / 6 / 13 國際個資處理原則

### ⚠️ 代價

- 部分細則延後鎖定，Phase 1 上線前需追加 brainstorm 結論

### 🔮 未來影響

- 🔮 Phase 1 implementation TBD per memory `project_pdpa.md`; ADR will be amended via supersede when locked
- Phase 2 多租戶啟用時，各租戶可能需自訂保存期限（B2B 客戶合約要求）
- 跨境傳輸 Phase 2 可能改採資料本地化方案（台灣 region DB）

## References

- 個人資料保護法第 5、8、11、12 條: https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021
- 個人資料保護法施行細則第 12 條: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- 個人資料保護法施行細則第 21 條（業務必須例外，4 個窄門）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=21
- 商業會計法第 38 條（憑證保存 5 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- 民法第 125 條（請求權時效 15 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=125
- 憲法法庭 111 年憲判字第 13 號（2022/8/12 健保案 — 創設「資料停止利用權」+「代碼化僅大幅降低非完全消滅」）: https://cons.judicial.gov.tw/docdata.aspx?fid=38&id=309956
- NIST SP 800-188 De-Identification of Personal Information: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-188.pdf
- ISO/IEC 20889:2018 Privacy enhancing data de-identification techniques: https://www.iso.org/standard/69373.html
- GDPR Article 4(5) Pseudonymisation: https://gdpr-info.eu/art-4-gdpr/
- GDPR Recital 26 (anonymization): https://gdpr-info.eu/recitals/no-26/
- GDPR Article 5 (Principles): https://gdpr-info.eu/art-5-gdpr/
- GDPR Article 13 (Information to be provided): https://gdpr-info.eu/art-13-gdpr/
- RRMS Phase 1 spec §6 PDPA section: ../superpowers/specs/2026-05-07-rrms-phase1-design.md

## Amendments

| Date       | PR                   | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-11 | TBD (Phase 4)        | Round-3 PDPA 法理深挖（2026-05-11）鎖定原 ADR 列為 TBD 的細則 + 確認設計關鍵法理（per 法務部 2014/2017 函釋 + 憲法法庭 111 憲判字第 13 號 + NIST SP 800-188）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 鎖定：(a) reporter PII 結案後保留期 = 2 年（不變）（b) audit_log 保留期 = 7 年（per ADR-0076 + 商業會計法 + 民法 125 條取較短整合值）（c) **明列「user 表 PII 匿名化後，user_id UUID 仍屬個資」**（per 法務部函釋「客觀上仍有還原可能即仍屬個資」）→ user 匿名化 trigger 必須同步真匿名化 audit_log 內 user_id（per ADR-0133 strategy A）（d) 兒童個資 / 跨境傳輸 SCC 仍 Phase 2 處理；References 大幅補充法源（憲法法庭判例 + 法務部函釋 + NIST + ISO + GDPR）；Related ADR 加 ADR-0077, ADR-0078, ADR-0133 |
| 2026-05-11 | TBD (Phase 4 hotfix) | Round-4 evidence verification（2026-05-11 獨立研究員）發現前一列 amendment Reason 引用的「法務部 法律字第 10303513040 號 (2014)」於 mojlaw.moj.gov.tw 站內字號搜尋查無此函釋條目；「10603512680 號 (2017)」實質採「呈現方式說」立場（「依其呈現方式已無從直接或間接識別該特定個人者，即非屬個人資料」），與本 amendment 援引方向相反。經獨立驗證，前一列 amendment (c) 之**實質結論**（user_id UUID 經 user 表匿名化後仍屬個資、須同步真匿名化 audit_log）仍由憲法法庭 111 憲判字第 13 號「代碼化僅大幅降低非完全消滅」+ NIST SP 800-188 真匿名化標準 + 學界共識（保留 surrogate key 為 pseudonymization）獨立支撐，不受影響。前一列 amendment row 文本保留不修改（歷史紀錄完整）。 | (a) References 段移除兩則錯誤函釋連結；(b) 本列為元層更正紀錄，標示前一列 amendment 函釋引用已 superseded by Round-4 verification；(c) Related ADR 不變                                                                                                                                                                                                                                                                                                                                                      |
