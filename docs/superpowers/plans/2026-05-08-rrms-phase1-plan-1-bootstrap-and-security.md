# RRMS Phase 1 — Plan 1: Bootstrap & 5-Layer Security Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **給人類使用者**：本計畫為 Phase 1 第 1/8 份計畫。完成後產出可運作的 Next.js 專案骨架 + 五層縱深防禦中 L1/L2/L4 三道必要防線，並通過紅隊測試。後續計畫見本檔尾段。

**Goal:** 建立 RRMS 專案的 Next.js 16 骨架，部署 L1（Claude Code Hooks）+ L2（Pre-commit）+ L4（GitHub Actions CI）三層獨立的安全防護，並通過故意植入 secret 的紅隊測試證明三層皆能擋下，建立一個「再寫任何 feature code 之前，安全防線已經先到位」的開發環境。

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui，部署於 Vercel；專案根目錄掛 Husky pre-commit hook（gitleaks + ESLint + tsc）；GitHub Actions 執行同樣檢查作為 PR required status check；專案內 `.claude/settings.json` 設定 `Stop` + `PostToolUse(matcher=Task)` hooks 連動 `scripts/post-review-scan.sh`；自訂 ESLint rules 禁止 `NEXT_PUBLIC_*_SECRET / *_KEY / *_TOKEN` 命名，並禁止前端 import 第三方 server SDK；自訂 bundle scan script 確認 client output 不含 secret。

**Tech Stack:**
- Node.js 22 LTS（pnpm 11 強制最低；使用者本機已有 Node 24，Vercel CI 設 `node-version: '22'`）
- pnpm 10.x 或 11.x（latest）
- Next.js 16.x（App Router、React 19 stable、Turbopack 預設、`next build` **不再自動跑 lint** — CI 必須獨立 `pnpm lint`）
- React 19（stable，由 Next.js 16 提供）
- TypeScript 5.x（strict mode）
- Tailwind CSS v4（**沒有 `tailwind.config.js`，theme 用 `app/globals.css` 內 `@theme {}`**；shadcn init 自動處理）
- shadcn/ui（package 已從 `shadcn-ui` 改名為 `shadcn`）
- ESLint 10（flat config；v9 也相容）
- Husky 9.x（用 `husky init`，不是 `husky install`）+ lint-staged 17.x（v10+ 自動 `git add`，**不要在 task 中手動 add**）
- gitleaks 8.30.x
- semgrep（CI only，**用 `semgrep scan` 本地模式**，不要 `semgrep ci`，以免要登入雲端 AppSec Platform、把代碼上傳到第三方違反個資法）
- GitHub Actions（actions/checkout@v6、setup-node@v4）
- Vercel CLI（部分步驟手動於網頁操作）

**版本鎖定政策**：每項依賴在 Task 0 的 research 步驟驗證當下實際 latest stable 版本，若 spec 中所列版本與官方不符，以官方為準並回報。

---

## Spec 對照

本計畫對應 spec [docs/superpowers/specs/2026-05-07-rrms-phase1-design.md](../specs/2026-05-07-rrms-phase1-design.md) 中：

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 6.7.1 程式碼撰寫硬性規則 | Task 4 + Task 5 + Task 6 |
| 6.7.2 機密歸屬清單 | Task 11（.env.example 模板） |
| 6.7.3 認證 Cookie 設定 | 由 Plan 3 處理（Better Auth 設定時，Task 7 + Task 11） |
| 6.7.4 自動防護 L1 Claude hooks | Task 10 |
| 6.7.4 自動防護 L2 pre-commit | Task 6 |
| 6.7.4 自動防護 L4 GitHub Actions | Task 8 + Task 9 |
| 6.7.5 server-side-only API call | Task 4 自訂 ESLint rule |
| 6.7.6 違規處置 | Task 13 README 文件化 |
| 紅隊測試（5 層皆能擋） | Task 12 |

---

## File Structure

完成本計畫後，專案結構如下：

```
RRMS/
├── .claude/
│   └── settings.json                     # L1 hooks: Stop + PostToolUse(Task)
├── .github/
│   └── workflows/
│       └── ci.yml                        # L4 CI
├── .husky/
│   └── pre-commit                        # L2 hook
├── .gitleaks.toml                        # gitleaks 自訂 rules
├── .gitignore                            # 已存在；本計畫補強
├── .env.example                          # env vars 模板（不含值）
├── eslint.config.mjs                     # ESLint flat config
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── README.md                             # 開發者指引
├── eslint-rules/
│   ├── no-public-secret-vars.mjs         # 自訂 rule 1
│   └── no-server-sdk-in-client.mjs       # 自訂 rule 2
├── scripts/
│   ├── check-bundle-secrets.mjs          # bundle 掃描
│   ├── post-review-scan.sh               # L1 hooks 與 L4 共用
│   └── red-team-test.sh                  # 紅隊驗證
├── semgrep.yml                           # semgrep 自訂規則
└── src/
    └── app/
        ├── layout.tsx
        ├── page.tsx                      # 暫時 placeholder
        └── globals.css
```

---

## Pre-Tasks: 使用者手動準備（你來做，AI 無法代勞）

**完成前不要進入 Task 1**。每一步做完跟我說「OK」或回報錯誤訊息。

### P-1. 安裝必備工具（本機）

確認你的 Windows 機器有以下工具，缺哪個依連結安裝：

| 工具 | 用途 | 檢查指令 | 下載 |
|---|---|---|---|
| Node.js 22 LTS（22+） | JavaScript runtime；pnpm 11 強制最低 | `node --version` | https://nodejs.org/（裝 22 LTS） |
| pnpm 10 或 11 | 套件管理 | `pnpm --version` | 在 PowerShell 跑 `npm install -g pnpm@latest` |
| Git | 版本控制 | `git --version` | https://git-scm.com/（已有 git，跳過） |
| gh（GitHub CLI） | 建 repo / branch protection 命令式設定 | `gh --version` | https://cli.github.com/ |
| gitleaks | secret 掃描 | `gitleaks version` | https://github.com/gitleaks/gitleaks/releases（下載 Windows zip，放到 PATH 中的目錄） |

