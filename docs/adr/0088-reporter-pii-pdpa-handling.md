# ADR 0088 — 報修者個資 PDPA 處理（Phase 1 細則 TBD）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | （隱含於整體 PDPA 討論）§ D 決議 D14 |
| Related ADR | ADR-0075, ADR-0076 |

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
- 商業會計法第 38 條（憑證保存期限）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- 民法第 125 條（請求權時效）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=125
- GDPR Article 5 (Principles): https://gdpr-info.eu/art-5-gdpr/
- GDPR Article 13 (Information to be provided): https://gdpr-info.eu/art-13-gdpr/
- RRMS Phase 1 spec §6 PDPA section: ../superpowers/specs/2026-05-07-rrms-phase1-design.md
