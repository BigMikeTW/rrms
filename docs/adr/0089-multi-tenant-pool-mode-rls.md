# ADR 0089 — 多租戶資料隔離採 AWS Pool 模式（owner_id + Postgres RLS）

| Field           | Value                                                                               |
| --------------- | ----------------------------------------------------------------------------------- |
| Status          | Accepted                                                                            |
| Date            | 2026-05-10                                                                          |
| Supersedes      | —                                                                                   |
| Superseded by   | —                                                                                   |
| Brainstorm 來源 | `location-and-coverage-v2.html` § E 決議 E1; `platform-rigorous-analysis.html` 對應 |
| Related ADR     | ADR-0017, ADR-0067, ADR-0076, ADR-0077, ADR-0133                                    |

## Context

RRMS 將從 Phase 1 的單一業主擴展為 Phase 2 多租戶 SaaS（多家業主共用同一 deployment）。AWS SaaS Lens 定義三種租戶模式：Silo（每租戶獨立 DB）、Pool（共用 schema + tenant_id 過濾）、Bridge（混合）。Silo 成本與運維負擔線性上升；Bridge 複雜度高。RRMS 預期 Phase 2 起 ≥10 業主、查詢量級可控，Pool 模式在成本與彈性間最佳。但 Pool 模式若僅靠應用層過濾，一行 missing `WHERE owner_id = ?` 即洩漏跨租戶資料 — 必須依賴資料庫層的 Postgres Row-Level Security (RLS) 作為強制邊界。

## Decision

採 **Pool 模式**：所有業務表共用 schema，皆含 `owner_id` 欄位。資料隔離由兩層強制：(1) 應用層 query 自動帶入 `owner_id` 過濾；(2) Postgres RLS policy 以 session-level `current_setting('app.current_owner_id')` 自動 enforce。Phase 1 schema 已備 `owner_id` 欄位（ADR-0067），RLS policy 在 Phase 2 啟用（ADR-0068）。

## Consequences

### ✅ 好處

- 單一 deployment 服務多業主，運維成本不隨租戶線性上升
- RLS 在 DB 層阻擋跨租戶洩漏 — 即使應用層 bug 也不破防
- 對應 brainstorm A17 多租戶基礎決議

### ⚠️ 代價

- 所有 query 必須設定 session 變數，遺漏即 RLS 拒絕（開發紀律）
- 跨租戶報表需 elevated role bypass RLS（要嚴格審計）

### 🔮 未來影響

- Phase 2 啟用 RLS 時須完整 E2E 測試所有 read/write path
- Phase 3 Enterprise tier 可選 Silo 模式（單一業主獨立 DB）做為升級路徑

## References

- AWS SaaS Lens — Tenant Isolation Strategies: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html
- PostgreSQL Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Brainstorm: `location-and-coverage-v2.html` 決議 E1

## Amendments

| Date       | PR                      | Reason                                                                                                                                 | Change                                                                |
| ---------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2026-05-11 | TBD (Plan 2 mini-audit) | Round-3 doc audit 發現 ADR-0133 §Decision 方案 A（audit_log 跨表真匿名化）與多租戶紀律耦合，但本 ADR Related ADR 未列 0133（單向引用） | Related ADR 加 ADR-0077, ADR-0133（cross-link 補充；Decision 段不動） |
