# ADR 0117 — MVP 上線時程 = 6-7 個月標準節奏

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `migration-and-ai-governance.html` 決議 G2（與 `q9-quick-decisions.html` 對照） |
| Related ADR | ADR-0116, ADR-0118, ADR-0064, ADR-0065 |

## Context

q9 列了 3／6／12 個月三種時程選項。RRMS MVP 範圍（ADR-0064 / ADR-0065）涵蓋公開報修表單、後台派工、LINE 整合、技師端 PWA、評分結算、稽核日誌、多租戶地基等 7 大塊；以 BigMike + Claude Code 單線程節奏（ADR-0116），3 個月過短、12 個月會失去市場節奏。

migration-and-ai-governance brainstorm 評估後選定中段節奏。

## Decision

RRMS MVP 上線時程目標 = **6-7 個月**（自 Phase 1 spec 鎖定日起算），完整涵蓋本次 brainstorm 所有 MVP 範圍（ADR-0064 / 0065 / 0066 定義的 in-scope / out-of-scope 邊界）。

時程結構：
- 月 1-2：Phase 1 平台地基（Auth、DB、租戶、稽核）
- 月 3-4：Phase 2 核心業務流（報修 → 派工 → 結案 → 評分）
- 月 5：Phase 3 LINE 整合 + 技師 PWA
- 月 6：Phase 4 結算 + 報表 + 對帳
- 月 7：UAT、PDPA 法務驗收、上線緩衝

## Consequences

### ✅ 好處
- 時程足夠 BigMike 用 atomic plan 紀律（ADR-0120）穩步推進，不必走捷徑跳過 TDD
- 涵蓋本次 brainstorm 全部 hard 決議，無「砍範圍上線」壓力
- 對齊 Vercel Pro 月費 6 期預算（ADR-0118）

### ⚠️ 代價
- 比 3 個月選項晚上線 3-4 個月 → 期間市場需求可能變動
- BigMike 個人持續投入 6-7 個月 → 中途若中斷會嚴重 delay

### 🔮 未來影響
- 6-7 個月內任何延遲必須以 ADR 紀錄延遲原因，避免時程估算經驗流失
- Phase 2／3 roadmap（ADR-0068 / 0069 / 0070）以 MVP 上線後為起點規劃

## References

- `docs/superpowers/brainstorm/migration-and-ai-governance.html`
- `docs/superpowers/brainstorm/q9-quick-decisions.html`
- ADR-0064, ADR-0065, ADR-0066（MVP 範圍）
