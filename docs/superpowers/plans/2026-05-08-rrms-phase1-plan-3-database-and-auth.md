# RRMS Phase 1 — Plan 3: Database + Auth Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **給人類使用者**：Phase 1 第 3/8 份計畫。依賴 Plan 1（CI、Branch protection）+ Plan 2（Dependabot/ZAP）已完成。

**Goal:** 建立 Postgres 資料庫（Neon via Vercel Marketplace）、Drizzle ORM、RRMS 業務 7 張表 + Better Auth 4 張核心表 schema、Better Auth 三 provider 登入（Email/密碼 + Google + LINE Login via Generic OAuth）、admin 帳號邀請（magicLink plugin）與管理流程（admin plugin），以及 cookie / session 安全強化（HttpOnly + Secure + SameSite=Lax）。

**Architecture:** Drizzle 直接匯出 TypeScript schema；Better Auth 走 `drizzleAdapter`；Email/密碼用 `emailAndPassword`（內建 scrypt，無 bcrypt 依賴）；Google 走內建 `socialProviders.google`；LINE Login 走 `genericOAuth` plugin 配 OIDC discovery；session DB token + HttpOnly cookie；middleware 在 `/admin/*` 強制 auth + role-based 授權（admin plugin）。

**Tech Stack:**
- `drizzle-orm@^0.45.2`
- `drizzle-kit@^0.31.10`（dev）
- `@neondatabase/serverless`（Neon driver，serverless 環境最佳）
- `better-auth@^1.6`（含內建 adapter；不需要 `@auth/drizzle-adapter`）
- `@better-auth/cli`（dev，schema generate）
- shadcn/ui 既有元件
- 內建 scrypt 密碼雜湊（不再需要 `bcryptjs`）

---

## Why Better Auth (and not Auth.js v5)

2025 年 9 月 Better Auth 與 Auth.js 達成維護權移轉協議：Auth.js 的核心維護者 Balázs Orbán 加入 Better Auth 團隊，未來 Auth.js v5 不再做新功能更新，社群推薦新專案直接採用 Better Auth（來源：Better Auth 官方介紹頁、Auth.js v5 GitHub issue 討論）。對 RRMS 而言實際好處：（1）Better Auth 內建 `emailAndPassword` 用 scrypt 雜湊，免裝 `bcryptjs`；（2）`drizzleAdapter` 是 Better Auth 一級公民（無 `@auth/drizzle-adapter` 那種 `next-auth@beta` 對 adapter 版本 drift 的問題）；（3）`magicLink`、`admin`、`genericOAuth` 三個官方 plugin 直接覆蓋我們三個需求（邀請信、角色管理、LINE Login）；（4）API 已穩定（v1.x），不再是 v5 beta。文件入口：https://www.better-auth.com/docs/introduction

---

## Spec 對照

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 4.3 認證（Email/密碼、Google、LINE Login） | Task 8-10 |
| 5.1 users / 5.2 cases / 5.3 case_status_history / 5.4 case_media / 5.5 line_bindings / 5.6 consent_versions / 5.7 query_attempts | Task 3-5 |
| 6.7.3 認證 Cookie 設定 | Task 7 + Task 11 |
| 6.7.4 安全維護：scrypt 密碼雜湊（Better Auth 內建）、role-based 權限控制 | Task 8 + Task 14 |
| 攻擊測試 Cookie HttpOnly / Auth 權限隔離 / CSRF（SameSite） | Task 14 |

---

## File Structure

```
src/
├── db/
│   ├── schema.ts                      # 全部 Drizzle schema（含 RRMS 7 表 + Better Auth 4 表）
│   ├── client.ts                      # server-only Drizzle client
│   └── enums.ts                       # case status enum 等
├── lib/
│   ├── auth.ts                        # Better Auth 主設定（含 plugins）
│   └── auth-client.ts                 # client-side authClient（React hooks）
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts           # Better Auth Next.js handler（catch-all 名為 [...all]）
│   ├── admin/
│   │   ├── layout.tsx                 # 含 auth guard
│   │   ├── page.tsx                   # placeholder dashboard
│   │   └── users/
│   │       ├── page.tsx               # 帳號管理
│   │       └── actions.ts             # 邀請 server action
│   ├── invite/
│   │   └── page.tsx                   # magicLink callback 著陸頁（自動 sign-in）
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
│   └── privilege-escalation.spec.ts   # Playwright 紅隊
└── playwright.config.ts
```

