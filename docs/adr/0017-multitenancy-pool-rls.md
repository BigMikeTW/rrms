# ADR 0017 — 多租戶資料隔離採 AWS Pool 模式（共享 DB + tenant_id + RLS）

| Field           | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Status          | Accepted                                                                    |
| Date            | 2026-05-10                                                                  |
| Supersedes      | —                                                                           |
| Superseded by   | —                                                                           |
| Brainstorm 來源 | `location-and-coverage-v2.html`, `platform-rigorous-analysis.html` 決議 A17 |
| Related ADR     | ADR-0003, ADR-0016, ADR-0019, ADR-0089, ADR-0133                            |

## Context

AWS SaaS Lens 三種多租戶資料隔離模型：(1) **Silo** — 每租戶獨立 DB instance（強隔離、貴）；(2) **Pool** — 共享 DB + `tenant_id` 過濾 + RLS（成本低、需嚴密設計）；(3) **Bridge** — 共享 DB / 獨立 schema（折衷）。RRMS Phase 1 單一客戶（pro080）— Phase 2+ 才會有多租戶；但資料模型與隔離機制必須**第一天就設計好**，不能後補（後補 = data migration 災難）。Pool 模式 + Postgres RLS 是 Vercel + Neon 環境最划算且可擴展的選擇。

## Decision

採用 **Pool 模式 + Postgres Row-Level Security**：(a) 所有 tenant-scoped table 必含 `tenant_id UUID NOT NULL` 欄位 + index；(b) RLS policy `USING (tenant_id = current_setting('app.tenant_id')::uuid)` 強制過濾；(c) 連線初始 `SET app.tenant_id` 由 Server Action / Function middleware 注入（從 session 解出）；(d) DB user 設 `BYPASSRLS = false`（admin migration user 例外）。Phase 1 即啟用此模式，預設 `app.tenant_id` 設為固定 pro080 UUID。

## Consequences

### ✅ 好處

- 一份 schema 服務無限租戶；運維 / 升級成本低
- RLS 在 DB 層強制；application bug 不會跨租戶洩資料
- 與 ltree（ADR-0016）/ jsonb attributes（ADR-0019）相容

### ⚠️ 代價

- RLS policy 設計 / 測試複雜；漏設 = catastrophic data leak → 必須有專門測試（per-table RLS test）
- 連線設定 `app.tenant_id` 在 serverless 連線池場景需小心（每次 query 前確認）

### 🔮 未來影響

- 大客戶若要求 Silo（獨立 DB）→ Pool / Silo 混合（dual mode），現有 schema 不變
- Phase 2 SaaS 啟用時主要工作是 onboarding flow + per-tenant config，data layer 已就緒

## References

- AWS SaaS Lens — tenant isolation: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

## Amendments

| Date       | PR                      | Reason                                                             | Change                                                                |
| ---------- | ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 2026-05-11 | TBD (Plan 2 mini-audit) | 同 ADR-0089 — Round-3 doc audit 發現與 ADR-0133 多租戶耦合單向引用 | Related ADR 加 ADR-0089, ADR-0133（cross-link 補充；Decision 段不動） |
