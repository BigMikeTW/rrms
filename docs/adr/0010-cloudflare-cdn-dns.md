# ADR 0010 — CDN 與 DNS 採用 Cloudflare（Free Plan）前置 Vercel

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-comparison.html`, `platform-registration.html` 決議 A10 |
| Related ADR | ADR-0014 |

## Context

RRMS 域名 `rrms.pro080.com`（prod）/ `rrms-dev.pro080.com`（dev）已在 Cloudflare 管理。Cloudflare Free Plan 提供：(a) DNSSEC、(b) anti-DDoS、(c) 全球 CDN、(d) WAF 基礎規則、(e) page rules。Vercel 自帶 CDN 與 DDoS 保護，但放 Cloudflare 在前面可：(i) 統一所有 pro080.com 子網域管理；(ii) 多一層 WAF；(iii) cookie `.pro080.com` SSO 場景下 DNS 集中管理。

## Decision

DNS authoritative 在 **Cloudflare**（Free Plan）；Vercel domain 採 CNAME → Cloudflare → Vercel edge。Cloudflare proxy（橘雲）**開啟**以享 CDN / WAF；TLS 模式設 **Full (strict)**。涉及 Vercel-specific feature（Image Optimization、ISR origin）若衝突再個別關閉 proxy。

## Consequences

### ✅ 好處
- 統一管理 pro080.com 與所有子網域（含未來多租戶 *.pro080.com）
- 雙層 DDoS / WAF 保護
- Free Plan 即足，零成本

### ⚠️ 代價
- 雙層 CDN 偶有 cache header 衝突 — 需 page rule 微調
- Cloudflare proxy 與 Vercel Image Optimization 的互動需驗證

### 🔮 未來影響
- 若多租戶 SaaS → wildcard `*.pro080.com` cert 由 Cloudflare 統一發
- 若客戶自帶域名 → Cloudflare for SaaS 是平滑升級路徑

## References

- Cloudflare DNS: https://developers.cloudflare.com/dns/
- Vercel + Cloudflare: https://vercel.com/guides/cloudflare-with-vercel
