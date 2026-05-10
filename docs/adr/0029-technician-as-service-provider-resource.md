# ADR 0029 — 技師資料模型為服務商全局資源（不屬於 owner）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-dispatch-technician.html` 決議 B6 |
| Related ADR | ADR-0030, ADR-0091 |

## Context

技師可能同一天為多位 owner 的多棟大樓服務。若把 technician 綁在 owner 下作為子資源，跨 owner 派工就要重複建檔、評分歷史也會被切碎、AI 派工訓練資料無法跨 owner 累積（B12）。

## Decision

`technician` 表是**服務商（公司）全局資源**，不歸屬於任何 owner / building。派工時透過 `case.assigned_technician_id` 引用；技師的歷史案件、評分、月度對帳都跨 owner 累積。

## Consequences

- ✅ 派工自由度最大；評分與績效資料完整；AI 派工訓練（B12）有完整 dataset
- ⚠️ 多租戶隔離（E1 RBAC）必須在 RBAC 層處理：owner 看不到其他 owner 的技師敏感資料
- 🔮 未來業務線 1（原廠協作）可共用同一池技師

## References

- `docs/superpowers/brainstorm/q7-dispatch-technician.html`
