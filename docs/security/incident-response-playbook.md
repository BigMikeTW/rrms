<!--
What:  RRMS Security Incident Response Playbook. Categorizes incidents
       A-E by source and severity, prescribes per-category response
       SOP with explicit time-to-action gates, lists secret rotation
       procedures, and defines quarterly tabletop drills.
Why:   Implements spec §6.8 (外洩通報 SOP) as an actionable runbook so
       on-call responders don't improvise during an incident. Phase 1
       single-developer reality means BigMike is sole responder;
       playbook ensures consistency over time and across future hires.
       PDPA §12 reporting clock (72 hr from awareness) drives several
       time gates. Audit log retention + 7-year anonymization (ADR-0076
       amended / ADR-0133) feeds incident forensics.
Where: `docs/security/incident-response-playbook.md`. Linked from:
       (1) spec §6.8 (this is the actionable companion);
       (2) Plan 2 Task 7 acceptance criteria;
       (3) future Plan 8 onboarding for new admin staff.
When:  Consulted whenever any Layer 4 alert fires (Dependabot, npm
       audit, ZAP, gitleaks) or when an admin reports a suspected
       breach. Quarterly tabletop drill (per §Drills below) keeps
       responders fresh.
-->

# RRMS 資安事件回應 Playbook

對應 spec §6.8 外洩通報 SOP + 個資法第 12 條（外洩通報 72 小時義務）。

## 事件分類

| 類別 | 範例 | 嚴重度 |
|---|---|---|
| **A. 套件漏洞 (CVE)** | Dependabot alert / `Dependency audit` job 報 high+ | low – critical |
| **B. 動態掃描警告** | `Security — ZAP daily` 或 PR ZAP scan 報 high+ | high |
| **C. 認證 / 授權異常** | 後台被未授權存取、cookie 被盜、Better Auth advisory（per ADR-0134 #5 偵測） | critical |
| **D. 資料外洩疑慮** | DB 誤刪、客戶反映看到別人資料、log 含個資、audit_log 寫入失敗 | critical |
| **E. 服務不可用** | Vercel 部署失敗、Neon DB 連線異常 | medium-high |

## 各類別處理流程

### A. Dependabot / Dependency audit 警告

1. 收到 email（Dependabot）或 GitHub Actions fail（CI Dependency audit job）
2. **1 小時內**：點開 alert / job log 看影響版本與修復版本
3. **24 小時內**：審 Dependabot 自動開的升級 PR；CI 通過 → merge
4. 若 Dependabot 沒自動開 PR（無修復版本可用）：
   - 評估能否切換套件
   - 評估能否暫時移除使用該套件的 feature
   - 在 GitHub issue 紀錄處置決策（標 `security` label）
5. **不忽略**；不修則 CI 持續擋 PR

### B. ZAP scan 報 high+

1. 收到自動建立的 GitHub issue 通知（標題 `[Security] ZAP ...`）
2. **1 小時內**：開 issue 看 ZAP 報告 artifact
3. **4 小時內**：判斷
   - **false positive** → 在 `.zap/rules.tsv` 加例外 + 註解理由；commit；結 issue
   - **真漏洞** → 開修補 PR；含 regression test；merge 後再跑 daily scan 確認綠

### C. 認證 / 授權異常 (critical)

1. **立即**：通報內部 LINE 群組（後續 Plan 7 ChatOps 階段自動化）
2. **1 小時內**：管理員停用受影響帳號；輪替 secret（見下方 § Secret 輪替清單）
3. **24 小時內**：依個資法第 12 條評估是否須通知當事人；準備通報文字
4. **72 小時內**：若評估後須通知 → 通知當事人 + 依需要通報主管機關（per 個資法第 12 條第 3 項）
5. 全程紀錄：時間、判斷、處置 → 存 `docs/security/incidents/YYYY-MM-DD-<short>.md`

### D. 資料外洩疑慮 (critical)

1. 同 C 1–5
2. 額外：立即停用該功能（feature flag / Vercel rollback to last-known-good）
3. 額外：抓出受影響範圍 — 查 `audit_log`（per ADR-0076；7 年保留；經 Phase 4 amendment 後採真匿名化策略 per ADR-0133）+ Vercel access logs + Neon query logs
4. 額外：依匿名化 SOP 處理已外洩個資（per ADR-0133 方案 A+B+C+D）

### E. 服務不可用 (medium-high)

1. **1 小時內**：Vercel rollback 到上一版（per Plan 1 落地 Rollback 程序）
2. **4 小時內**：GitHub issue 紀錄事件、影響範圍、處置
3. 評估是否需通知客戶（per 個資法第 12 條若涉及無法行使權利）

## 通報窗口

- **內部首要窗口**：（公司 LINE 群組 ID / Email — Plan 8 上線時填）
- **個資法主管機關**：依目的事業主管機關（資訊服務業 → 經濟部商業司；待確認最新主管機關名單）
- **法律顧問**：（公司聘請的法律顧問 — Plan 8 上線時填）

## Secret 輪替清單

當需要輪替 secret 時依序處理；每次輪替須寫一筆 audit_log（per ADR-0076 + ADR-0078 reason_code = `SECRET_ROTATED`）：

| Secret | 輪替方式 | 影響 |
|---|---|---|
| `DATABASE_URL`（含 3 個 role per ADR-0089 / Plan 3 Phase 4 Additions） | Neon dashboard 重設密碼 → 更新 Vercel env（`DATABASE_URL_OWNER` / `_MIGRATION` / `_APP`） | 觸發重新部署、新 connection；舊 connection 立即 invalid |
| `BETTER_AUTH_SECRET` | 自行生成 32 字元 random → 更新 Vercel env | 所有現有 session 失效；使用者需重新登入 |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | LINE Developers Console reissue | 推播暫斷直到 token 更新；舊 token 30 分鐘內失效 |
| `LINE_MESSAGING_CHANNEL_SECRET` | LINE Developers Console reissue | webhook 簽章驗證會用新 secret |
| `DROPBOX_REFRESH_TOKEN` | Dropbox App Console revoke + 重新 OAuth | 媒體上傳暫停，需在後台重綁 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console reset | Google 登入暫停直到更新 |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Developers Console reissue | LINE 登入暫停直到更新 |
| `RESEND_API_KEY`（Phase 4 提前到 Phase 1） | Resend Dashboard rotate | 系統信暫停直到更新 |

## 演練

每季一次紅隊演練（紙上推演 / tabletop exercise）：

- 隨機抽一個情境（A–E）
- 計時走完一遍流程
- 檢討哪裡卡關 → 更新本 playbook
- 演練紀錄存 `docs/security/drills/YYYY-MM-DD-<scenario>.md`

## 法源

- 個人資料保護法第 12 條（外洩通報義務、72 小時規定）：https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050021&flno=12
- 個人資料保護法施行細則第 22 條（事故通報細節）：https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=22
- 憲法法庭 111 年憲判字第 13 號（停止利用權應急處置）：https://cons.judicial.gov.tw/docdata.aspx?fid=38&id=309956

## Cross-references

- spec §6.8 外洩通報 SOP（本 playbook 為 actionable 版本）
- ADR-0076 audit log append-only + 7-year retention（forensics 依據）
- ADR-0133 真匿名化策略（外洩後處置）
- ADR-0134 Better Auth security configuration（C 類認證異常依據）
- Plan 1 Rollback 程序（E 類服務不可用依據）
