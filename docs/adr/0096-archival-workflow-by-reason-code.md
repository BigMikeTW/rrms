# ADR 0096 — Workflow 分流（封存 / 解封依 reason_code 走不同流程）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `audit-trail.html` § E 決議 E8 |
| Related ADR | ADR-0076, ADR-0090 |

## Context

節點封存（archive）動機多元：大樓拆除、戶合併、住戶搬遷、合約到期。不同原因對應不同合理流程 — 大樓拆除是物理事實不需討論、合約到期是商業決策需雙方確認。若全部走同一條 approval chain（過嚴）會卡流程；若全部 auto-archive（過鬆）則風險高。需依 reason_code 分流。

## Decision

封存 workflow 依 `reason_code` 分流如下：

| reason_code | 觸發者 | 流程 |
|---|---|---|
| `BUILDING_DEMOLITION` 大樓拆除 | owner_admin | 直接封存（單方確認） |
| `TENANT_MERGED` 戶合併 | pm 提交 | owner_admin 確認 |
| `RELOCATION` 搬遷 | pm | 直接封存 + 自動建議建新 node |
| `CONTRACT_END` 合約到期 | pm 提交 | 內部 PM + owner_admin 雙簽 |

**解封（unarchive）一律需 owner_admin 簽核**（不論原 reason_code），且必須附上新的 reason 寫入 audit_log。所有封存 / 解封事件寫 `audit_log`（ADR-0076 append-only）。

## Consequences

### ✅ 好處
- 流程強度與業務風險匹配
- reason_code 強制必填即逼使紀錄為何封存 — 法遵與 audit 必要
- 解封統一走 owner_admin 防止繞過

### ⚠️ 代價
- workflow engine 須支援多分支（`Effect`-based state machine 或類似）
- 新增 reason_code 需更新分流表（policy as data 對應 ADR-0093）

### 🔮 未來影響
- Phase 2+ 可加入 reason_code 法遵稽核儀表板（哪類封存最多、是否異常）
- 與 ADR-0097 雙層 audit 儲存配合，深化分析查詢

## References

- Brainstorm: `audit-trail.html` 決議 E8
- ADR-0076 audit_log append-only
