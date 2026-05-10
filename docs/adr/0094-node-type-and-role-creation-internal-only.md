# ADR 0094 — 新增 node_type / 新角色限公司內部超管（MVP）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html` § E 決議 E6 |
| Related ADR | ADR-0090, ADR-0093, ADR-0095 |

## Context

ADR-0093 的 Policy as Data 引擎理論上允許任何人新增角色 / node_type。但 MVP 階段若放開給業主 owner_admin 自助操作，極易出現：(a) 不熟悉繼承規則導致權限漏洞；(b) 角色命名混亂跨業主；(c) 廢棄角色累積污染 policy 表。需要安全閥。

## Decision

MVP 階段，**新增 node_type 與新增角色僅公司內部超管（`staff_internal` 中具 `super_admin` flag 者）可執行**。業主端 owner_admin 僅能：

- 指派 / 撤回既有角色給人員
- 設定 M:N 綁定（樓管 ↔ 大樓、總務 ↔ 戶）
- 啟用 / 停用 owner 內部使用者

不可：建立新 role 字串、建立新 node_type、修改 policy schema。業主自助新增為 Premium / Enterprise tier feature（ADR-0095）。

## Consequences

### ✅ 好處
- MVP 階段風險可控；公司內部把關角色擴張
- 業主端 onboarding 簡單（只需點選預定義角色）
- 為 plan tier feature gating 鋪路

### ⚠️ 代價
- 業主想要客製角色須提工單給內部，回應週期較長
- 內部超管成為瓶頸（須監控 SLA）

### 🔮 未來影響
- Premium tier（ADR-0095）開放 owner_admin 自助新增 type / 角色（含審核 workflow）
- Enterprise tier 完全自助 + custom schema

## References

- Brainstorm: `flexible-architecture.html` 決議 E6
- ADR-0093 Policy as Data 引擎
- ADR-0095 Plan Tier feature gating
