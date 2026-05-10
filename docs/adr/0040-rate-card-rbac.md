# ADR 0040 — 費率表內部員工自管（查看全員 / 修改主管 / 匯入超管）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `rate-card-design.html` 決議 B17 |
| Related ADR | ADR-0031, ADR-0041, ADR-0089 |

## Context

費率（compensation_rate_card）是利潤關鍵資訊。若任何後台員工皆可改 = 風險高；若只有超管能管 = 日常運作卡關。需細分 RBAC。

## Decision

費率表 RBAC 三層：

- **查看** — 所有後台員工（含派工）皆可查看（派工需確認費率指派）
- **新增 / 修改 / 停用** — 派工主管以上
- **批次匯入** — 超管專屬（敏感操作，需 audit log + 二次確認）

無法直接從外部 API 修改；只能透過後台 UI 經 Server Action（ADR-0002）。

## Consequences

- ✅ 日常營運順暢；高風險操作受限；audit trail 完整
- ⚠️ 主管以上必須有人（小團隊輪休時可能單點故障）
- 🔮 Phase 2 動態費率（B40）後此 RBAC 模型套到 adjustment 規則表

## References

- `docs/superpowers/brainstorm/rate-card-design.html`
