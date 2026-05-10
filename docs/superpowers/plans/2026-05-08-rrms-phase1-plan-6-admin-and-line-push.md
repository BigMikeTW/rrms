# RRMS Phase 1 — Plan 6: Admin Backend + LINE Push Notifications

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。

> **給人類使用者**：Phase 1 第 6/8 份。依賴 Plan 1-5。

**Goal:** 完整後台介面 — Dashboard、案件列表（搜尋 / 篩選 / 排序）、案件詳情頁（含媒體預覽 + 狀態變更）、狀態歷史紀錄。並整合 LINE Messaging API：新案件立案時推內部 LINE 群組；狀態變更時推給綁定的客戶。Webhook 接收 endpoint 含**簽章驗證**。通過 LINE webhook 偽造、權限隔離、狀態變更稽核三個攻擊測試。

**Architecture:** Admin pages 全用 Server Component + Server Action；案件列表用 SQL pagination；狀態變更走交易：寫 cases.status + 寫 case_status_history + 觸發 LINE push（push 失敗用 webhook retry queue 補償，Phase 1 簡化為 console.error + 寫紀錄表）；Webhook handler 用 LINE 簽章 HMAC-SHA256 驗證每個請求。

**Tech Stack:**
- `@line/bot-sdk` ^11.0.0（已驗證 2026-05-08：v11 拿掉 axios 改用原生 fetch；需 Node 20+，Plan 1 ci.yml 已用 22）
- shadcn/ui Table / Dialog / Select
- React 19 useOptimistic（狀態變更即時 UI）

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 4.2 後台管理（Dashboard / 列表 / 詳情 / 帳號） | Task 3-6 |
| 4.4.2 LINE Messaging API（webhook + push） | Task 8-10 |
| 5.3 case_status_history | Task 5 |
| 6.7.5 server-side-only LINE SDK | Task 7 |
| 攻擊測試 LINE Webhook 簽章 / Auth 權限隔離 / server-side-only 補強 | Task 11-12 |

---

## File Structure

```
src/
├── adapters/
│   └── line/
│       ├── index.ts                  # LineAdapter port (Phase 3)
│       └── LineBotSdkAdapter.ts      # concrete adapter wrapping @line/bot-sdk + HMAC verify (Plan 6 Task 2; per ADR-0110)
├── lib/
│   └── line/
│       └── push.ts               # 推播訊息「組合 / 內容生成」（內文 templating；不直接 import @line/bot-sdk）
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Dashboard（覆蓋 Plan 3 placeholder）
│   │   ├── cases/
│   │   │   ├── page.tsx          # 案件列表
│   │   │   ├── [caseNo]/
│   │   │   │   ├── page.tsx      # 案件詳情
│   │   │   │   ├── actions.ts    # 狀態變更 server action
│   │   │   │   └── components/
│   │   │   │       ├── StatusForm.tsx
│   │   │   │       └── （MediaGallery.tsx 延後到 Phase 2 — Phase 1 只列 dropbox path 文字）
│   │   └── ...
│   └── api/
│       └── line/
│           └── webhook/
│               └── route.ts       # LINE webhook 入口
__tests__/
└── admin/
    ├── line-webhook-forgery.spec.ts
    ├── status-change-permission.spec.ts
    └── status-history-audit.spec.ts
```

---

## Pre-Tasks

- [ ] Plan 5 全部驗收通過

---

## Task 0: Pre-code Research Gate

| 技術 | URL |
|---|---|
| LINE Messaging API push | https://developers.line.biz/en/reference/messaging-api/#send-push-message |
| LINE Webhook 簽章驗證 | https://developers.line.biz/en/reference/messaging-api/#signature-validation |
| @line/bot-sdk Node.js | https://github.com/line/line-bot-sdk-nodejs |
| Drizzle transactions | https://orm.drizzle.team/docs/transactions |
| Next.js Image / 圖檔代理 | https://nextjs.org/docs/app/api-reference/components/image |

寫 research → 確認 → commit。

---

## Task 1: 使用者手動 — 建立 LINE Messaging API Channel + 內部群組

- [ ] **Step 1：建立 Messaging API Channel（兩個：dev + prod）**

