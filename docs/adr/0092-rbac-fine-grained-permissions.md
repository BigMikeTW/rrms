# ADR 0092 — 權限細分為六種動作（看名稱 / 看內容 / 編輯 / 派工 / 簽核 / 結帳）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` § E 決議 E4 |
| Related ADR | ADR-0091, ADR-0093 |

## Context

業務情境下，「能看見」與「能做什麼」不是同一件事。樓管能看到報修單名稱與狀態（為了知道情況）但未必能看金額；總務能編輯戶內資料但不能簽核合約。二元 read/write 模型表達不出這些業務區分。

## Decision

權限拆為六種動作層級（fine-grained permissions），每個資源（節點 / 案件 / 合約 / 帳單）獨立管控：

| 動作 | 範例 |
|---|---|
| `view_name` 看名稱 | 列表只顯示標題 / 編號 |
| `view_full` 看完整內容 | 含金額、聯絡方式、附件 |
| `edit` 可編輯 | 修改非鎖定欄位 |
| `dispatch` 可派工 | 指派技師 |
| `approve` 可簽核 | 核准請款 / 變更 / 封存 |
| `settle` 可結帳 | 開立發票、收款確認 |

每動作獨立套用 ADR-0091 的樹狀繼承三規則。預設角色 → 動作 mapping 由 RBAC engine（ADR-0093）以 policy data 配置，不寫死 code。

## Consequences

### ✅ 好處
- 業務區分精確：樓管看得到問題但看不到金額、總務管戶但不能簽合約
- 各動作獨立繼承，可針對個別動作放寬或收緊（如「樓管可編輯但不可結帳」）
- 與 OpenFGA / Casbin 的 (subject, object, action) 三元組天然對應

### ⚠️ 代價
- 權限矩陣維度 = 角色 × 6 動作 × 節點層級，測試組合多
- UI 必須對每個按鈕 / 欄位獨立判斷，前端複雜度上升

### 🔮 未來影響
- Premium / Enterprise tier 允許 owner_admin 自訂動作（ADR-0095）
- 動作集合可演化（如未來新增 `delegate`），加新動作不破壞既有 policy

## References

- Brainstorm: `flexible-architecture-qa.html` 決議 E4
- OpenFGA Authorization Model: https://openfga.dev/docs/concepts
- Casbin RBAC with Domains: https://casbin.org/docs/rbac-with-domains/