**完成檢查指令**（PowerShell）：
```powershell
node --version; pnpm --version; git --version; gh --version; gitleaks version
```
全部能印出版本號才算完成。

### P-2. 帳號授權

- [ ] 登入 GitHub CLI：`gh auth login`（選 GitHub.com → HTTPS → Yes 授權 Git → 用瀏覽器登入）
- [ ] 登入 Vercel CLI：之後安裝 `pnpm add -g vercel` 後跑 `vercel login`（Task 14 才需要）
- [ ] **確認 Vercel 帳號為 Pro plan（非 Hobby Free）**：登入 https://vercel.com/dashboard → 帳號 / 團隊 Settings → Billing 看「Current Plan」。若是 Hobby Free 必須升 Pro，理由：[Vercel Fair Use Guidelines §Commercial Usage](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) 明示「Hobby plans are intended for non-commercial, personal use only」；RRMS 為商業營運系統（公司內部 + 客戶報修），用 Hobby 違反 TOS。對應 brainstorm A14、H1 hard 決議。

### P-3. 建立 GitHub Repo

選擇 A 或 B，**只挑一個做**。

**方法 A（推薦，命令式）**：
```powershell
cd c:\APP_Project\RRMS
gh repo create rrms --private --source=. --remote=origin --description "Repair Request Management System (RRMS)"
git push -u origin main
```

**方法 B（網頁）**：
1. 開 https://github.com/new
2. Repository name 填 `rrms`
3. 勾 Private
4. **不要**勾 "Initialize this repository with..."（我們本機已有 commit）
5. 按 Create repository
6. 在 RRMS 目錄跑：
   ```powershell
   git remote add origin https://github.com/<你的帳號>/rrms.git
   git branch -M main
   git push -u origin main
   ```

### P-4. 確認 spec commit 已推上 GitHub

```powershell
git log --oneline
```
預期：看到 `fb3386d`、`0d4ea32`、`a923887`、`ab74eff` 四個 commit。

```powershell
git remote -v
```
預期：看到 origin 指向 GitHub repo。

```powershell
git status
```
預期：`Your branch is up to date with 'origin/main'.`

**Pre-Tasks 全部完成後，跟我回報「P-Tasks 完成」。**

---

## Task 0: 各依賴官方版本驗證（Pre-code Research Gate）

> 本任務不寫程式，只查證、回報、等使用者確認。對應 [feedback_pre_code_research_gate.md](../../../../Users/Mike%20Lin/.claude/projects/c--APP-Project-RRMS/memory/feedback_pre_code_research_gate.md) 工作規則。

- [ ] **Step 1：fetch 各官方文件，確認 latest stable 版本與不變的 API**

依序 fetch 以下官方頁，記錄當下 latest stable 版本到 `docs/superpowers/research/2026-05-08-bootstrap-versions.md`：

| 技術 | 官方文件 |
|---|---|
| Next.js | https://nextjs.org/docs/app/getting-started/installation |
| pnpm | https://pnpm.io/installation |
| Tailwind CSS | https://tailwindcss.com/docs/installation/framework-guides/nextjs |
| shadcn/ui | https://ui.shadcn.com/docs/installation/next |
| ESLint flat config | https://eslint.org/docs/latest/use/configure/configuration-files |
| Husky | https://typicode.github.io/husky/get-started.html |
| lint-staged | https://github.com/lint-staged/lint-staged |
| gitleaks | https://github.com/gitleaks/gitleaks |
| semgrep | https://semgrep.dev/docs/getting-started/quickstart |
| GitHub Actions for Node.js | https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs |
| Claude Code Hooks | https://code.claude.com/docs/en/hooks |

- [ ] **Step 2：把驗證結果整理成短文，列出**
  - 每項 latest stable 版本
  - 與本計畫所列版本是否一致；不一致時以官方為準
  - 是否有任何 breaking change / migration guide 須注意（特別是 Next.js 與 Tailwind v4）

- [ ] **Step 3：把報告丟給使用者，等使用者回「OK 繼續」再進 Task 1**

> ⚠️ 本步驟是研究 gate；使用者沒回 OK 就不能進 Task 1。

- [ ] **Step 4：commit research 報告**

```bash
git add docs/superpowers/research/2026-05-08-bootstrap-versions.md
git commit -m "docs: research bootstrap dependency versions"
```

---

## Task 1: 初始化 Next.js 16 專案骨架

**Files:**
- Create: `package.json`、`tsconfig.json`、`next.config.ts`、`src/app/{layout,page}.tsx`、`src/app/globals.css`、`postcss.config.mjs`、`tailwind.config.ts`（皆由 create-next-app 產生）

- [ ] **Step 1：跑 create-next-app（精確 flags）**

在 RRMS 根目錄跑（PowerShell）：
```powershell
cd c:\APP_Project\RRMS
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"
```

過程中可能會問是否覆蓋現有檔案（README.md / .gitignore），選 **No** 不覆蓋我們已有的 spec 跟 .gitignore。

- [ ] **Step 2：驗證 dev server 跑得起來**

```powershell
pnpm dev
```

預期：終端顯示 `Local: http://localhost:3000`，瀏覽器開該網址看到 Next.js 預設首頁。確認後 `Ctrl+C` 終止 dev server。

- [ ] **Step 3：把 src/app/page.tsx 改成 RRMS placeholder**

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">RRMS</h1>
        <p className="mt-4 text-gray-600">Repair Request Management System</p>
        <p className="mt-2 text-sm text-gray-400">Phase 1 — Bootstrap</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4：再跑 dev server 驗證**

```powershell
pnpm dev
```
瀏覽器看到 RRMS 標題與副標。`Ctrl+C` 結束。

- [ ] **Step 5：commit**

```powershell
git add .
git commit -m "feat: initialize Next.js 16 + Tailwind + TypeScript scaffold"
```

---

## Task 2: TypeScript 嚴格模式

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1：把 tsconfig.json 加上 strict 相關設定**

開 `tsconfig.json`，把 `"compilerOptions"` 內補上以下鍵（已存在的略過）：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2：加 type-check script 到 package.json**

