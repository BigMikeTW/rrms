# RRMS Phase 1 — Plan 5: Dropbox Media Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。

> **給人類使用者**：Phase 1 第 5/8 份。依賴 Plan 1-4。

**Goal:** 客戶在 `/report` 表單可上傳照片與影片；檔案**直接從瀏覽器上傳到 Dropbox**（不經 Vercel Function，避開頻寬費）；上傳完成後 server 寫入 `case_media`。具上傳檔型驗證、大小限制、惡意檔擋下機制。

**Architecture:** Server 用 Dropbox App Folder + refresh token 模式產生 `temporary_upload_link`（短效 4 小時）→ 回傳給瀏覽器 → 瀏覽器以 PUT 方式直接上傳到 Dropbox 的 upload URL → 上傳完成後瀏覽器 callback `/api/media/complete` 通知 server 寫入 `case_media`。Server 端在簽 upload link 時就檢查 mime type + 檔案大小，惡意檔不發 link。

**Tech Stack:**
- Dropbox API v2（`dropbox` npm package OR 直接呼叫 REST，Phase 1 用 fetch 即可）
- File API（瀏覽器原生）
- mime-type 檢查（用 file extension + browser-reported mime + 簽 link 時也驗一次）

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 4.5 媒體上傳（Dropbox）流程圖 | Task 3-5 |
| 5.4 case_media | 既有；Task 5 寫入紀錄 |
| 6.7.1 機密管理（Dropbox refresh token） | Task 1 |
| 6.7.5 server-side-only API | Task 3 + 4 |
| 攻擊測試 上傳檔案濫用 | Task 6 |

---

## File Structure

```
src/
├── adapters/
│   └── storage/
│       ├── index.ts               # StorageAdapter port (Phase 3)
│       └── DropboxAdapter.ts      # concrete adapter (Plan 5 Task 2; per ADR-0110)
├── app/
│   ├── api/
│   │   └── media/
│   │       ├── get-upload-url/
│   │       │   └── route.ts       # POST → 簽 4hr upload link
│   │       └── complete/
│   │           └── route.ts       # POST → 寫 case_media
│   └── report/
│       └── components/
│           └── MediaUploader.tsx  # 客戶端上傳 UI
__tests__/
└── media/
    ├── upload-flow.spec.ts        # happy path
    └── upload-abuse.spec.ts       # 紅隊
```

---

## Pre-Tasks

- [ ] Plan 4 全部驗收通過

---

## Task 0: Pre-code Research Gate

| 技術 | URL |
|---|---|
| Dropbox API: get_temporary_upload_link | https://www.dropbox.com/developers/documentation/http/documentation#files-get_temporary_upload_link |
| Dropbox OAuth refresh token flow | https://developers.dropbox.com/oauth-guide |
| File API in browser | https://developer.mozilla.org/en-US/docs/Web/API/File_API |
| Vercel Function 4.5MB body 限制 | https://vercel.com/docs/functions/runtimes#request-body-size |

寫 research → 確認 → commit。

---

## Task 1: 使用者手動 — 建立 Dropbox App + refresh token

- [ ] **Step 1：建立 Dropbox App**

1. 登入 https://www.dropbox.com/developers/apps
2. 按 `Create app`
3. Choose API: **Scoped access**
4. Choose access type: **App folder**（限制只能存取自己的 app folder）
5. App name: `RRMS-dev`（建立兩個 app：`RRMS-dev` + `RRMS-prod`）
6. 按 Create

- [ ] **Step 2：設定 Permissions**

進到剛建好的 app，上方分頁 `Permissions`，勾選：
- `files.metadata.write`
- `files.metadata.read`
- `files.content.write`
- `files.content.read`

按 Submit。

- [ ] **Step 3：取得 refresh token**

a. 上方分頁 `Settings`，記下：
   - `App key`
   - `App secret`

b. 在瀏覽器開：
```
https://www.dropbox.com/oauth2/authorize?client_id=<App key>&token_access_type=offline&response_type=code
```
點 Allow → 拿到一段 authorization code。

c. 用 curl 換 refresh token（替換 `<App key>`、`<App secret>`、`<authorization code>`）：
```powershell
curl https://api.dropboxapi.com/oauth2/token `
  -d code=<authorization code> `
  -d grant_type=authorization_code `
  -u <App key>:<App secret>
