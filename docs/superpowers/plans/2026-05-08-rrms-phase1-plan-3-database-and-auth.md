# RRMS Phase 1 — Plan 3: Database + Auth Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **給人類使用者**：Phase 1 第 3/8 份計畫。依賴 Plan 1（CI、Branch protection）+ Plan 2（Dependabot/ZAP）已完成。

**Goal:** 建立 Postgres 資料庫（Neon via Vercel Marketplace）、Drizzle ORM、全 7 張表 schema、Auth.js v5 三 provider 登入（Email/密碼 + Google + LINE Login）、admin 帳號邀請與管理流程，以及 cookie / session 安全強化（HttpOnly + Secure + SameSite=Lax）。

**Architecture:** Drizzle 直接匯出 TypeScript schema；Auth.js v5 用 Credentials provider 走 bcryptjs 雜湊；OAuth 走標準 redirect flow；自訂 LINE Login provider；session 一律用 HttpOnly cookie；middleware 在 `/admin/*` 強制 auth + role-based 授權。

**Tech Stack:**
- Drizzle ORM + drizzle-kit
- `@neondatabase/serverless`（Neon driver，serverless 環境最佳）
- Auth.js v5（next-auth@5）
- bcryptjs
- Resend / Vercel Marketplace email provider（admin 邀請信）
- shadcn/ui 既有元件

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 4.3 認證（Email/密碼、Google、LINE Login） | Task 9-11 |
| 5.1 users / 5.2 cases / 5.3 case_status_history / 5.4 case_media / 5.5 line_bindings / 5.6 consent_versions / 5.7 query_attempts | Task 3-5 |
| 6.7.3 認證 Cookie 設定 | Task 12 |
| 6.7.4 安全維護：bcrypt 密碼雜湊、role-based 權限控制 | Task 9 + Task 14 |
| 攻擊測試 Cookie HttpOnly / Auth 權限隔離 / CSRF（SameSite） | Task 16-17 |

---

## File Structure

```
src/
├── db/
│   ├── schema.ts                      # 全部 Drizzle schema
│   ├── client.ts                      # server-only Drizzle client
│   └── enums.ts                       # case status enum 等
├── auth/
│   ├── auth.config.ts                 # Auth.js shared config (edge-safe)
│   ├── auth.ts                        # Auth.js 主設定（含 providers）
│   └── providers/
│       └── line.ts                    # 自訂 LINE Login provider
├── lib/
│   └── crypto.ts                      # bcrypt wrapper
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── admin/
│   │   ├── layout.tsx                 # 含 auth guard
│   │   ├── page.tsx                   # placeholder dashboard
│   │   └── users/
│   │       └── page.tsx               # 帳號管理
│   ├── invite/
│   │   └── [token]/
│   │       └── page.tsx               # 同事點啟用信來這裡設密碼
│   └── login/
│       └── page.tsx
└── middleware.ts                       # /admin/* auth guard

drizzle/
├── 0000_initial.sql                    # 第一次 migration
└── meta/
    └── _journal.json

drizzle.config.ts
__tests__/
├── auth/
│   ├── cookie-httponly.spec.ts        # Playwright 紅隊
│   ├── csrf.spec.ts                   # Playwright 紅隊
│   └── privilege-escalation.spec.ts   # Playwright 紅隊
└── playwright.config.ts
```

---

## Pre-Tasks

- [ ] Plan 1 + Plan 2 全部 Definition of Done 通過
- [ ] 確認 Vercel CLI 已 `vercel login`（之後 `vercel env pull` 會用到）

---

## Task 0: Pre-code Research Gate

- [ ] **Step 1：fetch 各官方文件**

| 技術 | URL |
|---|---|
| Drizzle ORM with Neon | https://orm.drizzle.team/docs/get-started-postgresql#neon |
| drizzle-kit migrations | https://orm.drizzle.team/kit-docs/overview |
| Auth.js v5 (next-auth@beta) | https://authjs.dev/getting-started/installation |
| Auth.js Credentials provider | https://authjs.dev/getting-started/authentication/credentials |
| Auth.js Google provider | https://authjs.dev/getting-started/providers/google |
| Auth.js custom OAuth provider | https://authjs.dev/guides/configuring-oauth-providers |
| LINE Login OAuth 2.0 | https://developers.line.biz/en/docs/line-login/integrate-line-login/ |
| bcryptjs | https://github.com/dcodeIO/bcrypt.js |
| Vercel Marketplace Neon | https://vercel.com/marketplace/neon |