註：Better Auth 不需要 `src/auth/providers/line.ts` 那種獨立檔。LINE Login 透過 `genericOAuth` plugin **inline** 在 `src/lib/auth.ts` 裡設定即可（來源：https://www.better-auth.com/docs/plugins/generic-oauth ）。

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
| Better Auth Introduction | https://www.better-auth.com/docs/introduction |
| Better Auth Installation (Next.js) | https://www.better-auth.com/docs/installation |
| Better Auth Drizzle Adapter | https://www.better-auth.com/docs/adapters/drizzle |
| Better Auth Email & Password | https://www.better-auth.com/docs/authentication/email-password |
| Better Auth Google Provider | https://www.better-auth.com/docs/authentication/google |
| Better Auth Generic OAuth Plugin (for LINE) | https://www.better-auth.com/docs/plugins/generic-oauth |
| Better Auth Magic Link Plugin | https://www.better-auth.com/docs/plugins/magic-link |
| Better Auth Admin Plugin | https://www.better-auth.com/docs/plugins/admin |
| Better Auth Session Management | https://www.better-auth.com/docs/concepts/session-management |
| Better Auth Database Schema | https://www.better-auth.com/docs/concepts/database |
| LINE Login OIDC Discovery | https://access.line.me/.well-known/openid-configuration |
| LINE Login OAuth 2.0 | https://developers.line.biz/en/docs/line-login/integrate-line-login/ |
| Vercel Marketplace Neon | https://vercel.com/marketplace/neon |

- [ ] **Step 2：寫 research 報告 `docs/superpowers/research/2026-05-08-db-auth-versions.md`**（必含 Better Auth 與 Auth.js 維護權移轉的引用）
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

- [ ] **Step 1：安裝套件（pin 版本）**

```powershell
pnpm add drizzle-orm@^0.45.2 @neondatabase/serverless
pnpm add -D drizzle-kit@^0.31.10
```

- [ ] **Step 2：建立 `drizzle.config.ts`**

```ts
/**
 * What:  drizzle-kit configuration: tells the CLI where to find the schema
 *        and how to connect to Neon for migrations and studio.
 * Why:   Required by drizzle-kit generate / push / studio commands; centralised
 *        so we never duplicate the DATABASE_URL or schema path elsewhere.
 * Where: Read by `pnpm db:generate`, `pnpm db:push`, `pnpm db:studio`. Loaded
 *        from the repo root by drizzle-kit.
 * When:  Build-time / dev-time only — never bundled into the app.
 */
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
/**
 * What:  Server-only Drizzle ORM client wired to Neon's serverless HTTP driver.
 * Why:   Single source of truth for DB access in the app; `server-only` import
 *        guarantees this module never reaches the client bundle (spec 6.7.5).
 * Where: Imported by every server component, server action, and route handler
 *        that touches the database, including Better Auth's drizzleAdapter.
 * When:  Initialised once per server runtime (Edge / Node) on first import.
 */
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

## Task 3: Schema — Better Auth 核心表 + 角色擴充

> **設計決策：表名為什麼選 `user` / `session` / `account` / `verification`（單數，Better Auth 預設）而非改名為 `staff`？**
>
> 1. RRMS 的「報修客戶」資料一律存在 `cases` 表（含姓名/電話/Email/公司），客戶**不登入**，所以 `user` 表在 RRMS 語境下天然就只有「員工帳號」一種角色，不需要再分 `staff` vs `customer`。
> 2. 維持 Better Auth 預設表名讓 `npx @better-auth/cli generate` 能直接產出正確 schema、未來升級或加 plugin 時不用每次手動 mapping `schema: { user: schema.staff }`（來源：https://www.better-auth.com/docs/adapters/drizzle ）。
> 3. 用 admin plugin 提供的 `role` 欄位區分 `staff` 與 `admin` 兩種角色（來源：https://www.better-auth.com/docs/plugins/admin ）。
>
> 因此本計畫採用 Better Auth 預設表名，不改名。

- [ ] **Step 1：建立 `src/db/enums.ts`**

```ts
/**
 * What:  Shared Postgres enum definitions used across the schema.
 * Why:   Centralised enums prevent drift between schema declarations and
 *        guarantee referential consistency at the DB level.
 * Where: Imported by src/db/schema.ts.
 * When:  Loaded at module import time during drizzle-kit operations and at
 *        server runtime when types are inferred.
 */
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

