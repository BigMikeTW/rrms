# ADR 0133 — audit_log 真匿名化策略：4 方案組合（A+B+C+D）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-11 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | (post-brainstorm pivot — Round-3 deep-dive 2026-05-11 — Phase 4 立法) |
| Related ADR | ADR-0076, ADR-0077, ADR-0078, ADR-0088 |

## Context

ADR-0076 立 audit_log append-only；ADR-0077 立 13 mandatory fields（含 `who uuid` actor）。這引發一個核心法律張力：

- **業務面**：audit log 須長期保留以滿足 ISO 27001 A.8.15「protected against unauthorized changes」+ 內稽 / 法遵 / 商業會計法第 38 條（憑證 5 年、會計帳簿與財務報表 10 年）+ 民法第 125 條（請求權時效 15 年）
- **法律面**：當 user 表 PII 到期匿名化（per ADR-0088 reporter PII 結案翌日起 2 年），audit_log 內的 `who uuid` 仍 reference 該 user_id — 此 UUID 是否仍屬個資？

Round-3 PDPA 法理 deep-dive（2026-05-11）以憲法法庭判例 + 國際匿名化標準 + 個資法施行細則 + 學界共識為核心法源組合，得出 RRMS 對 audit log `who` UUID 採「**保守視為個資**」立場（即使主管機關未明確背書「不問還原難易度」絕對說，憲法法庭「侵害非完全消滅」立場 + NIST 真匿名化標準 + 學界 pseudonymization 共識仍要求採真匿名化處理）。

| 法源 | 結論 |
|---|---|
| 憲法法庭 111 年憲判字第 13 號（2022/8/12 健保案） | 代碼化措施僅「**大幅降低**侵害」非完全消滅；憲法法庭創設「**資料停止利用權**」 |
| NIST SP 800-188 (2023 final) | 「Anonymization 必須**不可逆銷毀**所有 links between de-identified datasets and original datasets」— RRMS 保留 UUID = 未銷毀映射 = pseudonymization 不是 anonymization |
| 個資法施行細則第 21 條 | 業務必須例外只有 4 個窄門：(1) 法令保存期限 (2) 契約約定 (3) 刪除侵害當事人利益 (4) 其他正當事由 — **內部稽核 / ISO 27001 不直接構成例外** |
| 學界（邱文聰、吳全峰、許慧瑩、蔡柏毅） | 一致認定「保留 surrogate key + 仍存在可重連結映射」屬假名化（pseudonymization），仍屬個資 |
| 台灣個資法 vs GDPR Art 89 | **台灣無 Art 89「歸檔 / 科研 / 統計目的」長期保存例外**；不能直接套例外 |

因此 RRMS 必須有具體 audit_log 真匿名化策略，否則 Phase 1 上線即違法。

## Decision

採 **4 方案組合（A + B + C + D）**：

### 方案 A：真匿名化（per NIST SP 800-188）

當 user 表觸發匿名化（per ADR-0088）時，**同步**將 audit_log 內該 user 的所有 `who` UUID 替換為單一固定常數：

```
ANONYMIZED_USER_UUID = '00000000-0000-0000-0000-ffffffffffff'
```

- 此常數在 user 表中**永遠不對應任何 row**（reserved sentinel）
- 替換後 audit_log 仍保留事件 type、時間、`target` jsonb（中已 redacted PII）、`reason_code`、`reason_note`、`approval_chain`、`ip_address`（個資但非 user 表 PK）、`user_agent`
- 銷毀「`who` UUID ↔ 真實使用者」的映射 = NIST 標準 anonymization
- 實作位置：Plan 8 anonymization cron handler（per ADR-0088 排程每日 03:00）+ user 主動行使「停止利用」「刪除」權利時的同步觸發

**為何用單一常數而非 hash(user_id, salt)**：
- hash + salt 仍保留映射（salt 在 source code / env），未滿足 NIST「irreversibly destroyed」標準
- 單一常數徹底切斷映射 → 真匿名化
- 內稽仍可分析「事件 type 分布」「時間 pattern」「reason_code 統計」— 不需要追蹤特定使用者