1. 開 https://developers.line.biz/console/
2. 選原先建好的 Provider（與 Plan 3 LINE Login 同一個或另開都可）
3. Create new channel → `Messaging API`
4. Channel name: `RRMS OA (dev)` 與 `RRMS OA (prod)`，兩個分別建
5. Channel description: 報修系統官方帳號
6. Category：選最接近的（如「Productivity」）
7. Email：你的
8. 同意條款 → Create

- [ ] **Step 2：取得 Channel Secret + Channel Access Token**

每個 channel 進去後：
1. 上方分頁 `Basic settings` → 記下 **Channel Secret**
2. 上方分頁 `Messaging API`：
   - Webhook URL：先填 `https://example.com/api/line/webhook` 暫值（Task 9 完成後改回正式 URL）
   - Use webhook：開
   - Auto-reply messages：關（避免干擾）
   - Greeting messages：可保留
3. 上方分頁 `Messaging API` 下方 `Channel access token (long-lived)` 區塊：按 Issue → 記下 token

- [ ] **Step 3：建立內部 LINE 群組 + 取得 group ID**

1. 加 dev OA 為好友（用 channel 頁的 QR code）
2. 把 OA 拉進你公司的內部 LINE 群組
3. 在群組傳一句訊息（任意）
4. 暫時透過 Plan 6 Task 9 完成後從 webhook log 中拿到 `groupId`（先 placeholder，Task 9 完成後再回填）

- [ ] **Step 4：環境變數**

```powershell
vercel env add LINE_MESSAGING_CHANNEL_SECRET
vercel env add LINE_MESSAGING_CHANNEL_ACCESS_TOKEN
vercel env add LINE_INTERNAL_GROUP_ID  # 暫填空字串，Task 9 完成後再 update
vercel env pull .env.local
```

- [ ] **Step 5：跟我回報**

「LINE OA dev/prod 建好，secret/token 已推 env，groupId 待 Task 9 取得」。

---

## Task 2: LINE adapter (LineAdapter implementation)

> **Per ADR-0110**: 此 client 為 `LineAdapter` port（`src/adapters/line/index.ts`，Phase 3 已落地）的 **concrete adapter**，路徑為 `src/adapters/line/LineBotSdkAdapter.ts`。**業務層（`src/app/`、`src/lib/`）禁止直接 import `@line/bot-sdk` 或 `@line/liff`**；ESLint rule `rrms/no-platform-sdk-outside-adapter` 會在 CI 擋下違規。MessagingApiClient 實例化、HMAC 簽章驗證、webhook event parsing 全部是這個 class 的內部實作；business code 只看得到 port 介面定義的 `verifyWebhookSignature` / `parseWebhookEvent` / `replyToMessage` / `pushMessage` 四個方法。

- [ ] **Step 1：安裝 @line/bot-sdk**

```powershell
pnpm add "@line/bot-sdk@^11.0.0"
```

- [ ] **Step 2：建立 `src/adapters/line/LineBotSdkAdapter.ts`**

```ts
// src/adapters/line/LineBotSdkAdapter.ts
// 4W header 略（per CODING_STANDARDS — What/Why/Where/When；Why 引 ADR-0110）
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { messagingApi } from "@line/bot-sdk";
import type {
  LineAdapter,
  LineOutboundMessage,
  LineSignatureCheckResult,
  LineWebhookEvent,
} from "@/adapters/line";

class LineBotSdkAdapter implements LineAdapter {
  private readonly client = new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN!,
  });

  /**
   * 驗證 LINE Webhook 的 X-Line-Signature header
   * 對應 https://developers.line.biz/en/reference/messaging-api/#signature-validation
   */
  verifyWebhookSignature(rawBody: string, signature: string | null): LineSignatureCheckResult {
    if (!signature) return { ok: false, reason: "no signature header" };
    const hmac = createHmac("sha256", process.env.LINE_MESSAGING_CHANNEL_SECRET!);
    hmac.update(rawBody, "utf8");
    const expected = hmac.digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return { ok: false, reason: "length mismatch" };
    return { ok: timingSafeEqual(a, b), reason: undefined };
  }

  parseWebhookEvent(rawBody: string): LineWebhookEvent[] {
    // SDK-shape → port-shape mapping; drop event types not enumerated in port
    // (per ADR-0112 discipline 2 — neutral contracts)
    const parsed = JSON.parse(rawBody) as { events?: unknown[] };
    return (parsed.events ?? []).flatMap(/* normalize per port enum */ () => []);
  }

  async replyToMessage(replyToken: string, messages: LineOutboundMessage[]): Promise<void> {
    await this.client.replyMessage({ replyToken, messages });
  }

  async pushMessage(userId: string, messages: LineOutboundMessage[]): Promise<void> {
    await this.client.pushMessage({ to: userId, messages });
  }
}

export const lineAdapter: LineAdapter = new LineBotSdkAdapter();
```

