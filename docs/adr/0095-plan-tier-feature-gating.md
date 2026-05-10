# ADR 0095 — Plan Tier feature gating 設計（Free/Standard/Premium/Enterprise）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` § E 決議 E7 |
| Related ADR | ADR-0067, ADR-0089, ADR-0094 |

## Context

RRMS 預期 Phase 2 起以多租戶 SaaS 商業化。業主對「客製化深度」需求差異極大：小業主只需 baseline、中型想要彈性新增角色、大型 / 連鎖要求完全自訂 schema + SSO + 高階審計。一視同仁的功能範圍會導致：(a) 小業主負擔大型功能複雜度；(b) 大業主需求被 baseline 限制。需要分層方案。

## Decision

設計四層 plan tier（MVP 僅保留 `owner.plan_tier` 欄位空間 — ADR-0067，實際 gating 邏輯 Phase 2 啟用）：

| Tier | 角色 / type 管理 | 查詢 / 報表 | 審計 / 安全 |
|---|---|---|---|
| **Free / Standard** | 內建角色與 node_type，新增需內部審核 | 預定義報表 | Baseline audit_log |
| **Premium** | owner_admin 自助新增 node_type / 角色（policy 引擎開放） | 自訂查詢 / dashboard | 進階分析儲存（ADR-0097） |
| **Enterprise** | 完全自訂 schema + permission set | 完全自訂 | SSO + 法遵級審計 + SLA |

MVP 階段 Phase 1 所有業主視為 Standard，`plan_tier` 欄位預留但不 gate；Phase 2 啟用 gating。

## Consequences

### ✅ 好處
- 商業模式分層清晰，定價邏輯有依據
- 工程一份 codebase 服務四層（feature flag），不需多 fork
- MVP 不必實作 gating 邏輯，僅保留 schema 空間

### ⚠️ 代價
- Phase 2 啟用 gating 時須全功能盤點哪些屬於 Premium / Enterprise（規劃成本）
- Tier 升降級遷移流程（特別是降級時 custom 資料如何處理）需專門設計

### 🔮 未來影響
- Phase 2 推出 Premium tier（含 owner_admin 自助 — ADR-0094 鬆綁）
- Phase 3 推出 Enterprise tier（含 SSO 整合、Silo 模式選項）

## References

- Brainstorm: `flexible-architecture-qa.html` 決議 E7
- ADR-0067 schema reserved fields
- AWS SaaS Tenant Tier 設計參考: https://aws.amazon.com/saas/