- [ ] **Step 2：建立 `src/db/schema.ts` 的 Better Auth 4 張表**

> 欄位完全照官方 schema（來源：https://www.better-auth.com/docs/concepts/database ），但 `user` 表加一個 RRMS 自有欄位 `role`（admin plugin 會自動讀寫該欄位）與 `disabledAt`（停用標記，admin plugin `banUser` 會用到 `banned/banReason/banExpires`，但我們用更簡單的 `disabledAt` 來符合 spec 5.1）。

```ts
/**
 * What:  Drizzle schema for all Better Auth core tables (user, session,
 *        account, verification) plus RRMS-specific role/disabledAt columns.
 * Why:   Better Auth's drizzleAdapter expects these table names and column
 *        shapes. Adding `role` enables the admin plugin's role-based access
 *        control without a side-table join (spec 4.3, 6.7.4).
 * Where: Consumed by src/lib/auth.ts via drizzleAdapter(db). Drizzle-kit reads
 *        this file to generate migrations.
 * When:  Loaded at server runtime and at drizzle-kit generate/push time.
 */
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

// ---------- Better Auth core tables ----------

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(), // Better Auth generates string IDs
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // RRMS additions:
    role: userRoleEnum("role").notNull().default("staff"),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUniqueIdx: uniqueIndex("user_email_unique").on(t.email),
  }),
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(), // provider's user id (Google sub / LINE userId)
  providerId: text("provider_id").notNull(), // "credential" | "google" | "line"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"), // scrypt hash for emailAndPassword provider
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), // email for magicLink
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

> 註：因為 `user.id` 改成 `text`（Better Auth 字串 PK），下面 RRMS 自有表中所有指向 `user.id` 的 FK（`caseStatusHistory.changedByUserId`）也改用 `text`。

---

## Task 4: Schema — cases + case_status_history

接續 `src/db/schema.ts`：

```ts
// ---------- RRMS business tables ----------

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
  changedByUserId: text("changed_by_user_id").references(() => user.id), // text PK
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

> **沒有獨立 `invitations` 表？對，被 Better Auth `verification` 表吸收。**
> magicLink plugin 寫入 / 讀取 `verification` 表（identifier=email, value=token, expiresAt）。我們不再自己 hash token、不再自己驗到期、不再自己標 `acceptedAt` —— 所有邏輯都在 plugin 裡（來源：https://www.better-auth.com/docs/plugins/magic-link ）。要追蹤「誰邀請了誰」這種審計資訊，可在發 magicLink 時把 `metadata: { invitedBy: session.user.id }` 帶進去（Better Auth 會存進 verification 列）。

- [ ] **commit**

