# ADR 0024 — 三條業務線範疇定義

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `business-scope.html` 決議 B1 |
| Related ADR | ADR-0025 |

## Context

RRMS 從早期討論曾被誤解為單一業務型態（例如純客服平台或純報修工單）。實際上 BigMike 的事業包含三條業務線，各自的客戶、付款方、流程都不同；若不在 ADR 鎖定範疇，schema 與權限模型會被錯誤地針對單一業務切。

## Decision

RRMS 服務範疇明確為三條業務線：

1. **協助原廠報修服務** — 終端客戶找原廠 → 原廠派單給我方 → 跟原廠請款
2. **終端客戶維保承攬**（100+ 棟大樓）— 我方直接與業主簽合約 → 跟終端客戶請款（**MVP 焦點**）
3. **零售品牌維保**（未來）— 第三階段擴充

## Consequences

- ✅ Schema 設計（合約、結帳對象、技師派工來源）一開始就考慮多業務型態，避免 Phase 2 大改
- ⚠️ 增加初期建模複雜度（contract 表需支援多種 billing party）
- 🔮 業務線 1、3 後續套用同一框架（B2），但 Phase 1 只實作業務線 2

## References

- `docs/superpowers/brainstorm/business-scope.html`
