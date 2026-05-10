# ADR 0091 — 樹狀繼承 RBAC 三條規則

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` § E 決議 E3 |
| Related ADR | ADR-0019, ADR-0090, ADR-0092 |

## Context

RRMS location 樹（owner → 大樓 → 樓層 → 戶）採 ltree 階層儲存（ADR-0019 系列）。資料可見性需對應樹結構：樓管不能看到隔壁棟、總務不能看到整棟匯總。需要明確、可機器驗證的繼承規則。

## Decision

樹狀繼承 RBAC 三條規則（適用 ADR-0090 的 pm / building_manager / general_affairs / owner_admin 四角色）：

1. **看不到祖先** — 用戶綁定節點 N 時，N 的 parent / grandparent 不可見。
2. **看不到平行節點** — N 的 sibling 不可見（不同大樓間互不可見）。
3. **看自己節點以下子樹（全部繼承）** — N 及其所有 descendant 可見。

`staff_internal`（內部員工）為例外 — 視為 super-tenant 看全部。`owner_admin` 綁在 owner 節點，自然繼承整個 owner 子樹。

## Consequences

### ✅ 好處
- 三條規則簡單可機器驗證（測試矩陣 = 角色 × 節點層級 × {ancestor/sibling/descendant}）
- 與 ltree `<@` operator 天然契合（subtree 判斷一行 SQL）
- 業務直覺：樓管管自己樓 = 看自己樓的全部、不看其他樓

### ⚠️ 代價
- M:N 綁定多節點時要對每個綁定節點獨立套規則再 union（query 複雜度增）
- 跨大樓彙總報表需 owner_admin 或 pm 角色才能看全 owner 子樹

### 🔮 未來影響
- Phase 2 RLS policy 以 ltree `<@` 實作三規則
- 細分權限（ADR-0092）以本三規則為基底再套欄位 / 動作層

## References

- Brainstorm: `flexible-architecture-qa.html` 決議 E3
- PostgreSQL ltree subtree operator: https://www.postgresql.org/docs/current/ltree.html
- 對應 ADR-0019 動態 RBAC jsonb 設計
