# ADR 0031 — 後台 3-4 人含派工 / 客服角色

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-final-technician-statement.html` 決議 B8 |
| Related ADR | ADR-0089 |

## Context

RBAC（E1）需要知道後台實際 head count 與角色分工，才能合理切 role hierarchy。若把 5 種角色全切細，3-4 人團隊會 1 人扮 3 角，UI 反而複雜。

## Decision

後台規模設定為 **3-4 人**，含以下角色（同一人可有多角）：

- 派工 / 客服（受理 + 派單 + 跟催）
- 結帳 / 對帳（B23-B25）
- 派工主管以上（費率管理權限，B17）
- 超管（批次匯入、敏感操作）

`role` 表初版即提供以上 4 role；user-role 為 many-to-many。

## Consequences

- ✅ 與實際團隊規模匹配；不過度切角色
- ⚠️ 若團隊擴張需新增 role 與細粒度權限
- 🔮 ADR-0089/E1 RBAC 設計以此為基線

## References

- `docs/superpowers/brainstorm/q7-final-technician-statement.html`