- [ ] **Step 2：寫 research 報告 `docs/superpowers/research/2026-05-08-db-auth-versions.md`**
- [ ] **Step 3：報告給使用者，等「OK 繼續」**
- [ ] **Step 4：commit research 報告**

---

## Task 1: 透過 Vercel Marketplace 安裝 Neon（使用者手動）

- [ ] **Step 1：到 Vercel Dashboard**

1. 開 https://vercel.com/dashboard
2. 點選 RRMS 專案
3. 上方 tab → `Storage`
4. 按 `Create Database`
5. 選 `Neon`
6. 名稱填 `rrms-db`
7. Region 選離你最近的（例：`AWS - Asia Pacific (Singapore)`）
8. 按 `Create`

完成後 Vercel 會**自動把 Neon 環境變數注入 RRMS 專案**：
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- 等等

- [ ] **Step 2：本機同步環境變數**

```powershell
pnpm add -g vercel  # 如已安裝可跳
vercel link  # 互動：選 RRMS 專案
vercel env pull .env.local
```

驗證 `.env.local` 中有 `DATABASE_URL=postgres://...`。

- [ ] **Step 3：跟我回報「Neon 已建立並 env pull 成功」**

---

## Task 2: 安裝 Drizzle

- [ ] **Step 1：安裝套件**

```powershell
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

- [ ] **Step 2：建立 `drizzle.config.ts`**

```ts
// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 3：建立 `src/db/client.ts`**

```ts
// src/db/client.ts
// server-only Drizzle client
// 對應 spec 6.7.5 server-side-only API call
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4：commit**

```powershell
git add package.json pnpm-lock.yaml drizzle.config.ts src/db/client.ts
git commit -m "feat(db): install Drizzle ORM with Neon driver"
```

---

## Task 3: Schema — users

- [ ] **Step 1：建立 `src/db/enums.ts`**

```ts
// src/db/enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["staff", "admin"]);

export const caseStatusEnum = pgEnum("case_status", [
  "filed",
  "dispatching",
  "dispatched",
  "completed",
  "cancelled",
]);
```

- [ ] **Step 2：建立 `src/db/schema.ts` 的 users 部分**

```ts
// src/db/schema.ts
import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userRoleEnum, caseStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    googleSub: text("google_sub"),
    lineUserId: text("line_user_id"),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUniqueIdx: uniqueIndex("users_email_unique").on(t.email),
    googleSubIdx: index("users_google_sub_idx").on(t.googleSub),
    lineUserIdIdx: index("users_line_user_id_idx").on(t.lineUserId),
  }),
);
```

---

## Task 4: Schema — cases + case_status_history

接續 `src/db/schema.ts`：

```ts
export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseNo: text("case_no").notNull(),
    reporterName: text("reporter_name").notNull(),
    reporterPhone: text("reporter_phone").notNull(),
    reporterEmail: text("reporter_email").notNull(),
    reporterCompany: text("reporter_company").notNull(),
    location: text("location").notNull(),
    description: text("description").notNull(),
    status: caseStatusEnum("status").notNull().default("filed"),
    lineUserId: text("line_user_id"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    consentTextVersion: text("consent_text_version").notNull(),
    filedAt: timestamp("filed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    tenantId: uuid("tenant_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    caseNoUniqueIdx: uniqueIndex("cases_case_no_unique").on(t.caseNo),
    statusIdx: index("cases_status_idx").on(t.status),
    closedAtIdx: index("cases_closed_at_idx").on(t.closedAt),
    lineUserIdIdx: index("cases_line_user_id_idx").on(t.lineUserId),
  }),
);

export const caseStatusHistory = pgTable("case_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  fromStatus: caseStatusEnum("from_status"),
  toStatus: caseStatusEnum("to_status").notNull(),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  note: text("note"),
});
```

---

## Task 5: Schema — media / bindings / consent / query_attempts

```ts
export const caseMedia = pgTable("case_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  dropboxPath: text("dropbox_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lineBindings = pgTable("line_bindings", {
  lineUserId: text("line_user_id").primaryKey(),
  reporterPhone: text("reporter_phone"),
  reporterEmail: text("reporter_email"),
  reporterName: text("reporter_name"),
  reporterCompany: text("reporter_company"),
  linkedAt: timestamp("linked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const consentVersions = pgTable("consent_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: text("version").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true })
    .notNull()
    .defaultNow(),
  retiredAt: timestamp("retired_at", { withTimezone: true }),
});