`"scripts"` 區塊內新增：
```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3：執行 type check 驗證 codebase 通過**

```powershell
pnpm typecheck
```
預期：無 error 輸出。

- [ ] **Step 4：commit**

```powershell
git add tsconfig.json package.json
git commit -m "chore: enable TypeScript strict mode"
```

---

## Task 3: shadcn/ui 初始化 + Button 煙霧測試

**Files:**
- Create: `components.json`、`src/lib/utils.ts`、`src/components/ui/button.tsx`
- Modify: `src/app/page.tsx`、`src/app/globals.css`

- [ ] **Step 1：執行 shadcn init**

```powershell
pnpm dlx shadcn@latest init --defaults --yes --force
```

> **shadcn 4.7+ CLI 變動**：舊「Style: New York」preset 已不存在。CLI 預設使用 `base-nova` preset（底層 primitive 從 Radix 改為 Base UI）。`--defaults` 採用：preset = `base-nova`、baseColor = `neutral`、cssVariables = true，視覺上等同舊 New York Neutral 中性灰階。若要強制 Radix，加 `-b radix`。

- [ ] **Step 2：加 Button 元件**

```powershell
pnpm dlx shadcn@latest add button
```

- [ ] **Step 3：放一顆 Button 到首頁驗證**

`src/app/page.tsx`：
```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">RRMS</h1>
        <p className="mt-4 text-gray-600">Repair Request Management System</p>
        <p className="mt-2 text-sm text-gray-400">Phase 1 — Bootstrap</p>
        <Button className="mt-8">shadcn smoke test</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4：dev server 驗證 Button 樣式正確顯示**

```powershell
pnpm dev
```
瀏覽器看到中性灰階按鈕（base-nova / Neutral 樣式；shadcn 4.7+ 預設）。

- [ ] **Step 5：commit**

```powershell
git add .
git commit -m "feat: integrate shadcn/ui with Button smoke test"
```

---

## Task 4: ESLint 自訂 Rules（核心安全規則）

**Files:**
- Modify: `eslint.config.mjs`
- Create: `eslint-rules/no-public-secret-vars.mjs`、`eslint-rules/no-server-sdk-in-client.mjs`
- Create: `__tests__/eslint-rules.test.mjs`（驗證 rule 行為）

對應 spec 6.7.1 程式碼撰寫硬性規則。

- [ ] **Step 1：建立 eslint-rules/no-public-secret-vars.mjs**

```js
// eslint-rules/no-public-secret-vars.mjs
// 禁止以 NEXT_PUBLIC_ 開頭且名稱含 SECRET / KEY / TOKEN / PASSWORD 的 env var
// 對應 spec 6.7.1

const FORBIDDEN_PATTERN = /^NEXT_PUBLIC_.*(SECRET|KEY|TOKEN|PASSWORD)/i;

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow NEXT_PUBLIC_* env vars whose names contain SECRET/KEY/TOKEN/PASSWORD",
    },
    messages: {
      forbiddenName:
        "'{{name}}' is forbidden: NEXT_PUBLIC_* variables are exposed to the browser. Rename without NEXT_PUBLIC_, or rename to remove SECRET/KEY/TOKEN/PASSWORD if it's truly public.",
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object?.type === "MemberExpression" &&
          node.object.object?.name === "process" &&
          node.object.property?.name === "env" &&
          node.property?.type === "Identifier" &&
          FORBIDDEN_PATTERN.test(node.property.name)
        ) {
          context.report({
            node,
            messageId: "forbiddenName",
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 2：建立 eslint-rules/no-server-sdk-in-client.mjs**

```js
// eslint-rules/no-server-sdk-in-client.mjs
// 在標 'use client' 的檔案中禁止 import 列在黑名單的伺服器端 SDK
// 對應 spec 6.7.5

