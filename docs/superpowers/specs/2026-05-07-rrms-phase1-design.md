# RRMS Phase 1 設計文件

| 項目 | 值 |
|---|---|
| 日期 | 2026-05-07 |
| 狀態 | Draft，待使用者確認 |
| 範圍 | Phase 1（簡易報修系統） |
| 目標上線時程 | 短時間內（具體日期待 plan 階段確認） |

---

## 1. 專案目標

讓客戶能透過網頁或 LINE Official Account（以下簡稱 LINE OA）提交報修申請；公司內部人員可在後台管理案件、追蹤狀態，並透過 LINE 即時通知。

**Phase 1 的成功標準**：

- 客戶可在 5 分鐘內完成報修申請（含照片/影片上傳）
- 後台同事可在 LINE 收到新案件通知
- 客戶可在 LINE OA 輸入報修編號查詢案件狀態
- 系統符合台灣《個人資料保護法》基本義務

**長期方向**：可能演進為多租戶 SaaS。Phase 1 設計時為此預留空間（例如資料模型加 `tenant_id` 預留欄位、用 Drizzle 友善的 Postgres RLS 結構），但功能不實作。

---

## 2. 範圍

### 2.1 Phase 1（本文件範圍）

| 模組 | 內容 |
|---|---|
| 公開報修表單 | 無需登入；姓名、手機、Email、公司/單位、地點（自由文字）、內容、照片/影片（不限張數，存 Dropbox） |
| 隱私告知與同意 | 隱私告知聲明 + 必勾同意 + 時間戳記錄 |
| 後台管理 | 公司同事登入後檢視所有案件、變更狀態、查看媒體 |
| 認證 | Email + 密碼、Google OAuth、LINE Login（管理端三選一） |
| LINE 通知 | 新案件 → 推內部 LINE 群組；狀態變更 → 推綁定的客戶（若已綁定） |
| LINE OA 查詢 | 客戶輸入「報修編號 + 手機末四碼」雙重驗證後，Bot 回案件狀態（僅揭露最小欄位） |
| 案件編號 | `RPR-YYYYMMDDXXX` 每日序號 |
| 狀態流程 | 已立案 → 派工中 → 已派工 → 已完成 / 已取消（每階段記錄時間戳） |
| 自動匿名化 | 結案翌日起算 2 年到期，凌晨排程執行 |
| 個資權利請求 | LINE OA 選單「我要查詢/更正/刪除我的資料」→ 後台同事手動處理 |
| 環境 | Production + Preview/Dev 兩環境 |

### 2.2 明確排除（延後到 Phase 2 或更後）

| 不做 | 原因 |
|---|---|
| 客戶端登入帳號（Google/LINE 登入） | 客戶端 Phase 1 不需登入；填表即可 |
| 客戶公司管理員角色（多租戶） | Phase 2 再規劃 |
| LINE OA 自動列出客戶所有案件 | Phase 2，需先有客戶綁定機制 |
| 後台敏感資料遮罩 + JIT 授權 + 稽核紀錄 | Phase 2，先有真實資料量再導入 |
| 欄位級加密 | 不做（Neon at-rest 加密足夠 Phase 1） |
| 行銷利用客戶資料 | 不做 |
| Demo / Stage 環境 | Phase 2 再加 |
| 客戶自助查詢/刪除介面 | Phase 1 用 LINE 訊息申請即可 |

---

## 3. 系統角色

| 角色 | Phase 1 行為 | 認證方式 |
|---|---|---|
| 客戶（報修人） | 填寫報修表單；LINE OA 查詢案件狀態 | 不需登入 |
| 後台同事 | 檢視所有案件、變更狀態、查看媒體 | Email/密碼 OR Google OR LINE Login |
| 系統管理員（superuser） | 同上 + 建立/停用同事帳號 | 同上 |

**Phase 1 權限粒度**：兩級（同事 / 管理員）。同事看所有案件、改狀態；管理員多了「帳號管理」權限。

---

## 4. 功能模組

### 4.1 公開報修表單

**路徑**：`/report`（建議掛在主域名 `app.<domain>` 下）

**欄位**：

