# ADR 0007 — LINE 整合採用 LINE Messaging API + LIFF

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 A7; `user-tiers.html` |
| Related ADR | — |

## Context

RRMS Phase 1 必含 LINE 整合：(a) 民眾透過 LINE 提交維修申請；(b) 派工通知工務人員；(c) 工務人員回填進度。LINE 提供兩個層級：Messaging API（webhook + push / reply）與 LIFF（LINE Front-end Framework — 在 LINE app 內開啟 web view 並注入 user profile）。兩者組合涵蓋從 chat-only 到 form-rich 互動的完整光譜。

## Decision

LINE 整合採 **Messaging API（webhook + push/reply）+ LIFF（form / 進度更新頁面）**。Webhook endpoint 為 Vercel Function（ADR-0002, Node runtime）；LIFF 頁面為 Next.js route（ADR-0001）以 LIFF SDK 在 client side 解 access token 拿 user profile。LINE channel 設定：official Messaging API channel + LIFF app（type: full / tall）。

## Consequences

### ✅ 好處
- 民眾無須安裝額外 app — 走在 LINE 內完成整個維修流程
- LIFF 注入 user profile 免另做登入流程（與 ADR-0005 / ADR-0132 認證體系獨立）
- Messaging API push 通知到達率高於 email

### ⚠️ 代價
- LINE platform 規則變更風險（rate limit、push message 計價）
- LIFF 在非 LINE 瀏覽器需 fallback；測試需 LINE app 真機

### 🔮 未來影響
- Phase 2 若要支援 WhatsApp / Telegram / Email — 走 messaging adapter 抽象（與 ADR-0006 同 pattern）
- 若 LINE 政策變動 → 切回普通 web form 仍可工作（漸進增強）

## References

- LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/
- LIFF: https://developers.line.biz/en/docs/liff/
