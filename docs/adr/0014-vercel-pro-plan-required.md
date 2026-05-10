# ADR 0014 — Vercel 計畫必須 Pro Plan，禁用 Hobby Free 跑商業 production

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 A14（hard）; brainstorm H1 |
| Related ADR | ADR-0002, ADR-0010, ADR-0012 |

## Context

Vercel Hobby Free Plan 的服務條款（[vercel.com/legal/terms](https://vercel.com/legal/terms)）明文：**Hobby Plan 僅限非商業用途**；商用流量（含本 RRMS 的維修費收費 / 客戶支付場景）違反 TOS，Vercel 有權立即停權。Pro Plan US$20/seat/月 才為商業用途授權，且提供：(a) 300s function timeout（vs Hobby 60s — ADR-0002 依賴）；(b) team collaboration；(c) higher build minutes / bandwidth；(d) password protected deployments。

## Decision

RRMS production deployment **必須使用 Vercel Pro Plan**（最低 US$20/seat/月）；**禁止以 Hobby Free Plan 跑 production**。Dev / preview environment 可用同一 Pro team 配額；個人 Hobby 僅供本機驗證或 spike。Plan tier 變更須走 PR + ADR 修訂。

## Consequences

### ✅ 好處
- 合規（Vercel TOS）— 無被停權風險
- 300s timeout 滿足 Puppeteer PDF（ADR-0008）與 Fluid Compute（ADR-0002）需求
- Team collaboration 讓 BigMike + AI 協作 audit trail 清楚

### ⚠️ 代價
- 固定成本 US$20/seat/月（Phase 1 1 seat ≈ NT$640/月）
- Seat 數隨團隊擴張線性上升

### 🔮 未來影響
- Phase 2+ 多租戶 SaaS 可能需 Enterprise Plan（custom limits / SSO / audit log）
- 此為 brainstorm A14/H1 hard 決議；推翻須完整 ADR supersede 流程

## References

- Vercel Pricing: https://vercel.com/pricing
- Vercel TOS (commercial use): https://vercel.com/legal/terms
- 記憶錨點: `project_vercel_plan_tier.md`