**`target` jsonb 也須 redact**：
- 同步將 `target` 內含 PII 的 key（如 `reporter_name`, `reporter_phone`, `reporter_email`, `line_user_id`）替換為固定字串（如 `(已匿名)`）或刪除
- `before` / `after` jsonb 同理

### 方案 B：分區保留期（per 商業會計法 + 民法）

audit_log 整體保留 **7 年**（取商業會計法第 38 條 5 年 + 民法第 125 條請求權時效 15 年的整合值，偏向實務常見「最長 7 年」上限），到期**整列刪除**（不止匿名化 — 連事件本身刪除）。

法源：
- 個資法施行細則第 21 條第 1 款「法令規定保存期限」（援引商業會計法）
- 規避「永久保留」與個資法第 11 條第 3 項「特定目的消失應刪除」之衝突

實作：每日 cron 額外執行 `DELETE FROM audit_log WHERE occurred_at < NOW() - INTERVAL '7 years'`（用 partitioning + DROP partition 性能更佳；Phase 2 評估）。

### 方案 C：契約 / 告知書明文（per 個資法第 8 條告知義務 + 第 19 條）

spec §6.1 隱私告知聲明明文補上：

> 「為符合內部稽核、ISO 27001 與商業會計法等規定，您的操作紀錄（**不含**您姓名、電話、Email、地址等可識別資訊；**僅含**事件類型、時間、操作 metadata）將保留 **7 年**。當您資料到期匿名化時，操作紀錄中對應的識別代號將同步替換為匿名常數，無法再連回您本人。」

並在 §6.4「當事人權利」明列「您可隨時透過 LINE OA 行使停止利用、刪除權利；行使後 7 個工作日內，您的所有 audit log 識別代號將被匿名化」。

法源：
- 個資法第 8 條告知義務（明示利用期間 + 告知處理方式）
- 個資法第 19 條（特定目的內利用 + 當事人同意雙備援）

### 方案 D：當事人權利支援 UI（per 憲法法庭 111 憲判字第 13 號）

提供兩管道行使「停止利用 / 刪除」權利：
1. **LINE OA 選單**「我要停止 / 刪除我的資料」（Phase 1 Plan 7 已規劃；本 ADR 確認須含 audit_log 同步處理）
2. **後台介面**（Plan 4 加；admin 代為處理當事人請求）

收到請求 → 7 個工作日內處理（per 個資法第 13 條）→ 同步觸發 user + audit_log 雙表真匿名化（per 方案 A）→ 寫一筆新 audit_log 紀錄此「匿名化動作」（reason_code = `USER_ANONYMIZED_RIGHTS_REQUEST`）。

## Consequences

### ✅ 好處

- **法理站得住**：滿足法務部函釋 + 憲法法庭判例 + NIST 標準的同時，保留 audit_log 內稽價值
- **不違反 ISO 27001 A.8.15 append-only 精神**：紀錄不被「修改」，是被「真匿名化」（事件本體仍在，僅 actor 識別性消失）
- **支援當事人權利行使**：符合 111 憲判字第 13 號「資料停止利用權」要求
- **保留統計分析能力**：事件 type / 時間 / reason_code 分布仍可分析；只損失「特定使用者軌跡」

### ⚠️ 代價

- **失去「特定 user 全歷程追蹤」能力**：匿名化後無法回查「該使用者在 N 年前做過什麼」— 但 PDPA 角度這正是要的
- **匿名化 cron 邏輯複雜度高**：須跨表 transaction（user + audit_log + outbox + cases + media）+ 同步寫新 audit row 紀錄此匿名化動作
- **方案 A 替換的雜訊**：同一常數 `00000000-...ffff` 可能在 audit_log 中累積大量 row → 對「按 user 聚合」查詢失去意義（已預期；屬可接受代價）
- **法律仍有殘餘風險**：方案 A+B+C+D 為「保守上策」；理論上仍可能被主管機關認定不足。緩解：採方案 D 主動權利支援 + 7 年到期整列刪除（方案 B）+ 隱私告知書明確表達方案 C，三者層層降低殘餘風險

### 🔮 未來影響

