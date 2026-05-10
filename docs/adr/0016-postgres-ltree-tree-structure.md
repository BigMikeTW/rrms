# ADR 0016 — 樹狀資料結構採用 PostgreSQL ltree extension

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html`, `platform-rigorous-analysis.html` 決議 A16 |
| Related ADR | ADR-0003, ADR-0019 |

## Context

RRMS 多處需要任意深度樹狀結構：(a) 物件分類（建築 → 樓層 → 房間 → 設備 → 元件）；(b) 維修工種分類（電 → 強電 → 配電盤 → 斷路器）；(c) 組織架構（公司 → 部門 → 班組）；(d) RBAC 角色繼承樹（ADR-0019）。候選：(i) adjacency list — 簡單但 recursive query 成本高；(ii) materialized path（字串）— 自寫複雜；(iii) nested set — 寫入成本高；(iv) **PostgreSQL ltree extension** — 原生支援、有 GiST index、`@>`/`<@`/`~` operators、查詢效能佳。

## Decision

所有任意深度樹狀關聯採 **PostgreSQL `ltree` extension**（已於 Neon 啟用, ADR-0003）。每個樹狀 entity 有 `path ltree NOT NULL` 欄位 + GiST index。子樹查詢用 `path <@ 'parent.path'`、ancestor 查詢用 `path @> 'child.path'`、pattern 用 `path ~ 'A.*.B'`。Drizzle ORM（ADR-0004）以 `sql` template tag 嵌入 ltree operator。

## Consequences

### ✅ 好處
- 任意深度、查詢效能佳（GiST index）
- 純 PostgreSQL 原生功能；不依賴 application layer 維護
- 與 RLS（ADR-0017）相容 — RLS policy 可用 `path <@ tenant_root` 過濾

### ⚠️ 代價
- 移動子樹（rename ancestor）需更新所有 descendant `path`（單一 UPDATE 即可，但須 transaction）
- ltree 是 PG-only — DB 換家須改寫（緩解：ORM 抽象, ADR-0004）

### 🔮 未來影響
- Phase 2+ 多租戶 SaaS 大樹（10K+ 節點）效能仍可承受
- AI 派工（Phase 3）可基於 ltree 做能力 / 區域匹配查詢

## References

- PostgreSQL ltree: https://www.postgresql.org/docs/current/ltree.html
