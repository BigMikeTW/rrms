# RRMS Phase 1 — Plan 8: Anonymization Cron + Production Cutover

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。

> **給人類使用者**：Phase 1 第 8/8 份。依賴 Plan 1-7。**完成本計畫即正式上線。**

**Goal:** 實作匿名化 Cron Job（每日 03:00 Asia/Taipei，把結案翌日起算超過 2 年的案件自動匿名化，含 Dropbox 媒體刪除）；設定 production 環境（網域 DNS、production LINE channel + Webhook、Dropbox prod app、Google OAuth prod credentials、Resend email）；建立上線前檢查清單與紅隊匿名化驗證；最終正式切換到 production domain。

**Architecture:** Vercel Cron Job 觸發 `/api/cron/anonymize-expired`；該 endpoint 用 `CRON_SECRET` header 驗證、再批次 update cases + delete 對應 case_media + Dropbox file；對每個被匿名化的 case 在內部記錄一行 audit；DNS 由你網域商指 CNAME 到 Vercel；production 各家 secrets 全走 Vercel env production 範圍，preview env 仍保留 dev secrets。

**Tech Stack:**
- Vercel Cron Jobs（vercel.ts crons 區段）
- Resend（透過 Vercel Marketplace；Phase 2 Plan 已預留）
- 既有 Dropbox / LINE / Drizzle

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 6.3 資料保存與匿名化（自動排程） | Task 1-3 |
| 7.4 vercel.ts cron 設定範例 | Task 1 |
| 11. 上線前置作業（DNS、domain、env） | Task 5-9 |
| 攻擊測試 匿名化排程 | Task 4 |
| 9. 風險與假設 | 全 plan 即上線收尾 |

---

## File Structure

```
src/
├── app/
│   └── api/
│       └── cron/
│           └── anonymize-expired/
│               └── route.ts
├── lib/
│   └── anonymize.ts                  # 匿名化核心邏輯
docs/
└── runbook/
    ├── pre-launch-checklist.md
    └── post-launch-monitoring.md
__tests__/
└── cron/
    └── anonymize.spec.ts
vercel.ts                              # 加入 crons 設定
```

---

## Pre-Tasks

- [ ] Plan 7 全部驗收通過
- [ ] 你已備妥網域 `pro080.com`（已決定）；DNS 設定權限在你手上
- [ ] 你已通知公司同事「即將正式啟用，準備接單」

---

## Task 0: Pre-code Research Gate

| 技術 | URL |
|---|---|
| Vercel Cron Jobs | https://vercel.com/docs/cron-jobs |
| Vercel Cron 安全（CRON_SECRET） | https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs |
| `vercel.ts` 設定 | https://vercel.com/docs/project-configuration/vercel-ts |
| Vercel Custom Domain 設定 | https://vercel.com/docs/projects/domains |

寫 research → 確認 → commit。

---

## Task 1: 設定 Vercel Cron + 路徑

- [ ] **Step 1：修改 Plan 1 Task 14 已建立的 `vercel.ts`，加上 `crons` 欄位（不要整檔重建）**

```ts
import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/anonymize-expired",
      // 03:00 Asia/Taipei = 19:00 UTC 前一天
      schedule: "0 19 * * *",
    },
  ],
};
```

- [ ] **Step 2：在 Vercel 加環境變數 `CRON_SECRET`**

產一個 32 字元的 random：
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```powershell
vercel env add CRON_SECRET production
# 貼上
vercel env add CRON_SECRET preview
# 同樣貼上（preview 也加好讓 PR 能測試）
vercel env pull .env.local
```

- [ ] **Step 3：commit**

```powershell
git add vercel.ts
git commit -m "feat(cron): register daily anonymize-expired cron @ 03:00 Asia/Taipei"
```

---

## Task 2: 匿名化核心邏輯

- [ ] **Step 1：建立 `src/lib/anonymize.ts`**

