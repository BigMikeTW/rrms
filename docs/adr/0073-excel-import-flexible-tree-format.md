# ADR 0073 — Excel 匯入彈性樹格式（parent_code + node_code）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` 決議 C10 |
| Related ADR | ADR-0072 |

## Context

ADR-0072 確認用 Excel 匯入主檔，但 Excel 格式有兩個選項：
- (a) 固定 5 欄（owner / building / floor / unit / room）— 直觀但無法表達不規則樹（如某些業主沒有 floor 層）
- (b) `parent_code + node_code` 一行一節點（adjacency list）— 可表達任意樹，無位數限制

Brainstorm `flexible-architecture-qa` 結論為 (b)，理由：
1. 大樓結構不規則（地下室、機電房、共用設施不一定走 floor → unit → room）
2. 未來業務線 1、3 可能完全不用 5 層樹
3. (b) 格式可直接對應 ltree 或 closure table

## Decision

Excel 匯入彈性樹採**選項 (b)**：

| 欄位 | 說明 |
|---|---|
| `parent_code` | 父節點代碼（root 留空） |
| `node_code` | 本節點代碼（同 parent 下唯一） |
| `node_type` | owner / building / floor / unit / room / ...（從 catalog 取） |
| `name` | 顯示名稱 |
| `metadata` | jsonb（per ADR-0071 彈性 schema） |

**不採**固定 5 欄格式。

## Consequences

- ✅ 任意深度、任意拓撲樹皆可表達（地下室、機電房、共用設施）
- ✅ 對應 ltree / closure table 資料庫設計，無轉換損耗
- ⚠️ 樓管填 Excel 時需理解 parent_code 概念（提供範例與校驗工具降低門檻）
- 🔮 Phase 2 加入業務線 1、3 時不需改匯入格式；新節點類型加 catalog 即可

## References

- `docs/superpowers/brainstorm/flexible-architecture-qa.html`
- ADR-0071 — AI 三道地基（彈性 schema 紀律）
- ADR-0072 — 第一波資料匯入策略
