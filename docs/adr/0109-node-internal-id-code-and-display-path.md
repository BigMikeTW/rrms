# ADR 0109 — 節點同時有 internal_id (UUID) + node_code (業主可變) + display_path (自動串接)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` 決議 F6 |
| Related ADR | ADR-0016, ADR-0076, ADR-0107, ADR-0108 |

## Context

業主經常會「重新編號」內部位置（如把「A棟」改名為「東棟」、戶號從 101 重編成 1F-01）。若系統用業主的 code 當主鍵，所有 audit_log（ADR-0076）、報修單外鍵會在改編號當下失效或須跨表 cascade update — 違反 append-only 紀律。但業主面對的 UI 必須顯示業主自己的 code，不能要求業主用 UUID 找位置。同時，操作 UX 需要顯示完整路徑（「業主 A / 東大樓 / 5F / 502 / 主臥」）給人類確認。

## Decision

每個位置節點同時保有三個欄位：

| 欄位 | 類型 | 來源 | 是否可變 | 用途 |
|---|---|---|---|---|
| `internal_id` | UUID | 系統產生 | **永不變** | 主鍵、外鍵、audit_log 引用 |
| `node_code` | text | 業主自訂 | 可變 | 業主 UI / 報表顯示、業主自家內部識別 |
| `display_path` | text | 自動串接 | 隨樹結構或 code 變動自動 recompute | 完整路徑 UX 顯示，分隔符 `/` |

`display_path` 由 trigger 或 application service 在 `node_code` 變更或父節點移動時 recompute（自動維護，業主不直接編輯）。

## Consequences

### ✅ 好處
- audit_log / 外鍵指向不變 UUID — 業主重編號不破壞歷史紀錄
- 業主仍見到自己熟悉的 code 與完整路徑
- display_path 加速人眼比對（無需 UI 端 recursive join）

### ⚠️ 代價
- 三欄位增加 schema 複雜度
- `display_path` 須在 code 變更或樹結構移動時更新（trigger 或 service layer 統一處理）
- 移動子樹時 descendant `display_path` 需 cascade update（單 transaction 完成）

### 🔮 未來影響
- Phase 2+ AI 派工以 internal_id 做 reference，避免業主重編號污染訓練資料
- export / import 工具須以 internal_id 為錨點，code 為人讀標籤

## References

- Brainstorm: `flexible-architecture-qa.html` 決議 F6
- Event sourcing append-only: ADR-0076
