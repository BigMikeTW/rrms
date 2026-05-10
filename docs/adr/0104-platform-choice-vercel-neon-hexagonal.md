# ADR 0104 — 部署平台 Bundle 選 B：Vercel + Neon + Auth.js + Hexagonal + Superpowers 治理

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `honest-comparison.html` 決議 F1; `migration-and-ai-governance.html` |
| Related ADR | ADR-0001, ADR-0003, ADR-0005, ADR-0014, ADR-0107, ADR-0132 |

## Context

腦力激盪比對三套整體 bundle：(A) Vercel + Neon + **Clerk** + 鬆散治理（turnkey 但 Clerk 認證層 30-40% lock-in、商業條款限制）；(B) Vercel + Neon + **Auth.js** + Hexagonal 紀律 + Superpowers AI governance（中度 lock-in 但 adapter 化後可降到 5-8%，認證資料留在自家 DB）；(D) **Railway / Render** 自管雲（lock-in 最低但 DX 差、需自管 cron / queue / blob 三套服務、Phase 1 啟動成本飆升）。RRMS 為 1 人 + AI 協作的小團隊起步，需要 turnkey DX 但又不能在認證層綁死第三方。

## Decision

採 **Bundle B**：**Vercel**（compute + CDN + cron + blob，ADR-0001/0002/0006/0009）+ **Neon Postgres**（DB，ADR-0003）+ **Auth.js v5**（認證，ADR-0005）+ **Hexagonal/Ports-and-Adapters** 強制紀律（ADR-0107）+ **Superpowers** brainstorm/spec/plan/ADR governance flow。**不選 A**（Clerk 被排除）；**不選 D**（Railway 自管成本不划算）。

> 註：Auth.js v5 於 Plan 3 設計階段被 Better Auth 取代（見 ADR-0132）；本 ADR 的 bundle 語意不變，僅認證層具體技術換家，Hexagonal 紀律使該換家成本可控。

## Consequences

### ✅ 好處
- Turnkey DX — Vercel git-push 即部署、Neon serverless、Auth.js OSS
- 認證資料留自家 Neon DB，避開 Clerk 商業條款與 vendor lock-in
- Hexagonal + Superpowers 將整體 lock-in 從 ~30%（A bundle）壓到 5-8%（ADR-0114）

### ⚠️ 代價
- 固定 Vercel Pro US$20/seat/月（ADR-0014）
- 多租戶 / Organization / RBAC 須自寫（不享 Clerk Organizations 內建）

### 🔮 未來影響
- Phase 2+ 若 Vercel 漲價或政策變動，依 ADR-0113 Strangler Fig + Blue-Green 流程遷移
- Auth.js → Better Auth pivot 為此紀律的首次實證 — 換家成本被 Hexagonal 壓在認證 adapter 內

## References

- Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
- Vercel TOS: https://vercel.com/legal/terms
- Neon: https://neon.tech
- Auth.js v5: https://authjs.dev
- Brainstorm: `honest-comparison.html` 決議 F1; `migration-and-ai-governance.html`
