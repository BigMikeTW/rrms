# RRMS Phase 1 — Plan 7: LINE OA + Customer Query (雙重驗證)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。

> **給人類使用者**：Phase 1 第 7/8 份。依賴 Plan 1-6。

**Goal:** 完整 LINE Official Account 客戶體驗 — Rich Menu（查詢、刪除、查資料權利請求）；客戶在 OA 中以「報修編號 + 手機末四碼」雙重驗證查詢狀態（最小揭露）；客戶端 LIFF flow 讓綁定 LINE 的客戶下次報修時自動帶入舊資料；rate limit 防編號列舉；異常告警。通過 brute-force、編號列舉觸發告警、server-side-only 補強三個攻擊測試。

**Architecture:** Webhook handler 解析訊息 → state machine 處理「等編號 / 等末四碼 / 等其他輸入」三狀態（state 存 LINE userId 為 key、PG 為 store，TTL 5 分鐘）；查詢通過時呼叫專用 server function 撈最小欄位；rate limiter 整合 query_attempts 表既有設計；異常告警直接 push 內部群組。LIFF 用獨立子網域 `/liff/report` 接收 LINE 帶來的 idToken 解析 LINE userId 並從 line_bindings 預填表單。

**Tech Stack:**
- @line/bot-sdk Reply / Push / Rich Menu
- LIFF v2 SDK（瀏覽器端載入）
- 簡易 PG state machine 表 `oa_conversations`
- 既有 query_attempts 表

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 4.4.3 LINE OA 功能 + 雙重驗證流程 + Rate limiting | Task 4-6 |
| 4.1 LINE 帶入舊資料規則（LIFF） | Task 7 |
| 5.5 line_bindings | Task 7 |
| 5.7 query_attempts | Task 5 |
| 6.4 當事人權利請求 | Task 8 |
| 攻擊測試 雙重驗證 brute force / 編號列舉告警 / server-side-only | Task 9-11 |

---

## File Structure

```
src/
├── lib/
│   └── line/
│       ├── conversations.ts        # PG-backed conversation state
│       ├── query.ts                # 雙重驗證 + 最小揭露
│       ├── rate-limit-query.ts     # query_attempts based rate limit
│       └── rich-menu.ts            # 註冊 Rich Menu
├── app/
│   ├── api/
│   │   └── line/
│   │       └── webhook/
│   │           └── route.ts        # Plan 6 已建；本計畫擴充處理客戶訊息
│   └── liff/
│       └── report/
│           └── page.tsx            # LIFF 進入點
scripts/
└── register-rich-menu.ts          # 一次性執行：建 + 上傳 menu image + 設預設

__tests__/
└── line-oa/
    ├── query-bruteforce.spec.ts
    ├── case-no-enumeration-alert.spec.ts
    └── server-side-only.spec.ts
```

---

## Pre-Tasks

- [ ] Plan 6 全部驗收通過
- [ ] LINE OA dev/prod 兩個 channel、webhook 已連線

---

## Task 0: Pre-code Research Gate

| 技術 | URL |
|---|---|
| LINE Rich Menu | https://developers.line.biz/en/reference/messaging-api/#rich-menu |
| LINE Reply Message | https://developers.line.biz/en/reference/messaging-api/#send-reply-message |
| LIFF v2 SDK | https://developers.line.biz/en/reference/liff/ |
| LIFF init + getProfile | https://developers.line.biz/en/reference/liff/#init |

寫 research → 確認 → commit。

---

## Task 1: 擴 schema — oa_conversations

`src/db/schema.ts`：