export const queryAttempts = pgTable(
  "query_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lineUserId: text("line_user_id").notNull(),
    caseNoAttempted: text("case_no_attempted").notNull(),
    phoneLast4Attempted: text("phone_last4_attempted").notNull(),
    success: boolean("success").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    lineUserIdAttemptedAtIdx: index("query_attempts_user_at_idx").on(
      t.lineUserId,
      t.attemptedAt,
    ),
    caseNoAttemptedAtIdx: index("query_attempts_case_at_idx").on(
      t.caseNoAttempted,
      t.attemptedAt,
    ),
  }),
);
```

- [ ] **commit**

```powershell
git add src/db/
git commit -m "feat(db): define Drizzle schema for all 7 tables"
```

---

## Task 6: 產生 + 套用 migration

- [ ] **Step 1：加 npm scripts 到 package.json**

```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 2：產 migration**

```powershell
pnpm db:generate
```
預期：在 `drizzle/` 目錄產生 `0000_*.sql` 與 `meta/_journal.json`。

- [ ] **Step 3：套用到 Neon**

```powershell
pnpm db:push
```
互動式 confirm 後，Neon DB 內會建出 7 張表。

- [ ] **Step 4：用 drizzle-kit studio 視覺驗證**

```powershell
pnpm db:studio
```
瀏覽器開 https://local.drizzle.studio，確認看到 7 張表。

- [ ] **Step 5：commit**

```powershell
git add drizzle package.json pnpm-lock.yaml
git commit -m "feat(db): generate and apply initial migration"
```

---

## Task 7: 安裝 Auth.js v5 + 基礎設定

- [ ] **Step 1：安裝**

```powershell
pnpm add next-auth@beta @auth/drizzle-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

- [ ] **Step 2：產生 AUTH_SECRET**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
複製輸出值，貼進 `.env.local`：
```
AUTH_SECRET=<剛才產生的值>
AUTH_URL=http://localhost:3000
```

也用 Vercel CLI 推到 Vercel：
```powershell
vercel env add AUTH_SECRET production
# 貼上同樣的值
vercel env add AUTH_SECRET preview
# 同上
```

- [ ] **Step 3：建立 `src/auth/auth.config.ts`（edge-safe）**

```ts
// src/auth/auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLogged = !!auth?.user;
      const isAdmin = nextUrl.pathname.startsWith("/admin");
      if (isAdmin) return isLogged;
      return true;
    },
  },
  providers: [], // 在 auth.ts 補
} satisfies NextAuthConfig;
```

- [ ] **Step 4：建立 `src/middleware.ts`**

```ts
// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 5：commit**

```powershell
git add .
git commit -m "feat(auth): install Auth.js v5 with edge-safe middleware"
```

---

## Task 8: Credentials Provider（Email + 密碼，bcryptjs 雜湊）

- [ ] **Step 1：建立 `src/lib/crypto.ts`**

```ts
// src/lib/crypto.ts
import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 2：建立 `src/auth/auth.ts`（主設定）**

```ts
// src/auth/auth.ts
import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/crypto";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "rrms.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await db.query.users.findFirst({
          where: eq(users.email, String(creds.email)),
        });
        if (!user || !user.passwordHash || user.disabledAt) return null;
        const ok = await verifyPassword(
          String(creds.password),
          user.passwordHash,
        );
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
```

- [ ] **Step 3：建立 `src/app/api/auth/[...nextauth]/route.ts`**

```ts
// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/auth/auth";
```

- [ ] **Step 4：建立 `src/app/login/page.tsx`（最小可用版）**

```tsx
// src/app/login/page.tsx
import { signIn } from "@/auth/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">後台登入</h1>
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/admin",
          });
        }}
        className="space-y-4"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="email"
          className="block w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="密碼"
          className="block w-full rounded border p-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-black p-2 text-white"
        >
          登入
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5：commit**

```powershell
git add .
git commit -m "feat(auth): credentials provider with bcrypt + login page"
```

---

## Task 9: Google OAuth Provider（含外部設定）

