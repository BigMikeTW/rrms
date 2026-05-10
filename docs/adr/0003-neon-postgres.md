# ADR 0003 — 資料庫採用 Neon Postgres (managed serverless PostgreSQL)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` 決議 A3; `migration-and-ai-governance.html` |
| Related ADR | ADR-0004, ADR-0016, ADR-0017 |

## Context

RRMS 需要支援：(1) `ltree` 分類樹（ADR-0016）；(2) `jsonb` 動態 RBAC attributes（ADR-0019）；(3) Row-Level Security 多租戶隔離（ADR-0017）；(4) serverless-friendly connection pooling（搭配 ADR-0002 的 Vercel Functions）。Neon 是 Vercel Marketplace 原生整合的 managed PostgreSQL，支援 branching（per-PR preview DB）、auto-scaling、scale-to-zero。

## Decision

主資料庫採用 **Neon Postgres**（PostgreSQL 16+），啟用 `ltree` 與標準 `jsonb` 能力，啟用 Row-Level Security。連線分離：`DATABASE_URL`（pooled, for Functions）+ `DATABASE_URL_UNPOOLED`（unpooled, for migrations / cron）。透過 Vercel Marketplace 整合自動注入 env vars。

## Consequences

### ✅ 好處
- 純 PostgreSQL 相容，無 vendor-specific SQL；未來可遷移至 RDS / Cloud SQL / Supabase
- Neon Branching 支援 per-PR preview database — 與 Vercel Preview URL 完美對齊
- Scale-to-zero 在 Phase 1 低流量期成本接近 0

### ⚠️ 代價
- Cold-start 延遲（首次 query ~500ms）；可用 keep-alive 或 Fluid Compute 緩解
- Neon-specific 的 branching API 若深用會輕度 lock-in（但 DB schema 本身仍為純 PG）

### 🔮 未來影響
- Phase 2+ 多租戶 SaaS 需更精細的 RLS 政策設計（ADR-0017）
- 大客戶若要求自建 DB → ORM 抽象（ADR-0004）讓切換相對輕量

## References

- Neon docs: https://neon.tech/docs
- PostgreSQL ltree: https://www.postgresql.org/docs/current/ltree.html
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
