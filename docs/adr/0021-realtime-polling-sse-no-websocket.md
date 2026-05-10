# ADR 0021 — 即時通知 MVP 用 polling 或 SSE，不導入 WebSocket（soft）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html`, `docker-vs-serverless.html` 決議 A21 |
| Related ADR | ADR-0002, ADR-0018 |

## Context

RRMS 即時需求：(a) 案件狀態更新 → 派工人員看到；(b) 新案件通知 → admin 看到；(c) LINE 推播為主要 push channel（ADR-0007）— web UI 即時度需求其實低（更新通常 5-30 秒延遲可接受）。Serverless（ADR-0002）對 WebSocket 不友善 — function 不持久連線、Vercel 無原生 WS 支援（須走第三方如 Pusher / Ably / Soketi）。Polling 簡單但耗資源；SSE 是 HTTP 單向推送、serverless 可承載（雖仍受 timeout）。

## Decision

Phase 1 即時通知**不導入 WebSocket**：(a) 預設 **polling**（每 10-30 秒刷新關鍵列表）；(b) 進階場景用 **SSE (Server-Sent Events)** — Next.js Route Handler 串流回應，client 用 `EventSource`；(c) 主要 push channel 仍為 LINE Messaging API（ADR-0007）。⚠️ **此為 soft 決議**：若 Phase 2 出現真正高頻即時需求（如多人協作派工版面）— 評估接 Pusher / Ably 或拉 Docker worker（ADR-0018）跑專用 WS server。

## Consequences

### ✅ 好處
- 與 serverless 模型自然相容；零額外基礎設施
- Polling / SSE 純 HTTP — Cloudflare（ADR-0010）/ CDN 可正常工作
- LINE push 已涵蓋大多數即時通知需求

### ⚠️ 代價
- ⚠️ **Soft 決議：Phase 1 採用，後續若需求變化可導入 WebSocket（透過第三方或 Docker worker）**
- Polling 在低流量沒問題、流量大時 DB 壓力會明顯
- SSE 在 serverless 仍受 timeout（300s）— 須 client 重連

### 🔮 未來影響
- 若採 Pusher / Ably → 加 messaging adapter 抽象；不影響主程式
- 若拉 Docker WS worker → 與 ADR-0018 退路一致

## References

- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Next.js streaming responses: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
