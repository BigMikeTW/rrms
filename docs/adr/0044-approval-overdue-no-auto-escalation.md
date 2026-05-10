# ADR 0044 — 簽核逾期持續提醒 + 後台儀表板顯示，不自動升級

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-approval-billing-query.html` 決議 B21 |
| Related ADR | ADR-0043 |

## Context

自動升級簽核（例如 3 天未簽 → 自動報主管）在小團隊（B8 = 3-4 人）會造成「上層被打擾」與「責任跳級」。BigMike 偏好維持人工判斷彈性。

## Decision

簽核逾期處理：

- **持續提醒** — 系統每日 cron 寄 email + LINE 給簽核人
- **後台儀表板** — 顯示「卡關案件」清單（含逾期天數、待簽人）
- **不自動升級** — 不自動轉派 / 不自動跳級給上層；由派工人員人工判斷後手動轉派

## Consequences

- ✅ 上層不被機械式打擾；派工人員保持掌控
- ⚠️ 若派工人員忽略儀表板，案件可能長期卡關
- 🔮 Phase 2 可加入 SLA 達成率報表（B26）追蹤卡關 KPI

## References

- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
