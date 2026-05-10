# ADR 0058 — Reopened 案件歷史 PDF 仍可下載（標示「重啟前版本」）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-two-stage-closure.html` 決議 B35 |
| Related ADR | ADR-0053, ADR-0056 |

## Context

案件 Reopened（狀態 10）= 結案後又出問題重啟。但業主可能已經根據 v1 報告做了報銷 / 對住戶交差。若 v1 PDF 因為 reopen 而被刪 / 替換 = 業主帳對不起來。

## Decision

案件 Reopened 後：

- 歷史 v1, v2 PDF **仍可下載**，但 UI 與 PDF 浮水印標示為「**重啟前版本**」
- 新報告需等候**重新 Resolved** 後產出 v3
- `case_report.version` 持續遞增；舊版皆有效但加註

## Consequences

- ✅ 業主歷史報銷不受影響；資料可追溯
- ⚠️ UI 需正確顯示版本鏈（v1 → v2 → reopened → v3）
- 🔮 與 audit_log D2 append-only 形成完整歷史

## References

- `docs/superpowers/brainstorm/q8-two-stage-closure.html`
