# ADR 0066 — MVP 明確排除清單

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html`, `q8-approval-billing-query.html` 決議 C3 |
| Related ADR | ADR-0065, ADR-0068 |

## Context

僅列「做什麼」不夠；必須明列「不做什麼」才能擋住開發中途的 scope creep。本 ADR 為 ADR-0065 的對偶 — 鎖定 MVP 階段**禁止實作**的功能。

## Decision

MVP **不做**以下功能（每項皆為 hard 排除）：

1. **AI 派工**（per ADR-0070 第①階段為純人工）
2. **技師合約自動化**（onboarding、電子簽）
3. **動態費率**（per ADR-0067 schema 預留但 MVP 不啟用）
4. **線上考核 / 內稽考試系統**
5. **KYC**（客戶身分驗證流程）
6. **客戶端評分**（僅有內部 4 維度評分，per ADR-0065）
7. **多關簽核**（A1-A4 四段為固定流程，無動態多級審批）
8. **完整應收帳款（AR）模組**
9. **電子發票自動化**（API 串接）
10. **客戶端 BI 工具**（C3 — 客戶自助分析介面）
11. **排程 email 報表**

## Consequences

- ✅ scope 邊界清晰，PR review 時可直接以本 ADR 拒絕越界 PR
- ⚠️ 部分需求（電子發票、AR）會以「人工流程 + 半自動」過渡，Phase 2 才補完
- 🔮 排除項目在 Phase 2、Phase 3 啟用時需另開 ADR；本 ADR 不被 superseded（僅階段性適用）

## References

- `docs/superpowers/brainstorm/contract-and-dynamic-rate.html`
- `docs/superpowers/brainstorm/q8-approval-billing-query.html`
- ADR-0065 — MVP 功能集
- ADR-0068 — 第二階段啟用功能
