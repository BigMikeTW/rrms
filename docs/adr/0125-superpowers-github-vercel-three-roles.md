# ADR 0125 — superpowers / GitHub / Vercel 三方分工不重疊

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` 決議 G10 |
| Related ADR | ADR-0011, ADR-0012, ADR-0119, ADR-0122, ADR-0123, ADR-0124 |

## Context

RRMS 工作鏈涉及三個外部平台／工具集，職責若重疊或未定義，會出現「同樣的事在兩處設定，drift 後找不到 source of truth」。superpowers-toolkit brainstorm 鎖定三者各自唯一職責，禁止跨界。

## Decision

三方分工固定如下，**職責不重疊**：

| 平台 / 工具 | 唯一職責 | 範圍 |
|---|---|---|
| **superpowers** | Claude Code 的紀律與工作流 | brainstorming / plans / TDD / verification / review / worktree 等 9 項 skills（ADR-0122）；管「AI 怎麼做事」 |
| **GitHub** | source of truth + CI | Git repo、branch、PR、issue、GitHub Actions 6 道檢查（ADR-0123）；管「程式碼長什麼樣 + 過不過得了關」 |
| **Vercel** | CD + preview + production | git integration 自動 deploy、preview URL per PR（ADR-0124）、production deploy on merge to main、env vars、edge runtime；管「程式碼跑在哪」 |

跨界禁止例：
- GitHub Actions **不**做 deploy（交給 Vercel）
- Vercel **不**負責跑 lint / typecheck / npm audit（交給 GitHub Actions）
- superpowers skills **不**直接打 GitHub API 或 Vercel API（透過 Claude Code 標準 git / vercel CLI）

## Consequences

### ✅ 好處
- 任何問題定位明確：紀律問題查 skills、code 問題查 GitHub、deploy 問題查 Vercel
- 三平台各自更新時不會互相破壞（解耦）
- 對齊三平台官方推薦的最佳實踐（GitHub 主 source、Vercel 主 deploy、superpowers 主 AI 紀律）

### ⚠️ 代價
- BigMike 需熟悉三套介面（已透過 user memory 與 ADR 累積知識基礎）
- 跨界整合點（如 GitHub PR ↔ Vercel preview bot）若任一方故障需各自處理

### 🔮 未來影響
- 若引入新工具（如 Linear 取代 GitHub issue），需先評估會不會踩到既有三方職責
- Phase 2／3 引入 monitoring（Sentry ADR-0013）視為 Vercel 體系的延伸（runtime 觀測），不另開分工

## References

- `docs/superpowers/brainstorm/superpowers-toolkit.html`
- ADR-0011（GitHub + GitHub Actions）
- ADR-0012（Vercel git integration CD）
- ADR-0122（強制 superpowers skills）
- ADR-0123（GitHub Actions PR pipeline）
- ADR-0124（Vercel preview URL per PR）
