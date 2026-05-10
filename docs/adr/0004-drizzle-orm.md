# ADR 0004 — ORM 採用 Drizzle ORM

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 A4; `migration-and-ai-governance.html` |
| Related ADR | ADR-0003 |

## Context

候選 ORM：Prisma（成熟、需 generate step、bundle 較大、serverless 啟動慢）、Drizzle（SQL-first、type-safe、零 codegen runtime、bundle 小、serverless-friendly）、Kysely（query builder，但缺 schema 定義 DSL）。RRMS 跑在 Vercel Functions（ADR-0002）— bundle size 與 cold-start 是硬指標。Drizzle 的 SQL-first 哲學也與 PostgreSQL 進階能力（`ltree`, RLS, jsonb）對齊（ADR-0003）。

## Decision

ORM 採用 **Drizzle ORM**。Schema 定義於 `db/schema/` 內 TypeScript 檔；migration 透過 `drizzle-kit generate` + `drizzle-kit migrate` 在 CI / pre-deploy 執行。原始 SQL 透過 Drizzle 的 `sql` template tag 嵌入（用於 `ltree` operators、RLS policies、複雜聚合）。

## Decision

## Consequences

### ✅ 好處
- 無 codegen runtime — bundle 小、serverless cold-start 快
- SQL-first：能直接寫 `ltree` operators / RLS policies；不被 ORM 抽象遮蔽 PG 能力
- TypeScript-first schema definition — type safety 完整

### ⚠️ 代價
- 比 Prisma 年輕、生態較小；某些工具（admin UI）需自寫
- 學習曲線：開發者習慣 Prisma 後須適應 SQL-style API

### 🔮 未來影響
- DB 抽象層讓 Postgres 換家相對單純（ADR-0003 退路）
- Phase 2 多租戶 RLS 政策可直接以 SQL 表達、不被 ORM 卡住

## References

- Drizzle ORM: https://orm.drizzle.team
- Drizzle Kit migrations: https://orm.drizzle.team/kit-docs/overview
