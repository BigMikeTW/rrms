# ADR 0001 — 前端框架採用 Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 A1; `migration-and-ai-governance.html` |
| Related ADR | ADR-0002, ADR-0012, ADR-0015 |

## Context

RRMS 需要 SSR/SSG 混合渲染、per-route bundle splitting、與 Vercel 平台原生整合的前端框架。Next.js 16 App Router 提供 React Server Components、Server Actions、PPR、Cache Components 等新一代能力，且為 Vercel 第一公民。TypeScript 是 commercial-grade 系統的型別安全基線；Tailwind v4 + shadcn/ui 提供 design system 起點且不鎖死 vendor。

## Decision

前端 stack 固定為：**Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui**。所有頁面採 App Router（`app/` 目錄）；不採用 Pages Router。所有 React component 為 `.tsx`、明確 `'use client'` / Server Component 邊界。

## Consequences

### ✅ 好處
- 與 Vercel 平台、Server Actions（ADR-0002）、Cache Components 原生整合
- shadcn/ui 是 source-in-repo 模式（非 npm dep）— 完全可改、無 lock-in
- TypeScript strict + Tailwind v4 的 zero-config 為 AI-assisted coding 提供穩定 grounding

### ⚠️ 代價
- App Router 與 Pages Router 心智模型差異大；Next.js 16 多項 API 與訓練資料不同（見 `AGENTS.md`）— 必須先讀 `node_modules/next/dist/docs/`
- shadcn/ui copy-in 模式需自行維護升級

### 🔮 未來影響
- 鎖定 React Server Components 模型；未來若改用 Remix / TanStack Start 將是 major rewrite
- Tailwind v4 的 CSS-first config 會影響 design token 的儲存方式

## References

- Next.js 16 docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS v4: https://tailwindcss.com/docs