| 欄位 | 型別 | 必填 | 備註 |
|---|---|---|---|
| 姓名 | string | ✅ | |
| 手機 | string | ✅ | 台灣手機格式驗證 (`/^09\d{8}$/`) |
| Email | string | ✅ | 標準 email 驗證 |
| 公司/單位名稱 | string | ✅ | |
| 報修地點 | string | ✅ | 自由文字 |
| 報修內容 | text | ✅ | 自由文字 |
| 照片/影片 | file[] | ❌ | 不限張數；上傳到 Dropbox |
| 隱私同意 | checkbox | ✅ | 勾選並記錄時間戳；不勾不能送出 |

**送出後行為**：

1. 後端驗證資料
2. 寫入 Postgres，產生 `RPR-YYYYMMDDXXX` 編號
3. 透過 LINE Messaging API 推訊息到內部 LINE 群組
4. 顯示成功頁，告知客戶案件編號 + LINE OA QR code（鼓勵加好友查狀態）

**LINE 帶入舊資料的規則（涉及個資告知）**：

- 若客戶在 LINE OA 加好友且已綁定（透過 LIFF），下次透過 LINE 路徑進入表單時，姓名/手機/Email/公司會預先填入
- 客戶可隨時修改預設帶入的資料
- **隱私告知聲明中明文揭露此行為**

### 4.2 後台管理

**路徑**：`/admin`（同主域名）

**主要頁面**：

| 頁面 | 功能 |
|---|---|
| Dashboard | 數字摘要：今日新案件 / 待處理 / 處理中 / 本月已完成 |
| 案件列表 | 表格：編號、報修人、公司、地點、狀態、立案時間 / 排序 / 搜尋 / 狀態篩選 |
| 案件詳情 | 顯示所有欄位、媒體 thumbnail（點開預覽）、狀態歷史、變更狀態的按鈕 |
| 帳號管理（僅管理員） | 列出同事帳號；新增（Email/密碼）；停用 |
| 個人設定 | 更換密碼、綁定 Google/LINE |

**狀態變更**：每次按下「派工中 → 已派工」等變更時，記錄 `actor_user_id` + `changed_at`，寫入 `case_status_history` 表。

### 4.3 認證

**Library**：Auth.js v5（Next.js App Router 適配版）

**登入方式（Phase 1，admin 側專用）**：

| 方式 | Provider | 備註 |
|---|---|---|
| Email + 密碼 | Credentials provider | 帳號統一用 Email；密碼用 bcrypt 雜湊 |
| Google | Google OAuth provider | 內建 |
| LINE | 自訂 OAuth provider | 用 LINE Login channel 設定 |

**帳號建立**：管理員在後台建帳號 → 系統寄一封啟用信（含一次性連結）→ 同事點連結設密碼。Google / LINE 登入則由同事自行綁定到既有帳號。

**Session**：Auth.js 預設 JWT in cookie；TTL = 30 天滑動。

### 4.4 LINE 整合

#### 4.4.1 LINE Login（用於後台同事登入）

- 對應一個 LINE Login Channel
- Auth.js 自訂 OAuth provider 串 `https://access.line.me/oauth2/v2.1/`
- 來源：LINE Login 文件 https://developers.line.biz/en/docs/line-login/

#### 4.4.2 LINE Messaging API（用於通知 + LINE OA）

- 對應一個 LINE Messaging API Channel（即 LINE OA）
- SDK：`@line/bot-sdk`（官方）
- Webhook：`POST /api/line/webhook` 處理：
  - 客戶傳訊息查狀態
  - 客戶按 Rich Menu 選單（包含「我要刪除資料」、「查詢案件」）
  - 加好友事件
- Push：新案件時 `client.pushMessage(staffGroupId, ...)`；狀態變更時若客戶綁定，同樣 push

#### 4.4.3 LINE OA 功能（Phase 1）

**Rich Menu**（常駐選單）：

- 「查詢案件狀態」→ 進入查詢驗證流程（見下方）
- 「我要查詢/更正我的資料」→ Bot 引導輸入聯絡資訊，後台同事手動回覆
- 「我要刪除資料」→ Bot 引導輸入手機號或 Email，後台同事手動處理

**查詢驗證流程（雙重驗證，避免編號被猜測導致個資外洩）**：