```ts
export const oaConversations = pgTable("oa_conversations", {
  lineUserId: text("line_user_id").primaryKey(),
  state: text("state").notNull(), // e.g. 'awaiting_case_no' / 'awaiting_phone_last4'
  contextJson: text("context_json"), // 暫存中途資料，例如 case_no
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

跑 migration、commit：
```powershell
pnpm db:generate
pnpm db:push
git add src/db drizzle
git commit -m "feat(line): oa_conversations table for state machine"
```

---

## Task 2: Conversation state helpers

- [ ] **Step 1：建立 `src/lib/line/conversations.ts`**

```ts
import "server-only";
import { db } from "@/db/client";
import { oaConversations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const TTL_MS = 5 * 60 * 1000;

export async function setConv(
  lineUserId: string,
  state: string,
  context?: Record<string, unknown>,
) {
  const expiresAt = new Date(Date.now() + TTL_MS);
  const ctx = context ? JSON.stringify(context) : null;
  await db
    .insert(oaConversations)
    .values({
      lineUserId,
      state,
      contextJson: ctx,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: oaConversations.lineUserId,
      set: { state, contextJson: ctx, expiresAt, updatedAt: new Date() },
    });
}

export async function getConv(lineUserId: string) {
  const row = await db.query.oaConversations.findFirst({
    where: eq(oaConversations.lineUserId, lineUserId),
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) return null; // 過期
  return row;
}

export async function clearConv(lineUserId: string) {
  await db
    .delete(oaConversations)
    .where(eq(oaConversations.lineUserId, lineUserId));
}
```

- [ ] **Step 2：commit**

```powershell
git add src/lib/line/conversations.ts
git commit -m "feat(line): conversation state helpers (PG-backed, 5min TTL)"
```

---

## Task 3: Rate limit + query attempt 紀錄

- [ ] **Step 1：建立 `src/lib/line/rate-limit-query.ts`**

```ts
import "server-only";
import { db } from "@/db/client";
import { queryAttempts } from "@/db/schema";
import { sql, and, eq, gte } from "drizzle-orm";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_FAIL_PER_USER = 5;
const MAX_FAIL_PER_CASE = 5;

export async function recordAttempt(
  lineUserId: string,
  caseNoAttempted: string,
  phoneLast4Attempted: string,
  success: boolean,
) {
  await db.insert(queryAttempts).values({
    lineUserId,
    caseNoAttempted,
    phoneLast4Attempted,
    success,
  });
}

export async function userIsLocked(lineUserId: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(queryAttempts)
    .where(
      and(
        eq(queryAttempts.lineUserId, lineUserId),
        eq(queryAttempts.success, false),
        gte(queryAttempts.attemptedAt, since),
      ),
    );
  return (r?.c ?? 0) >= MAX_FAIL_PER_USER;
}

export async function caseNoIsBeingProbed(
  caseNoAttempted: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(queryAttempts)
    .where(
      and(
        eq(queryAttempts.caseNoAttempted, caseNoAttempted),
        eq(queryAttempts.success, false),
        gte(queryAttempts.attemptedAt, since),
      ),
    );
  return (r?.c ?? 0) >= MAX_FAIL_PER_CASE;
}
```

- [ ] **Step 2：commit**

```powershell
git add src/lib/line/rate-limit-query.ts
git commit -m "feat(line): query rate limit + case_no probing detection"
```

---

## Task 4: 雙重驗證查詢核心

- [ ] **Step 1：建立 `src/lib/line/query.ts`**

```ts
import "server-only";
import { db } from "@/db/client";
import { cases } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface QueryResult {
  ok: boolean;
  caseNo?: string;
  status?: string;
  filedAt?: Date;
  lastChangedAt?: Date;
}

const STATUS_LABELS: Record<string, string> = {
  filed: "已立案",
  dispatching: "派工中",
  dispatched: "已派工",
  completed: "已完成",
  cancelled: "已取消",
};

export async function queryCaseStatus(
  caseNo: string,
  phoneLast4: string,
): Promise<QueryResult> {
  const c = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  if (!c) return { ok: false };
  if (c.anonymizedAt) return { ok: false }; // 已匿名化
  if (c.reporterPhone.slice(-4) !== phoneLast4) return { ok: false };

  return {
    ok: true,
    caseNo: c.caseNo,
    status: STATUS_LABELS[c.status] ?? c.status,
    filedAt: c.filedAt,
    lastChangedAt: c.updatedAt,
  };
}
```

- [ ] **Step 2：commit**

```powershell
git add src/lib/line/query.ts
git commit -m "feat(line): minimum-disclosure case status query (case_no + phone last4)"
```

---

## Task 5: Webhook handler — 完整對話 flow

- [ ] **Step 1：擴充 `src/app/api/line/webhook/route.ts`**

```ts
import { NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line/verify-signature";
import { lineClient } from "@/lib/line/client";
import { getConv, setConv, clearConv } from "@/lib/line/conversations";
import { queryCaseStatus } from "@/lib/line/query";
import {
  recordAttempt,
  userIsLocked,
  caseNoIsBeingProbed,
} from "@/lib/line/rate-limit-query";

const CASE_NO_RE = /^RPR-\d{11}$/;
const PHONE_LAST4_RE = /^\d{4}$/;

async function reply(replyToken: string, text: string) {
  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyLineSignature(rawBody, req.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(rawBody) as {
    events: Array<{
      type: string;
      replyToken?: string;
      source: { type: string; userId?: string; groupId?: string };
      message?: { type: string; text?: string };
      postback?: { data: string };
    }>;
  };

  for (const event of body.events) {
    const userId = event.source.userId;
    if (!userId) continue;

    // Rich Menu postback
    if (event.type === "postback" && event.postback && event.replyToken) {
      const action = event.postback.data;
      if (action === "query") {
        await setConv(userId, "awaiting_case_no");
        await reply(
          event.replyToken,
          "請輸入您的報修編號（格式：RPR-YYYYMMDDXXX）",
        );
      } else if (action === "delete") {
        await reply(
          event.replyToken,
          "請輸入您報修時填的手機號碼或 Email，我們會由同事協助處理刪除請求。",
        );
        await setConv(userId, "awaiting_delete_contact");
      } else if (action === "rights") {
        await reply(
          event.replyToken,
          "請輸入您報修時填的手機號碼或 Email + 您要查詢/更正/停止處理的事項，我們會由同事協助。",
        );
        await setConv(userId, "awaiting_rights_contact");
      }
      continue;
    }

    // Text message
    if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
      const text = event.message.text!.trim();

      if (await userIsLocked(userId)) {
        await reply(
          event.replyToken,
          "您的查詢請求過於頻繁，請於 24 小時後再試。",
        );
        continue;
      }

      const conv = await getConv(userId);

      // 自動偵測：若直接送了像 case_no 的訊息
      if (CASE_NO_RE.test(text)) {
        await setConv(userId, "awaiting_phone_last4", { caseNo: text });
        await reply(
          event.replyToken,
          "請輸入您報修時留下的手機號碼末四碼（4 位數字）",
        );
        continue;
      }

      if (conv?.state === "awaiting_case_no") {
        if (!CASE_NO_RE.test(text)) {
          await reply(
            event.replyToken,
            "編號格式不正確，請重新輸入（格式：RPR-YYYYMMDDXXX）",
          );
          continue;
        }
        await setConv(userId, "awaiting_phone_last4", { caseNo: text });
        await reply(
          event.replyToken,
          "請輸入您報修時留下的手機號碼末四碼（4 位數字）",
        );
        continue;
      }

      if (conv?.state === "awaiting_phone_last4") {
        if (!PHONE_LAST4_RE.test(text)) {
          await reply(event.replyToken, "末四碼格式不正確，請重新輸入 4 位數字");
          continue;
        }
        const ctx = JSON.parse(conv.contextJson ?? "{}") as { caseNo?: string };
        const caseNo = ctx.caseNo ?? "";
        const result = await queryCaseStatus(caseNo, text);
        await recordAttempt(userId, caseNo, text, result.ok);

        if (result.ok) {
          await reply(
            event.replyToken,
            `案件 ${result.caseNo}\n` +
              `狀態：${result.status}\n` +
              `立案：${result.filedAt!.toISOString().slice(0, 16)}\n` +
              `最近更新：${result.lastChangedAt!.toISOString().slice(0, 16)}`,
          );
        } else {
          await reply(event.replyToken, "資料不正確，請確認後再試。");
          // 若該案件被列舉嘗試 → 推內部群組告警
          if (await caseNoIsBeingProbed(caseNo)) {
            await lineClient.pushMessage({
              to: process.env.LINE_INTERNAL_GROUP_ID!,
              messages: [
                {
                  type: "text",
                  text: `⚠️ 案件 ${caseNo} 在 24h 內被驗證失敗 ≥5 次，可能有人嘗試列舉，請留意。`,
                },
              ],
            });
          }
        }
        await clearConv(userId);
        continue;
      }

      // 預設：解釋怎麼操作
      await reply(
        event.replyToken,
        "請點底下選單操作，或直接傳您的報修編號（RPR-YYYYMMDDXXX）開始查詢。",
      );
    }
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/api/line/webhook/route.ts
git commit -m "feat(line): full webhook flow — query verify + rate limit + alert"
```

---

## Task 6: Rich Menu 註冊腳本

- [ ] **Step 1：準備 menu image**

依 LINE 規格製作 2500x1686 PNG，三個按鈕區（每區 833x843，水平排列），可用 Canva 或設計師繪製。檔案放 `assets/rich-menu-2026-05.png`。

> Phase 1 簡化：用純色按鈕加文字也行。

- [ ] **Step 2：建立 `scripts/register-rich-menu.ts`**

```ts
import "dotenv/config";
import { messagingApi, MessagingApiBlobClient } from "@line/bot-sdk";
import { readFileSync } from "node:fs";

const api = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN!,
});
const blob = new MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN!,
});

async function main() {
  const richMenu = await api.createRichMenu({
    size: { width: 2500, height: 843 },
    selected: true,
    name: "RRMS Main",
    chatBarText: "選單",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "postback", data: "query", displayText: "查詢案件狀態" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "postback", data: "rights", displayText: "查詢/更正我的資料" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "postback", data: "delete", displayText: "我要刪除資料" },
      },
    ],
  });
  const richMenuId = richMenu.richMenuId;

  await blob.setRichMenuImage(
    richMenuId,
    new Blob([readFileSync("./assets/rich-menu-2026-05.png")], {
      type: "image/png",
    }),
  );

  await api.setDefaultRichMenu(richMenuId);
  console.log(`Rich menu set as default: ${richMenuId}`);
}
main();
```

- [ ] **Step 3：執行（一次性）**

```powershell
pnpm tsx scripts/register-rich-menu.ts
```

- [ ] **Step 4：手動測試**

加 OA dev 為好友 → 看到底下選單三按鈕。

- [ ] **Step 5：commit**

```powershell
git add scripts/register-rich-menu.ts
git commit -m "feat(line): rich menu registration script"
```

---

## Task 7: LIFF — 帶入舊資料 flow

- [ ] **Step 1：使用者手動 — 建 LIFF app**

1. 到 LINE Developer Console → RRMS OA channel
2. 上方分頁 `LIFF` → Add
3. LIFF app name: `RRMS Report`
4. Size: `Full`
5. Endpoint URL: `https://rrms.pro080.com/liff/report`
6. Scope: 勾 `profile`、`openid`
7. 按 Add → 拿到 LIFF ID