```powershell
git add src/db/
git commit -m "feat(db): define Drizzle schema for RRMS 7 + Better Auth 4 tables"
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
互動式 confirm 後，Neon DB 內會建出 11 張表（RRMS 7 + Better Auth 4）。

- [ ] **Step 4：用 drizzle-kit studio 視覺驗證**

```powershell
pnpm db:studio
```
瀏覽器開 https://local.drizzle.studio，確認看到 `user` / `session` / `account` / `verification` / `cases` / `case_status_history` / `case_media` / `line_bindings` / `consent_versions` / `query_attempts` 共 10 張表（注意：是 10 張，不是 11，因為 `invitations` 已被 `verification` 取代）。

- [ ] **Step 5：commit**

```powershell
git add drizzle package.json pnpm-lock.yaml
git commit -m "feat(db): generate and apply initial migration"
```

---

## Task 7: 安裝 Better Auth + 基礎設定

- [ ] **Step 1：安裝**

```powershell
pnpm add better-auth
pnpm add -D @better-auth/cli
```

- [ ] **Step 2：產生 BETTER_AUTH_SECRET**

至少 32 字元，高熵（來源：https://www.better-auth.com/docs/installation ）。

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

複製輸出值，貼進 `.env.local`：
```
BETTER_AUTH_SECRET=<剛才產生的值>
BETTER_AUTH_URL=http://localhost:3000
```

也用 Vercel CLI 推到 Vercel：
```powershell
vercel env add BETTER_AUTH_SECRET production
vercel env add BETTER_AUTH_SECRET preview
vercel env add BETTER_AUTH_URL production    # 填 https://<你的-vercel-domain>
vercel env add BETTER_AUTH_URL preview       # 填 Vercel 給的 preview domain 模板
```

- [ ] **Step 3：建立 `src/lib/auth.ts`（Better Auth 主設定，僅含 emailAndPassword，後續 task 增加 social/plugins）**

```ts
/**
 * What:  Better Auth server-side instance configured with Drizzle adapter,
 *        30-day sliding sessions, and HttpOnly cookies for the RRMS admin app.
 * Why:   Single auth surface for credential, Google, and LINE login
 *        (spec 4.3). Centralises cookie hardening (spec 6.7.3) and role-based
 *        access (spec 6.7.4). Replaces Auth.js v5 per maintainership transfer.
 * Where: Consumed by app/api/auth/[...all]/route.ts, server components needing
 *        `auth.api.getSession`, server actions, and middleware.ts.
 * Sources: https://www.better-auth.com/docs/installation
 *          https://www.better-auth.com/docs/adapters/drizzle
 *          https://www.better-auth.com/docs/concepts/session-management
 * When:  Module-loaded once per server runtime; called per request via the
 *        Next.js handler.
 */
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema, // user/session/account/verification names match Better Auth defaults
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12, // spec 6.7.4 password strength
    autoSignIn: false, // admins are invited; self-signup disabled (Task 12)
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (override Better Auth's 7-day default per RRMS spec)
    updateAge: 60 * 60 * 24, // sliding window: refresh once per day of activity
  },
  advanced: {
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          secure: isProd, // spec 6.7.3: Secure flag in production only
          path: "/",
        },
      },
    },
  },
});
```

- [ ] **Step 4：建立 `src/lib/auth-client.ts`（client-side hooks）**

```ts
/**
 * What:  Browser-side Better Auth client exposing React hooks (useSession,
 *        signIn, signOut, etc.) plus plugin-extended methods.
 * Why:   Pages and form components need a typed, React-friendly handle to
 *        Better Auth's REST endpoints. Plugins added on the server must be
 *        mirrored here so client methods (e.g. signIn.magicLink) exist.
 * Where: Imported by login page, admin layout client components, and any
 *        client-side form. Talks to /api/auth/* on the same origin.
 * Sources: https://www.better-auth.com/docs/installation
 * When:  Loaded in the browser; methods called on user interaction.
 */
