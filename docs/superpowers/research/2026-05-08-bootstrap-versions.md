# RRMS Plan 1 Bootstrap Dependency Research

**Date:** 2026-05-08
**Purpose:** Pre-code research gate for Plan 1 (Bootstrap & 5-Layer Security). Verify current latest stable versions and any breaking changes before any code is written.
**Outcome required:** Project Manager (user) review and explicit "OK 繼續" before Plan 1 Task 1 may begin.

---

## Plan-stated versions vs verified

| Tech | Plan said | Latest stable today (2026-05-08) | Match? | Notes |
|---|---|---|---|---|
| Next.js | 15.x | **16.2.6** | ⚠️ | Plan refers to 15.x, but 16.x is current. App Router, Turbopack default, React 19 stable. `next build` no longer auto-runs the linter. |
| pnpm | 9.x or 10.x (unstated) | **11.x** (Node 22+ required) | ⚠️ | pnpm 11 dropped Node 18/20; need Node 22 LTS minimum. |
| Tailwind CSS | v4 | **v4.2** | ✅ | v4 confirmed; uses `@tailwindcss/postcss` plugin and `@import "tailwindcss"` syntax (no v3 `tailwind.config.js`). |
| shadcn/ui | latest CLI | **shadcn@4.7.0** | ⚠️ | Package renamed `shadcn-ui` → `shadcn`. Use `pnpm dlx shadcn@latest init`. |
| ESLint | 9.x flat config | **v10.3.0** | ⚠️ | ESLint 10 is current. Flat config (`eslint.config.mjs`) is the standard. v9→v10 migration guide exists. |
| Husky | v9 | **v9.1.7** | ✅ | Use `npx husky init` (not `husky install`). v10 will remove deprecated shebang patterns. |
| lint-staged | latest | **v17.0.3** (released 2026-05-08) | ✅ | Multiple config formats supported; `package.json` field is fine for small projects. |
| gitleaks | latest | **v8.30.1** | ✅ | Official GitHub Action `gitleaks/gitleaks-action@v2`; pre-commit hook also supported. `detect`/`protect` commands deprecated since 8.19 (use `git`/`dir` subcommands). |
| Semgrep | latest | **CLI current (no version on quickstart page)** | ✅ | Install via `brew`/`pipx`. Requires Python 3.10+. Use `semgrep ci` for CI scanning. |
| GitHub Actions for Node | actions/checkout@v4, setup-node@v4 | **checkout@v6**, **setup-node@v4** | ⚠️ | `actions/checkout` is now v6; `setup-node` still v4 (with `cache: 'pnpm'` support). |
| Claude Code Hooks | settings.json hooks | **Current** (URL redirected to code.claude.com) | ⚠️ | docs.claude.com → **code.claude.com/docs/en/hooks** (301). Hook events richer than expected (PreToolUse, PostToolUse, SessionStart, Stop, UserPromptSubmit, etc.). |

---

## Per-tool details

### Next.js
- URL fetched: https://nextjs.org/docs/app/getting-started/installation
- **Latest stable: 16.2.6** (page lastUpdated 2026-05-07)
- Install command: `pnpm create next-app@latest my-app --yes`
- Notable:
  - **Turbopack is now the default bundler** for both `next dev` and `next build`. Use `--webpack` flag to opt out.
  - Default scaffold enables: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, import alias `@/*`, and includes `AGENTS.md` (with `CLAUDE.md` referencing it) for coding agents.
  - **App Router uses React 19 stable** (the doc still mentions "React canary" verbiage but notes "all the stable React 19 changes" are included).
  - **Breaking vs Plan 1 assumption:** Starting with Next.js 16, `next build` **no longer runs the linter automatically**. Plan must wire ESLint into a separate `pnpm lint` script and CI step.
  - Minimum Node.js: **20.9** (but pnpm 11 needs 22+, so 22 LTS is the effective floor).
  - TypeScript minimum: 5.1.0.

### pnpm
- URL fetched: https://pnpm.io/installation
- **Latest stable: 11.x** (`npm install -g pnpm@latest-11`)
- Install methods (in priority order for our setup):
  1. **Corepack** (recommended for Node 16.13+): `corepack enable pnpm`
  2. Standalone script (Windows/POSIX/Docker)
  3. npm: `npm install -g pnpm@latest-11`
