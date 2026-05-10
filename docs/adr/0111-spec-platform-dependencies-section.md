# ADR 0111 — spec 必含「Platform Dependencies」章節，列出哪些功能用到 Vercel-specific

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `vendor-lockin-analysis.html` 決議 F8 |
| Related ADR | ADR-0110, ADR-0112, ADR-0113 |

## Context

ADR-0110 的 Hexagonal 紀律壓低了 lock-in，但「哪些功能實際上踩到 Vercel-specific 行為」這件事若不文件化，半年後遷移時須逆向工程整 codebase。Vercel 招牌新產品（Fluid Compute、Edge Config、AI Gateway、Sandbox、Workflow…）即使包在 adapter 內，介面語意也可能偷渡 Vercel-only 假設（如 streaming model、cold start 行為、function timeout 限制）。spec 是 RRMS 設計的單一真理源，必須誠實列出依賴清單。

## Decision

RRMS spec（`docs/superpowers/specs/*-design.md`）**必須含「Platform Dependencies」章節**，內容包含：

1. 列出所有 Vercel-specific 服務 / SDK 名稱
2. 每項對應的 RRMS 功能（如「PDF 報表生成 → Vercel Functions 300s timeout」）
3. 每項對應的 adapter port 名稱（ADR-0110）
4. 替代方案（若需遷移，能用什麼開源 / 自管 / 其他雲服務取代）
5. 預估遷移工作量（小時 / 天 / 週）

新功能引入新平台依賴時，spec PR 須同步更新該章節，由 `scripts/audit-docs.mjs` 檢核。

## Consequences

### ✅ 好處
- 平台依賴透明化 — 任何時點打開 spec 即知 RRMS 踩到哪些 Vercel 招牌
- 遷移時不必逆向工程，依清單逐項換 adapter
- 新功能引入時迫使設計者思考替代方案（自然抑制過度依賴）

### ⚠️ 代價
- spec 維護負擔增加（每新功能 +5-10 行）
- 替代方案評估須投入研究時間

### 🔮 未來影響
- 年度 review 時可量化 lock-in 比例變化（如從 7% 升到 12% 觸發紅線）
- Phase 2+ 多租戶 SaaS Enterprise 客戶可能要求看此章節作為採購評估

## References

- Brainstorm: `vendor-lockin-analysis.html` 決議 F8
- Vercel Platform docs: https://vercel.com/docs