```powershell
vercel env add NEXT_PUBLIC_LIFF_ID
# 填 LIFF ID
vercel env pull .env.local
```

- [ ] **Step 2：建立 `src/app/liff/report/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import liff from "@line/liff";

export default function LiffReportPage() {
  const [profile, setProfile] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [prefilled, setPrefilled] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
  }>({});

  useEffect(() => {
    (async () => {
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      const p = await liff.getProfile();
      setProfile({ userId: p.userId, displayName: p.displayName });

      // Server fetch line_bindings
      const r = await fetch(`/api/liff/binding?userId=${encodeURIComponent(p.userId)}`);
      if (r.ok) {
        const data = await r.json();
        setPrefilled(data ?? {});
      }
    })();
  }, []);

  if (!profile) return <main className="p-6">載入中…</main>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">報修申請（已綁定 {profile.displayName}）</h1>
      <p className="mb-4 text-sm text-gray-600">
        系統已自動帶入您先前報修的基本資料，您可以修改後再送出。
      </p>
      {/* 重複利用 ReportForm，但傳入 prefilled */}
      {/* 為簡化此處內嵌精簡表單；實作時應拆共用 form */}
      <form action="/api/case" method="POST">
        <input type="hidden" name="lineUserId" value={profile.userId} />
        <input
          name="reporterName"
          defaultValue={prefilled.name}
          required
          className="my-2 block w-full rounded border p-2"
        />
        <input
          name="reporterPhone"
          defaultValue={prefilled.phone}
          required
          pattern="^09\d{8}$"
          className="my-2 block w-full rounded border p-2"
        />
        <input
          name="reporterEmail"
          defaultValue={prefilled.email}
          required
          type="email"
          className="my-2 block w-full rounded border p-2"
        />
        <input
          name="reporterCompany"
          defaultValue={prefilled.company}
          required
          className="my-2 block w-full rounded border p-2"
        />
        <input
          name="location"
          required
          placeholder="報修地點"
          className="my-2 block w-full rounded border p-2"
        />
        <textarea
          name="description"
          required
          rows={5}
          placeholder="故障情形"
          className="my-2 block w-full rounded border p-2"
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required />
          <span>我已閱讀並同意 <a href="/consent/v1" target="_blank" className="underline">隱私權告知聲明</a></span>
        </label>
        <button className="mt-4 w-full rounded bg-black p-2 text-white">送出</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3：建立 `src/app/api/liff/binding/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { lineBindings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);
  const row = await db.query.lineBindings.findFirst({
    where: eq(lineBindings.lineUserId, userId),
  });
  if (!row) return NextResponse.json({});
  return NextResponse.json({
    name: row.reporterName,
    phone: row.reporterPhone,
    email: row.reporterEmail,
    company: row.reporterCompany,
  });
}
```

- [ ] **Step 4：在送出時更新 line_bindings + cases.lineUserId**

修改 `src/app/report/actions.ts` submitReport：

```ts
const lineUserId = formData.get("lineUserId");
// ... existing code ...

