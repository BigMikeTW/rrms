# ADR 0090 — 角色模型：四種業務角色 + owner_admin

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `location-and-coverage-v2.html` § E 決議 E2 |
| Related ADR | ADR-0089, ADR-0091, ADR-0093 |

## Context

物業維修場景下，使用者橫跨「服務提供方（內部員工）」與「服務接收方（業主端各層級）」兩端。若用單一 admin/user 二元模型，無法表達「物業 PM 看整個 owner、樓管只看自己負責大樓、總務只看自己戶」的資料邊界，也無法區分業主端最高權限與內部員工。需明確的角色分類。

## Decision

定義五種角色（四業務 + 一業主端最高權限）：

| 角色 | 歸屬 | 可見範圍 |
|---|---|---|
| `staff_internal` | 內部員工（不屬任何 owner） | 看所有 owner 資料 |
| `pm` 物業 PM | 屬某 owner | 看整個 owner 樹 |
| `building_manager` 樓管 | 屬某 owner，M:N 綁定特定大樓 | 僅綁定大樓子樹 |
| `general_affairs` 總務 | 屬某 owner，M:N 綁定特定戶 | 僅綁定戶 |
| `owner_admin` | 屬某 owner | 該 owner 全範圍最高權限（含人員管理） |

`staff_internal` 在 RBAC engine 視為 super-tenant；其餘四種一律走 ADR-0091 樹狀繼承規則。

## Consequences

### ✅ 好處
- 五種角色覆蓋 brainstorm 列舉的所有業務場景
- M:N 綁定支援樓管 / 總務常見的「跨棟 / 跨戶」實際需求
- owner_admin 與 staff_internal 分離，業主端不誤觸內部營運

### ⚠️ 代價
- M:N 綁定表（user_building_assignment / user_unit_assignment）需額外維護
- `staff_internal` 跨租戶權限風險高，須額外 audit_log 強制記錄

### 🔮 未來影響
- Premium / Enterprise tier 允許新增自訂角色（ADR-0095）但仍套用本表四種角色語意
- Phase 2 RLS policy 以本五角色為 baseline 撰寫

## References

- Brainstorm: `location-and-coverage-v2.html` 決議 E2
- NIST RBAC Standard (INCITS 359-2012): https://csrc.nist.gov/projects/role-based-access-control