1. 客戶按「查詢案件狀態」，或主動傳符合 `RPR-\d{11}` 格式的訊息
2. Bot 回應：「請輸入您報修時留下的手機號碼末四碼（4 位數字）」
3. 客戶輸入 4 位數
4. 後端比對 `cases.case_no` + `cases.reporter_phone` 末四碼
5. **驗證通過** → Bot 回**最小揭露**內容：
   - 案件編號
   - 目前狀態（已立案 / 派工中 / 已派工 / 已完成 / 已取消）
   - 立案時間
   - 最近狀態變更時間
   - **不揭露**：姓名、完整手機、Email、地點、報修內容、照片影片（這些 Bot 訊息會留在 LINE 伺服器，最小揭露原則）
6. **驗證失敗** → Bot 回「資料不正確，請確認後再試」並寫入 `query_attempts` 表

**Rate limiting（防止編號被列舉嘗試）**：

- 同一 LINE userId 在 24 小時內失敗驗證 ≥ 5 次 → 暫停該 userId 查詢功能 24 小時
- 同一 `case_no` 在 24 小時內失敗驗證 ≥ 5 次 → 觸發後台告警（可能是有人正在嘗試竊取資料），通知管理員 LINE 群組

**法源**：個人資料保護法第 5 條（合理目的關聯）+ 施行細則第 12 條第 2 項（安全維護義務、稽核機制、使用紀錄保存）

#### 4.4.4 LINE 環境隔離

- Phase 1 兩環境各對應一個 LINE Messaging API Channel：
  - Production：正式 OA（公開加好友）
  - Preview/Dev：測試 OA（僅供開發測試）
- LINE Login 同樣準備兩個 channel 對應兩環境
- 環境變數分開管理（在 Vercel Dashboard 設）

### 4.5 媒體上傳（Dropbox）

**動機**：避開 Vercel function 的請求 body size 限制與頻寬費。

**流程**：

```
[Browser] ──(1) 申請上傳──▶ [Next.js API /api/media/get-upload-url]
                                            │
                                            ▼
                            (2) 呼叫 Dropbox API 取得 temporary upload link
                                            │
                                            ▼
[Browser] ◀──(3) 回 upload_url──────────────┘
   │
   │ (4) 直接 PUT 檔案到 Dropbox
   ▼
[Dropbox]
   │
   │ (5) 上傳完成後，瀏覽器通知 server
   ▼
[Next.js API /api/media/complete] ──(6) 寫 case_media table──▶ [Postgres]
                                                              {dropbox_path, mime_type, size}
```

**Dropbox 設定**：

- 用 Dropbox App with App Folder（不需要存取使用者整個 Dropbox）
- 用 refresh token + service account（不是個人 OAuth 流程）
- API：`/2/files/get_temporary_upload_link`
- 來源：Dropbox API v2 官方文件 https://www.dropbox.com/developers/documentation/http/documentation

**檔案命名**：`/<env>/<RPR-編號>/<uuid>.<ext>`

---

## 5. 資料模型（Drizzle schema 草稿）

> 完整 SQL DDL 在 plan 階段產出。本節列出主要表與欄位。

### 5.1 `users`（後台同事）

| 欄位 | 型別 | 備註 |
|---|---|---|
| id | uuid | PK |
| email | text | unique |
| password_hash | text | nullable（用 OAuth 者可為 null） |
| name | text | |
| role | enum | `staff` / `admin` |
| google_sub | text | nullable |
| line_user_id | text | nullable |
| disabled_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 5.2 `cases`（報修單）

| 欄位 | 型別 | 備註 |
|---|---|---|
| id | uuid | PK |
| case_no | text | unique；`RPR-YYYYMMDDXXX`（每日序號 000-999） |
| reporter_name | text | |
| reporter_phone | text | |
| reporter_email | text | |
| reporter_company | text | |
| location | text | |
| description | text | |
| status | enum | `filed` / `dispatching` / `dispatched` / `completed` / `cancelled` |
| line_user_id | text | nullable，客戶若有綁定 LINE |
| consent_at | timestamptz | 同意時間戳 |
| consent_text_version | text | 同意當下的告知聲明版本號 |
| filed_at | timestamptz | |
| closed_at | timestamptz | nullable，狀態變 completed/cancelled 時填 |
| anonymized_at | timestamptz | nullable，匿名化執行時間 |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| tenant_id | uuid | nullable；Phase 1 全填預設值，Phase 2 用於多租戶 |