- Notable:
  - **pnpm 11 requires Node.js 22 minimum.** Compatibility table shows v22, v24, v26 supported; v14/16/18/20 dropped.
  - Corepack had a temporary signature issue requiring manual update — note for setup script.

### Tailwind CSS
- URL fetched: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- **Latest stable: v4.2**
- Install: `npm install tailwindcss @tailwindcss/postcss postcss`
- Config: `postcss.config.mjs` (ES module) with `"@tailwindcss/postcss": {}` plugin.
- CSS entry: `@import "tailwindcss";` (replaces the v3 `@tailwind base/components/utilities` triple).
- **Important difference from v3:** v4 has **no `tailwind.config.js`** in the default setup — theme tokens go in CSS via `@theme {}`. Any plan or doc that says "edit `tailwind.config.js`" needs updating.

### shadcn/ui
- URL fetched: https://ui.shadcn.com/docs/installation/next
- **Current CLI:** `pnpm dlx shadcn@latest init` (version **4.7.0** per GitHub releases)
- **Package name change:** old `shadcn-ui` → new `shadcn`. Plan must use the new name everywhere.
- Requirements: Tailwind installed, `@/*` import alias in `tsconfig.json`, App Router.
- Three install paths: visual preset (`/create?template=next`), CLI (`shadcn@latest init -t next`), or manual.
- Tailwind v4 / React 19 compatibility not explicitly called out in this page, but the CLI handles both via templates.

### ESLint
- URL fetched: https://eslint.org/docs/latest/use/configure/configuration-files
- **Latest stable: v10.3.0** (version switcher shows v10.3.0, v9.39.4, v8.57.1)
- Default config: **flat config** — `eslint.config.js` / `eslint.config.mjs` / `eslint.config.cjs`
- Legacy `.eslintrc.*` still supported but considered legacy.
- "Migrate to v10.x" guide exists; v8→v9 was the big flat-config-default switch, v9→v10 is incremental.
- Next.js 16 docs explicitly recommend `eslint.config.mjs`.

### Husky
- URL fetched: https://typicode.github.io/husky/get-started.html (+ GitHub releases)
- **Latest stable: v9.1.7** (released 2025-11-18)
- Install: `npm install --save-dev husky` then `npx husky init`
- **Breaking from v8:**
  - `husky install` command **deprecated** — use `husky init` instead.
  - The legacy hook header (`#!/usr/bin/env sh` + `. "$(dirname -- "$0")/_/husky.sh"`) is deprecated and **will be removed in v10**. New hooks should be plain shell scripts.
  - Direct command execution (no `npx` wrapper) now supported.

### lint-staged
- URL fetched: https://github.com/lint-staged/lint-staged
- **Latest stable: v17.0.3** (released 2026-05-08 — same day as this report)
- Config formats accepted: `package.json` field, `.lintstagedrc[.json|.yaml|.yml|.js|.mjs|.cjs]`, `lint-staged.config.js`.
- Notable: **Pre-v10 required manual `git add`** in tasks; v10+ integrates this automatically — do NOT add `git add` to lint-staged commands.

### gitleaks
- URL fetched: https://github.com/gitleaks/gitleaks
- **Latest stable: v8.30.1** (released 2026-03-21)
- Install paths:
  - Homebrew: `brew install gitleaks`
  - Docker: `zricethezav/gitleaks:latest`
  - **Pre-commit:** native `.pre-commit-config.yaml` support
  - **GitHub Action:** `gitleaks/gitleaks-action@v2` (official, requires `GITHUB_TOKEN`)
- **Deprecation:** since v8.19, `detect` and `protect` commands are hidden from help. Use modern subcommands (`gitleaks git`, `gitleaks dir`).

### Semgrep
- URL fetched: https://semgrep.dev/docs/getting-started/quickstart
- Latest version not on the quickstart page (no version badge); CLI install is current as of 2026-04-28.
- Install:
  - macOS: `brew install semgrep` or `pipx install semgrep`
  - Linux: `pipx install semgrep` or `uv tool install semgrep`
  - Windows: `pipx install semgrep` (after Python 3.10+ + UTF-8 setup)
