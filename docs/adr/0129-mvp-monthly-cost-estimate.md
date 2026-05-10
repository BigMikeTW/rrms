# ADR 0129 — MVP 月費預估三情境

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H4（soft — 評估） |
| Related ADR | ADR-0014, ADR-0126, ADR-0127 |

## Context

ADR-0126 鎖定 MVP 必註冊 7 平台 + ADR-0127 推薦 Sentry。BigMike 需要對「每月實際燒多少錢」有概念，方能（a）決定是否啟動 MVP、（b）對潛在合作業主開價時有成本底線。本 ADR 不鎖計畫變動，僅鎖三個情境下的預估值，供決策參考。

## Decision

MVP 月費依業主數量估算三情境（NT$，含 Vercel Pro 必、其餘 Free 起步）：

| 情境 | 業主數量 | 月費預估 | 主要成本來源 |
|---|---|---|---|
| A — 早期試運 | 1-3 業主 | **≈ NT$1,000** | Vercel Pro NT$640 + 域名 NT$30 + buffer |
| B — 小規模商轉 | 10-30 業主 | **≈ NT$2,650** | Vercel Pro + Neon Launch（量起）+ LINE 推播加購 |
| C — 滿載 | 100 業主 | **≈ NT$5,000-6,000** | Vercel Pro + Neon Scale + LINE + Sentry Team + Cloudflare 流量加購 |

實際數字依用量 + 匯率浮動；超出 ±20% 應 trigger ADR 修訂或開新 ADR。

## Consequences

### ✅ 好處
- BigMike 對成本有錨點，可對外報價時保留毛利空間
- 三情境 cover MVP 全生命週期，不必再次預估
- 強化「Free 層撐到何時」的決策可見性

### ⚠️ 代價
- 估算粗、未含金流手續費（Phase 2 才導入 — 見 ADR-0128）
- 匯率波動（US$ → NT$）會讓 Vercel Pro / Sentry / Anthropic 月費浮動

### 🔮 未來影響
- 🔮 **Soft estimate, may shift with usage** — 上線首 3 個月實測值出來後須重新校準
- 超情境 C → 進入 Phase 2 / Phase 3，須引入 ADR-0128 解凍平台，月費結構整體重估
- Anthropic API 用量隨 AI 派工（ADR-0070）四階段啟用快速增長 — 需獨立成本 ADR

## References

- Vercel Pricing: https://vercel.com/pricing
- Neon Pricing: https://neon.tech/pricing
- LINE Messaging API 推播計費: https://www.linebiz.com/tw/service/line-account-connect/
- Sentry Pricing: https://sentry.io/pricing/
- Cloudflare Plans: https://www.cloudflare.com/plans/