- [ ] **Step 3：commit**

```powershell
git add src/adapters/line package.json pnpm-lock.yaml
git commit -m "feat(line): LINE concrete adapter for LineAdapter port (per ADR-0110)"
```

---

## Task 3: Dashboard

- [ ] **Step 1：覆蓋 `src/app/admin/page.tsx`**

```tsx
import { db } from "@/db/client";
import { cases } from "@/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayNew] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(cases)
    .where(gte(cases.filedAt, startOfToday));
  const [pending] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(cases)
    .where(eq(cases.status, "filed"));
  const [inProgress] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(cases)
    .where(sql`${cases.status} IN ('dispatching','dispatched')`);
  const [completedThisMonth] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(cases)
    .where(
      sql`${cases.status} = 'completed' AND ${cases.closedAt} >= date_trunc('month', NOW())`,
    );

  const stats = [
    { label: "今日新案件", value: todayNew?.c ?? 0 },
    { label: "待處理", value: pending?.c ?? 0 },
    { label: "處理中", value: inProgress?.c ?? 0 },
    { label: "本月已完成", value: completedThisMonth?.c ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">後台 Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded border p-4">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/admin/page.tsx
git commit -m "feat(admin): dashboard with 4 KPI tiles"
```

---

## Task 4: 案件列表

- [ ] **Step 1：建立 `src/app/admin/cases/page.tsx`**

```tsx
import { db } from "@/db/client";
import { cases } from "@/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import Link from "next/link";

export default async function CasesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where = [] as any[];
  if (q) {
    where.push(
      or(
        ilike(cases.caseNo, `%${q}%`),
        ilike(cases.reporterName, `%${q}%`),
        ilike(cases.reporterCompany, `%${q}%`),
        ilike(cases.location, `%${q}%`),
      ),
    );
  }
  if (status) where.push(eq(cases.status, status as any));

  const rows = await db.query.cases.findMany({
    where: where.length ? (whereExpr) => whereExpr : undefined,
    orderBy: [desc(cases.filedAt)],
    limit: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">案件列表</h1>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜尋編號 / 姓名 / 公司 / 地點"
          className="rounded border p-2"
        />
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">全部狀態</option>
          <option value="filed">已立案</option>
          <option value="dispatching">派工中</option>
          <option value="dispatched">已派工</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          篩選
        </button>
      </form>

      <table className="mt-6 w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">編號</th>
            <th className="p-2">公司</th>
            <th className="p-2">地點</th>
            <th className="p-2">狀態</th>
            <th className="p-2">立案時間</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">
                <Link
                  href={`/admin/cases/${c.caseNo}`}
                  className="text-blue-600 underline"
                >
                  {c.caseNo}
                </Link>
              </td>
              <td className="p-2">{c.reporterCompany}</td>
              <td className="p-2">{c.location}</td>
              <td className="p-2">{c.status}</td>
              <td className="p-2">{c.filedAt.toISOString().slice(0, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/admin/cases/page.tsx
git commit -m "feat(admin): cases list with search + status filter"
```

---

## Task 5: 案件詳情 + 狀態變更

- [ ] **Step 1：建立 `src/app/admin/cases/[caseNo]/page.tsx`**

