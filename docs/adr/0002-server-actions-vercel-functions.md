# ADR 0002 — 後端採用 Next.js Server Actions + Vercel Functions (Node runtime, Fluid Compute)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 A2; `docker-vs-serverless.html` |
| Related ADR | ADR-0001, ADR-0008, ADR-0018 |

## Context

RRMS 工作負載以表單提交、CRUD、PDF 生成、LINE webhook 為主，屬「scale-to-zero、bursty」型態。Vercel Functions 的 Fluid Compute 在保留 serverless 自動擴展優點的同時提供 in-function concurrency，避免傳統 serverless 的 cold-start 與單請求隔離成本。Server Actions 則消除 REST/RPC boilerplate，與 React 表單天然整合。

## Decision

後端 API 第一首選為 **Next.js Server Actions**（type-safe form mutation）；對於 webhook、cron、PDF 生成等非表單場景採用 **Vercel Functions on Node.js runtime（Fluid Compute 開啟）**。**預設 timeout = 300 秒**（Pro Plan 上限），長任務（PDF 批次）走 background job pattern。不採用 Edge Runtime 作為主要後端（Node 生態相容性優先）。

## Consequences

### ✅ 好處
- Server Actions 提供 end-to-end type safety；無需手寫 fetch + zod 雙端驗證
- Fluid Compute 解決傳統 serverless cold-start 問題、降低成本
- Node runtime 與 Puppeteer / @sparticuz/chromium（ADR-0008）相容

### ⚠️ 代價
- 300s timeout 上限對於極長任務（大型 PDF batch）仍須拆分；不適合常駐 worker
- Server Actions 是 Next.js 專屬，未來若離開 Vercel/Next.js 須改寫為 REST/tRPC

### 🔮 未來影響
- 若需常駐 process（real-time WebSocket、長任務 worker）— 走 ADR-0018 的 Docker 退路

## References

- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Vercel Fluid Compute: https://vercel.com/docs/functions/fluid-compute
