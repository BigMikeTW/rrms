# ADR 0101 — 重大版本前 /ultrareview 多 agent 雲端最終把關

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` § E 決議 E13; `platform-rigorous-analysis.html` 對應 |
| Related ADR | ADR-0100, ADR-0102, ADR-0103 |

## Context

ADR-0100 的 `/security-review` 處理常規 release 的安全面。但「重大版本」（首次上線、Phase 1 GA、多租戶啟用、結帳模組上線等）影響面遠大於常規 release，需更深入的多面向把關 — 不只 security，還含架構合理性、性能、UX、合規完整性。單一 agent / 單一 review 不夠。

## Decision

**重大版本前必須執行 `/ultrareview` skill** — 多 agent 雲端最終把關，至少涵蓋：

| 維度 | 負責 agent / 工具 |
|---|---|
| 架構與設計合理性 | Claude Opus（主寫）+ GPT-5 第二意見 |
| 安全 | `/security-review` baseline + Snyk 深度掃描 |
| 性能 | Vercel Speed Insights + bundle 分析 |
| UX | Playwright E2E + 視覺回歸 |
| 合規 | PDPA / ISO 27001 對照表審視 |
| 資料一致性 | `pnpm audit:docs` + ADR / spec / plan 引用對照 |

「重大版本」定義：(a) production 首次 deploy；(b) phase 1→2 切換；(c) 結帳 / 金流模組 GA；(d) 多租戶 RLS 啟用；(e) BigMike 主動標記為重大者。結果以 PR comment 集中呈現；BigMike 最終裁決（ADR-0103）。

## Consequences

### ✅ 好處
- 重大版本多維度把關，避免單一視角盲點
- 多 agent 互相 cross-check 降低 single-LLM hallucination 風險
- 對應 brainstorm G section process discipline

### ⚠️ 代價
- 每次 ultrareview 1-3 小時（含人工 review 結果）
- 多 agent / 多工具有 API 成本（GPT-5 / Snyk / 等）

### 🔮 未來影響
- Phase 2 多租戶啟用前必跑 ultrareview
- 累積後可建立 ultrareview checklist 模板

## References

- Brainstorm: `superpowers-toolkit.html` 決議 E13
- ADR-0100 release security review
- ADR-0102 多模型協作
- ADR-0103 AI 增強你的決策，不取代你的決策
