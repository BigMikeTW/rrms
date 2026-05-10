# ADR 0124 — 每 PR 自動 Vercel preview URL（LINE LIFF 即時測試）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` + `superpowers-toolkit.html` 決議 G9 |
| Related ADR | ADR-0012, ADR-0007, ADR-0119 |

## Context

ADR-0012 已鎖定 Vercel git integration 作為 CD 機制。本 ADR 進一步鎖定「每個 PR 自動產生 preview URL」這個能力為強制要求，並要求 preview 必須能在 LINE LIFF 中真實測試（因為 LINE 是 RRMS 主通道 ADR-0028）。

單人 + AI 模式無 staging environment 養護人力，preview-per-PR 是最務實的「準上線環境」替代方案。

## Decision

每個 PR 推到 GitHub 後，Vercel 自動產生獨立 preview URL：

- URL 形式：`<branch-slug>-rrms.vercel.app`（或自訂 preview domain）
- preview deployment 使用獨立的 preview env vars（與 production 隔離）
- preview URL 必須能在 LINE LIFF 中即時開啟（LIFF endpoint 設定為 `${PREVIEW_URL}/liff/...` 樣板）
- BigMike 在 merge 前必須在 preview URL 親自驗收：
  - 公開報修表單在手機瀏覽器
  - 後台在桌機瀏覽器
  - 技師端 PWA + LINE LIFF 在實機 LINE app

GitHub PR 頁面留言區必有 Vercel bot 自動貼出的 preview URL，未出現即視為 CD 異常。

## Consequences

### ✅ 好處
- 取代 staging environment：每個 PR 都是一次「準上線」測試
- LINE LIFF 整合在 merge 前真實驗證，避免上線後才發現 LIFF 環境差異
- BigMike 即使非工程背景也能用瀏覽器／手機直接驗收

### ⚠️ 代價
- preview deployments 增加 Vercel 用量（Pro plan 配額足夠 ADR-0014）
- preview env vars 維護成本：需維護 .env.preview 並透過 Vercel CLI / dashboard 同步

### 🔮 未來影響
- 若導入更多外部 webhook（如金流、簡訊），preview URL 需要對應的 webhook 環境（可能用 ngrok 或專屬 preview webhook 設定）
- Phase 2 多租戶啟用後，preview 環境需考慮如何 seed 多租戶測試資料

## References

- `docs/superpowers/brainstorm/platform-rigorous-analysis.html`
- `docs/superpowers/brainstorm/superpowers-toolkit.html`
- ADR-0012（Vercel git integration CD）
- ADR-0007（LINE Messaging API + LIFF）
- ADR-0028（LINE 主通道）
