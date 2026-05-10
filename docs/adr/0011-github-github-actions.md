# ADR 0011 — Source 與 CI 採用 GitHub + GitHub Actions

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-comparison.html`, `superpowers-toolkit.html` 決議 A11 |
| Related ADR | ADR-0012 |

## Context

候選 source host：GitHub / GitLab / Bitbucket / 自架 Gitea。GitHub 為 de-facto 標準，與 Vercel（ADR-0012）、Claude Code、各種 marketplace tool 整合最深。GitHub Actions 提供 free tier minutes 對 commercial private repo 來說足以跑 CI（lint / test / audit）。

## Decision

Source code 託管於 **GitHub** （private repo `BigMikeTW/RRMS`）；CI 採用 **GitHub Actions**。CI 工作流：(a) `lint` （ESLint + tsc）；(b) `test`（vitest / playwright）；(c) `audit:docs`（`scripts/audit-docs.mjs` ADR / spec / plan 一致性）；(d) `build`（Next.js build dry run）。所有 PR 必須通過全部 CI job 才能 merge（branch protection 強制）。

## Consequences

### ✅ 好處
- GitHub Actions 與 GitHub PR / branch protection / Dependabot 原生整合
- Marketplace 生態最豐富；Claude Code / Codex 等 AI 工具皆以 GitHub 為一等公民
- Vercel Git Integration（ADR-0012）push-to-deploy 直接對 GitHub branch

### ⚠️ 代價
- GitHub 中央化風險（少數情況 outage 會卡 deploy）
- Private repo Actions free minutes 有限；若 CI 重了須付費或自託 runner

### 🔮 未來影響
- Phase 2+ 若需更嚴 CI / self-hosted runner — Actions 平滑升級
- 若爆量遷移至 GitLab Self-host — workflow YAML 須重寫

## References

- GitHub Actions: https://docs.github.com/en/actions
- Branch protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