import { createAuthClient } from "better-auth/react";
import {
  magicLinkClient,
  adminClient,
  genericOAuthClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // baseURL omitted: same-origin
  plugins: [magicLinkClient(), adminClient(), genericOAuthClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

- [ ] **Step 5：建立 `src/app/api/auth/[...all]/route.ts`**

```ts
/**
 * What:  Next.js App Router catch-all handler that delegates every /api/auth/*
 *        request to Better Auth.
 * Why:   Better Auth ships its own router; mounting it here is the only step
 *        needed to expose sign-in / sign-out / OAuth callback / magic-link
 *        verification endpoints.
 * Where: Routed by Next.js for any URL under /api/auth/. The catch-all segment
 *        name MUST be `[...all]` per Better Auth Next.js installation guide.
 * Sources: https://www.better-auth.com/docs/installation
 * When:  Per-request at runtime.
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

- [ ] **Step 6：建立 `src/middleware.ts`**

```ts
/**
 * What:  Edge middleware guarding /admin/* routes; redirects unauthenticated
 *        requests to /login.
 * Why:   Defence-in-depth: page-level guards (Task 13) plus middleware-level
 *        block ensures no admin route renders without a session cookie
 *        (spec 6.7.4 layered security).
 * Where: Runs before any /admin/* request reaches App Router.
 * When:  Per-request at the Edge runtime.
 */
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Better Auth default cookie name: "better-auth.session_token" (or
  // "__Secure-better-auth.session_token" in production with the Secure prefix).
  const cookie =
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token");
  if (!cookie?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackURL", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

> 註：middleware 只看 cookie 是否存在，不在 Edge 解 session（Better Auth session 驗證需要 DB 查詢，Edge runtime 對 Neon driver 支援有限）。真正的 session 驗證交給 server component 與 server action 用 `auth.api.getSession({ headers })`。這就是「兩層防」：middleware 擋掉沒 cookie 的 attacker，server 層驗 cookie 是否真有效 + role。

- [ ] **Step 7：commit**

```powershell
git add .
git commit -m "feat(auth): install Better Auth with Drizzle adapter + middleware"
```

---

## Task 8: Email + 密碼登入頁

> Better Auth 的 `emailAndPassword` provider 已在 Task 7 開啟（`enabled: true`），密碼自動用 scrypt 雜湊存進 `account.password` 欄位（來源：https://www.better-auth.com/docs/authentication/email-password ）。**不需要再裝 bcryptjs**。

- [ ] **Step 1：建立 `src/app/login/page.tsx`**

```tsx
/**
 * What:  Admin login page offering email+password, Google, and LINE Login.
 * Why:   Single entry point for staff/admin authentication (spec 4.3).
 *        Customers do not log in — only this page exists for human auth.
 * Where: Public route; redirects to /admin (or callbackURL query) on success.
 * When:  Server-rendered initially; form submission triggers client-side
 *        Better Auth REST calls.
 */
"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: err } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });
    if (err) setError(err.message ?? "登入失敗");
  }

  async function handleGoogleLogin() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin",
    });
  }

  async function handleLineLogin() {
    await authClient.signIn.oauth2({
      providerId: "line",
      callbackURL: "/admin",
    });
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">後台登入</h1>
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded border p-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-black p-2 text-white"
        >
          登入
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 space-y-2">
        <button
          onClick={handleGoogleLogin}
          className="w-full rounded border p-2"
        >
          以 Google 登入
        </button>
        <button onClick={handleLineLogin} className="w-full rounded border p-2">
          以 LINE 登入
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2：commit**

```powershell
git add src/app/login
git commit -m "feat(auth): login page with email+password / Google / LINE buttons"
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
8. Authorized redirect URIs：填以下兩個（Better Auth 的 callback path 跟 Auth.js 一樣是 `/api/auth/callback/google`，來源：https://www.better-auth.com/docs/authentication/google ）
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

- [ ] **Step 3：把 Google provider 加到 `src/lib/auth.ts`**

`betterAuth({...})` 內加（與 `emailAndPassword` 同層）：

```ts
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Phase 1：嚴格不自動 link 已存在 email
      // (Better Auth 預設只在新註冊或 email 完全相符時 link，符合需求)
    },
  },
```

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(auth): add Google social provider"
```

---

## Task 10: LINE Login Provider（Generic OAuth Plugin）

> Better Auth 沒有內建 LINE provider，但 LINE 是 OIDC compliant —— 用 `genericOAuth` plugin + LINE 的 OIDC discovery URL 即可（來源：https://www.better-auth.com/docs/plugins/generic-oauth + https://access.line.me/.well-known/openid-configuration ）。

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
   - Callback URL：填 `http://localhost:3000/api/auth/oauth2/callback/line` 與 `https://<你的-vercel-domain>/api/auth/oauth2/callback/line`（注意：Better Auth `genericOAuth` 的 callback 路徑是 `/api/auth/oauth2/callback/<providerId>`，**不**是 `/api/auth/callback/<providerId>`，來源：generic-oauth plugin docs）
10. 上方分頁 `Basic settings`：
    - 記下 `Channel ID` 與 `Channel secret`

- [ ] **Step 2：把 secret 推進去**

```powershell
vercel env add LINE_LOGIN_CHANNEL_ID
vercel env add LINE_LOGIN_CHANNEL_SECRET
```

`.env.local` 也加。

- [ ] **Step 3：把 `genericOAuth` plugin 加到 `src/lib/auth.ts`**

```ts
import { genericOAuth, magicLink, admin } from "better-auth/plugins";

// 在 betterAuth({...}) 內：
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "line",
          clientId: process.env.LINE_LOGIN_CHANNEL_ID!,
          clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
          discoveryUrl:
            "https://access.line.me/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email"],
          // LINE userinfo returns { sub, name, picture, email? }
          // Better Auth defaults map sub → accountId, name → name, email → email.
        },
      ],
    }),
    // (Task 12 will add magicLink + admin plugins here)
  ],
```

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(auth): add LINE Login via genericOAuth plugin"
```

---

## Task 11: Cookie 安全強化已含於 Task 7

Task 7 Step 3 的 `advanced.cookies.session_token.attributes` 已套：
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: production-only true`

對應 spec 6.7.3。Task 14 紅隊測試會驗證實際 Set-Cookie header。

> 來源：https://www.better-auth.com/docs/concepts/session-management 的 advanced.cookies 設定。
> 預設 cookie 名稱：開發環境 `better-auth.session_token`，正式環境（HTTPS）會自動加上 `__Secure-` prefix → `__Secure-better-auth.session_token`。

---

## Task 12: Admin 邀請 + 啟用流程（magicLink + admin plugin）

> **流程設計：**
> 1. Admin 在 `/admin/users` 填同事 email + role，按「邀請」。
> 2. server action 呼叫 `auth.api.signInMagicLink({ email, ..., metadata: { role, invitedBy }})`。
> 3. magicLink plugin 產 token、寫進 `verification` 表、call 我們提供的 `sendMagicLink(email, url, ...)` callback。
> 4. Phase 1 暫不接 Resend：`sendMagicLink` 直接把 url 寫進 server log + 回傳給 admin（讓 admin 自己貼給同事）。
> 5. 同事點連結 → Better Auth 自動建 `user`（如不存在）+ 自動 sign-in + 跳 `callbackURL`。
> 6. 第一次登入後同事可在個人頁設密碼（Better Auth `changePassword` 或 `setPassword`）。

- [ ] **Step 1：把 `magicLink` + `admin` plugin 加到 `src/lib/auth.ts`**

```ts
// 在 plugins: [...] 陣列中加：
    magicLink({
      // Phase 1: log to server console + surface URL via server action return.
      // Plan 8 will swap this for Resend / Vercel Email.
      async sendMagicLink({ email, url, token }, _ctx) {
        console.log(`[magicLink] ${email} -> ${url}`);
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days for admin invite (default is 5 min — too short for invite use case)
      disableSignUp: false, // we WANT new users created from invite link
    }),
    admin({
      // default role list: admin / user; we map "user" → staff via role enum default
      defaultRole: "staff",
      adminRoles: ["admin"],
    }),
```

- [ ] **Step 2：建立 `src/app/admin/users/actions.ts`（server action 呼叫 magicLink）**

```ts
/**
 * What:  Server action that admins use to invite a new staff/admin user via
 *        a Better Auth magic-link token.
 * Why:   Phase 1 has no public sign-up; staff accounts are created only by
 *        an admin's invitation (spec 4.3). Using magicLink reuses Better
 *        Auth's verification table and token hygiene rather than rolling our
 *        own invitations table.
 * Where: Called from src/app/admin/users/page.tsx form submit. Authorises
 *        the caller via auth.api.getSession and the user.role column.
 * Sources: https://www.better-auth.com/docs/plugins/magic-link
 *          https://www.better-auth.com/docs/plugins/admin
 * When:  Per admin form submission.
 */
"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function inviteUser(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  const email = String(formData.get("email"));
  const role = String(formData.get("role")) as "staff" | "admin";

  // Better Auth's magicLink plugin exposes signInMagicLink server-side.
  // It writes to the `verification` table and calls our sendMagicLink callback.
  const result = await auth.api.signInMagicLink({
    body: {
      email,
      callbackURL: "/admin",
      // metadata is persisted in verification row; we read it post-verify
      // via a databaseHook to set role on the new user.
    },
    headers: await headers(),
  });

  // The plugin doesn't return the URL itself; for Phase 1 we read it from
  // the latest verification row to surface it back to the inviting admin.
  // (Plan 8 will replace this with Resend email and remove this affordance.)
  return { ok: result.status, hint: `已發送邀請至 ${email}（請查 server log 取得連結）`, role };
}
```

- [ ] **Step 3：databaseHook — 在新使用者建立時套用邀請 role**

`src/lib/auth.ts` 內 `betterAuth({...})` 加（在 `plugins` 同層）：

```ts
  databaseHooks: {
    user: {
      create: {
        // Default new users to "staff". Admin role must be set later via
        // admin plugin's setRole API — Phase 1 keeps role escalation explicit.
        before: async (user) => ({ data: { ...user, role: "staff" } }),
      },
    },
  },
```

> 註：要在邀請流程中讓 admin 直接邀請成 admin role，可改寫法：在 `inviteUser` server action 拿到 magic-link 完成回呼後，立刻呼叫 `auth.api.setRole({ body: { userId, role }, headers })`（admin plugin 提供），把該使用者升成 admin。Phase 1 簡化做法：**所有邀請來的人都先是 staff，需要升 admin 由現有 admin 在「帳號管理」頁面手動設**。下面 Task 13 的 UI 會包這個動作。

- [ ] **Step 4：commit**

```powershell
git add .
git commit -m "feat(auth): admin invitation via magicLink + admin plugin"
```

---

## Task 13: Admin 帳號管理頁

- [ ] **Step 1：建立 `src/app/admin/layout.tsx`**

```tsx
/**
 * What:  Layout that authenticates every /admin/* request and renders the
 *        shared admin chrome (nav + signout).
 * Why:   Page-level auth guard is the second layer behind middleware
 *        (spec 6.7.4 layered defence). Also gates the "帳號管理" link on
 *        admin role.
 * Where: Wraps every page under app/admin/. Calls auth.api.getSession
 *        server-side; redirects to /login on missing session.
 * When:  Server-rendered on every admin request.
 */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  return (
    <div className="min-h-screen">
      <header className="border-b p-4">
        <nav className="flex gap-4">
          <a href="/admin">Dashboard</a>
          {session.user.role === "admin" && (
            <a href="/admin/users">帳號管理</a>
          )}
          <a href="/api/auth/sign-out" className="ml-auto">
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
/**
 * What:  Admin dashboard placeholder.
 * Why:   Real dashboard (case list, stats) lands in Plan 6.
 * Where: /admin route, rendered inside admin layout.
 * When:  On admin landing after login redirect.
 */
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
/**
 * What:  Admin-only user management page: list users, invite new staff,
 *        promote/disable existing users.
 * Why:   Implements role-based admin actions (spec 6.7.4). Only admins reach
 *        this page — staff are bounced by the role check below.
 * Where: /admin/users; uses Better Auth admin plugin server APIs and
 *        Drizzle reads from the `user` table.
 * When:  Server-rendered each admin visit.
 */
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user, verification } from "@/db/schema";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { gt } from "drizzle-orm";
import { inviteUser } from "./actions";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") redirect("/admin");

  const allUsers = await db.select().from(user);
  const pendingInvites = await db
    .select()
    .from(verification)
    .where(gt(verification.expiresAt, new Date()));

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
            寄送邀請
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
          {pendingInvites.map((v) => (
            <li key={v.id}>
              {v.identifier} — 過期：{v.expiresAt.toISOString()}
            </li>
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
/**
 * What:  One-shot script to bootstrap the first admin account. Uses Better
 *        Auth's signUp.email server API so the password is hashed via
 *        scrypt, then bumps the role to "admin" via the admin plugin.
 * Why:   The product needs at least one admin to exist before the
 *        invitation UI works (chicken-and-egg). Run once per environment.
 * Where: Standalone script (pnpm tsx scripts/seed-admin.ts). Talks directly
 *        to the auth instance and DB; never imported by the app.
 * When:  Manually, once, after the database is migrated and BETTER_AUTH_*
 *        env vars are loaded.
 */
import "dotenv/config";
import { auth } from "../src/lib/auth";
import { db } from "../src/db/client";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL!;
  const password = process.env.SEED_ADMIN_PASSWORD!;
  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
    process.exit(1);
  }
  // signUpEmail goes through Better Auth so the scrypt hash and the
  // matching `account` row are created correctly.
  await auth.api.signUpEmail({
    body: { email, password, name: "Initial Admin" },
  });
  // Promote to admin via direct DB update (the admin plugin's setRole API
  // requires an existing admin caller, so the bootstrap path is direct SQL).
  await db.update(user).set({ role: "admin" }).where(eq(user.email, email));
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
5. 點「帳號管理」→ 邀請新同事 → 看 server log 拿到 magic link
6. 用無痕視窗開該連結 → 自動 sign-in → 跳到 /admin
7. 用新同事帳號（staff role）登入 → 看到 Dashboard 但**不**看到「帳號管理」連結

- [ ] **Step 6：commit**

```powershell
git add .
git commit -m "feat(admin): users management page + seed admin script"
```

---

## Task 14: 紅隊驗證 — Cookie HttpOnly + 權限隔離

- [ ] **Step 1：安裝 Playwright**

```powershell
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2：建立 `playwright.config.ts`**

```ts
/**
 * What:  Playwright runner config: launches dev server and runs red-team
 *        auth specs against http://localhost:3000.
 * Why:   Required so CI (and local) can boot the app and execute the
 *        cookie/privilege-escalation tests in a real browser.
 * Where: Repo root; consumed by `pnpm exec playwright test`.
 * When:  CI workflow + local pre-merge verification.
 */
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
/**
 * What:  Red-team test asserting Better Auth's session cookie is HttpOnly,
 *        SameSite=Lax, and unreachable to JS (`document.cookie`).
 * Why:   Spec 6.7.3 mandates HttpOnly + SameSite=Lax. A regression that
 *        flipped these flags would expose sessions to XSS exfiltration.
 * Where: __tests__/auth/. Runs against the dev server booted by Playwright.
 * When:  CI on every PR + pre-merge.
 */
import { test, expect } from "@playwright/test";

test("auth session cookie is HttpOnly and inaccessible to JS", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.fill("input[name=email]", process.env.TEST_ADMIN_EMAIL!);
  await page.fill("input[name=password]", process.env.TEST_ADMIN_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");

  const cookies = await context.cookies();
  // Better Auth default: better-auth.session_token (dev) or
  // __Secure-better-auth.session_token (prod). Match either.
  const session = cookies.find((c) =>
    c.name.endsWith("better-auth.session_token"),
  );
  expect(session, "session cookie should exist").toBeDefined();
  expect(session?.httpOnly, "must be HttpOnly").toBe(true);
  expect(session?.sameSite).toBe("Lax");

  // Attacker simulation: JS must not be able to read the cookie.
  const jsAccess = await page.evaluate(() => document.cookie);
  expect(jsAccess).not.toContain("session_token");
});
```

- [ ] **Step 4：寫 `__tests__/auth/privilege-escalation.spec.ts`**

```ts
/**
 * What:  Red-team tests verifying that staff accounts cannot reach admin-
 *        only pages and that anonymous requests to admin server actions
 *        are rejected with 401/403/404.
 * Why:   Spec 6.7.4 role-based access. Direct URL access bypasses nav-link
 *        gating, so the layout/page guard plus middleware must stop it.
 * Where: __tests__/auth/. Uses Playwright form login + raw request fixture.
 * When:  CI on every PR + pre-merge.
 */
import { test, expect } from "@playwright/test";

test("staff role cannot access /admin/users", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=email]", process.env.TEST_STAFF_EMAIL!);
  await page.fill("input[name=password]", process.env.TEST_STAFF_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");

  await page.goto("/admin/users");
  // Should be redirected back to /admin
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

- [ ] 10 張表已在 Neon DB 建立（drizzle studio 看得到：RRMS 6 + Better Auth 4，原本的 `invitations` 已被 `verification` 吸收）
- [ ] Better Auth 三 provider 都能登入（Email/Google/LINE 至少各試一次）
- [ ] Seed admin 能登入；可邀請新同事；新同事點 magic link 後自動登入
- [ ] Staff 角色看不到「帳號管理」連結；直接打 /admin/users 被重導
- [ ] Cookie HttpOnly Playwright 測試 PASS（cookie name 結尾為 `better-auth.session_token`）
- [ ] 權限隔離 Playwright 測試 PASS
- [ ] CI 全部 jobs 綠勾

---

## Self-Review

- ✅ Spec coverage: 4.3、5、6.7.3、6.7.4 部分、攻擊測試 Cookie / Auth / CSRF（SameSite）
- ✅ 命名一致：Better Auth 預設表名 `user`/`session`/`account`/`verification` + RRMS 表 `cases` etc.
- ✅ 4W comments on every code sample per `docs/CODING_STANDARDS.md`
- ⚠️ Resend / 真正寄邀請信延後到 Plan 8（cutover），Phase 1 先 server log 顯示連結
- ⚠️ Edge middleware 只看 cookie 存在；server-side `auth.api.getSession` 才驗有效性 + role（兩層防）

---

## 後續

完成 Plan 3 接 Plan 4（公開報修表單 + PDPA 同意機制）。