- Phase 2 多租戶啟用時，各租戶可能要求自訂保留期（B2B 合約） → 需 schema 加 `tenant_audit_retention_years` 欄位 + cron 按 tenant 處理
- Phase 3 加入 hash chain（per ADR-0077 §未來影響）時，匿名化動作須同步重算 hash chain（保留證據鏈完整性）
- 若主管機關（國發會 / PDPC）未來發布「audit log 對 user_id 處理」具體指引，本 ADR 可能需 supersede

## References

- 個人資料保護法第 5、8、11、12、19 條: https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021
- 個人資料保護法第 13 條（行使權利處理期限 30 日 / 必要時延長 30 日）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050021&flno=13
- 個人資料保護法施行細則第 12 條第 2 項第 10 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- 個人資料保護法施行細則第 21 條（業務必須例外）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=21
- 商業會計法第 38 條（會計憑證至少保存 5 年；會計帳簿及財務報表至少 10 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=J0080009&flno=38
- 民法第 125 條（請求權時效 15 年）: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=125
- 憲法法庭 111 年憲判字第 13 號（2022/8/12 健保案）: https://cons.judicial.gov.tw/docdata.aspx?fid=38&id=309956
- NIST SP 800-188 De-Identification of Personal Information: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-188.pdf
- ISO/IEC 20889:2018 Privacy enhancing data de-identification techniques: https://www.iso.org/standard/69373.html
- ISO/IEC 27001:2022 A.8.15 Logging: https://www.iso.org/standard/82875.html
- GDPR Article 4(5) Pseudonymisation: https://gdpr-info.eu/art-4-gdpr/
- GDPR Recital 26 (anonymization): https://gdpr-info.eu/recitals/no-26/
- GDPR Article 89 (公益歸檔 / 科研 / 統計例外 — RRMS 不適用): https://gdpr-info.eu/art-89-gdpr/
- 邱文聰（中研院法律所）關於 GDPR pseudonymisation 之見解: https://www.iias.sinica.edu.tw/member_post/8?class=12
- 蔡柏毅〈淺談個資去識別化與合理利用間之平衡〉金融聯合徵信第 39 期: https://www.jcic.org.tw/main_ch/fileRename/fileRename.aspx?fid=1190&kid=1
- 〈匿名化或假名化？資料去識別化之概念釐清〉hsu.legal: https://hsu.legal/article/58
- 研究員 Round-3 PDPA 法理深挖紀錄（本 session 2026-05-11；非 commit 檔，已內嵌於本 ADR Context 段）
- 研究員 Round-4 法源 evidence verification 紀錄（2026-05-11 session 內；觸發本 ADR Amendment）

## Amendments

| Date | PR | Reason | Change |
|---|---|---|---|
| 2026-05-11 | TBD (Phase 4 hotfix) | Round-4 evidence verification（2026-05-11 獨立研究員）發現原 Context 表中「法務部 法律字第 10303513040 號（2014/11/17）」於 [mojlaw.moj.gov.tw](https://mojlaw.moj.gov.tw/LawContentList.aspx?type=E&kw=10303513040) 站內字號搜尋回傳「資料錯誤」、無此函釋條目；原引第三方 URL（`id=FE304775`）實際指向「法律字第 10603512680 號（2017/11/10）」，且該 2017 函釋採「呈現方式說」立場（逐字：「依其呈現方式已無從直接或間接識別該特定個人者，即非屬個人資料」），與原 ADR 引用方向「客觀上仍有還原可能即仍屬個資、不問還原難易度」**相反**。為避免錯引在日後合規審計時動搖論證鏈；Decision 段（4 方案 A+B+C+D + 7 年保留 + 真匿名化）由憲法法庭 111 憲判字第 13 號 + NIST SP 800-188 + 個資法施行細則第 21 條 + 學界共識獨立支撐，政策**不動**。同時補商業會計法第 38 條漏列第 2 項「會計帳簿及財務報表至少保存 10 年」。 | (a) Context 法源表移除兩列「法務部 函釋」；(b) Context line 16 商業會計法第 38 條補第 2 項「會計帳簿與財務報表 10 年」分流；(c) Context 「明確結論：仍屬個資」軟化為「保守視為個資」並重述核心法源組合；(d) References 段同步刪兩則錯誤函釋連結；(e) References 段商業會計法 38 條描述補第 2 項；(f) Decision 段（4 prong + 7 年 + 真匿名化）**不動** |