### 5.3 `case_status_history`

| 欄位 | 型別 | 備註 |
|---|---|---|
| id | uuid | PK |
| case_id | uuid | FK → cases |
| from_status | enum | |
| to_status | enum | |
| changed_by_user_id | uuid | FK → users |
| changed_at | timestamptz | |
| note | text | nullable |

### 5.4 `case_media`

| 欄位 | 型別 | 備註 |
|---|---|---|
| id | uuid | PK |
| case_id | uuid | FK → cases |
| dropbox_path | text | |
| mime_type | text | |
| size_bytes | bigint | |
| uploaded_at | timestamptz | |

### 5.5 `line_bindings`

| 欄位 | 型別 | 備註 |
|---|---|---|
| line_user_id | text | PK |
| reporter_phone | text | nullable，可在 LINE OA 中綁定後填 |
| reporter_email | text | nullable |
| reporter_name | text | nullable |
| reporter_company | text | nullable |
| linked_at | timestamptz | |

> 「下次帶入舊資料」依 `line_user_id` 從此表撈，不從 `cases` 撈（避免被匿名化後失效）。

### 5.6 `consent_versions`

存歷次隱私告知聲明的內容快照，搭配 `cases.consent_text_version` 可還原同意當下看的是哪個版本。

### 5.7 `query_attempts`（LINE OA 查詢驗證紀錄）

| 欄位 | 型別 | 備註 |
|---|---|---|
| id | uuid | PK |
| line_user_id | text | 提交查詢的 LINE userId |
| case_no_attempted | text | 客戶輸入的編號 |
| phone_last4_attempted | text | 客戶輸入的末四碼（雜湊或留明文後續匿名化） |
| success | boolean | 驗證通過與否 |
| attempted_at | timestamptz | |

> 用於 4.4.3 的 rate limiting 邏輯與後台告警偵測。同一案件被匿名化時，`query_attempts` 中對應紀錄一併清除。

---

## 6. 個資法（PDPA）遵循

**法源**：個人資料保護法（民國 112 年最新版）+ 個人資料保護法施行細則（2026-05-07 已從全國法規資料庫驗證）

### 6.1 隱私告知聲明（須含內容，依第 8 條）

1. **蒐集機關名稱**：（公司名稱待填）
2. **蒐集目的**：「處理您的維修申請、案件進度追蹤、與您聯絡確認案情」
3. **個資類別**：「姓名、聯絡電話、電子郵件、所屬單位、報修地點、影像紀錄（照片/影片）」
4. **利用期間**：「自結案之翌日起 2 年；期滿系統將自動匿名化」
5. **利用地區**：「資料儲存與處理涉及以下境外地區：美國（Vercel、Dropbox、Neon）、日本（LINE）；未涉及將個資直接揭露給境外第三方使用」
6. **利用對象**：「本公司處理人員」
7. **利用方式**：「於本系統內部查閱、聯絡您本人」
8. **當事人權利**：「您可隨時請求查詢、複製、補充更正、停止處理利用、刪除您的個人資料；請求方式：透過本公司 LINE Official Account 提交申請」
9. **不提供之影響**：「未提供將無法為您處理本次報修」
10. **特別告知**：「本系統會記錄您的 LINE 識別碼以便下次報修時自動帶入您先前留下的基本資料；您可隨時要求停止此行為」
11. **同意確認**：勾選同意；勾選時間戳將被記錄

> 草稿待 plan 階段法務 review 後定稿，並開放版本管理。

### 6.2 法律依據（第 19 條）

- (二)契約類似關係：客戶提交報修等於對「請求維修」之契約類似關係
- (五)當事人同意：勾選同意聲明
- 雙重備援，任一條件成立即合法

### 6.3 資料保存與匿名化

| 規則 | 內容 |
|---|---|
| 保存期限 | 結案翌日起 2 年 |
| 到期處理 | 自動匿名化（不可逆），非加密 |
| 排程 | 每日 03:00 台北時間（19:00 UTC 前一天）執行 Vercel Cron Job |
| 例外 | 客戶提前透過 LINE OA 「我要刪除資料」→ 立即手動處理 |

**匿名化欄位**：

