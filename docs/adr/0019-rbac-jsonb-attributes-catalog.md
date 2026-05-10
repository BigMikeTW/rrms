# ADR 0019 — 動態樹狀 RBAC 後端用 jsonb attributes + catalog（不寫死 enum）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html`, `flexible-architecture-qa.html` 決議 A19 |
| Related ADR | ADR-0003, ADR-0016, ADR-0017 |

## Context

RBAC 候選實作：(a) 寫死 enum（`role: 'admin' | 'manager' | 'worker'`）— 簡單但僵硬；(b) Casbin / OpenFGA — 完整 ABAC engine 但學習曲線高、抽象重；(c) 自寫 jsonb attributes + catalog table — 折衷：權限模型存於 DB（catalog），實際決策資料以 jsonb 表達。RRMS 需求：權限隨樹狀結構（ADR-0016）繼承、隨多租戶（ADR-0017）切割、客戶可能要求自定義角色 → enum 不足。Casbin 完整引擎在 Phase 1 過頭；走「Casbin 設計理念但自寫精簡版」最合 Phase 1 / Phase 2 漸進。

## Decision

RBAC 走 **jsonb attributes + catalog** 模式：(a) `permission_catalog` table 列出所有原子權限（`resource:action`）— 隨產品演進新增 row 而非改 schema；(b) `roles` table 含 `permissions jsonb`（陣列 of catalog ids 或 wildcard pattern）；(c) `user_role_assignments` 含 `scope_path ltree`（限定生效範圍）+ `attributes jsonb`（如 `{ region: 'TW', max_amount: 50000 }`）；(d) decision function `can(user, action, resource)` 在 Postgres function 或 application layer 評估。設計參考 Casbin / OpenFGA 但不引入相依。

## Consequences

### ✅ 好處
- 權限新增不改 schema — 客戶定制 / Phase 2 多租戶各自定義角色皆可
- 與 ltree（ADR-0016, scope_path）/ RLS（ADR-0017, tenant_id）整合
- jsonb 可索引（GIN index）— 常用 attribute 查詢效能 OK

### ⚠️ 代價
- decision logic 自寫；測試覆蓋率須高（每條 policy 至少 1 positive + 1 negative test）
- 比寫死 enum 慢；高 throughput 場景需 cache（per-request memoize）

### 🔮 未來影響
- Phase 2+ 若需更複雜（ReBAC / 關係型權限）→ 可平滑接入 OpenFGA（catalog 對應到 OpenFGA tuples）
- AI 派工（Phase 3）可用 attributes 做能力匹配（如 `skills: ['plumbing', 'electrical']`）

## References

- Casbin: https://casbin.org
- OpenFGA: https://openfga.dev
- Postgres jsonb GIN: https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING
