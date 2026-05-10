# ADR 0107 — 彈性架構選方案 2：彈性樹 + 預設 type 庫 + 可組態角色

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html` 決議 F4 |
| Related ADR | ADR-0016, ADR-0106, ADR-0108, ADR-0109 |

## Context

不同業主的組織與物理結構差異極大：物業公司有「集團 → 子公司 → 園區 → 大樓」、單一辦公室業主只有「業主 → 樓層 → 戶」、工廠業主有「業主 → 廠區 → 設備區」。三套候選：

1. **方案 1（固定 schema）** — 寫死五層，業主結構不符就硬塞，未來擴張時 schema migration 成本高
2. **方案 2（彈性樹 + 預設 type 庫 + 可組態角色）** — 樹結構任意 nested、每節點 `node_type` 從預設庫挑選、角色可新增並綁 node_type
3. **方案 3（完全自由 schema）** — 每業主自定欄位/型別，AI 派工 / 跨業主分析無法共用 schema，知識庫價值消滅

## Decision

採 **方案 2：彈性樹 + 預設 type 庫 + 可組態角色**。

- 樹結構任意深度（PostgreSQL ltree, ADR-0016）
- 每節點有 `node_type` 欄位，值從**預設 type 庫**（ADR-0108）挑選
- 角色（如「大樓總幹事」「樓管」）可新增，並綁定到一或多種 `node_type`
- **不選方案 1**（剝奪業主結構彈性）；**不選方案 3**（消滅 AI 跨業主學習能力）

## Consequences

### ✅ 好處
- 結構彈性：物業 / 辦公 / 工廠業主皆可表達
- 預設 type 庫保留語意一致性 — AI 派工與知識庫仍能跨業主學習
- 角色可組態，不必每次新業主就改 code

### ⚠️ 代價
- 任意樹必依 `node_type` 自我描述；UI 顯示邏輯比固定 schema 複雜
- 預設 type 庫的擴增須走 ADR + migration（小成本，但有紀律）

### 🔮 未來影響
- Phase 2+ 跨業主 AI 知識庫（ADR-0070）可用 `node_type` 做語意分群
- 自定 type 在 Phase 3 Enterprise tier 開放（Phase 1-2 鎖定預設庫）

## References

- Brainstorm: `flexible-architecture.html` 決議 F4
- PostgreSQL ltree: https://www.postgresql.org/docs/current/ltree.html