await db.transaction(async (tx) => {
  await tx.insert(cases).values({
    // ... existing ...
    lineUserId: typeof lineUserId === "string" ? lineUserId : null,
  });

  if (typeof lineUserId === "string" && lineUserId) {
    await tx
      .insert(lineBindings)
      .values({
        lineUserId,
        reporterName: data.reporterName,
        reporterPhone: data.reporterPhone,
        reporterEmail: data.reporterEmail,
        reporterCompany: data.reporterCompany,
      })
      .onConflictDoUpdate({
        target: lineBindings.lineUserId,
        set: {
          reporterName: data.reporterName,
          reporterPhone: data.reporterPhone,
          reporterEmail: data.reporterEmail,
          reporterCompany: data.reporterCompany,
          linkedAt: new Date(),
        },
      });
  }
});
```

- [ ] **Step 5：commit**

```powershell
git add src/app/liff src/app/api/liff src/app/report/actions.ts
git commit -m "feat(line): LIFF flow — prefill from line_bindings + write back on submit"
```

---

## Task 8: 隱私權利請求 — 後台處理介面

- [ ] **Step 1：把 conv state `awaiting_delete_contact` / `awaiting_rights_contact` 寫入 `customer_requests` 表**

擴 schema：

```ts
export const customerRequests = pgTable("customer_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // 'delete' | 'rights'
  lineUserId: text("line_user_id"),
  contactInfo: text("contact_info").notNull(),
  status: text("status").notNull().default("open"), // 'open' | 'in_progress' | 'closed'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closedByUserId: uuid("closed_by_user_id").references(() => users.id),
  notes: text("notes"),
});
```

migration、commit。

- [ ] **Step 2：在 webhook flow 中接到 `awaiting_delete_contact` / `awaiting_rights_contact` 時插入此表**

修改 `src/app/api/line/webhook/route.ts` 加：

```ts
if (conv?.state === "awaiting_delete_contact" || conv?.state === "awaiting_rights_contact") {
  await db.insert(customerRequests).values({
    type: conv.state === "awaiting_delete_contact" ? "delete" : "rights",
    lineUserId: userId,
    contactInfo: text,
  });
  await clearConv(userId);
  await reply(
    event.replyToken,
    "已收到您的請求，我們會由同事在 7 個工作日內處理並聯絡您。",
  );
  // push 內部群組
  await lineClient.pushMessage({
    to: process.env.LINE_INTERNAL_GROUP_ID!,
    messages: [
      {
        type: "text",
        text: `🔔 客戶提交個資權利請求（${conv.state === "awaiting_delete_contact" ? "刪除" : "查詢/更正"}）：${text}`,
      },
    ],
  });
  continue;
}
```

- [ ] **Step 3：建立 `src/app/admin/customer-requests/page.tsx`**

```tsx
import { db } from "@/db/client";
import { customerRequests } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function CustomerRequestsPage() {
  const rows = await db
    .select()
    .from(customerRequests)
    .orderBy(desc(customerRequests.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold">客戶權利請求</h1>
      <table className="mt-4 w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">時間</th>
            <th className="p-2">類型</th>
            <th className="p-2">聯絡資訊</th>
            <th className="p-2">狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.createdAt.toISOString().slice(0, 16)}</td>
              <td className="p-2">{r.type === "delete" ? "刪除" : "查詢/更正"}</td>
              <td className="p-2">{r.contactInfo}</td>
              <td className="p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(line): customer rights request flow + admin review page"
```

---

## Task 9: 紅隊 — Brute Force 雙重驗證

- [ ] **Step 1：建立 `__tests__/line-oa/query-bruteforce.spec.ts`**

```ts
import { test, expect } from "vitest";
import { recordAttempt, userIsLocked } from "@/lib/line/rate-limit-query";
import { db } from "@/db/client";
import { queryAttempts } from "@/db/schema";

test("user is locked after 5 failed attempts within 24h", async () => {
  const userId = "U_test_brute_" + Date.now();
  // 清 prior attempts
  // 連續 5 次 failed
  for (let i = 0; i < 5; i++) {
    await recordAttempt(userId, "RPR-20260508001", "0000", false);
  }
  expect(await userIsLocked(userId)).toBe(true);
});
```

> 註：本測試直接呼叫 lib，不經 LINE webhook，因為 webhook 簽章難以模擬。Plan 8 增加端到端 webhook 驗證。

- [ ] **Step 2：跑測試 + commit**

```powershell
pnpm exec vitest run __tests__/line-oa/query-bruteforce.spec.ts
git add __tests__
git commit -m "test(security): red-team query brute force locks user after 5 fails"
```

---

## Task 10: 紅隊 — 案件編號列舉觸發告警

- [ ] **Step 1：建立 `__tests__/line-oa/case-no-enumeration-alert.spec.ts`**

```ts
import { test, expect } from "vitest";
import {
  recordAttempt,
  caseNoIsBeingProbed,
} from "@/lib/line/rate-limit-query";

test("same case_no probed by 5 different users triggers alert flag", async () => {
  const caseNo = "RPR-20260508999";
  for (let i = 0; i < 5; i++) {
    await recordAttempt(`U_probe_${i}`, caseNo, "0000", false);
  }
  expect(await caseNoIsBeingProbed(caseNo)).toBe(true);
});
```

- [ ] **Step 2：commit**

```powershell
pnpm exec vitest run
git add __tests__
git commit -m "test(security): red-team case_no enumeration triggers staff alert"
```

---

## Task 11: 紅隊 — Server-side-only 補強驗證

- [ ] **Step 1：建立 `__tests__/line-oa/server-side-only.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

test("client bundle does not contain @line/bot-sdk identifier", async () => {
  // 假設 build 已產出 .next/static
  const dir = ".next/static";
  let leaks = 0;
  for (const f of walk(dir)) {
    const content = readFileSync(f, "utf8");
    if (content.includes("@line/bot-sdk") || content.includes("MessagingApiClient")) {
      console.error(`LEAK: server SDK identifier in ${f}`);
      leaks++;
    }
  }
  expect(leaks).toBe(0);
});

function* walk(d: string): Generator<string> {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(js|mjs|css)$/.test(p)) yield p;
  }
}
```

- [ ] **Step 2：commit**

```powershell
pnpm build
pnpm exec playwright test __tests__/line-oa/server-side-only.spec.ts
git add __tests__
git commit -m "test(security): red-team verify @line/bot-sdk not in client bundle"
```

---

## Plan 7 驗收條件

- [ ] LINE OA 加好友 → 看到 Rich Menu 三個選項
- [ ] 點「查詢案件狀態」→ 引導輸入 → 雙重驗證後回最小揭露內容
- [ ] 連續 5 次錯誤 → 24h 鎖定
- [ ] 同案件被列舉 5 次失敗 → 內部群組收到告警
- [ ] LIFF 連結進入 `/liff/report` 自動帶入舊資料（如 line_bindings 已有）
- [ ] Rich Menu「我要刪除資料」/「查詢/更正」→ 寫入 customer_requests + 推內部群組
- [ ] 後台 `/admin/customer-requests` 看得到請求列表
- [ ] 三個紅隊測試全 PASS
- [ ] CI 全綠

---

## Self-Review

- ✅ Spec 4.4.3 雙重驗證 + rate limit + 告警全覆蓋
- ✅ Spec 4.1 LINE 帶入舊資料含 LIFF 流程
- ✅ Spec 6.4 當事人權利請求窗口（LINE OA）
- ⚠️ Phase 1 webhook flow 是線性 if-else；Phase 2 可重構為 state machine pattern

---

## 後續

完成 Plan 7 接 Plan 8（Anonymization Cron + Production Cutover，最終一份）。
