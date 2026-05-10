# ADR 0025 — MVP 聚焦業務線 2（大樓維保 100+ 棟）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `business-scope.html` 決議 B2 |
| Related ADR | ADR-0024, ADR-0026 |

## Context

三條業務線（ADR-0024）若同時上線會撐爆 Phase 1 範疇與工期。需要選擇一條作為 MVP，把流程、UI、合約、結帳、評分全部跑通，再把同一套框架套到其他業務線。

## Decision

**MVP = 業務線 2：終端客戶維保承攬（100+ 棟大樓）**。Phase 1 spec/plan/code 全部以此為唯一場景；業務線 1（原廠協作）與業務線 3（零售品牌）延後但會復用同一資料模型與 RBAC 框架。

## Consequences

- ✅ 範疇收斂、工期可控；BigMike 已有現成 100+ 棟客戶可立即上線驗證
- ⚠️ 業務線 1 的「原廠派單入口」Phase 1 不做，需走人工錄入暫代
- 🔮 Phase 2 加入業務線 1 時，contract / billing party 已預留欄位（ADR-0024 設計）

## References

- `docs/superpowers/brainstorm/business-scope.html`