```tsx
import { db } from "@/db/client";
import { cases, caseStatusHistory, caseMedia, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import StatusForm from "./components/StatusForm";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseNo: string }>;
}) {
  const { caseNo } = await params;
  const caseRow = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  if (!caseRow) notFound();

  const history = await db
    .select({
      h: caseStatusHistory,
      u: user,
    })
    .from(caseStatusHistory)
    .leftJoin(user, eq(caseStatusHistory.changedByUserId, user.id))
    .where(eq(caseStatusHistory.caseId, caseRow.id))
    .orderBy(desc(caseStatusHistory.changedAt));

  const media = await db
    .select()
    .from(caseMedia)
    .where(eq(caseMedia.caseId, caseRow.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{caseRow.caseNo}</h1>

      <section className="rounded border p-4">
        <h2 className="font-semibold">報修人</h2>
        <p>{caseRow.reporterName} ({caseRow.reporterCompany})</p>
        <p>{caseRow.reporterPhone} · {caseRow.reporterEmail}</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">內容</h2>
        <p><strong>地點：</strong>{caseRow.location}</p>
        <p className="mt-2 whitespace-pre-wrap">{caseRow.description}</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">媒體（{media.length}）</h2>
        {/* Phase 1 簡化：列出 dropbox path；Phase 2 加 thumbnail */}
        <ul className="mt-2 space-y-1 text-sm">
          {media.map((m) => (
            <li key={m.id}>
              {m.dropboxPath} ({m.mimeType}, {Math.round(m.sizeBytes / 1024)} KB)
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">狀態</h2>
        <p>目前：<strong>{caseRow.status}</strong></p>
        <StatusForm caseNo={caseRow.caseNo} currentStatus={caseRow.status} />
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">狀態歷史</h2>
        <ul className="mt-2 space-y-1">
          {history.map(({ h, u }) => (
            <li key={h.id} className="text-sm">
              {h.changedAt.toISOString().slice(0, 16)} —
              {h.fromStatus ?? "(初次)"} → {h.toStatus} by {u?.email ?? "-"}
              {h.note && <span className="text-gray-500"> ({h.note})</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2：建立 `src/app/admin/cases/[caseNo]/actions.ts`**

```ts
"use server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { cases, caseStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pushOnStatusChange } from "@/lib/line/push";

export async function changeStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Forbidden");

  const caseNo = String(formData.get("caseNo"));
  const toStatus = String(formData.get("toStatus")) as
    | "filed" | "dispatching" | "dispatched" | "completed" | "cancelled";
  const note = String(formData.get("note") ?? "");

  await db.transaction(async (tx) => {
    const c = await tx.query.cases.findFirst({
      where: eq(cases.caseNo, caseNo),
    });
    if (!c) throw new Error("not found");
    const fromStatus = c.status;
    if (fromStatus === toStatus) return;

    const isClosing = toStatus === "completed" || toStatus === "cancelled";
    await tx
      .update(cases)
      .set({
        status: toStatus,
        closedAt: isClosing ? new Date() : c.closedAt,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, c.id));

    await tx.insert(caseStatusHistory).values({
      caseId: c.id,
      fromStatus,
      toStatus,
      changedByUserId: session.user.id,
      note: note || null,
    });
  });

  // push (best-effort)
  try {
    await pushOnStatusChange(caseNo, toStatus);
  } catch (e) {
    console.error("LINE push failed:", e);
  }

  revalidatePath(`/admin/cases/${caseNo}`);
}
```

- [ ] **Step 3：建立 `src/app/admin/cases/[caseNo]/components/StatusForm.tsx`**

```tsx
"use client";
import { changeStatus } from "../actions";

