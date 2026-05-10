# ADR 0103 — 「AI 增強你的決策，不取代你的決策」— BigMike 最終 merge 裁決

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` § E 決議 E15 |
| Related ADR | ADR-0100, ADR-0101, ADR-0102 |

## Context

ADR-0100 / 0101 / 0102 引入大量 AI 工具與 agent 進入工作流，可大幅加速 review 與實作。但 AI 工具有 hallucination、有錯判、有 context 不全的盲點。若放任 AI 自動 merge，極易把錯誤決策上 production；且 RRMS 為 BigMike 個人創業項目，最終法律責任、商業責任、技術債由 BigMike 承擔。AI 角色須明確界定為「增強」而非「取代」決策。

## Decision

工作流紀律：**所有 AI review / 工具掃描結果以 PR comment 呈現給 BigMike，BigMike 做最終 merge 判斷；AI 不自動 merge**。

具體實作：

- Vercel Agent / Claude / GPT-5 / Snyk / SonarCloud 結果以 PR comment 形式集中
- GitHub branch protection rule 要求 PR 由 BigMike approve 才可 merge（不允許 auto-merge by bot）
- 例外：Plan 2-7 因屬執行性質可開 auto-merge（per `feedback_pr_flow.md`），但 Plan 1 + Plan 8（首尾關鍵）必須手動 merge
- 緊急情況（如 production 0-day）可由 BigMike 授權 AI 提出 hotfix，但 merge 仍由 BigMike 點擊

精神：**AI 是放大鏡與計算機，不是決策者**。

## Consequences

### ✅ 好處
- BigMike 對 production 始終有最終控制權
- 法律 / 商業責任歸屬清晰（BigMike 是 merge 點擊者）
- 防止 AI 自動引入錯誤決策（hallucination 防線）

### ⚠️ 代價
- BigMike 成為 merge 瓶頸（須每日處理 PR queue）
- 緊急 hotfix 速度受限於 BigMike 在線時間

### 🔮 未來影響
- 未來若團隊擴張，merge 權限可下放給其他人類成員，但仍不下放給 AI
- Phase 2+ 多租戶後此原則仍適用 — AI 提建議，人類 owner 決策

## References

- Brainstorm: `platform-rigorous-analysis.html` 決議 E15
- 記憶錨點: `feedback_pr_flow.md`（PR-based workflow）
- 記憶錨點: `feedback_no_overreach.md`（no over-inference）
- ADR-0102 多模型協作
- 對應 G section process discipline