| 欄位 | 處理方式 |
|---|---|
| reporter_name | → `(已匿名)` |
| reporter_phone | → null |
| reporter_email | → null |
| line_user_id | → null |
| 報修地點若含個人地址 | → 路段層級保留，門牌移除（Phase 1 為 free text，無法自動處理；先全清為 `(已匿名)`，Phase 2 改進） |
| 媒體 | 從 Dropbox 刪除，case_media 紀錄刪除 |
| 案件編號、案件類型、立案/結案時間、處理時長、公司名稱 | 保留 |

### 6.4 當事人權利（第 11 條）

| 權利 | Phase 1 實作 |
|---|---|
| 查詢/閱覽/複製 | LINE OA「我要查詢我的資料」→ 後台同事手動回覆 |
| 補充更正 | 同上 |
| 停止處理利用 | 同上 |
| 刪除 | LINE OA「我要刪除資料」→ 後台同事手動匿名化 |

### 6.5 安全維護（施行細則第 12 條）

| 措施 | Phase 1 實作 | Phase 2 規劃 |
|---|---|---|
| 傳輸加密 | 全站 HTTPS（Vercel 預設） | — |
| 儲存加密 | Neon AES-256 at-rest（預設） | — |
| 密碼雜湊 | bcrypt | — |
| 權限控制 | role-based（staff / admin） | + 敏感欄位 JIT 授權 |
| 存取紀錄 | case_status_history 記錄狀態變更；query_attempts 記錄 LINE OA 查詢嘗試 | + access_log 記錄敏感欄位查看 |
| 客戶查詢驗證 | LINE OA 查詢需「報修編號 + 手機末四碼」雙重驗證 + rate limiting + 異常告警 | + 客戶端 LINE Login OAuth 取代 |
| 資料外洩通報 | 內部 SOP 文件（24h 內部通報、72h 通知當事人） | — |

### 6.6 委外處理（第 8 條第 7 項）

| Sub-processor | 服務 | 所在地 | DPA |
|---|---|---|---|
| Vercel | hosting / functions | 美國 / 全球 | Vercel Data Processing Agreement（標準條款） |
| Neon | Postgres | 配置時選定 region | Neon DPA |
| Dropbox | media storage | 美國 | Dropbox DPA |
| LINE | messaging | 日本 | LINE 服務條款 |

> Plan 階段確認每家是否需要單獨簽署 DPA 或其標準條款已足夠。

### 6.7 機密管理與前端資料外露禁則（硬性條款）

**原則**：所有伺服器機密絕不出現在瀏覽器 F12 / DevTools / 原始碼 view-source / JS bundle 中。

#### 6.7.1 程式碼撰寫硬性規則

- **禁止 hardcode 任何**機密、密碼、token、API key、secret、簽章金鑰、refresh token、OAuth client secret、DB connection string 進入原始碼
- **所有機密走 Vercel 環境變數**，不可在原始碼中以任何形式（含字串、註解、測試 fixture）出現實際值
- **環境變數命名禁則**：機密變數**絕不**以 `NEXT_PUBLIC_` 開頭（Next.js 會將此前綴變數注入瀏覽器 bundle）
- 來源依據：Next.js 官方環境變數規範 https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

#### 6.7.2 機密歸屬清單

| 類別 | 範例 | 存放位置 | F12 可見？ |
|---|---|---|---|
| 伺服器機密 | DB 密碼、LINE Channel Secret、Dropbox refresh token、OAuth client_secret、Auth.js secret、Webhook 簽章 | Vercel env（**無** `NEXT_PUBLIC_` 前綴）；只在 API Route / Server Component / Server Action 使用 | ❌ 絕不可見 |
| 公開識別碼 | LINE Login `client_id`、Google `client_id`、LIFF ID | Vercel env（可加 `NEXT_PUBLIC_` 前綴），或寫死於前端 | ✅ 設計上即可見；安全靠 redirect URI 白名單 |
| 使用者畫面上的資料 | 報修人姓名/手機/Email 等 | Postgres → API → 前端 | ✅ 對「有權限的本人」可見；無權限者打 API 直接被拒 |

#### 6.7.3 認證 Cookie 設定

- Auth.js session cookie 必須設定：
  - `HttpOnly`（JS 無法讀取，防 XSS 竊取）
  - `Secure`（僅 HTTPS）
  - `SameSite=Lax`（防 CSRF）
