# ADR 0056 — PDF 一致性策略 = Immutable Snapshot + Version 比對

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-pdf-report.html` 決議 B33 |
| Related ADR | ADR-0042, ADR-0054, ADR-0058 |

## Context

PDF 報告若每次產生都重新讀資料 → 同一案件兩個時點下載會內容不同（因案件 Reopened 加了新工項）。但若僅存第一次的 PDF → 後續變更追不到。需要兩者兼顧。

## Decision

PDF 一致性策略 = **D + E 混合**：

- **每次生成 PDF** = 不可變的資料快照 + 新一列 `case_report` row（記 version、generated_at、generated_by、PDF blob ref、源資料 snapshot JSON）
- **過期報告下載**時 PDF 加**浮水印**（標示 "v1, 此版本已被 v3 取代"）
- 原版本 PDF **永不刪除**（與 audit_log D2 同精神）

## Consequences

- ✅ 法律證據力（每張 PDF 都有獨立快照）；業主可看歷史變更
- ⚠️ Storage 隨版本累積（但 PDF 體積不大；每年數 GB 可接受）
- 🔮 Reopened 案件（B35 / ADR-0058）依此模型自然支援多版本

## References

- `docs/superpowers/brainstorm/q8-pdf-report.html`
