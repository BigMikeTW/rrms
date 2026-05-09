<!--
  4W documentation header — RRMS developer README

  WHAT
    Top-level developer-facing README for the RRMS (Repair Request Management
    System) repository. Covers Phase 1 scope, tech stack, quick-start steps,
    npm scripts, the five-layer defense-in-depth security model, hard rules
    for handling secrets, and the standard work-flow (spec → research →
    confirmation → commit). Acts as the single source of truth that links
    out to the design spec and Plan 1 implementation plan.

  WHY
    Spec §6.7.6 ("Documentation requirements") mandates that the repository
    README document the security model so the rules cannot be missed by:
      - new human contributors during onboarding,
      - future Claude Code sessions opening the repo cold (the file is one
        of the first things the agent reads to establish context),
      - human reviewers triaging a PR on github.com.
    Centralising the rules here prevents drift between the spec and what
    contributors actually see when they clone the repo.

  WHERE
    Path: repo root — `README.md`. Rendered surfaces:
      - GitHub repository landing page (github.com/<org>/RRMS).
      - Vercel preview deployment comment (linked back to the repo).
      - PR template references (any "see README" link from .github/).
    Linked from: docs/superpowers/specs/2026-05-07-rrms-phase1-design.md
    (spec §6.7.6) and docs/superpowers/plans/plan-1-bootstrap-and-security.md
    (Task 13).

  WHEN
    Read scenarios:
      - First clone of the repo by a new contributor (onboarding).
      - First time a fresh Claude Code session opens this repo (the agent
        consults README before proposing any change).
      - Each PR review when the reviewer needs to confirm the five-layer
        defense table or secret-handling rules.
      - Whenever the security model is amended in the spec, this file MUST
        be updated in the same PR (per spec §6.7.6).
-->

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
