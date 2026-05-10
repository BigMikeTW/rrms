# ADR 0064 — MVP 範圍鎖定為業務線 2（大樓維保 100+ 棟）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `business-scope.html` 決議 C1 |
| Related ADR | ADR-0024 |

## Context

ADR-0024 已鎖定 RRMS 三條業務線（原廠派案、大樓維保、零售品牌）。Phase 1 MVP 必須選擇單一業務線聚焦，否則 schema、UI、流程要兼顧三套不同的客戶 / 付款方 / 流程，會導致 MVP 上線時間無限延後。BigMike 現有 100+ 棟大樓維保合約為最穩定、最有現金流的業務線，最適合作為 MVP 切入點。

## Decision

Phase 1 MVP 範圍鎖定為**業務線 2（終端客戶維保承攬，100+ 棟大樓）**。MVP **不涵蓋**業務線 1（原廠派案）與業務線 3（零售品牌維保）。Schema 預留多業務支援欄位（per ADR-0024），但 Phase 1 程式邏輯、UI、報表、結帳僅針對業務線 2 實作。

## Consequences

- ✅ MVP 範圍可控，能在合理時程內上線並驗證商業模式
- ✅ 所有測試資料、流程、邊界條件聚焦單一業務線，品質可保證
- ⚠️ 業務線 1、3 的特殊需求（原廠回單、零售 SLA）暫不驗證，Phase 2 啟用前仍需另一輪 brainstorm
- 🔮 Phase 2 擴充至業務線 1、3 時，由於 schema 已預留，預期為「啟用旗標 + 補 UI」而非大規模改寫

## References

- `docs/superpowers/brainstorm/business-scope.html`
- ADR-0024 — 三條業務線範疇定義