- 來源：OWASP Session Management Cheat Sheet https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

#### 6.7.4 自動防護機制（Plan 階段建立）

- **`.gitignore`** 含 `.env`、`.env.*`（已寫入 root `.gitignore`）
- **Pre-commit hook（gitleaks 或同等工具）** 阻擋誤 commit 含 secret 的檔案
- **Build-time bundle 掃描** 確認最終打包到 client 的 JS 不含任何機密 pattern
- **CI 強制檢查**：commit 含 secret 直接 fail
- 來源：gitleaks 官方文件 https://github.com/gitleaks/gitleaks

#### 6.7.5 對外 API 呼叫一律走 server-side

- **禁止**前端直接呼叫 LINE Messaging API、Dropbox API、DB（即使透過代理）
- 所有外部 API 由自家 Next.js API Route / Server Action 中轉
- 前端只跟自家 API 對話（同源），不接觸任何第三方憑證
- 此原則同時保證 6.7.1 不會被破壞

#### 6.7.6 違反處理

任何 PR 若違反 6.7.1 ~ 6.7.5：
- CI 自動 fail，禁止 merge
- code review 階段直接退件
- 已 commit 的 secret 視同**已外洩**：立即輪替該 secret，再從 git history 清除

> 此節為個資法第 12 條「安全維護義務」與施行細則第 12 條第 2 項「設備安全」「事故預防」的具體實踐。

---

### 6.8 外洩通報 SOP（內部文件，plan 階段定稿）

1. **發現**：任何同事或自動監控發現異常 → 立即通知系統管理員
2. **24 小時內**：管理員初步評估範圍、影響、原因；保存證據
3. **72 小時內**：通知受影響當事人（用 Email + LINE）；通報主管機關（依目的事業主管機關）
4. **應變**：採取阻止擴大措施（換 token、停用帳號、隔離）
5. **紀錄**：所有過程留檔，備主管機關查驗（第 12 條第 3 項）

---

## 7. 技術架構

### 7.1 技術棧

| 層 | 技術 |
|---|---|
| Framework | Next.js 15 App Router |
| UI | Tailwind CSS + shadcn/ui |
| 資料庫 | Postgres（Neon via Vercel Marketplace） |
| ORM | Drizzle |
| 認證 | Auth.js v5 |
| LINE | `@line/bot-sdk` + LINE Login OAuth |
| 媒體 | Dropbox API (App Folder) |
| Hosting | Vercel Functions（Fluid Compute，Node.js 24） |
| 排程 | Vercel Cron Jobs |
| 設定檔 | `vercel.ts`（取代 `vercel.json`） |
| 套件管理 | pnpm |

### 7.2 環境配置

| 環境 | 觸發 | 域名 | DB | LINE Channel |
|---|---|---|---|---|
| Production | `main` 分支 push | `app.<domain>` | Neon main branch | 正式 LINE OA + 正式 LINE Login |
| Preview/Dev | feature 分支 push、PR | `<branch>-<project>.vercel.app` | Neon dev branch | 測試 LINE OA + 測試 LINE Login |

> Neon 的 branching 功能讓兩環境用同一專案的不同 branch，免費額度足夠。

### 7.3 部署流程

1. 開發者推送 feature 分支 → Vercel 自動部署 Preview → 取得 Preview URL
2. 在 Preview 環境驗證功能（含 LINE 測試）
3. 開 PR 到 `main`
4. Merge → Vercel 自動部署 Production

### 7.4 設定檔範例（`vercel.ts`）

```ts
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    {
      path: '/api/cron/anonymize-expired',
      schedule: '0 19 * * *', // 03:00 Asia/Taipei
    },
  ],
};
```

---

## 8. 外部相依與設定

> 詳細「click-by-click」步驟在 plan 階段提供（依使用者「外部設定要詳細列步驟」規則）。本節列出需要設定的服務清單。

| 服務 | 用途 | Phase 1 需要的數量 |
|---|---|---|
| LINE Developer Console | 申請 Messaging API channel × 2、LINE Login channel × 2 | 4 個 channel |
| Google Cloud Console | OAuth 2.0 client（管理員 Google 登入）× 2（兩環境各一） | 2 |
| Dropbox App Console | App + App Folder + refresh token × 2 | 2 |
| Vercel Marketplace | 安裝 Neon integration | 1 |
| 域名 DNS | 將 `app.<domain>` CNAME 到 Vercel | 1 |
| GitHub | Repo 連到 Vercel 觸發部署 | 1 |

