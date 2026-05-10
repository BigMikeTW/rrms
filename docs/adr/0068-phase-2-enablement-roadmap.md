# ADR 0068 — 第二階段啟用功能路線圖

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html`, `platform-registration.html` 決議 C5 |
| Related ADR | ADR-0066, ADR-0067, ADR-0074 |

## Context

ADR-0066 列出 MVP 排除清單，但部分功能在 Phase 2（多租戶 SaaS 化、客戶數規模化）必定要啟用。本 ADR 鎖定 Phase 2 啟用清單，作為 Phase 1 結束後的 brainstorm 入口。

## Decision

Phase 2 啟用以下功能（順序由 Phase 2 brainstorm 細化）：

1. **技師 onboarding 自動化合約 + 電子簽**
2. **客戶端評分**（補足 MVP 僅有內部評分的缺口）
3. **A4 升級為合法電簽**（取代 MVP 階段的 PDF 簽名圖檔）
4. **電子發票 API 自動化**
5. **自動低評分 review**（評分觸發再審流程）
6. **Tinybird 深化分析**（per ADR-0074 — 100 業主滿載前不啟用）
7. **排程 email 報表**

## Consequences

- ✅ Phase 1 收尾時可清楚看見「下一階段做哪 7 件事」，避免方向迷失
- ⚠️ Phase 2 仍需逐項建 ADR + plan；本 ADR 僅是路線圖，非實作規範
- 🔮 **Soft commitment, scope/timing may shift** — 順序與時程依 Phase 1 上線後實際使用回饋調整；個別項目可能被 Phase 3 吸收或合併

## References

- `docs/superpowers/brainstorm/contract-and-dynamic-rate.html`
- `docs/superpowers/brainstorm/platform-registration.html`
- ADR-0066 — MVP 排除清單
- ADR-0067 — schema 預留欄位
- ADR-0074 — Tinybird / Clerk Pro 啟用門檻
