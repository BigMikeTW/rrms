# ADR 0116 — 開發資源 = BigMike + Claude Code（純單人 + AI，零委外）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 G1（與 `platform-comparison.html` 對照） |
| Related ADR | ADR-0117, ADR-0118, ADR-0014 |

## Context

q9 brainstorm 列了三種人力配置選項（A 純自建、B 人力外包、C AI 輔助 + 少量委外）。BigMike 為非工程背景產品擁有者，無內部 RD 團隊，亦無預算長期外包。實際運作上，整個 MVP 由 BigMike 一人負責產品決策與流程，Claude Code 作為 AI 工程實作助手；委外比例為零。

此決議影響後續所有「人力／時程／預算／治理」相關 ADR。

## Decision

RRMS MVP 開發資源結構固定為：

- **唯一人類成員**：BigMike（非工程背景 PM，負責 brainstorm／決策／驗收／與外部廠商接洽）
- **唯一工程實作者**：Claude Code（AI 助手，負責寫程式／測試／文件／PR）
- **委外比例**：0%（不外包任何模組、不雇 freelancer）
- **重大決策權**：100% 由 BigMike 保留；AI 提建議，但 hard 決議寫入 brainstorm／ADR 必須經 BigMike 確認

q9 原 C 選項描述「AI 輔助 + 少量委外」中的「少量委外」部分推翻為零。

## Consequences

### ✅ 好處
- 決策鏈最短：無溝通成本、無對齊會議、無等待外包交付
- 成本可預測：無人力外包費用，僅 Claude Code 訂閱費 + 平台費
- 知識集中：所有決議都經 BigMike 確認，半年後仍可追溯

### ⚠️ 代價
- BigMike 個人時間成為唯一瓶頸 → 必須靠紀律（ADR-0120 atomic plan、session 切分）撐起品質
- 無人類同儕審查 → 必須靠 GitHub Actions（ADR-0123）+ ultrareview / security-review skill 補位
- 一旦 BigMike 不在線，專案完全停擺（單點風險）

### 🔮 未來影響
- Phase 2／3 若要擴張，將是「新增 AI agent role」優先於「找人類工程師」
- 預算估算邏輯（ADR-0118）以「BigMike 自身時間 + 平台月費」為基準，q9 原金額選項作廢

## References

- `docs/superpowers/brainstorm/q9-quick-decisions.html`
- `docs/superpowers/brainstorm/platform-comparison.html`
- ADR-0014（Vercel Pro plan 月費基準）
