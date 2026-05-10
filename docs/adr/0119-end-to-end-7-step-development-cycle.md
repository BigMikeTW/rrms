# ADR 0119 — 端到端 7 步開發循環（brainstorm → plan → branch → TDD → self-review → PR → merge）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` 決議 G4 |
| Related ADR | ADR-0120, ADR-0121, ADR-0123, ADR-0124, ADR-0125 |

## Context

單人 + AI 開發（ADR-0116）最大風險是「skip 流程、直接寫」。一旦 Claude Code 沒有強制工作流，會出現：跳過 brainstorm 直接寫 plan、跳過 plan 直接寫 code、commit 沒跑驗證、PR 沒過 review 就 merge。這類 drift 在過去 sessions 已經被 consistency-audit 與 pre-Plan-2 audit 發現多起（見 ADR-0000 Context）。

superpowers-toolkit brainstorm 鎖定「強制 7 步循環」作為治理骨架。

## Decision

任何 feature／bugfix／重構皆採以下 7 步循環，缺一不可：

1. **brainstorm**：使用 `superpowers:brainstorming` skill，鎖定 hard 決議寫入 brainstorm HTML
2. **writing-plans**：使用 `superpowers:writing-plans` skill，產出 atomic step 的 markdown plan
3. **開分支（or worktree 隔離）**：依 ADR-0120 第 3 條紀律決定是否走 worktree（重大架構必走）
4. **TDD 執行**：先寫測試（`superpowers:test-driven-development`）→ 實作 → `superpowers:verification-before-completion` → review → commit
5. **自審**：使用 `superpowers:requesting-code-review` 對自己的 commit 做 self-review
6. **Push + PR**：推到 GitHub，自動觸發 GitHub Actions CI（ADR-0123）+ Vercel preview（ADR-0124）；重大功能跑 `/ultrareview`，敏感（auth／PII／billing）跑 `/security-review`
7. **Merge to main**：使用 `superpowers:finishing-a-development-branch` 完成；Vercel 自動 deploy 至 production（ADR-0125）

## Consequences

### ✅ 好處
- 任何 feature 都有完整 brainstorm 證據鏈 → 半年後可追溯
- TDD 強制 → 回歸測試自動累積
- preview URL 強制 → BigMike 在 merge 前可在 LINE LIFF 真實環境驗收

### ⚠️ 代價
- 每個 feature 至少 7 步，無法走捷徑 → 短期速度比「直接寫」慢
- 紀律疲勞風險：BigMike 可能想跳步 → 必須靠 ADR-0120 第 1 條（每個 plan 開頭重申紀律）對抗

### 🔮 未來影響
- 任何 PR 缺少前 5 步任一環節 → CI 應拒收（pre-commit / PR template 檢核）
- Phase 2／3 引入新 AI agent role（如 designer agent）也必須走相同 7 步

## References

- `docs/superpowers/brainstorm/superpowers-toolkit.html`
- ADR-0120（7 條 AI 治理紀律）
- ADR-0122（強制 superpowers skills 清單）