const SERVER_ONLY_PACKAGES = [
  "@line/bot-sdk",
  "dropbox",
  "drizzle-orm/node-postgres",
  "drizzle-orm/neon-http",
  "@neondatabase/serverless",
  "better-auth",
  "better-auth/adapters/drizzle",
  "better-auth/plugins",
  "better-auth/next-js",
];

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing server-only SDKs in files marked 'use client'",
    },
    messages: {
      forbiddenImport:
        "'{{pkg}}' is server-only. Importing it in a 'use client' file would bundle it (and its credentials) to the browser.",
    },
    schema: [],
  },
  create(context) {
    let isClientFile = false;
    return {
      Program(node) {
        // 檢查檔案第一個 ExpressionStatement 是否為 'use client'
        const firstStmt = node.body[0];
        if (
          firstStmt?.type === "ExpressionStatement" &&
          firstStmt.expression?.type === "Literal" &&
          firstStmt.expression.value === "use client"
        ) {
          isClientFile = true;
        }
      },
      ImportDeclaration(node) {
        if (!isClientFile) return;
        const pkg = node.source.value;
        if (SERVER_ONLY_PACKAGES.some((p) => pkg === p || pkg.startsWith(`${p}/`))) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: { pkg },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 3：把這兩個 rule 註冊到 eslint.config.mjs**

開 `eslint.config.mjs`，最終長這樣：

```js
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import noPublicSecretVars from "./eslint-rules/no-public-secret-vars.mjs";
import noServerSdkInClient from "./eslint-rules/no-server-sdk-in-client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      rrms: {
        rules: {
          "no-public-secret-vars": noPublicSecretVars,
          "no-server-sdk-in-client": noServerSdkInClient,
        },
      },
    },
    rules: {
      "rrms/no-public-secret-vars": "error",
      "rrms/no-server-sdk-in-client": "error",
    },
  },
];

export default eslintConfig;
```

- [ ] **Step 4：建立故意違規的測試檔（紅隊資料），驗證 ESLint 抓得到**

建立 `__tests__/__fixtures__/violation-public-secret.tsx`（**這個檔案會故意違規**）：
```tsx
// __tests__/__fixtures__/violation-public-secret.tsx
export const apiKey = process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET;
```

建立 `__tests__/__fixtures__/violation-client-sdk.tsx`：
```tsx
// __tests__/__fixtures__/violation-client-sdk.tsx
"use client";
import { Client } from "@line/bot-sdk";
export const c = new Client({ channelAccessToken: "x", channelSecret: "y" });
```

跑 lint：
```powershell
pnpm exec eslint __tests__/__fixtures__/
```

預期：兩個檔案各有一個 error：
- `violation-public-secret.tsx`：`'NEXT_PUBLIC_LINE_CHANNEL_SECRET' is forbidden...`
- `violation-client-sdk.tsx`：`'@line/bot-sdk' is server-only...`

**若 ESLint 沒抓到 → 兩個 rule 寫錯了，必須先修到能抓到才能繼續。**

- [ ] **Step 5：把 fixtures 加入 .eslintignore（避免實際 lint 時打到自己）**

開（或建立）`eslint.config.mjs` 補上 ignore：
```js
const eslintConfig = [
  { ignores: ["__tests__/__fixtures__/**"] },
  ...compat.extends(/* ... */),
  // ...
];
```

確認加入後再跑 `pnpm lint`，整個 codebase 應該無 error。

- [ ] **Step 6：commit**

```powershell
git add .
git commit -m "feat(security): add custom ESLint rules for secret-var and client-sdk bans"
```

---

## Task 5: gitleaks 設定（含 LINE / Dropbox / Better Auth 客製 pattern）

**Files:**
- Create: `.gitleaks.toml`

對應 spec 6.7.4 Layer 2 中的 secret 偵測。

- [ ] **Step 1：寫 .gitleaks.toml**

```toml
# .gitleaks.toml
# 對應 spec 6.7.4 Layer 2

title = "RRMS gitleaks rules"

# 沿用內建規則
[extend]
useDefault = true

# 自訂 RRMS 相關 rules
[[rules]]
id = "line-channel-secret"
description = "LINE Channel Secret (32 char hex)"
regex = '''(?i)channel[_\-]?secret[\s'"=:]+([a-f0-9]{32})'''
tags = ["line", "secret"]

[[rules]]
id = "line-channel-access-token"
description = "LINE Channel Access Token (long token)"
regex = '''(?i)channel[_\-]?access[_\-]?token[\s'"=:]+([A-Za-z0-9+/=]{100,})'''
tags = ["line", "secret"]

[[rules]]
id = "dropbox-token"
description = "Dropbox API token"
regex = '''sl\.[A-Za-z0-9_-]{50,}'''
tags = ["dropbox", "secret"]

[[rules]]
id = "auth-secret"
description = "Better Auth / NextAuth / Auth.js secret"
regex = '''(?i)(BETTER_AUTH_SECRET|NEXTAUTH_SECRET|AUTH_SECRET)[\s=]+["']?([A-Za-z0-9+/=]{32,})["']?'''
tags = ["auth", "secret"]

# 全域 allowlist（別把 .env.example 跟測試 fixture 當成洩漏）
[allowlist]
description = "Skip example files and test fixtures"
paths = [
  '''\.env\.example$''',
  '''__tests__/__fixtures__/.*''',
  '''\.gitleaks\.toml$''',
]
```

- [ ] **Step 2：跑一次 gitleaks 確認 codebase 乾淨**

```powershell
gitleaks detect --source . --redact --no-git
```
預期：`no leaks found`。

- [ ] **Step 3：建立紅隊測試 fixture（不 commit）驗證 gitleaks 抓得到**

暫時建立 `__tests__/__fixtures__/violation-secret-line.txt`（先把它加進 allowlist 路徑就不會被 commit-time 擋下；但我們改用直接 detect 不限路徑）：

```text
LINE_CHANNEL_SECRET=01234567890123456789012345678abc
```

跑（**暫時**移除 allowlist 來驗證）：
```powershell
gitleaks detect --source __tests__/__fixtures__/violation-secret-line.txt --redact --no-git --config .gitleaks.toml --no-banner
```
預期：1 leak found，rule id = `line-channel-secret`。

驗證後**刪除這個 fixture**：
```powershell
Remove-Item __tests__/__fixtures__/violation-secret-line.txt
```

- [ ] **Step 4：commit**

```powershell
git add .gitleaks.toml
git commit -m "feat(security): add gitleaks config with RRMS-specific patterns"
```

---

## Task 6: Husky + lint-staged（L2 Pre-commit）

**Files:**
- Modify: `package.json`
- Create: `.husky/pre-commit`、`.lintstagedrc.json`

對應 spec 6.7.4 Layer 2。

- [ ] **Step 1：安裝 Husky 與 lint-staged**

```powershell
pnpm add -D husky lint-staged
```

- [ ] **Step 2：初始化 Husky**

```powershell
pnpm exec husky init
```
此命令會建立 `.husky/pre-commit` 預設內容，並在 `package.json` `scripts` 加上 `prepare`。

- [ ] **Step 3：把 .husky/pre-commit 內容換成下列**

```bash
# .husky/pre-commit
# Layer 2 of defense-in-depth (spec 6.7.4)

# 1. lint-staged：對 staged 檔案跑 ESLint + Prettier + tsc
pnpm exec lint-staged

# 2. gitleaks：偵測 staged 中含 secret 的內容
gitleaks protect --staged --redact --config .gitleaks.toml
```

- [ ] **Step 4：建立 .lintstagedrc.json**

```json
{
  "*.{ts,tsx,js,jsx,mjs}": ["eslint --max-warnings=0", "prettier --write"],
  "*.{json,md,toml,yml,yaml}": ["prettier --write"]
}
```

- [ ] **Step 5：補一個 typecheck 進 pre-commit（但不對 staged 限制，整個專案跑）**

修改 `.husky/pre-commit` 在最後加一行：
```bash
pnpm typecheck
```

最終長這樣：
```bash
pnpm exec lint-staged
gitleaks protect --staged --redact --config .gitleaks.toml
pnpm typecheck
```

- [ ] **Step 6：紅隊驗證 — 故意 stage 含 secret 的檔案，確認 commit 會失敗**

```powershell
"LINE_CHANNEL_SECRET=01234567890123456789012345678abc" | Out-File -FilePath fake-secret.txt -Encoding utf8
git add fake-secret.txt
git commit -m "this should fail"
```

預期：commit 失敗，gitleaks 報告偵測到 secret。

清理：
```powershell
git restore --staged fake-secret.txt
Remove-Item fake-secret.txt
```

- [ ] **Step 7：commit（這次合法的）**

```powershell
git add .husky package.json pnpm-lock.yaml .lintstagedrc.json
git commit -m "feat(security): add Husky pre-commit hook (lint-staged + gitleaks + tsc)"
```

---

## Task 7: Bundle Scan Script（驗證 client output 不含 secret）

**Files:**
- Create: `scripts/check-bundle-secrets.mjs`
- Modify: `package.json`（加 script）

對應 spec 6.7.4 共用掃描清單第 3 項。

- [ ] **Step 1：寫 scripts/check-bundle-secrets.mjs**

```js
#!/usr/bin/env node
// scripts/check-bundle-secrets.mjs
// 掃描 .next/static/ 內所有 JS/CSS 不含已知 secret pattern
// 對應 spec 6.7.4 共用掃描清單

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TARGET_DIR = ".next/static";

// 與 .gitleaks.toml 同步維護的 client-side 禁字 pattern
const PATTERNS = [
  { name: "LINE Channel Secret", regex: /channel[_-]?secret[^a-z]+[a-f0-9]{32}/i },
  { name: "LINE Channel Access Token", regex: /channel[_-]?access[_-]?token[^a-z]+[A-Za-z0-9+/=]{100,}/i },
  { name: "Dropbox token", regex: /sl\.[A-Za-z0-9_-]{50,}/ },
  { name: "Better Auth / Auth.js secret", regex: /(BETTER_AUTH_SECRET|NEXTAUTH_SECRET|AUTH_SECRET)\s*=\s*["']?[A-Za-z0-9+/=]{32,}/ },
  { name: "Generic API key", regex: /(api[_-]?key|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_+/=-]{20,}["']/i },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (stat.isFile() && /\.(js|mjs|css)$/.test(path)) yield path;
  }
}

let leaks = 0;
try {
  for (const file of walk(TARGET_DIR)) {
    const content = readFileSync(file, "utf8");
    for (const { name, regex } of PATTERNS) {
      if (regex.test(content)) {
        console.error(`LEAK: ${name} in ${file}`);
        leaks++;
      }
    }
  }
} catch (e) {
  if (e.code === "ENOENT") {
    console.error(`Bundle directory not found: ${TARGET_DIR}. Run 'pnpm build' first.`);
    process.exit(2);
  }
  throw e;
}

if (leaks > 0) {
  console.error(`\n${leaks} potential secret leak(s) found in client bundle.`);
  process.exit(2);
}
console.log("Bundle scan: no secrets found in client output.");
```

- [ ] **Step 2：加 npm script**

`package.json` 的 `scripts` 區補：
```json
"scan:bundle": "node scripts/check-bundle-secrets.mjs"
```

- [ ] **Step 3：build + scan 驗證乾淨**

```powershell
pnpm build
pnpm scan:bundle
```
預期：`Bundle scan: no secrets found in client output.`

- [ ] **Step 4：紅隊驗證 — 故意把 secret 放到 client 元件，build，驗證 scan 抓到**

暫改 `src/app/page.tsx`，加一行（**故意違規**）：
```tsx
const fakeSecret = "channel_secret=" + "0123456789abcdef0123456789abcdef";
console.log(fakeSecret);
```

```powershell
pnpm build
pnpm scan:bundle
```
預期：`LEAK: LINE Channel Secret in .next/static/...`，exit code 2。

**復原**：把那兩行刪掉，重新 build 一次驗證 scan 通過。

- [ ] **Step 5：commit**

```powershell
git add scripts/check-bundle-secrets.mjs package.json
git commit -m "feat(security): add client bundle secret scanner"
```

---

## Task 8: GitHub Actions CI (Layer 4)

**Files:**
- Create: `.github/workflows/ci.yml`

對應 spec 6.7.4 Layer 4。

- [ ] **Step 1：寫 .github/workflows/ci.yml**

```yaml
# .github/workflows/ci.yml
# Layer 4 of defense-in-depth (spec 6.7.4)

name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  secrets-scan:
    name: gitleaks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          config-path: .gitleaks.toml

  lint-and-types:
    name: ESLint + tsc
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  bundle-scan:
    name: Client bundle scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm scan:bundle

  semgrep:
    name: semgrep OWASP
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v6
      - run: semgrep --config p/owasp-top-ten --error
```

- [ ] **Step 2：push + 確認 CI 跑通**

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for L4 defense"
git push
```

去 GitHub repo Actions 分頁看 workflow 是否啟動、四個 jobs 是否全部通過。若 fail，看 log 排查（lockfile 不對、lint error 等）。

- [ ] **Step 3：跟使用者回報 CI 通過，請使用者繼續 Task 9**

---

## Task 9: GitHub Branch Protection（使用者手動設定）

**僅使用者操作**。AI 無法直接呼叫 GitHub Settings UI。

對應 spec 6.7.4 Layer 4 強制機制。

- [ ] **Step 1：使用 gh CLI 一鍵設定（推薦）**

執行：
```powershell
gh api repos/<你的帳號>/rrms/branches/main/protection -X PUT -F required_status_checks.strict=true -F "required_status_checks.contexts[]=gitleaks" -F "required_status_checks.contexts[]=ESLint + tsc" -F "required_status_checks.contexts[]=Client bundle scan" -F "required_status_checks.contexts[]=semgrep OWASP" -F enforce_admins=true -F required_pull_request_reviews.dismiss_stale_reviews=true -F restrictions=null
```

> 把 `<你的帳號>` 換成你的 GitHub 帳號。

- [ ] **Step 2：（可選）替代方案 — 在 GitHub 網頁設定**

1. 開 `https://github.com/<你的帳號>/rrms/settings/branches`
2. 按 `Add branch protection rule`
3. Branch name pattern：`main`
4. 勾 `Require a pull request before merging`
5. 勾 `Require status checks to pass before merging`
   - 在搜尋框輸入並各加入：`gitleaks`、`ESLint + tsc`、`Client bundle scan`、`semgrep OWASP`
6. 勾 `Require branches to be up to date before merging`
7. 勾 `Do not allow bypassing the above settings` / `Include administrators`
8. 按 Save

- [ ] **Step 3：紅隊驗證 — 開一個含 secret 的 PR，確認被擋下**

```powershell
git checkout -b red-team-test
"LINE_CHANNEL_SECRET=01234567890123456789012345678abc" | Out-File -FilePath fake-secret.txt -Encoding utf8
# 用 --no-verify 繞過本機 hook 模擬「同事繞過 L2 直推」場景
git add fake-secret.txt
git commit --no-verify -m "intentional violation for red team"
git push origin red-team-test
gh pr create --title "RED TEAM TEST: should be blocked" --body "Intentional secret leak"
```

到 PR 頁面看：
- gitleaks job 應該失敗
- PR Merge 按鈕應該被鎖（required check failed）

驗證完關閉 PR、刪 branch：
```powershell
gh pr close <PR 號碼> --delete-branch
git checkout main
```

- [ ] **Step 4：跟我回報「Branch protection 通過驗證」**

---

## Task 10: Claude Code Hooks (Layer 1)

**Files:**
- Create: `.claude/settings.json`、`scripts/post-review-scan.sh`

對應 spec 6.7.4 Layer 1。

- [ ] **Step 1：寫 scripts/post-review-scan.sh**

```bash
#!/usr/bin/env bash
# scripts/post-review-scan.sh
# 給 Claude Code Stop hook 用 (spec 6.7.4 Layer 1)
# Exit 0 = 通過；Exit 2 = 擋下（讓 Claude 不能停，必須先修）

set -euo pipefail

VIOLATIONS=0

echo "::group::gitleaks scan (working tree + last 50 commits)"
# 1) 掃工作目錄的所有檔案（含未 commit 的變更）— --no-git 跳過 git log
if ! gitleaks detect --source . --no-git --redact --config .gitleaks.toml --no-banner; then
  echo "VIOLATION: gitleaks detected secret in working tree"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
# 2) 額外掃最近 50 個 commit（防止「過去 commit、現在已從工作目錄刪除」的漏網案例）
if ! gitleaks detect --source . --redact --config .gitleaks.toml --log-opts="-50" --no-banner; then
  echo "VIOLATION: gitleaks detected secret in recent git history"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo "::endgroup::"

echo "::group::ESLint"
if ! pnpm exec eslint . --max-warnings=0; then
  echo "VIOLATION: ESLint errors"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo "::endgroup::"

echo "::group::TypeScript typecheck"
if ! pnpm typecheck; then
  echo "VIOLATION: TypeScript errors"
  VIOLATIONS=$((VIOLATIONS + 1))
fi
echo "::endgroup::"

# Bundle scan only if there's a build output
if [ -d ".next/static" ]; then
  echo "::group::Client bundle scan"
  if ! node scripts/check-bundle-secrets.mjs; then
    echo "VIOLATION: client bundle contains secret pattern"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
  echo "::endgroup::"
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  # Exit 2 → Claude Code Stop hook will prevent the agent from stopping
  echo "Blocking: $VIOLATIONS violation(s) detected. Fix before stopping." >&2
  exit 2
fi

echo "All security checks passed."
exit 0
```

設成可執行（git 在 Windows 沒 chmod，仍要 `git update-index --chmod=+x`）：
```powershell
git update-index --add --chmod=+x scripts/post-review-scan.sh
```

- [ ] **Step 2：寫 .claude/settings.json**

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/post-review-scan.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/post-review-scan.sh || true"
          }
        ]
      }
    ]
  }
}
```

> `|| true` 在 PostToolUse 是因為該 event Exit 2 不會擋（spec 6.7.4 Layer 1 表格已驗證），所以失敗只在 stderr 顯示給 Claude；真正的擋是 Stop hook。

- [ ] **Step 3：本機驗證 hook 腳本通過**

```powershell
bash scripts/post-review-scan.sh
```
預期：所有檢查通過，exit 0。

- [ ] **Step 4：紅隊驗證 hook 會擋（手動模擬 Stop hook 場景）**

故意改 `src/app/page.tsx` 加一行違規（不 commit）：
```tsx
const x = process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET;
```

```powershell
bash scripts/post-review-scan.sh
echo "exit code: $LASTEXITCODE"
```
預期：ESLint 報錯、exit code = 2。

復原修改。

- [ ] **Step 5：commit**

```powershell
git add .claude scripts/post-review-scan.sh
git commit -m "feat(security): add Claude Code hooks (Stop + PostToolUse) for L1 defense"
```

---

## Task 11: .env.example 模板

**Files:**
- Create: `.env.example`

對應 spec 6.7.2 機密歸屬清單。

- [ ] **Step 1：寫 .env.example**

```bash
# .env.example
# 複製為 .env.local 後填入實際值。.env.local 已在 .gitignore，永不會 commit。
# 對應 spec 6.7.2 機密歸屬清單

