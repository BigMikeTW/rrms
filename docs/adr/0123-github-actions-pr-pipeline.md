# ADR 0123 — GitHub Actions PR pipeline（lint / typecheck / test / build / audit / secret scan）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` 決議 G8 |
| Related ADR | ADR-0011, ADR-0119, ADR-0125 |

## Context

ADR-0011 已鎖定 GitHub + GitHub Actions 為 source + CI 平台。本 ADR 進一步鎖定 PR pipeline 必須包含的 6 道檢查項目，避免任何 PR 在「沒跑完整檢查」狀態下被 merge（單人 + AI 模式無法靠人類 reviewer 補位，CI 是最後一道防線）。

## Decision

每個 PR 推到 GitHub 後，GitHub Actions 必跑以下 6 道檢查，任一失敗即阻擋 merge：

1. **lint**：ESLint + Prettier，依 `docs/CODING_STANDARDS.md` 規則
2. **typecheck**：`tsc --noEmit`（TypeScript 嚴格模式）
3. **test**：單元測試 + 整合測試（依 ADR-0122 第 4 項 TDD 紀律累積）
4. **build**：Next.js build（驗證 production build 不會在 deploy 階段才爆）
5. **npm audit**：`pnpm audit --audit-level=high`，high / critical 漏洞阻擋
6. **secret scanner**：trufflehog（或同類工具）掃描 commit diff，避免 API key／密碼／token 漏入

PR 必須通過全部 6 道才可 merge to main；merge 後由 Vercel 自動 deploy（ADR-0125）。

## Consequences

### ✅ 好處
- 6 道檢查覆蓋程式碼品質、型別、測試、可建置性、安全漏洞、機密外洩五大風險
- 與 ADR-0119 7 步循環第 6 步無縫銜接
- secret scanner 對單人模式特別關鍵（沒有 reviewer 替你看 diff）

### ⚠️ 代價
- 每個 PR 跑 CI 需消耗 GitHub Actions 配額（GitHub 免費方案有限額；必要時升級）
- trufflehog false positive 偶爾會誤判 → 需要維護 ignore 規則

### 🔮 未來影響
- 增加新檢查項（例如 accessibility audit、E2E 跑 Playwright）需新開 ADR 或修訂本 ADR
- 若某項檢查長期 false positive 過多，須以 ADR 評估替換工具，不得直接停用

## References

- `docs/superpowers/brainstorm/superpowers-toolkit.html`
- ADR-0011（GitHub + GitHub Actions）
- ADR-0125（Vercel CD pipeline）
- `docs/CODING_STANDARDS.md`
