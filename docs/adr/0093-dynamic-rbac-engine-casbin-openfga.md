# ADR 0093 — 動態 RBAC 引擎採 Casbin / OpenFGA 設計理念（Policy as Data）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html` § E 決議 E5（soft, 理念採用） |
| Related ADR | ADR-0019, ADR-0090, ADR-0091, ADR-0092 |

## Context

若 RBAC 邏輯寫死在 code 裡（hardcoded `if role === 'pm'`），新增角色或調整權限矩陣即需 code change + redeploy；多租戶下不同業主想要的權限細節若都靠 code，最終演變成大量 if-else。Google Zanzibar（OpenFGA 開源實作）與 Casbin 提倡「Policy as Data」— 權限規則存於 DB / config，引擎讀取即生效。

## Decision

RBAC 引擎採 **Policy as Data 理念**（Casbin / OpenFGA 設計風格），但不必引入完整 OpenFGA 服務。Phase 1 以 Postgres jsonb policy 表 + ltree subtree 判斷自實作（對應 ADR-0019），規則包含：subject (user/role) × object (node/resource) × action (六動作 ADR-0092)。新增角色 / 新增動作 = 寫入 policy 表，不需 code change。

「soft」表示採理念但不強制特定實作框架；後續若引擎複雜度上升，可平滑遷移到 OpenFGA / Permify 等專業引擎。

## Consequences

### ✅ 好處
- 新增角色不需 redeploy（業主自助新增為 Premium tier 鋪路 — ADR-0095）
- 權限變更可走 admin UI + audit_log 紀錄，不必工程介入
- 對應 ADR-0019 的 jsonb 動態 schema 思路一致

### ⚠️ 代價
- 自實作引擎需嚴格 unit test（規則矩陣大）
- Policy 寫錯比 code 寫錯難 review（沒有編譯器把關），須由 mini-audit + RBAC 整合測試補足

### 🔮 未來影響
- Phase 2+ 若規模擴大可遷移到 OpenFGA service
- Policy 表本身為 audit_log target — 任何權限變更全紀錄

## References

- Brainstorm: `flexible-architecture.html` 決議 E5（soft）
- Google Zanzibar paper (2019): https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/
- OpenFGA: https://openfga.dev/
- Casbin: https://casbin.org/
- ADR-0019 dynamic RBAC jsonb 設計
