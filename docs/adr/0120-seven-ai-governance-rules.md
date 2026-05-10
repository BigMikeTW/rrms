# ADR 0120 — 7 條 AI 治理紀律（每個 plan 開頭強制重申）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `migration-and-ai-governance.html` 決議 G5 |
| Related ADR | ADR-0116, ADR-0119, ADR-0122 |

## Context

migration-and-ai-governance brainstorm 檢視前期 sessions 後識別出 7 個重複出現的 AI 失控模式（直接寫 code、step 過大、未隔離大改動、session 過長、PR 沒 review、commit 沒 verify、缺乏整體健康度檢查）。為避免每次 session 重新犯錯，鎖定 7 條紀律作為「治理憲法」。

## Decision

下列 7 條紀律為強制要求，**每個 plan 文件開頭必須重申一次**（防止 Claude Code 在 long-context session 中遺忘）：

1. **強制三段式**：每個 feature 必經 brainstorm → plan → execute 三階段，不允許「直接寫 code」
2. **Plan 步驟原子性**：每步 ≤ 30 分鐘 + ≤ 1 個檔案 + ≤ 1 個邏輯單元；不可合併步驟
3. **大改架構必開 worktree**：跨多個套件 / 跨層架構 / 重構主流程 → 強制使用 `superpowers:using-git-worktrees`（亦見 ADR-0122）
4. **Session 長度上限**：單一 session 工作 < 90 分鐘 **OR** 累計 5-7 個檔案改動就切新 session（防 context 污染與決策疲勞）
5. **每個 PR 強制 review**：重大功能跑 `/ultrareview`；小改動跑 `superpowers:requesting-code-review`；無 review 不得 merge
6. **所有 commit 必跑 verification-before-completion**：使用 `superpowers:verification-before-completion`，禁止「想當然」式 commit
7. **每週健康度檢查**：每週用 `superpowers:systematic-debugging` 心態通讀整個專案一次（spec／plan／ADR／code 是否仍對齊）

## Consequences

### ✅ 好處
- 7 條紀律組合對應前期所有已知失控模式 → 大幅降低 drift
- 在 plan 開頭重申 → Claude Code 無論進入哪個 session 都能立即就位
- 第 4 條（session 切分）對抗 long-context 模型在後段 token 衰退的現象

### ⚠️ 代價
- 每個 plan 多出「紀律 preamble」段落 → 文件變長
- 第 4 條切 session 會中斷工作節奏 → 必須靠 handoff 文件（user memory `feedback_session_handoff.md`）銜接

### 🔮 未來影響
- 任何違反紀律的 commit 應在 PR review 中被擋下 → 累積成 PR template checklist
- 紀律若隨經驗演化（例如新增第 8 條），新開 ADR superseding 本 ADR，不直接改本文

## References

- `docs/superpowers/brainstorm/migration-and-ai-governance.html`
- `MEMORY.md` → `feedback_session_handoff.md`
- ADR-0122（強制 superpowers skills 清單）