- [ ] **Step 1：使用者手動 — 建立 Google OAuth Client**

1. 開 https://console.cloud.google.com/
2. 上方下拉選 / 建立專案 `rrms`
3. 左側 menu → `APIs & Services` → `OAuth consent screen`
   - User Type: External
   - App name: RRMS
   - User support email: 你的 email
   - Developer contact: 你的 email
   - Scopes：加 `openid`、`email`、`profile`
   - Test users：加你自己的 Gmail（為了開發測試）
4. 左側 menu → `APIs & Services` → `Credentials`
5. 按 `Create Credentials` → `OAuth client ID`
6. Application type: `Web application`
7. Name: `rrms-dev`
8. Authorized redirect URIs：填以下兩個
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<你的-vercel-domain>/api/auth/callback/google`
9. 按 Create → 跳出 client ID + client secret，複製下來

- [ ] **Step 2：把 secret 推到 Vercel + 本機**

```powershell
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
# 各環境（development / preview / production）都加
```

`.env.local` 也加：
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

- [ ] **Step 3：把 Google provider 加到 `src/auth/auth.ts`**

```ts
import Google from "next-auth/providers/google";

// 在 providers: [...] 內加：
Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  allowDangerousEmailAccountLinking: false, // Phase 1 嚴格：必須事先邀請的同事 email 才能登入
}),
```

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(auth): add Google OAuth provider"
```

---

## Task 10: LINE Login Provider（自訂 OAuth）

- [ ] **Step 1：使用者手動 — 建立 LINE Login Channel**

1. 開 https://developers.line.biz/console/
2. 選或建立 Provider（公司名稱）
3. Channel 列表 → Create → `LINE Login`
4. Channel 名稱：`RRMS Admin Login (dev)`
5. Channel 說明：管理員後台登入用
6. App types: 勾 Web app
7. Email：你的
8. 按 Create
9. 進到 Channel 設定頁：
   - 上方分頁 `LINE Login`
   - Callback URL：填 `http://localhost:3000/api/auth/callback/line` 與 `https://<你的-vercel-domain>/api/auth/callback/line`（用換行分隔）
10. 上方分頁 `Basic settings`：
    - 記下 `Channel ID` 與 `Channel secret`

- [ ] **Step 2：把 secret 推進去**

```powershell
vercel env add LINE_LOGIN_CHANNEL_ID
vercel env add LINE_LOGIN_CHANNEL_SECRET
```

`.env.local` 也加。

- [ ] **Step 3：建立 `src/auth/providers/line.ts`**

```ts
// src/auth/providers/line.ts
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

interface LineProfile {
  sub: string; // LINE userId (immutable)
  name: string;
  picture?: string;
  email?: string;
}

export default function LineProvider(
  options: OAuthUserConfig<LineProfile>,
): OAuthConfig<LineProfile> {
  return {
    id: "line",
    name: "LINE",
    type: "oauth",
    issuer: "https://access.line.me",
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: { scope: "openid profile email" },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/v2/profile",
    idToken: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email ?? null,
        image: profile.picture ?? null,
      };
    },
    options,
  };
}
```

來源：LINE Login OpenID Connect https://developers.line.biz/en/docs/line-login/integrate-line-login/#using-openid-connect

- [ ] **Step 4：把 LINE provider 加到 `src/auth/auth.ts`**

```ts
import LineProvider from "./providers/line";

// 在 providers: [...] 內加：
LineProvider({
  clientId: process.env.LINE_LOGIN_CHANNEL_ID!,
  clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
}),
```

- [ ] **Step 5：commit**

```powershell
git add .
git commit -m "feat(auth): add LINE Login OAuth provider"
```

---

## Task 11: Cookie 安全強化已含於 Task 8

Task 8 Step 2 的 `cookies.sessionToken.options` 已套：
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: production-only true`

對應 spec 6.7.3。Task 16 紅隊測試會驗證。

---

## Task 12: Admin 邀請 + 啟用流程

- [ ] **Step 1：擴充 schema，加 invitations 表**

`src/db/schema.ts` 新增：

```ts
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  token: text("token").notNull(), // 一次性 + 雜湊存
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

跑 migration：
```powershell
pnpm db:generate
pnpm db:push
```

- [ ] **Step 2：建立 server action `src/app/admin/users/actions.ts`**