# ==== 伺服器機密（無 NEXT_PUBLIC_ 前綴；絕不可洩漏到瀏覽器） ====

# Postgres connection string (Neon, 由 Vercel Marketplace 注入)
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# LINE Messaging API (官方帳號 / OA)
LINE_MESSAGING_CHANNEL_SECRET=
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=
LINE_INTERNAL_GROUP_ID=

# LINE Login (admin 後台登入)
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=

# Google OAuth (admin 後台登入)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Dropbox (媒體上傳)
DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=
DROPBOX_REFRESH_TOKEN=

# ==== 公開識別碼（可加 NEXT_PUBLIC_ 前綴，會打包到瀏覽器） ====

# LIFF ID (LINE Front-end Framework)
NEXT_PUBLIC_LIFF_ID=

# 環境名稱（顯示用）
NEXT_PUBLIC_APP_ENV=development
```

- [ ] **Step 2：commit**

```powershell
git add .env.example
git commit -m "docs: add .env.example template per spec 6.7.2"
```

---

## Task 12: 紅隊測試自動化 Script（驗證五層全部能擋）

**Files:**
- Create: `scripts/red-team-test.sh`、`docs/superpowers/research/2026-05-08-red-team-test-result.md`

對應 spec 6.7.4 「驗證五層皆能正確擋下故意植入的 secret」。

- [ ] **Step 1：寫 scripts/red-team-test.sh**

```bash
#!/usr/bin/env bash
# scripts/red-team-test.sh
# 故意植入一個 LINE Channel Secret pattern，逐層驗證能擋下
# 對應 spec 6.7.4 驗收條件

