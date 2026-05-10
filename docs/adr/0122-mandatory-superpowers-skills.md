# ADR 0122 — 強制使用 9 項 superpowers skills

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` 決議 G7 |
| Related ADR | ADR-0119, ADR-0120 |

## Context

Claude Code 環境提供 superpowers skills 套件，其中部分 skills 是「治理／紀律 enforcer」（如 verification-before-completion、systematic-debugging），缺它們等於缺 review 機制。superpowers-toolkit brainstorm 列出 9 項對 RRMS 工作流缺一不可的 skill，明定為「強制」而非「建議」。

## Decision

RRMS 開發工作流強制使用下列 9 項 superpowers skills；任何 plan / PR / commit 缺對應 skill 啟動視為違反紀律：

| # | Skill | 用途 |
|---|---|---|
| 1 | `superpowers:brainstorming` | 7 步循環第 1 步：探索需求、鎖定 hard 決議 |
| 2 | `superpowers:writing-plans` | 7 步循環第 2 步：產出 atomic step plan |
| 3 | `superpowers:executing-plans` | 7 步循環第 4 步外殼：依 plan 逐步執行 + checkpoint |
| 4 | `superpowers:test-driven-development` | TDD 紀律：先測試再實作 |
| 5 | `superpowers:verification-before-completion` | commit 前驗證：證據優先於斷言 |
| 6 | `superpowers:systematic-debugging` | 任何 bug / 測試失敗 / 異常先用此 skill 結構化分析 |
| 7 | `superpowers:requesting-code-review` | 自審 + PR review |
| 8 | `superpowers:finishing-a-development-branch` | merge 前的整合決策（merge / PR / cleanup） |
| 9 | `superpowers:using-git-worktrees` | 重大架構變更時隔離 workspace |

對應 ADR-0119（7 步循環）與 ADR-0120（第 3、5、6 條紀律）的具體執行載體。

## Consequences

### ✅ 好處
- skills 套件已內建「拒絕跳步」邏輯 → 即使 Claude Code 在 long-context 想偷懶，skill 本身會阻擋
- 9 項覆蓋 brainstorm → plan → execute → review → finish 全鏈
- skill 名稱可直接被 Claude Code 識別 → ADR-0120 第 1 條的紀律 preamble 寫起來簡潔

### ⚠️ 代價
- skills 套件版本更新時需重新驗證 → 必要時開新 ADR 紀錄
- 學習成本：BigMike 需理解每個 skill 觸發時機（已透過 user memory 與 plan preamble 補強）

### 🔮 未來影響
- 若 superpowers 套件新增關鍵 skill（如新增 security-review-skill），開新 ADR superseding 本 ADR
- 若某 skill 被官方廢棄，須立即評估替代方案，不得「忽略」紀律

## References

- `docs/superpowers/brainstorm/superpowers-toolkit.html`
- ADR-0119（端到端 7 步循環）
- ADR-0120（7 條 AI 治理紀律）