```
回應中找到 `refresh_token`。

- [ ] **Step 4：環境變數推到 Vercel + 本機**

```powershell
vercel env add DROPBOX_APP_KEY
vercel env add DROPBOX_APP_SECRET
vercel env add DROPBOX_REFRESH_TOKEN
vercel env pull .env.local
```

驗證 `.env.local` 有三個 Dropbox 變數。

- [ ] **Step 5：跟我回報「Dropbox app 建好、refresh token 拿到」**

---

## Task 2: Dropbox storage adapter (StorageAdapter implementation)

> **Per ADR-0110**: 此 client 為 `StorageAdapter` port（`src/adapters/storage/index.ts`，Phase 3 已落地）的 **concrete adapter**，路徑為 `src/adapters/storage/DropboxAdapter.ts`。**業務層（`src/app/`、`src/lib/`）禁止直接 import `dropbox` 套件**；ESLint rule `rrms/no-platform-sdk-outside-adapter` 會在 CI 擋下違規。
>
> **此 adapter 須以 `class DropboxAdapter implements StorageAdapter` 形式包裝下方 functions**：`getTemporaryUploadLink` 對應 port 中的 signed-upload-URL 操作（**注意**：Phase 3 port 目前只有 `getSignedUrl`，Phase 5 實作時需擴增 `getSignedUploadUrl(key, options): Promise<{ url: string; expiresAt: Date }>` 至 port 介面，並在 port `index.ts` 4W 註解補述）；`deleteDropboxFile` 對應 `delete(key)`。Token 快取為實作細節，留在 adapter 內，不洩漏到 port。

- [ ] **Step 1：建立 `src/adapters/storage/DropboxAdapter.ts`**

```ts
// src/adapters/storage/DropboxAdapter.ts
// 4W header 略（per CODING_STANDARDS — What/Why/Where/When；Why 引 ADR-0006 + ADR-0110）
import "server-only";

const TOKEN_ENDPOINT = "https://api.dropboxapi.com/oauth2/token";
const API_ENDPOINT = "https://api.dropboxapi.com/2";

let cached: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
  });
  const auth = Buffer.from(
    `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`,
  ).toString("base64");

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Dropbox token refresh failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

/**
 * 為指定路徑簽一個 4 小時有效的 PUT upload URL。
 * 客戶端可直接 PUT 檔案到該 URL，不經過我們 server。
 */
export async function getTemporaryUploadLink(targetPath: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${API_ENDPOINT}/files/get_temporary_upload_link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commit_info: {
        path: targetPath,
        mode: "add",
        autorename: true,
        mute: false,
      },
      duration: 14400, // 4 hours
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox get_temporary_upload_link failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { link: string };
  return data.link;
}

export async function deleteDropboxFile(path: string): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${API_ENDPOINT}/files/delete_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });
}
```

- [ ] **Step 2：commit**

```powershell
git add src/adapters/storage
git commit -m "feat(media): Dropbox concrete adapter for StorageAdapter port (per ADR-0110)"
```

---

## Task 3: API route — 簽 upload URL

- [ ] **Step 1：建立 `src/app/api/media/get-upload-url/route.ts`**

```ts
// src/app/api/media/get-upload-url/route.ts
// Imports the concrete adapter directly in Phase 1 (no DI container yet).
// Phase 4 will introduce a factory; until then, the adapter file path itself
// is the swap point — replace DropboxAdapter with another StorageAdapter impl
// without touching this route. ESLint allows this import because the path
// resolves through `@/adapters/...`, not a raw `dropbox` SDK import.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dropboxStorage } from "@/adapters/storage/DropboxAdapter";
import { rateLimitByIp } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
];
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB per file

const reqSchema = z.object({
  caseNo: z.string().regex(/^RPR-\d{11}$/),
  filename: z.string().max(255),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive().max(MAX_BYTES),
});

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const allowed = await rateLimitByIp(ip, "media-sign", 30, 600);
  if (!allowed) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const body = await req.json();
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { caseNo, filename, mimeType, sizeBytes } = parsed.data;

  if (!ALLOWED_MIME.includes(mimeType)) {
    return NextResponse.json({ error: "mime type not allowed" }, { status: 415 });
  }

  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  const uuid = randomUUID();
  const ext = filename.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ?? "bin";
  const targetPath = `/${env}/${caseNo}/${uuid}.${ext}`;

  const uploadUrl = await dropboxStorage.getSignedUploadUrl(targetPath);
  return NextResponse.json({ uploadUrl, dropboxPath: targetPath, sizeBytes, mimeType });
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/api/media/get-upload-url
git commit -m "feat(media): API to sign 4hr Dropbox upload URL with mime/size guard"
```

---

## Task 4: API route — complete (寫入 case_media)

- [ ] **Step 1：建立 `src/app/api/media/complete/route.ts`**

```ts
// src/app/api/media/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { caseMedia, cases } from "@/db/schema";
import { eq } from "drizzle-orm";