```ts
import "server-only";
import { db } from "@/db/client";
import { cases, caseMedia } from "@/db/schema";
import { and, lte, isNull, eq, sql } from "drizzle-orm";
import { deleteDropboxFile } from "@/lib/dropbox";

interface AnonymizeResult {
  scanned: number;
  anonymized: number;
  mediaDeleted: number;
  errors: string[];
}

const ANON_NAME = "(已匿名)";

/**
 * 把所有「結案翌日起算超過 2 年」且尚未匿名化的案件處理掉。
 * 對應 spec 6.3 / 個資法第 11 條第 3 項。
 */
export async function anonymizeExpired(now: Date = new Date()): Promise<AnonymizeResult> {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 2);
  cutoff.setDate(cutoff.getDate() - 1); // 翌日起算

  const candidates = await db
    .select()
    .from(cases)
    .where(
      and(
        isNull(cases.anonymizedAt),
        sql`${cases.closedAt} IS NOT NULL`,
        lte(cases.closedAt, cutoff),
      ),
    );

  const result: AnonymizeResult = {
    scanned: candidates.length,
    anonymized: 0,
    mediaDeleted: 0,
    errors: [],
  };

  for (const c of candidates) {
    try {
      // 取媒體列表
      const media = await db
        .select()
        .from(caseMedia)
        .where(eq(caseMedia.caseId, c.id));

      // 刪 Dropbox 檔
      for (const m of media) {
        try {
          await deleteDropboxFile(m.dropboxPath);
          result.mediaDeleted += 1;
        } catch (e) {
          result.errors.push(`media delete ${m.dropboxPath}: ${e}`);
        }
      }

      // 匿名化 + 刪 case_media 紀錄
      await db.transaction(async (tx) => {
        await tx.delete(caseMedia).where(eq(caseMedia.caseId, c.id));
        await tx
          .update(cases)
          .set({
            reporterName: ANON_NAME,
            reporterPhone: "",
            reporterEmail: "",
            location: ANON_NAME,
            description: c.description, // 保留內容（無個資）
            lineUserId: null,
            anonymizedAt: now,
          })
          .where(eq(cases.id, c.id));
      });

      result.anonymized += 1;
    } catch (e) {
      result.errors.push(`case ${c.caseNo}: ${e}`);
    }
  }

  return result;
}
```

- [ ] **Step 2：commit**

```powershell
git add src/lib/anonymize.ts
git commit -m "feat(anonymize): core logic — clear PII fields + delete Dropbox media"
```

---

## Task 3: Cron API endpoint

- [ ] **Step 1：建立 `src/app/api/cron/anonymize-expired/route.ts`**

```ts
import { NextResponse } from "next/server";
import { anonymizeExpired } from "@/lib/anonymize";
import { lineClient } from "@/lib/line/client";

export async function GET(req: Request) {
  // 驗證 CRON_SECRET（Vercel 預設用 Authorization: Bearer <CRON_SECRET>）
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await anonymizeExpired();

  // 把結果推內部群組（成功 / 失敗都通報）
  const groupId = process.env.LINE_INTERNAL_GROUP_ID;
  if (groupId) {
    try {
      await lineClient.pushMessage({
        to: groupId,
        messages: [
          {
            type: "text",
            text:
              `🤖 每日匿名化排程結果\n` +
              `掃描：${result.scanned} 件\n` +
              `匿名化：${result.anonymized} 件\n` +
              `刪除媒體：${result.mediaDeleted} 個\n` +
              (result.errors.length
                ? `錯誤：${result.errors.length} 筆（見 Vercel logs）`
                : `無錯誤`),
          },
        ],
      });
    } catch (e) {
      console.error("notify push failed:", e);
    }
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 2：手動觸發測試（preview 環境）**

```powershell
git add src/app/api/cron
git commit -m "feat(cron): anonymize-expired endpoint with CRON_SECRET auth + LINE notify"
git push
```

等 Vercel preview 部署完，呼叫：

```powershell
$secret = "<剛才產生的 CRON_SECRET>"
curl https://<preview-url>/api/cron/anonymize-expired `
  -H "Authorization: Bearer $secret"