set -uo pipefail

FAKE_SECRET="LINE_CHANNEL_SECRET=01234567890123456789012345678abc"
TEST_FILE="red-team-secret.txt"
PASS=0
FAIL=0

cleanup() {
  rm -f "$TEST_FILE"
  git restore --staged "$TEST_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# === Layer 2: pre-commit ===
echo "=== L2: pre-commit hook ==="
echo "$FAKE_SECRET" > "$TEST_FILE"
git add "$TEST_FILE"
if git commit -m "RED TEAM SHOULD FAIL" 2>&1 | tee /tmp/red-l2.log; then
  echo "L2 FAIL: pre-commit allowed secret to commit"
  FAIL=$((FAIL+1))
else
  echo "L2 PASS: pre-commit blocked"
  PASS=$((PASS+1))
fi
git restore --staged "$TEST_FILE"

# === Layer 1: Claude Code Stop hook ===
echo "=== L1: Claude Code Stop hook (post-review-scan.sh direct) ==="
if bash scripts/post-review-scan.sh > /tmp/red-l1.log 2>&1; then
  echo "L1 FAIL: post-review-scan exited 0 with secret present"
  FAIL=$((FAIL+1))
else
  EXIT=$?
  if [ "$EXIT" -eq 2 ]; then
    echo "L1 PASS: post-review-scan exit 2 as expected"
    PASS=$((PASS+1))
  else
    echo "L1 PARTIAL: post-review-scan exit $EXIT (expected 2 for blocking)"
    FAIL=$((FAIL+1))
  fi
fi

# === Layer 4: GitHub Actions ===
# 自動化測試這層需要 push + 等 CI；這裡只指示手動驗證
echo "=== L4: GitHub Actions ==="
echo "L4 MANUAL: Use Task 9 Step 3 procedure to verify; not automated here."

cleanup

echo
echo "=== Summary ==="
echo "Pass: $PASS / 2 automated layers (L1, L2)"
echo "Fail: $FAIL"
echo "L4 must be verified manually per Task 9 Step 3"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
```

設可執行：
```powershell
git update-index --add --chmod=+x scripts/red-team-test.sh
```

- [ ] **Step 2：跑紅隊測試**

```powershell
bash scripts/red-team-test.sh
```
預期：`Pass: 2 / 2`。

- [ ] **Step 3：把結果寫進 research 報告**

`docs/superpowers/research/2026-05-08-red-team-test-result.md`：
```markdown
# RRMS Phase 1 Plan 1 — 紅隊測試結果

日期：2026-05-08

## 執行指令
bash scripts/red-team-test.sh

## 結果
- L1 Claude Code Stop hook：PASS（post-review-scan.sh exit 2）
- L2 pre-commit hook：PASS（git commit 失敗）
- L4 GitHub Actions：依 Task 9 Step 3 手動驗證 PASS（PR merge 被擋）

## 結論
Phase 1 三道必要防線全部通過故意植入 secret 的紅隊測試。
五層中 L3、L5 為 Phase 2 補強。
```

- [ ] **Step 4：commit**

```powershell
git add scripts/red-team-test.sh docs/superpowers/research/2026-05-08-red-team-test-result.md
git commit -m "test(security): add red-team verification + result report"
```

---

## Task 13: 開發者指引 README

**Files:**
- Modify / Create: `README.md`

- [ ] **Step 1：寫 README.md**

```markdown
# RRMS — Repair Request Management System

Phase 1：簡易報修系統，公開表單 + 後台管理 + LINE 通知。

## Tech Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui · Drizzle · Neon · Better Auth · LINE Messaging API · Dropbox API · Vercel Functions

## 開發前必讀

- 設計文件：[docs/superpowers/specs/2026-05-07-rrms-phase1-design.md](docs/superpowers/specs/2026-05-07-rrms-phase1-design.md)
- 安全規範：spec 第 6.7 節「機密管理與前端資料外露禁則」
- 工作規則：寫程式前必須先 fetch 各技術官方文件並請使用者確認（pre-code research gate）

## 快速啟動

```bash
pnpm install
cp .env.example .env.local  # 填入實際值
pnpm dev
```

## Scripts

| 指令 | 用途 |
|---|---|
| `pnpm dev` | 開發 server |
| `pnpm build` | 產出 production build |
| `pnpm lint` | ESLint（含 RRMS 自訂安全規則） |
| `pnpm typecheck` | TypeScript 嚴格檢查 |
| `pnpm scan:bundle` | client bundle secret 掃描 |
| `bash scripts/red-team-test.sh` | 紅隊驗證（測試五層防線） |
| `bash scripts/post-review-scan.sh` | 完整安全掃（Claude Stop hook 用） |

## 五層縱深防禦

對應 spec 6.7.4。**任何 PR 違反任一層即不可 merge。**

| 層 | 觸發點 | 工具 |
|---|---|---|
| L1 | AI session（Claude Code hooks） | `.claude/settings.json` + `scripts/post-review-scan.sh` |
| L2 | `git commit`（本機） | Husky + lint-staged + gitleaks + tsc |
| L3 | `git push`（本機；Phase 2） | — |
| L4 | GitHub PR / push（雲端） | `.github/workflows/ci.yml`（gitleaks、lint、typecheck、bundle scan、semgrep） |
| L5 | Vercel build（Phase 2） | — |

## 機密處理硬性規則（spec 6.7.1）

- ❌ 嚴禁 hardcode 任何 secret
- ❌ 嚴禁機密 env 變數命名以 `NEXT_PUBLIC_` 開頭
- ✅ 機密只放 server-side（API Route / Server Component / Server Action）
- ✅ 第三方 SDK（LINE / Dropbox / DB）只在 server 中 import
- ✅ Cookie 一律 `HttpOnly + Secure + SameSite=Lax`

違反即視同已外洩 → 立刻輪替該 secret + 用 BFG 清 git history → 走 spec 6.8 SOP。

## 工作流程

1. 任何新 feature 對應一份 spec 子章節 + 一份 implementation plan（在 `docs/superpowers/`）
2. 寫程式前先 fetch 官方文件並產出 research 報告
3. 報告經使用者確認後才開始 commit 程式碼
4. 每個 task 跑通驗證 → commit；不批量 commit
```

- [ ] **Step 2：commit**

```powershell
git add README.md
git commit -m "docs: write developer README with security model & workflow"
```

---

## Task 14: Vercel 專案連結 + 第一個 preview deploy

**Files:**
- Create: `vercel.ts`

外部設定 + 驗證為主，AI 跟使用者交替操作。

- [ ] **Step 1：在 Vercel 網頁建立專案（使用者操作）**

1. 開 https://vercel.com/new
2. 點 `Import Git Repository`
3. 找到 `<你的帳號>/rrms`，按 `Import`
4. Project Name：`rrms`（或自訂）
5. Framework Preset：自動偵測為 Next.js（不用改）
6. Build / Output / Install Command：保留 default
7. Environment Variables：先留空（後續 plan 再填）
8. 按 `Deploy`

等部署完成（首次大概 1-3 分鐘）。看到 Vercel 提供的 URL（例如 `https://rrms.vercel.app`），開啟確認看到 RRMS 首頁。

- [ ] **Step 2：寫 vercel.ts（取代未來會用到的 vercel.json）**

```ts
// vercel.ts
// 對應 spec 7.4
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  // crons / rewrites / headers 在後續 plan 加入
};
```

- [ ] **Step 3：安裝 @vercel/config 型別（鎖 exact 版本）**

```powershell
pnpm add -D @vercel/config@0.3.0
```

> ⚠️ **鎖 `0.3.0` exact、不要用 caret `^0.3.0`**。`@vercel/config` 仍是 v0.x 套件，作者隨時可能改 API。

- [ ] **Step 4：commit + push 觸發 preview deploy**

```powershell
git add vercel.ts package.json pnpm-lock.yaml
git commit -m "feat: add vercel.ts config skeleton"
git push
```

去 Vercel Dashboard → 專案 → Deployments，看 push 觸發新 deploy。

- [ ] **Step 5：開 preview URL 驗證頁面正常**

點最新 deploy 的 URL，看到 RRMS 首頁。

- [ ] **Step 6：紅隊驗證 — 開 PR 確認 Vercel preview + GitHub Actions 都跑**

```powershell
git checkout -b test/preview-pipeline
"# trivial change" >> README.md
git add README.md
git commit -m "test: trigger preview pipeline"
git push origin test/preview-pipeline
gh pr create --title "test: preview pipeline" --body "Verify Vercel + Actions both run"
```

到 PR 頁面確認：
- 看到 Vercel bot 留言貼出 preview URL
- 看到 GitHub Actions 四個 jobs 全部通過
- Merge 按鈕可按

驗證完關 PR 不 merge：
```powershell
gh pr close <PR 號碼> --delete-branch
git checkout main
```

- [ ] **Step 7：跟我回報「Vercel preview pipeline 通過」→ Plan 1 完成**

---

## Plan 1 驗收條件（Definition of Done）

✅ 全部達成才算完成：

- [ ] `pnpm dev` 在本機跑得起來，瀏覽器看到 RRMS 首頁
- [ ] `pnpm lint && pnpm typecheck && pnpm scan:bundle`（在 build 後）三個都通過
- [ ] `bash scripts/post-review-scan.sh` 通過
- [ ] `bash scripts/red-team-test.sh` 顯示 `Pass: 2 / 2`
- [ ] GitHub Actions CI 對 main 的最新 push 跑出綠勾
- [ ] GitHub Branch Protection 設定完成（required checks 含全部 4 個 jobs）
- [ ] 紅隊 PR（Task 9 Step 3）顯示 merge 按鈕被鎖
- [ ] Vercel 自動部署運作中：push main → production deploy；PR → preview deploy
- [ ] README.md 內容如 Task 13
- [ ] `.claude/settings.json` 設定 `Stop` + `PostToolUse(Task)` hook

---

## Self-Review 結果（writing-plans skill 內建）

執行 self-review 後修正項：

- ✅ Spec coverage：對照 spec 6.7 全部章節，每條都對應一個 Task
- ✅ Placeholder scan：無 TBD / TODO / 「實作之後」
- ✅ Type / 命名一致性：post-review-scan.sh、check-bundle-secrets.mjs、red-team-test.sh 三個 script 名稱在計畫內前後一致；ESLint rule id `rrms/no-public-secret-vars` 與 `rrms/no-server-sdk-in-client` 命名統一

---

## 後續計畫預告

Plan 1 完成後依序進入（總共 8 份計畫，本計畫為第 1 份）：

| # | 計畫 | 主要內容 | 預估 task 數 |
|---|---|---|---|
| 2 | Cross-Cutting Security Platform | Dependabot + OWASP ZAP CI + 排程掃描 + 自動開 issue | ~10 |
| 3 | Database + Auth Foundation | Drizzle schema + Better Auth 三 provider | ~12 |
| 4 | Public Form + PDPA Compliance | `/report` 表單 + 隱私同意版本管理 + 案件編號 | ~10 |
| 5 | Dropbox Media Pipeline | server-side 簽 upload URL + 瀏覽器直傳 | ~8 |
| 6 | Admin Backend + LINE Notifications | `/admin` 全套 + 狀態變更觸發 LINE push | ~14 |
| 7 | LINE OA + Customer Query | Rich Menu + 雙重驗證查詢 + rate limiting | ~10 |
| 8 | Anonymization Cron + Production Cutover | Vercel Cron + DNS + Prod LINE channel | ~8 |

每份 feature 計畫（3-8）都會內嵌**該 feature 對應的攻擊測試**（spec 6.7.4 紅隊驗證），跨 feature 的水平資安平台則由 Plan 2 集中處理。

每份計畫都會：
- 對照 spec 章節建立 coverage
- 通過 self-review
- 留下紅隊式 / 整合式驗收
- 在 commit 前要求使用者確認
