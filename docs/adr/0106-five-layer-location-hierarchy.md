# ADR 0106 — 五層位置 hierarchy + contract / contract_coverage 獨立掛載

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `location-and-coverage-v2.html` 決議 F3 |
| Related ADR | ADR-0016, ADR-0089, ADR-0107, ADR-0108 |

## Context

維修報修必須能定位到具體位置，並判斷該位置是否在某份合約的服務範圍內。腦力激盪比對 v1（位置與 coverage 混在同一棵樹）vs v2（位置樹獨立、coverage 用多對多 mapping 表掛在任意節點）。v1 在「同一單位被多份合約涵蓋（如保固期 + 後續年約重疊）」時無法表達；v2 解耦後 contract 可掛在任意節點層級（業主級、大樓級、甚至單一戶級）並支援多對多。

## Decision

採 **五層位置 hierarchy**：`owner → building → floor → unit → sub_unit`。

- `owner` 為多租戶頂層 namespace（對應 owner_id，ADR-0089 RLS 過濾依據）
- `building → floor → unit → sub_unit` 為實體空間定位
- `contract` 與 `contract_coverage`（多對多 mapping table）獨立於位置樹，可掛載至任意層級節點
- 任意樹的彈性靠 ADR-0107（彈性樹 + 預設 type 庫）實現；本 ADR 鎖定的是**頂層必含五層概念**

## Consequences

### ✅ 好處
- owner 為頂層命名空間，多租戶隔離清楚
- contract 可彈性掛載（業主整包 / 單棟 / 單戶），保固期 + 年約重疊可表達
- 支援子空間（如戶內主臥/客廳）與設備區（公共設施區域）

### ⚠️ 代價
- coverage 解析需 join `contract_coverage` + 沿樹回溯（用 ltree `<@` operator，ADR-0016）
- 頂層五層為固定**概念**；不允許砍掉（如「沒有大樓」業主仍須掛 dummy building 或用 sub_unit）

### 🔮 未來影響
- Phase 2+ 多業主、多集團場景下，owner 之上可能需 group/集團 概念 — 由 ADR-0107 預設 type 庫已含「集團」項處理
- AI 派工（ADR-0070）可基於 hierarchy 做地理鄰近匹配

## References

- PostgreSQL ltree: https://www.postgresql.org/docs/current/ltree.html
- Brainstorm: `location-and-coverage-v2.html` 決議 F3