```

預期：JSON 回應 `{"scanned":0, "anonymized":0, ...}`（DB 還沒符合條件的 case，掃 0 件）。

- [ ] **Step 3：驗證未授權呼叫被擋**

```powershell
curl https://<preview-url>/api/cron/anonymize-expired
```
預期：401。

---

## Task 4: 紅隊 — 模擬已過期案件 + 驗證匿名化

- [ ] **Step 1：建立 `__tests__/cron/anonymize.spec.ts`**

```ts
// 採用 @playwright/test 的 test runner 跑這支 server-side unit test，
// 與 Plan 3 / Plan 7 共用同一套測試框架，避免引入第二套（Vitest）。
// 透過 `pnpm exec playwright test --project=node ...` 執行（playwright.config 內已定義 node-only project）。
import { test, expect } from "@playwright/test";
import { db } from "@/db/client";
import { cases, caseMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { anonymizeExpired } from "@/lib/anonymize";

test("case closed > 2 years ago + 1 day is anonymized", async () => {
  const past = new Date();
  past.setFullYear(past.getFullYear() - 2);
  past.setDate(past.getDate() - 5); // 結案於 2 年又 5 天前

  const caseNo = "RPR-19990101000"; // 假編號
  // seed 一個結案的案件（測試專用）
  await db.insert(cases).values({
    caseNo,
    reporterName: "測試人",
    reporterPhone: "0912345678",
    reporterEmail: "test@example.com",
    reporterCompany: "測試公司",
    location: "測試地點",
    description: "測試內容",
    status: "completed",
    consentAt: past,
    consentTextVersion: "v1",
    filedAt: past,
    closedAt: past,
  });

  const result = await anonymizeExpired();

  expect(result.anonymized).toBeGreaterThan(0);

  const c = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  expect(c?.reporterName).toBe("(已匿名)");
  expect(c?.reporterPhone).toBe("");
  expect(c?.reporterEmail).toBe("");
  expect(c?.lineUserId).toBeNull();
  expect(c?.anonymizedAt).not.toBeNull();
});

test("case closed < 2 years ago is NOT anonymized", async () => {
  const recent = new Date();
  recent.setMonth(recent.getMonth() - 6);

  const caseNo = "RPR-20251101000";
  await db.insert(cases).values({
    caseNo,
    reporterName: "近期人",
    reporterPhone: "0912345678",
    reporterEmail: "recent@example.com",
    reporterCompany: "近期公司",
    location: "近期地點",
    description: "近期內容",
    status: "completed",
    consentAt: recent,
    consentTextVersion: "v1",
    filedAt: recent,
    closedAt: recent,
  });

  const result = await anonymizeExpired();
  const c = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  expect(c?.reporterName).toBe("近期人");
  expect(c?.anonymizedAt).toBeNull();
});
```

- [ ] **Step 2：跑測試 + commit**

```powershell
pnpm exec playwright test __tests__/cron/anonymize.spec.ts
git add __tests__
git commit -m "test(security): red-team anonymization respects 2-year retention"
```

---

## Task 5: 上線前置 — Production LINE channel 切換

> 此前 Plan 3 + Plan 6 已在 dev channel 設好；上線前要把 production channel 拉成同步狀態。

- [ ] **Step 1：開啟 production LINE OA**

到 https://developers.line.biz/console/，找到 Plan 6 已建的 `RRMS OA (prod)`：
- Webhook URL：填 `https://rrms.pro080.com/api/line/webhook`
- Use webhook：開
- 把對應 secret 填到 Vercel **production** scope：

```powershell
vercel env add LINE_MESSAGING_CHANNEL_SECRET production
vercel env add LINE_MESSAGING_CHANNEL_ACCESS_TOKEN production
vercel env add LINE_LOGIN_CHANNEL_ID production
vercel env add LINE_LOGIN_CHANNEL_SECRET production
vercel env add LINE_INTERNAL_GROUP_ID production
```

- [ ] **Step 2：在 production OA 註冊 Rich Menu**

```powershell
$env:LINE_MESSAGING_CHANNEL_ACCESS_TOKEN="<prod token>"
pnpm tsx scripts/register-rich-menu.ts
```

- [ ] **Step 3：跟我回報「prod LINE 已備好」**

---

## Task 6: 上線前置 — Production Google OAuth + Dropbox + LIFF

- [ ] **Step 1：建 Production Google OAuth client**

到 Google Cloud Console，**用同一個 RRMS 專案再建一個 OAuth client**：
1. Authorized redirect URI 填 `https://rrms.pro080.com/api/auth/callback/google`
2. 拿 client ID + secret，加進 Vercel production env：

```powershell
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

- [ ] **Step 2：建 Production Dropbox App**

依 Plan 5 Task 1 同樣流程，建一個 app `RRMS-prod`，設成 App folder + 同樣 permissions，拿 refresh token：

```powershell
vercel env add DROPBOX_APP_KEY production
vercel env add DROPBOX_APP_SECRET production
vercel env add DROPBOX_REFRESH_TOKEN production
```

- [ ] **Step 3：建 Production LIFF**

到 LINE Developer Console → RRMS OA (prod) → LIFF → Add，Endpoint URL 填 `https://rrms.pro080.com/liff/report`，拿 LIFF ID：

```powershell
vercel env add NEXT_PUBLIC_LIFF_ID production
```

- [ ] **Step 4：跟我回報「production secrets 全填好」**

---

## Task 7: 上線前置 — DNS 設定

> 此步驟你網域商不同步驟略有差異。以 GoDaddy / Cloudflare / 中華電信為例。

- [ ] **Step 1：在 Vercel 加兩個 domain（production + dev）**

1. Vercel Dashboard → RRMS 專案 → Settings → Domains
2. Add：填 `rrms.pro080.com`，分配到 production（main 分支）
3. Add：填 `rrms-dev.pro080.com`，分配到 preview（dev / feature 分支用同一個固定網址）
4. Vercel 顯示兩條 DNS CNAME 紀錄要在你網域商後台加

- [ ] **Step 2：到網域商後台改 DNS（加兩條 CNAME）**

需要加的紀錄：

| 子網域 | Type | Value（Vercel 提供） |
|---|---|---|
| `rrms` | CNAME | `cname.vercel-dns.com.`（或 Vercel UI 顯示的值） |
| `rrms-dev` | CNAME | 同上 |

#### 2A. 若用 Cloudflare：

1. Cloudflare Dashboard → `pro080.com`
2. DNS → Add record
3. **第一條**：Type CNAME / Name `rrms` / Target Vercel 給的值 / Proxy status **DNS only**（關 proxy）
4. **第二條**：Type CNAME / Name `rrms-dev` / Target Vercel 給的值 / Proxy status **DNS only**
5. 各自按 Save

#### 2B. 若用 GoDaddy：

1. My Domains → `pro080.com` → DNS Management
2. **第一條**：Add Type CNAME / Name `rrms` / Value Vercel 給的值 / TTL 1 Hour
3. **第二條**：Add Type CNAME / Name `rrms-dev` / Value 同上 / TTL 1 Hour
4. Save

#### 2C. 若用中華電信 / TWNIC：

1. 登入 https://rsdomain.cdsi.com.tw/
2. 找 `pro080.com` → 修改 DNS 設定
3. 加 CNAME `rrms` → Vercel 值
4. 加 CNAME `rrms-dev` → Vercel 值

- [ ] **Step 3：等 DNS 生效（5 分鐘到 24 小時）**

```powershell
nslookup rrms.pro080.com
nslookup rrms-dev.pro080.com
```
兩條都要指向 Vercel 才算生效。

- [ ] **Step 4：在 Vercel 確認 domain 狀態**

Settings → Domains 看到 `rrms.pro080.com` 與 `rrms-dev.pro080.com` 兩條都顯示 ✅ Valid Configuration。

- [ ] **Step 5：跟我回報「DNS 生效」**

---

## Task 8: 上線檢查清單

- [ ] **Step 1：建立 `docs/runbook/pre-launch-checklist.md`**

```markdown
# RRMS Phase 1 上線檢查清單

執行日期：（填）

## 程式碼

- [ ] main 分支 CI 全綠（最近一次 push）
- [ ] Plan 1-8 所有 Definition of Done 都打勾
- [ ] 五層防禦紅隊測試全 PASS
- [ ] Plan 3-7 攻擊測試全 PASS
- [ ] Dependabot 啟用，無未處理 high+ alert
- [ ] ZAP daily scan 最近一次無 high+

## Production 環境

- [ ] **Vercel plan = Pro 已確認**（非 Hobby Free；[Vercel Hobby 禁商用 TOS](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)）
- [ ] Vercel billing email 已設定且受 Mike 大監控（避免續訂失敗導致服務中斷）
- [ ] DNS 指向 Vercel 並 SSL 正常
- [ ] `https://rrms.pro080.com` 可開啟 RRMS 首頁
- [ ] LINE OA prod webhook URL 填正式 domain，已 Verify 200
- [ ] Google OAuth prod redirect URI 含正式 domain
- [ ] Dropbox prod app 已建，refresh token 在 production env
- [ ] 全部 production env vars 已填（清單見 Task 9）

## 帳號 / 資料

- [ ] 至少一個 admin 帳號已 seed
- [ ] consent_versions v1 已 seed
- [ ] Rich Menu 已在 prod OA 註冊並設為預設

## 測試

- [ ] 在正式 domain 上完整跑一次「填表 → LINE 通知 → 後台改狀態 → 客戶 LINE 收到變更」
- [ ] 在正式 domain LIFF 開啟、看到登入流程
- [ ] LINE OA 雙重驗證查詢實機測試一次

## 文件

- [ ] README.md 在 GitHub 上可讀
- [ ] docs/security/incident-response-playbook.md 完成
- [ ] 個資告知聲明 v1 公司名稱、聯絡窗口已正式填寫

## 備援

- [ ] Neon 自動備份已開啟（Vercel Marketplace 預設）
- [ ] CRON_SECRET 已存於管理員密碼管理工具
- [ ] 全部 secret 至少有兩位人員知道存放位置（避免 bus factor）

## 公告

- [ ] 公司同事已加 prod LINE OA 為好友，並進到內部群組
- [ ] 已通知客戶端聯絡窗口提供正式網址
```

- [ ] **Step 2：建立 `docs/runbook/post-launch-monitoring.md`**

```markdown
# RRMS 上線後監控

## 每天

- [ ] 看內部 LINE 群組「每日匿名化排程結果」訊息
- [ ] 若有匿名化錯誤訊息 → 立即看 Vercel logs

## 每週

- [ ] 看 GitHub Security 分頁有無新 Dependabot alert
- [ ] 看 GitHub Actions 是否有 ZAP daily 連續 fail

## 每月

- [ ] 紙上推演一次 spec 6.8 外洩通報 SOP
- [ ] 確認帳號狀態（停用離職同事帳號）
- [ ] 確認 consent_versions 是否需更新（公司營運變動觸發 v2）

## 應急

任何客戶反應「看到別人的資料」「我的資料外洩」時：
立即啟動 spec 6.8 SOP + docs/security/incident-response-playbook.md
```

- [ ] **Step 3：commit**

```powershell
git add docs/runbook
git commit -m "docs(runbook): pre-launch checklist + post-launch monitoring"
```

---

## Task 9: Production env vars 完整清單核對

- [ ] **Step 1：清單核對**

```powershell
vercel env ls production
```

確認以下全部存在於 production scope：

```
DATABASE_URL                          ← Plan 3
DATABASE_URL_UNPOOLED                 ← Plan 3
BETTER_AUTH_SECRET                    ← Plan 3
BETTER_AUTH_URL                       ← Plan 3 (改為正式 domain)
GOOGLE_CLIENT_ID                      ← Task 6
GOOGLE_CLIENT_SECRET                  ← Task 6
LINE_LOGIN_CHANNEL_ID                 ← Task 5
LINE_LOGIN_CHANNEL_SECRET             ← Task 5
LINE_MESSAGING_CHANNEL_SECRET         ← Task 5
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN   ← Task 5
LINE_INTERNAL_GROUP_ID                ← Task 5
DROPBOX_APP_KEY                       ← Task 6
DROPBOX_APP_SECRET                    ← Task 6
DROPBOX_REFRESH_TOKEN                 ← Task 6
NEXT_PUBLIC_LIFF_ID                   ← Task 6
NEXT_PUBLIC_APP_ENV=production
CRON_SECRET                           ← Task 1
```

- [ ] **Step 2：確認 BETTER_AUTH_URL 改為正式網域**

```powershell
vercel env rm BETTER_AUTH_URL production
vercel env add BETTER_AUTH_URL production
# 填 https://rrms.pro080.com
```

- [ ] **Step 3：跟我回報「全部 production env 確認」**

---

## Task 10: 切換 production 域名

- [ ] **Step 1：把 `rrms.pro080.com` 設為 production assignment**

Vercel Dashboard → Settings → Domains，把 `rrms.pro080.com` 設為 production branch（main）的對應域名。

- [ ] **Step 2：觸發一次 production 部署**

```powershell
git commit --allow-empty -m "chore: trigger production deploy on real domain"
git push origin main
```

- [ ] **Step 3：等 production 部署完，連 https://rrms.pro080.com**

確認：
- 首頁正常
- /report 表單可送出
- /admin 登入流程正常
- LINE OA 可加好友、Rich Menu 出現
- 客戶送出報修 → 內部群組收到通知
- 後台改狀態 → 客戶 LINE 收到通知（若已綁定 LINE）

- [ ] **Step 4：完整跑一輪上線檢查清單**

照 `docs/runbook/pre-launch-checklist.md` 一條條打勾。任何一條不過 → 修正 → 重新跑該條 → 全部過才算上線完成。

- [ ] **Step 5：commit + tag**

```powershell
git tag v1.0.0-phase1
git push origin v1.0.0-phase1
```

---

## Plan 8 驗收條件（也是 Phase 1 整體上線條件）

- [ ] Cron job 在 Vercel Dashboard 顯示已註冊
- [ ] 手動觸發 `/api/cron/anonymize-expired` 含正確 secret 回 200
- [ ] 不含 secret 呼叫回 401
- [ ] 紅隊測試 `__tests__/cron/anonymize.spec.ts` PASS（已過期被匿名化、未過期保留）
- [ ] DNS 生效，`https://rrms.pro080.com` 可訪
- [ ] Production LINE / Google / Dropbox 全部 secrets 已設
- [ ] 上線檢查清單全部打勾
- [ ] 公開示範：在 production domain 完整跑一次「客戶報修 → 員工接收 → 改狀態 → 客戶查詢」
- [ ] git tag `v1.0.0-phase1` 已 push
- [ ] **Phase 1 資料庫終態 13 表已驗證**（drizzle studio 看得到：Plan 3 產 10 表 + Plan 4 加 `rate_limit_buckets` + Plan 7 加 `oa_conversations`、`customer_requests` = 13）

---

## Self-Review

- ✅ Spec 6.3 匿名化規則完整實作（含媒體刪除、欄位清空、anonymizedAt 時間戳）
- ✅ Spec 7.4 vercel.ts cron 與官方範例一致
- ✅ Spec 11 待 plan 處理事項全數消化
- ⚠️ Resend / 啟用信寄送在 Plan 3 標 TODO，Phase 2 補（Phase 1 用手動貼連結）
- ⚠️ Phase 2 待擴展：客戶端 admin、LINE 自動列表、JIT 敏感資料授權

---

## Phase 1 完成

到此 Phase 1 全部 8 份計畫文件完整。執行完成後：

- 公開報修系統正式運轉
- 後台同事可管理案件
- LINE 推播 + 查詢 + 權利請求全功能
- 五層資安防線運作中
- 個資法遵循機制就位（同意 + 保存期限 + 匿名化 + 當事人權利）
- 第二份「Phase 2 brainstorm」可在實際運作 1-3 個月後再啟動
