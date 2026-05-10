# ADR 0105 — 架構部署形態採 Cloud SaaS（不自管雲、不內部部署）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 F2 |
| Related ADR | ADR-0001, ADR-0003, ADR-0014, ADR-0104 |

## Context

部署形態三選一：(i) **Cloud SaaS** — 由 RRMS 在 Vercel + Neon 上跑單一 multi-tenant deployment，業主只用瀏覽器/LINE 連線；(ii) **自管雲** — 業主在自己 AWS/GCP 帳號內部署 RRMS instance（高客製、運維成本線性上升、Phase 1 不可行）；(iii) **內部部署 (on-prem)** — 業主機房自架，與 Vercel / Neon serverless 模型衝突。RRMS 客群為中小型物業/工務團隊，預算與 IT 能力不足以負擔自管，且本系統的價值在於跨業主共用 AI 派工 / 知識庫（ADR-0070）— 內部部署直接消滅該價值。

## Decision

RRMS 採 **Cloud SaaS** 模式：單一 multi-tenant production deployment，以 owner_id + RLS（ADR-0089）做資料隔離；所有業主共用同一 codebase / infra；不提供 on-prem 或客戶自管雲版本（Phase 1-3 範圍內）。

## Consequences

### ✅ 好處
- 單一 deployment 服務多業主，運維成本不隨租戶線性上升
- AI / 知識庫可跨業主匯聚（去識別化後，依 ADR-0075 PDPA 規範）
- 升級 / patch 一次到位

### ⚠️ 代價
- 業主資料存於 RRMS 控制的 Neon DB — PDPA 角色為「受託處理者」（ADR-0075）
- 跨租戶洩漏風險集中 — 必依賴 RLS（ADR-0089）作為硬邊界

### 🔮 未來影響
- Phase 3 Enterprise tier 可考慮 Silo 模式（單一業主獨立 DB）作為升級路徑，仍屬 SaaS 範疇
- 不接受任何 on-prem 客製需求；如有需求轉為單獨產品線

## References

- AWS SaaS Lens: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/
- Brainstorm: `q9-quick-decisions.html` 決議 F2