const TRANSITIONS: Record<string, string[]> = {
  filed: ["dispatching", "cancelled"],
  dispatching: ["dispatched", "cancelled"],
  dispatched: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function StatusForm({
  caseNo,
  currentStatus,
}: {
  caseNo: string;
  currentStatus: string;
}) {
  const next = TRANSITIONS[currentStatus] ?? [];
  if (next.length === 0)
    return <p className="text-sm text-gray-500">已結案，無法再變更</p>;

  return (
    <form action={changeStatus} className="mt-3 flex gap-2">
      <input type="hidden" name="caseNo" value={caseNo} />
      <select name="toStatus" required className="rounded border p-2">
        {next.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        name="note"
        placeholder="備註（選填）"
        className="rounded border p-2"
      />
      <button className="rounded bg-black px-4 py-2 text-white">變更</button>
    </form>
  );
}
```

- [ ] **Step 4：commit**

```powershell
git add src/app/admin/cases
git commit -m "feat(admin): case detail page with status transition + history"
```

---

## Task 6: LINE push helpers

- [ ] **Step 1：建立 `src/lib/line/push.ts`**

```ts
import "server-only";
import { db } from "@/db/client";
import { cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { lineAdapter } from "@/adapters/line/LineBotSdkAdapter";

export async function pushOnNewCase(caseNo: string) {
  const groupId = process.env.LINE_INTERNAL_GROUP_ID;
  if (!groupId) return;
  const c = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  if (!c) return;

  await lineAdapter.pushMessage(groupId, [
    {
      type: "text",
      text:
        `🆕 新報修案件\n` +
        `編號：${c.caseNo}\n` +
        `報修人：${c.reporterName} (${c.reporterCompany})\n` +
        `地點：${c.location}\n` +
        `內容：${c.description.slice(0, 80)}${c.description.length > 80 ? "…" : ""}`,
    },
  ]);
}

export async function pushOnStatusChange(caseNo: string, toStatus: string) {
  const c = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  if (!c?.lineUserId) return; // 客戶未綁定 LINE，不推

  const labels: Record<string, string> = {
    filed: "已立案",
    dispatching: "派工中",
    dispatched: "已派工",
    completed: "已完成",
    cancelled: "已取消",
  };

  await lineAdapter.pushMessage(c.lineUserId, [
    {
      type: "text",
      text: `📋 您的報修案件 ${c.caseNo} 狀態更新為：${labels[toStatus] ?? toStatus}`,
    },
  ]);
}
```

- [ ] **Step 2：把 pushOnNewCase 接進 Plan 4 的 submitReport**

修改 `src/app/report/actions.ts`，在 `await db.insert(cases)...` 之後加：
```ts
import { pushOnNewCase } from "@/lib/line/push";

// 在 insert 完之後：
try {
  await pushOnNewCase(caseNo);
} catch (e) {
  console.error("push new case failed:", e);
}
```

- [ ] **Step 3：commit**

```powershell
git add src/lib/line src/app/report/actions.ts
git commit -m "feat(line): push new case to staff group + status changes to customer"
```

---

## Task 7: LINE webhook handler

- [ ] **Step 1：建立 `src/app/api/line/webhook/route.ts`**

```ts
import { NextResponse } from "next/server";
import { lineAdapter } from "@/adapters/line/LineBotSdkAdapter";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  const sigCheck = lineAdapter.verifyWebhookSignature(rawBody, signature);
  if (!sigCheck.ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as {
    events: Array<{
      type: string;
      source: { type: "group" | "user" | "room"; groupId?: string; userId?: string };
      message?: { type: string; text?: string };
      replyToken?: string;
    }>;
  };

  // Phase 1：先記 log 讓我們抓 groupId
  for (const event of body.events) {
    console.log("LINE webhook event:", JSON.stringify(event));
  }
  // Plan 7 會在這裡加查詢驗證流程的 logic

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/api/line/webhook
git commit -m "feat(line): webhook entry with HMAC signature verification"
```

---

## Task 8: 連線 webhook 到 LINE Console + 取得 groupId

- [ ] **Step 1：取得 Vercel 部署 URL**

push 上面的 commit；Vercel 自動部署 production；得到 `https://<your>.vercel.app/api/line/webhook`。

- [ ] **Step 2：把 URL 填回 LINE Developer Console**

1. https://developers.line.biz/console/ → RRMS OA (dev) → Messaging API
2. Webhook URL：填正式 URL
3. 按 `Verify` → 應收到 200
4. Use webhook：開

對 prod channel 重複（用 production domain，待 Plan 8 設好 DNS）。

- [ ] **Step 3：在群組傳一句話 → 從 Vercel logs 找 groupId**

```powershell
vercel logs --follow
```
看 console.log 輸出，找 `source.groupId`，記下來。

- [ ] **Step 4：把 groupId 推進 env**

```powershell
vercel env rm LINE_INTERNAL_GROUP_ID
vercel env add LINE_INTERNAL_GROUP_ID
# 貼上群組 ID
vercel env pull .env.local
```

重新部署：
```powershell
git commit --allow-empty -m "chore: trigger redeploy after LINE_INTERNAL_GROUP_ID set"
git push
```

- [ ] **Step 5：跟我回報 groupId 已設定**

---

## Task 9: 紅隊 — Webhook 簽章偽造

- [ ] **Step 1：建立 `__tests__/admin/line-webhook-forgery.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("LINE webhook without signature is rejected", async ({ request }) => {
  const r = await request.post("/api/line/webhook", {
    data: { events: [] },
  });
  expect(r.status()).toBe(401);
});

test("LINE webhook with wrong signature is rejected", async ({ request }) => {
  const r = await request.post("/api/line/webhook", {
    data: { events: [] },
    headers: {
      "x-line-signature": "AAAA0000fakefake",
    },
  });
  expect(r.status()).toBe(401);
});
```

- [ ] **Step 2：commit**

```powershell
git add __tests__
git commit -m "test(security): red-team LINE webhook signature forgery"
```

---

## Task 10: 紅隊 — 狀態變更權限隔離 + 稽核

- [ ] **Step 1：建立 `__tests__/admin/status-change-permission.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("anonymous request to changeStatus is rejected", async ({ request }) => {
  // server action 路由通常是 POST 同 path 的 form-encoded
  const r = await request.post("/admin/cases/RPR-20260508001", {
    form: { caseNo: "RPR-20260508001", toStatus: "completed" },
  });
  expect([401, 403, 404]).toContain(r.status());
});
```

- [ ] **Step 2：建立 `__tests__/admin/status-history-audit.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { db } from "@/db/client";
import { cases, caseStatusHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

test("status change writes case_status_history with actor", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=email]", process.env.TEST_ADMIN_EMAIL!);
  await page.fill("input[name=password]", process.env.TEST_ADMIN_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");

  // 假設先 seed 一個 case
  const caseNo = process.env.TEST_CASE_NO!;
  await page.goto(`/admin/cases/${caseNo}`);
  await page.selectOption("select[name=toStatus]", "dispatching");
  await page.fill("input[name=note]", "audit test");
  await page.click("button:has-text('變更')");

  await page.waitForLoadState("networkidle");

  // 驗證歷史紀錄
  const c = await db.query.cases.findFirst({ where: eq(cases.caseNo, caseNo) });
  if (!c) throw new Error("case not found");
  const history = await db
    .select()
    .from(caseStatusHistory)
    .where(eq(caseStatusHistory.caseId, c.id))
    .orderBy(desc(caseStatusHistory.changedAt))
    .limit(1);
  expect(history[0]?.toStatus).toBe("dispatching");
  expect(history[0]?.note).toBe("audit test");
  expect(history[0]?.changedByUserId).toBeTruthy();
});
```

- [ ] **Step 3：commit**

```powershell
git add __tests__
git commit -m "test(security): red-team status change permission + audit trail"
```

---

## Plan 6 驗收條件

- [ ] Dashboard 顯示 4 個 KPI
- [ ] 案件列表可搜尋、可篩選
- [ ] 案件詳情可看資料、可變更狀態、有歷史
- [ ] 提交報修時內部群組收到 LINE 推播
- [ ] 變更狀態時（且客戶有 lineUserId）客戶收到 LINE 推播
- [ ] LINE webhook 對偽造簽章回 401
- [ ] 三個紅隊測試全 PASS
- [ ] CI 全綠

---

## Self-Review

- ✅ Spec 4.2、4.4.2、5.3 全覆蓋
- ✅ 攻擊測試 LINE webhook 簽章 + Auth 權限隔離 + 稽核紀錄都有
- ⚠️ LINE push 失敗目前 fallback 為 console.error，Phase 2 應加 retry queue
- ⚠️ 媒體目前列 Dropbox 路徑，Phase 2 加 thumbnail proxy

---

## 後續

完成 Plan 6 接 Plan 7（LINE OA 客戶查詢 + Rich Menu）。
