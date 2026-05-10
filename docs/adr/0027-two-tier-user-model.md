# ADR 0027 — 客戶端兩層使用者模型（L1 報修人 / L2 窗口）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `user-tiers.html` 決議 B4 |
| Related ADR | ADR-0028, ADR-0093 |

## Context

100+ 棟大樓 × 每棟住戶數百，若全部要求註冊帳號，UX 阻力極大且帳號管理成本爆炸。但是「窗口角色」（樓管/總務）有強烈的查詢、簽核、對帳需求，必須有正式帳號與權限。兩種使用者的存取頻率、權限需求差距 100 倍以上。

## Decision

客戶端採**兩層使用者模型**：

- **L1 報修人** — 無註冊、量大、一次性互動；以 LINE userId 或匿名 token 識別
- **L2 窗口** — 註冊帳號、每棟 1-2 人；具查詢、簽核、對帳權限

L1 不進 `users` 表（僅以 LINE userId 存於 case 表）；L2 進 `users` 表並綁定 `building_id` / `owner_id`。

## Consequences

- ✅ 註冊摩擦集中於少數窗口，大幅降低導入阻力
- ⚠️ L1 → L2 升級流程須設計（同一人後來變窗口的歷史案件 attribution）
- 🔮 業務線 1、3 套用相同模型（B2）

## References

- `docs/superpowers/brainstorm/user-tiers.html`