- CI command: `semgrep ci` (requires AppSec Platform login; or use `semgrep scan` for unauthenticated local).
- **Caveat:** Plan should treat Semgrep as optional / advisory in Phase 1 — its quickstart pushes the hosted AppSec Platform sign-up flow, which means PII concerns for code we'd send up. We can run `semgrep scan` locally with public rule packs without an account.

### GitHub Actions for Node.js
- URL fetched: https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs
- Recommended actions:
  - `actions/checkout@v6` (current major)
  - `actions/setup-node@v4` (still v4)
- **pnpm caching:**
  - Use `pnpm/action-setup` to install pnpm
  - Then `setup-node@v4` with `cache: 'pnpm'` (requires pnpm ≥ 6.10.0 — we'll be on 11)
- Standard workflow uses `npm ci` / `npm test` — we'll substitute with `pnpm install --frozen-lockfile` / `pnpm test`.

### Claude Code Hooks
- **Original URL:** https://docs.claude.com/en/docs/claude-code/hooks → 301 redirect → **https://code.claude.com/docs/en/hooks** (note this for the spec)
- Config locations:
  - `~/.claude/settings.json` — global, not shareable
  - `.claude/settings.json` — **project, shared (commit to repo)** ← what Plan 1 uses
  - `.claude/settings.local.json` — project, gitignored
  - Plugin `hooks/hooks.json`
- Hook events available (key ones for our 5-layer security):
  - `PreToolUse` (can **deny**, **ask**, **allow**) — primary pre-commit-style gate
  - `PostToolUse` / `PostToolUseFailure`
  - `UserPromptSubmit` — can **block** before Claude processes
  - `Stop` / `SessionStart` / `SessionEnd`
  - `PermissionRequest` / `PermissionDenied`
  - Also: `FileChanged`, `CwdChanged`, `SubagentStart`, `PreCompact`, etc.
- Hook handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.
- Decision values: `"allow"`, `"deny"`, `"ask"`, `"defer"` (defer needs v2.1.89+), `"block"`.
- Exit codes: 0 = success (parse JSON stdout); 2 = blocking error (stderr → error message); other = non-blocking.
- **Deprecated:** older `decision: "approve" / "block"` shape → must use `hookSpecificOutput.permissionDecision` now.

---

## Cross-cutting risks / migration notes

1. **Tailwind v4 has no JS config file by default.** Any Plan 1 step that references `tailwind.config.js` must be updated to `@theme {}` blocks in `app/globals.css`. shadcn/ui CLI handles this automatically.
2. **Next.js 16 + React 19 + Turbopack default** is a significant jump from older "Next 14 + Webpack" mental models. Plan should explicitly call this out so future debugging knows where to look.
3. **`next build` no longer runs the linter.** Plan 1 CI workflow MUST run `pnpm lint` as a separate step, otherwise lint fails silently.
4. **pnpm 11 forces Node.js 22 LTS minimum.** Local dev and CI must both target Node 22. GitHub Actions `setup-node@v4 with: node-version: '22'` is required.
5. **Husky v9 hook script format** — when we run `husky init`, the auto-generated `.husky/pre-commit` should be a plain shell script (no legacy shebang/source line). If we copy old examples we'll get v10-deprecation warnings.
6. **shadcn package rename** — every command in the plan must say `shadcn` (not `shadcn-ui`).
7. **ESLint 9 flat config / 10 baseline** — no `.eslintrc` files; use `eslint.config.mjs`. The Next.js codemod `npx @next/codemod@canary next-lint-to-eslint-cli .` is available if migrating.
8. **Claude Code Hooks docs URL changed host** — update any plan/spec links to `code.claude.com/docs/en/hooks`.
9. **Semgrep AppSec sign-up friction** — Plan 1 should default to `semgrep scan` (local, no account) with public rulepacks; treat the hosted AppSec Platform integration as a Phase 2 decision after PDPA assessment.

---

## Recommendation to Project Manager

以下用白話中文總結，給 Mike 大確認：

### ✅ 沒問題、可以照計畫做的部分
- **Tailwind v4、Husky v9、lint-staged v17、gitleaks v8** — 這四項版本跟 Plan 1 寫的一致或更新版仍向下相容，照做即可。
- **GitHub Actions 的 setup-node@v4 + pnpm cache** — 這套組合官方文件就是這樣寫，可以直接抄。

### ⚠️ 需要小幅調整 Plan 1 的部分（建議照下面修改後再開工）

1. **Next.js 版本：Plan 寫 15.x，但今天最新是 16.2.6**
   - 例：`pnpm create next-app@latest` 跑下去就是 16，不會給你 15。
   - 影響：React 19 是穩定預設、Turbopack 是預設打包工具、`next build` 不再自動跑 lint。
   - 建議：把 Plan 1 的「Next.js 15.x」改成「Next.js 16.x（最新穩定版）」，並在 CI 加一條獨立的 `pnpm lint` 步驟。

2. **pnpm 11 強制 Node.js 22 起跳**
   - 例：你的電腦如果還在 Node 20，`pnpm` 會直接拒跑。
   - 建議：Plan 1 的「環境準備」一節明確寫「安裝 Node.js 22 LTS」，CI 也用 `node-version: '22'`。

3. **shadcn/ui 套件名稱已改名**
   - 舊名 `shadcn-ui`、新名 `shadcn`。指令是 `pnpm dlx shadcn@latest init`（不是 `shadcn-ui`）。
   - 建議：Plan 1 內所有 `shadcn-ui` 字樣改成 `shadcn`。

4. **ESLint 已到 v10**
   - Plan 1 寫 v9 也能跑，但建議直接用 v10 + flat config（`eslint.config.mjs`），少一次未來升級。

5. **actions/checkout 已到 v6**
   - Plan 1 如果寫 `@v4`，CI 還是會跑（v4 還沒下架），但建議直接寫 `@v6` 跟官方對齊。

6. **Claude Code Hooks 官方文件網址改了**
   - 從 `docs.claude.com/en/docs/claude-code/hooks` 變成 `code.claude.com/docs/en/hooks`（會自動 301 轉址，但 Plan 跟 spec 內的連結應該手動更新）。

7. **Tailwind v4 沒有 `tailwind.config.js`**
   - 如果 Plan 1 任何一步說「打開 tailwind.config.js 改 theme」，要改成「在 `app/globals.css` 內的 `@theme {}` 改」。shadcn 的 init 指令會自動處理，所以多半不用煩惱，只是文字描述要對。

8. **Semgrep 預設要登入雲端平台才能跑 `semgrep ci`**
   - 因為 RRMS 涉及 PDPA，把程式碼送到第三方平台這件事需要先評估。
   - 建議 Phase 1 先用 `semgrep scan`（本地、不需登入、用公開規則）就好；登入版的 AppSec Platform 留到 Phase 2 評估。

### ❌ 需要重新設計的部分
**沒有。** 上面 8 項都是版號或文字微調，沒有任何根本性的衝突需要打掉重練。

### 建議流程
請 Mike 大看完這份報告後，回覆「OK 繼續」即可。我會：
1. 依照上面 8 點微調 Plan 1 文字
2. 開始執行 Plan 1 Task 1（git 初始化 + Next.js scaffold）

如果有任何一項你不同意（例如想堅持用 Next.js 15），請直接告訴我，我會照你的決定走。

---

## Sources

Fetched in this order on 2026-05-08:

1. https://nextjs.org/docs/app/getting-started/installation
2. https://pnpm.io/installation
3. https://tailwindcss.com/docs/installation/framework-guides/nextjs
4. https://ui.shadcn.com/docs/installation/next
5. https://eslint.org/docs/latest/use/configure/configuration-files
6. https://typicode.github.io/husky/get-started.html
7. https://github.com/lint-staged/lint-staged
8. https://github.com/gitleaks/gitleaks
9. https://semgrep.dev/docs/getting-started/quickstart
10. https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs
11. https://docs.claude.com/en/docs/claude-code/hooks → 301 → https://code.claude.com/docs/en/hooks
12. https://github.com/typicode/husky/releases (supplementary, for exact Husky v9 version)
13. https://github.com/shadcn-ui/ui/releases (supplementary, for shadcn package rename + version)