const reqSchema = z.object({
  caseNo: z.string().regex(/^RPR-\d{11}$/),
  dropboxPath: z.string().startsWith("/"),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { caseNo, dropboxPath, mimeType, sizeBytes } = parsed.data;
  const caseRow = await db.query.cases.findFirst({
    where: eq(cases.caseNo, caseNo),
  });
  if (!caseRow) {
    return NextResponse.json({ error: "case not found" }, { status: 404 });
  }

  await db.insert(caseMedia).values({
    caseId: caseRow.id,
    dropboxPath,
    mimeType,
    sizeBytes,
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/api/media/complete
git commit -m "feat(media): record case_media after browser-direct upload"
```

---

## Task 5: 客戶端上傳元件

- [ ] **Step 1：建立 `src/app/report/components/MediaUploader.tsx`**

```tsx
"use client";
import { useState } from "react";

export default function MediaUploader({
  caseNo,
}: {
  caseNo: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, string>>({});

  async function uploadOne(file: File) {
    setProgress((p) => ({ ...p, [file.name]: "簽名中…" }));
    const signRes = await fetch("/api/media/get-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseNo,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
    if (!signRes.ok) {
      const err = await signRes.json();
      setProgress((p) => ({ ...p, [file.name]: `失敗：${err.error}` }));
      return;
    }
    const { uploadUrl, dropboxPath } = await signRes.json();

    setProgress((p) => ({ ...p, [file.name]: "上傳中…" }));
    const putRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });
    if (!putRes.ok) {
      setProgress((p) => ({ ...p, [file.name]: "上傳失敗" }));
      return;
    }

    await fetch("/api/media/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseNo,
        dropboxPath,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
    setProgress((p) => ({ ...p, [file.name]: "完成" }));
  }

  return (
    <div className="mt-6">
      <label className="block">
        <span className="text-sm">上傳照片 / 影片（可多選）</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={async (e) => {
            const list = Array.from(e.target.files ?? []);
            setFiles(list);
            for (const f of list) {
              await uploadOne(f);
            }
          }}
          className="mt-2 block"
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {files.map((f) => (
            <li key={f.name}>
              {f.name} — {progress[f.name] ?? "等待中"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2：把 MediaUploader 接進 ReportForm 成功頁**

修改 `src/app/report/components/ReportForm.tsx` 的 success 區塊：
```tsx
import MediaUploader from "./MediaUploader";

// 在 if (state.caseNo) 區塊內加：
<MediaUploader caseNo={state.caseNo} />
```

- [ ] **Step 3：手動驗證**

```powershell
pnpm dev
```
1. 開 /report 填表單送出
2. 在成功頁選 1-3 張圖
3. 看到「完成」狀態
4. 到 Dropbox app folder 確認檔案在 `<env>/<caseNo>/<uuid>.<ext>`
5. drizzle studio 確認 `case_media` 有對應紀錄

- [ ] **Step 4：commit**

```powershell
git add src/app/report
git commit -m "feat(media): browser-direct upload UI integrated with ReportForm"
```

---

## Task 6: 紅隊 — 上傳檔案濫用

- [ ] **Step 1：建立 `__tests__/media/upload-abuse.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("disallowed mime type is rejected at sign step", async ({ request }) => {
  const r = await request.post("/api/media/get-upload-url", {
    data: {
      caseNo: "RPR-20260508001",
      filename: "evil.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 1024,
    },
  });
  expect(r.status()).toBe(415);
});

test("oversized file is rejected at sign step", async ({ request }) => {
  const r = await request.post("/api/media/get-upload-url", {
    data: {
      caseNo: "RPR-20260508001",
      filename: "big.mp4",
      mimeType: "video/mp4",
      sizeBytes: 500 * 1024 * 1024, // 500MB > 200MB limit
    },
  });
  expect(r.status()).toBe(400);
});

test("filename with weird chars is sanitized in dropbox path", async ({
  request,
}) => {
  // mocking only the sign step; verify dropboxPath does not contain unsafe chars
  const r = await request.post("/api/media/get-upload-url", {
    data: {
      caseNo: "RPR-20260508001",
      filename: "../../../etc/passwd",
      mimeType: "image/png",
      sizeBytes: 1024,
    },
  });
  expect(r.ok()).toBe(true);
  const data = await r.json();
  expect(data.dropboxPath).not.toContain("..");
  expect(data.dropboxPath).toMatch(/^\/[a-z]+\/RPR-\d{11}\/[a-z0-9-]+\.\w+$/);
});

test("rate limit triggers after 30 sign requests in 10 minutes", async ({
  request,
}) => {
  for (let i = 0; i < 31; i++) {
    const r = await request.post("/api/media/get-upload-url", {
      data: {
        caseNo: "RPR-20260508001",
        filename: `f${i}.png`,
        mimeType: "image/png",
        sizeBytes: 100,
      },
    });
    if (i === 30) {
      expect(r.status()).toBe(429);
    }
  }
});
```

- [ ] **Step 2：跑測試 + commit**

```powershell
pnpm exec playwright test __tests__/media/upload-abuse.spec.ts
git add __tests__
git commit -m "test(security): red-team media upload abuse (mime/size/path/ratelimit)"
```

---

## Plan 5 驗收條件

- [ ] /report 表單送出後可上傳 1-N 個圖 / 影片
- [ ] 檔案進到 Dropbox app folder 對應路徑
- [ ] `case_media` 表有對應紀錄
- [ ] 4 個紅隊測試全 PASS
- [ ] CI 全綠

---

## Self-Review

- ✅ Spec 4.5 流程圖完整覆蓋
- ✅ 6.7.1 / 6.7.5 都有對應（refresh token 只在 server；前端不接觸）
- ⚠️ HEIC / HEIF mime 在某些瀏覽器可能 reportType 不一致，列在 Phase 2 觀察清單

---

## 後續

完成 Plan 5 接 Plan 6（後台 Admin + LINE 推播）。