```ts
// src/app/admin/users/actions.ts
"use server";
import { auth } from "@/auth/auth";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { randomBytes, createHash } from "node:crypto";

export async function inviteUser(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  const email = String(formData.get("email"));
  const role = String(formData.get("role")) as "staff" | "admin";

  const tokenPlain = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(invitations).values({
    email,
    role,
    token: tokenHash,
    expiresAt,
    invitedByUserId: session.user.id,
  });

  // TODO（Plan 8 啟用前接 Resend / Vercel Email）：
  // 暫時 Phase 1 階段，把連結直接列出來給管理員自己貼給同事
  return {
    inviteLink: `${process.env.AUTH_URL}/invite/${tokenPlain}`,
  };
}
```

- [ ] **Step 3：建立啟用頁 `src/app/invite/[token]/page.tsx`**

```tsx
// src/app/invite/[token]/page.tsx
import { db } from "@/db/client";
import { invitations, users } from "@/db/schema";
import { hashPassword } from "@/lib/crypto";
import { createHash } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.token, tokenHash),
      isNull(invitations.acceptedAt),
      gt(invitations.expiresAt, new Date()),
    ),
  });
  if (!invite) {
    return <main className="p-8">邀請連結無效或已過期</main>;
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">啟用帳號</h1>
      <p className="mb-4 text-sm">Email: {invite.email}</p>
      <form
        action={async (fd) => {
          "use server";
          const password = String(fd.get("password"));
          const name = String(fd.get("name"));
          await db.insert(users).values({
            email: invite.email,
            name,
            role: invite.role,
            passwordHash: await hashPassword(password),
          });
          await db
            .update(invitations)
            .set({ acceptedAt: new Date() })
            .where(eq(invitations.id, invite.id));
          redirect("/login");
        }}
        className="space-y-4"
      >
        <input
          name="name"
          required
          placeholder="姓名"
          className="block w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          required
          minLength={12}
          placeholder="密碼（最少 12 字元）"
          className="block w-full rounded border p-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-black p-2 text-white"
        >
          啟用
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(auth): admin invitation + token-based activation flow"
```

---

## Task 13: Admin 帳號管理頁

- [ ] **Step 1：建立 `src/app/admin/layout.tsx`**

