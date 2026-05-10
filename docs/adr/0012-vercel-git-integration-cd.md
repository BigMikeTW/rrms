# ADR 0012 — CD 採用 Vercel Git Integration (push-to-deploy + Preview + Rolling Releases)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-comparison.html`, `superpowers-toolkit.html` 決議 A12 |
| Related ADR | ADR-0001, ADR-0011, ADR-0014 |

## Context

部署候選：(a) Vercel — 與 Next.js 第一公民；(b) AWS Amplify；(c) Netlify；(d) 自架。RRMS 已決定 Vercel（ADR-0001 / ADR-0002）；其 Git Integration 提供 push-to-deploy、per-PR Preview URL、Rolling Releases（漸進式發布）、自動 rollback、build cache 等 CD 能力，與 GitHub（ADR-0011）整合零配置。

## Decision

CD 走 **Vercel Git Integration**：`main` branch push → production；其他 branch / PR push → 獨立 Preview URL（含 preview database — Neon Branching, ADR-0003）。**啟用 Rolling Releases**（漸進 % 流量切換）以降低部署風險，**啟用自動 rollback**（健康指標惡化自動回滾）。Production deploy 流量切換期間保留前一版（instant rollback 1-click）。

## Consequences

### ✅ 好處
- 每個 PR 都有可直接點擊驗收的 Preview URL — 對非工程師（BigMike）審閱極友好
- Rolling Releases 漸進切流量；自動 rollback 把部署事故影響降到最小
- 與 Vercel Marketplace 整合（Neon, Sentry 等 env vars 自動注入）

### ⚠️ 代價
- Preview deploy 數量在大團隊會吃 Vercel Pro Plan 配額（須監控）
- Vercel-specific feature（ADR-0014）— 換家須改 CI/CD pipeline

### 🔮 未來影響
- 多租戶 Phase 2 — Vercel 也支援多 domain alias，CD 可直接對應
- 若需 enterprise SLA → Vercel Enterprise Plan 平滑升級

## References

- Vercel Git Integration: https://vercel.com/docs/git
- Rolling Releases: https://vercel.com/docs/rolling-releases