---

## 9. 風險與假設

| 項目 | 假設 / 風險 | 緩解 |
|---|---|---|
| LINE Channel 申請週期 | 假設使用者已有公司 LINE OA 或可在 1 週內申請完 | 若無，Phase 1 上線時間延後；可先用個人開發測試 |
| 域名 DNS 生效時間 | 假設 < 24h | 期間用 Vercel 預設網址測試 |
| Dropbox App quota | 免費 plan 上限 200,000 API call/month | 若不足，升級或評估搬到 Cloudflare R2 |
| Neon free tier | 0.5 GB 儲存、3 GB egress/月 | Phase 1 預估遠低於上限；若達上限升級 |
| LINE Webhook 必須 HTTPS | Vercel 預設給 SSL，符合 | — |
| LINE OA 查詢被列舉/探測 | 報修編號每日序號可推測 | 雙重驗證（編號 + 手機末四碼）+ rate limiting + 異常告警；最小揭露原則 |
| Phase 1 不做客戶端登入 | 假設客戶資料已在表單中收齊；不需身份驗證即可建案 | 若有惡意大量送出，Phase 2 加 reCAPTCHA |
| 個資外洩 | 任何雲端服務都有風險 | 走 6.8 SOP；保險評估在 plan 階段考慮 |

---

## 10. Phase 2 預留項目（不在本 spec 實作範圍）

僅列項目以說明 Phase 1 設計如何為其鋪路：

- 客戶公司管理員角色（multi-tenant；`tenant_id` 已預留）
- LINE OA 自動列出綁定客戶所有案件
- 後台敏感資料預設遮罩 + JIT 授權 + 完整稽核紀錄（施行細則第 12 條對應）
- 「我已離職」LINE 觸發立即匿名化
- 4 環境（Dev / Stage / Demo / Prod）
- 報修地點結構化（公司+樓層下拉）
- reCAPTCHA / 防灌水
- Phase 2 啟動前重新做一輪 brainstorm

---

## 11. 待 plan 階段處理的後續工作

- [ ] Fetch 個資法第 41 條起的罰則章驗證最新罰鍰
- [ ] Fetch 個資法施行細則第 12 條第 2 項全文 11 項目
- [ ] 隱私告知聲明草稿正式定稿（含公司名稱、聯絡窗口）
- [ ] 各 sub-processor DPA 條款確認
- [ ] GitHub repo 建立、與 Vercel 連動
- [ ] 第一次 LINE Channel 申請（生產 + 測試）
- [ ] Domain DNS 設定步驟
- [ ] Dropbox App 申請與 refresh token 取得
- [ ] Drizzle schema DDL 完整版
- [ ] 報修編號每日序號的 race condition 處理（advisory lock 或 sequence）
- [ ] 隱私告知文字版本管理機制（資料表 + 同意時 freeze 版本號）

---

## 附錄 A：本文件遵循的工作規則

依使用者於 2026-05-07 確立的協作規則撰寫：

- 所有法律引用均註明條文出處與從《全國法規資料庫》驗證
- 所有技術建議均註明官方文件來源
- Phase 1 範圍嚴格控制，不擴張
- Phase 2 項目僅列出，不寫實作細節

## 附錄 B：條文引用來源

| 引用 | 來源 |
|---|---|
| 個人資料保護法第 5、8、11、12、19、20、28-31 條 | 全國法規資料庫 https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021 |
| 個人資料保護法施行細則第 12 條 | 全國法規資料庫 https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050022 |
| Vercel Cron Jobs | https://vercel.com/docs/cron-jobs |
| LINE Login | https://developers.line.biz/en/docs/line-login/ |
| LINE Messaging API | https://developers.line.biz/en/docs/messaging-api/ |
| Dropbox API v2 | https://www.dropbox.com/developers/documentation/http/documentation |
| Neon Security | https://neon.tech/docs/security/security-overview |
| GDPR Article 4(5) Pseudonymization | https://gdpr-info.eu/art-4-gdpr/ |