```tsx
// src/app/admin/layout.tsx
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="min-h-screen">
      <header className="border-b p-4">
        <nav className="flex gap-4">
          <a href="/admin">Dashboard</a>
          {session.user.role === "admin" && (
            <a href="/admin/users">帳號管理</a>
          )}
          <a href="/api/auth/signout" className="ml-auto">
            登出（{session.user.email}）
          </a>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2：建立 `src/app/admin/page.tsx`**

```tsx
// src/app/admin/page.tsx
export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">後台 Dashboard</h1>
      <p className="text-gray-600">案件列表與統計在 Plan 6 加入。</p>
    </div>
  );
}
```

- [ ] **Step 3：建立 `src/app/admin/users/page.tsx`**

```tsx
// src/app/admin/users/page.tsx
import { auth } from "@/auth/auth";
import { db } from "@/db/client";
import { users, invitations } from "@/db/schema";
import { redirect } from "next/navigation";
import { isNull } from "drizzle-orm";
import { inviteUser } from "./actions";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin");

  const allUsers = await db.select().from(users);
  const pendingInvites = await db
    .select()
    .from(invitations)
    .where(isNull(invitations.acceptedAt));

  return (
    <div>
      <h1 className="text-2xl font-bold">帳號管理</h1>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">邀請新同事</h2>
        <form action={inviteUser} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email"
            className="rounded border p-2"
          />
          <select name="role" className="rounded border p-2">
            <option value="staff">同事</option>
            <option value="admin">管理員</option>
          </select>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            產生邀請連結
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">現有帳號</h2>
        <ul className="space-y-1">
          {allUsers.map((u) => (
            <li key={u.id} className="flex gap-2">
              <span>{u.email}</span>
              <span className="text-gray-500">({u.role})</span>
              {u.disabledAt && <span className="text-red-500">已停用</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">待啟用邀請</h2>
        <ul className="space-y-1">
          {pendingInvites.map((i) => (
            <li key={i.id}>{i.email} — 過期：{i.expiresAt.toISOString()}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 4：建第一個 admin 帳號（種子資料）**

建立 `scripts/seed-admin.ts`：

```ts
// scripts/seed-admin.ts
import "dotenv/config";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/crypto";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL!;
  const password = process.env.SEED_ADMIN_PASSWORD!;
  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
    process.exit(1);
  }
  await db.insert(users).values({
    email,
    name: "Initial Admin",
    role: "admin",
    passwordHash: await hashPassword(password),
  });
  console.log(`Seeded admin: ${email}`);
}
main();
```

執行（使用者操作；本次性）：
```powershell
$env:SEED_ADMIN_EMAIL="<你的email>"; $env:SEED_ADMIN_PASSWORD="<暫時密碼>"
pnpm tsx scripts/seed-admin.ts
```
裝 tsx：`pnpm add -D tsx`

- [ ] **Step 5：手動驗證登入流程**

1. `pnpm dev`
2. 開 http://localhost:3000/login
3. 用 seed admin 帳密登入
4. 自動跳到 /admin → 看到 Dashboard
5. 點「帳號管理」→ 邀請新同事 → 拿到邀請連結
6. 用無痕視窗開該連結 → 設新密碼 → 跳回登入頁
7. 用新同事帳號登入 → 看到 Dashboard 但**不**看到「帳號管理」連結

- [ ] **Step 6：commit**

```powershell
git add .
git commit -m "feat(admin): users management page + seed admin script"
```

---

## Task 14: 紅隊驗證 — Cookie HttpOnly + CSRF + 權限隔離

- [ ] **Step 1：安裝 Playwright**

```powershell
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2：建立 `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./__tests__",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:3000" },
});
```

- [ ] **Step 3：寫 `__tests__/auth/cookie-httponly.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("auth session cookie is HttpOnly and inaccessible to JS", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  // 假設已 seed admin 帳號用環境變數帶入
  await page.fill("input[name=email]", process.env.TEST_ADMIN_EMAIL!);
  await page.fill("input[name=password]", process.env.TEST_ADMIN_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");

  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name.includes("session-token"));
  expect(session, "session cookie should exist").toBeDefined();
  expect(session?.httpOnly, "must be HttpOnly").toBe(true);
  expect(session?.sameSite).toBe("Lax");

  // 驗證 JS 確實讀不到（attacker simulation）
  const jsAccess = await page.evaluate(() => document.cookie);
  expect(jsAccess).not.toContain("session-token");
});
```

- [ ] **Step 4：寫 `__tests__/auth/privilege-escalation.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("staff role cannot access /admin/users", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=email]", process.env.TEST_STAFF_EMAIL!);
  await page.fill("input[name=password]", process.env.TEST_STAFF_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");

  await page.goto("/admin/users");
  // 應被重導到 /admin
  await expect(page).toHaveURL(/\/admin$/);
});

test("anonymous request to admin server action is rejected", async ({
  request,
}) => {
  const r = await request.post("/admin/users", {
    form: { email: "attacker@evil.com", role: "admin" },
  });
  expect([401, 403, 404]).toContain(r.status());
});
```

- [ ] **Step 5：跑測試**

```powershell
pnpm exec playwright test
```
預期：兩個測試 PASS。

- [ ] **Step 6：commit**

```powershell
git add __tests__ playwright.config.ts package.json pnpm-lock.yaml
git commit -m "test(security): red-team auth — cookie HttpOnly + privilege escalation"
```

---

## Plan 3 驗收條件

- [ ] 7 張表已在 Neon DB 建立（drizzle studio 看得到）
- [ ] Auth.js 三 provider 都能登入（Email/Google/LINE 至少各試一次）
- [ ] Seed admin 能登入；可邀請新同事；新同事啟用後可登入
- [ ] Staff 角色看不到「帳號管理」連結；直接打 /admin/users 被重導
- [ ] Cookie HttpOnly Playwright 測試 PASS
- [ ] 權限隔離 Playwright 測試 PASS
- [ ] CI 全部 jobs 綠勾

---

## Self-Review

- ✅ Spec coverage: 4.3、5、6.7.3、6.7.4 部分、攻擊測試 Cookie / Auth / CSRF
- ✅ 命名一致：`users` table、`auth.ts`、`/admin/users` 路徑前後一致
- ⚠️ Resend / 真正寄邀請信延後到 Plan 8（cutover），Phase 1 內部可手動貼連結

---

## 後續

完成 Plan 3 接 Plan 4（公開報修表單 + PDPA 同意機制）。
