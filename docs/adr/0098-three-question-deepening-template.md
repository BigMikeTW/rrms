# ADR 0098 — 模組設計用「三題深化模板」（業務指標 / 行為分析 / 預測性）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `per-module-audit-analytics.html` § E 決議 E10; `q7-dispatch-technician.html` 對應 |
| Related ADR | ADR-0097 |

## Context

每個模組（報修、派工、合約、結帳⋯）若只實作 CRUD + 業務流程，會缺少「事後可分析、可預警、可預測」的視角，事後再補成本高且資料不齊。需要設計階段就強制思考分析需求，但又要避免每模組都做完整 BI（過度工程）。

## Decision

每個模組設計時必填「三題深化模板」：

1. **業務指標（KPI / SLA / 趨勢）** — 此模組對應的關鍵指標是什麼？例：派工模組 → 派工平均回應時間、SLA 達成率
2. **使用者行為分析** — 哪些使用者操作要被追蹤以理解使用模式？例：哪些報修最常 escalate？
3. **預測性分析** — 是否有前置指標可預警？例：技師工作量飽和度預警

優先級分配：

- **MVP 階段** — 派工模組業務指標（①）納入。其他模組僅留 audit_log（ADR-0076）作為原料。
- **第二階段** — 各模組業務指標 + 使用者行為分析。
- **第三階段** — 預測性分析（含 AI 模型）。

## Consequences

### ✅ 好處
- 設計階段強制思考分析維度，audit_log 欄位設計時就齊全
- 分階段交付避免一次做太大
- 派工模組 MVP 即有業務指標，行銷 / 客戶 review 有數字可秀

### ⚠️ 代價
- 每模組設計多花 30-60 分鐘填模板
- 第二 / 三階段才能看到完整分析價值，短期 ROI 不明顯

### 🔮 未來影響
- ADR-0097 分析層上線後解鎖第二 / 三階段分析儀表板
- 可作為 module review checklist（plan PR 模板加入此三題）

## References

- Brainstorm: `per-module-audit-analytics.html` 決議 E10
- Brainstorm: `q7-dispatch-technician.html` 派工模組 KPI
- ADR-0097 雙層 audit 儲存
