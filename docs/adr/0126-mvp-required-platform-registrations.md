# ADR 0126 — MVP 必註冊平台清單與計畫層級

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H1（hard） |
| Related ADR | ADR-0001, ADR-0003, ADR-0007, ADR-0010, ADR-0011, ADR-0014, ADR-0071 |

## Context

RRMS Phase 1 MVP 為商業 production 部署（收費場景），所有第三方 SaaS 必須在開發前完成帳號註冊，並選對計畫層級。Hobby / 個人計畫多含 TOS 商用限制（如 Vercel Hobby 禁商用 — ADR-0014），若選錯層級會在上線後被停權或踩到法規風險。BigMike 為非工程背景，需一份明確「現在就去註冊」的清單，避免逐步建構過程中卡關。

## Decision

MVP 開發前 **必註冊** 以下 7 個平台，按指定計畫層級開帳號：

| # | 平台 | 計畫 | 用途 | 相關 ADR |
|---|---|---|---|---|
| 1 | GitHub | Free | 程式碼倉庫 + Actions CI | ADR-0011 |
| 2 | Vercel | **Pro（必）** US$20/seat/月 | Hosting + Functions + Cron | ADR-0014 |
| 3 | Neon | Free 起步（商用 OK） | Postgres 主資料庫 | ADR-0003 |
| 4 | Cloudflare | Free | DNS + CDN + DDoS（全可商用） | ADR-0010 |
| 5 | 域名註冊商 | Cloudflare Registrar 建議（at-cost） | `pro080.com` 持有 | ADR-0130 |
| 6 | LINE Developers | Free（200 推播 / 月） | Messaging API + LIFF | ADR-0007 |
| 7 | Anthropic API | 既有帳號 | Claude API（AI 派工 — Phase 2，但 key 先備） | ADR-0071 |

任何項目缺註冊或選錯層級 → 視為 Plan 1 阻塞項，PR 不得 merge。

## Consequences

### ✅ 好處
- 上線前帳號齊備、無臨時卡關
- Vercel Pro 合規（避開 Hobby TOS 商用禁令）
- Cloudflare / Neon / LINE Free 層即可滿足 MVP 流量，零起步成本

### ⚠️ 代價
- 固定月費 ≈ NT$640（Vercel Pro 1 seat）+ 域名 NT$30/月攤
- 7 個帳號 + 雙因素驗證 + 帳單卡片 → 對非工程背景使用者管理負擔不小

### 🔮 未來影響
- 用量超 Free 層 → Neon Launch / LINE 加購 / Cloudflare Pro 視 ADR-0129 預估觸發
- Anthropic API 啟用時間視 ADR-0070（AI 派工 four-phase roadmap）

## References

- Vercel Pricing: https://vercel.com/pricing
- Neon Pricing: https://neon.tech/pricing
- Cloudflare Plans: https://www.cloudflare.com/plans/
- LINE Messaging API Pricing: https://www.linebiz.com/tw/service/line-account-connect/
- GitHub Free: https://github.com/pricing
- Anthropic API: https://www.anthropic.com/api
