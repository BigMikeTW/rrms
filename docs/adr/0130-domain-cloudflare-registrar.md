# ADR 0130 — 域名註冊採 Cloudflare Registrar，DNS 指向 Vercel

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H5（hard） |
| Related ADR | ADR-0010, ADR-0126 |

## Context

`pro080.com` 為 RRMS 主域名（prod `rrms.pro080.com` / dev `rrms-dev.pro080.com` — 見 memory `project_domain_architecture.md`）。Cloudflare DNS 已是 authoritative（ADR-0010），但註冊商可選任意 ICANN-accredited registrar（GoDaddy、Namecheap、Cloudflare Registrar 等）。Cloudflare Registrar 唯一賣點：**at-cost 價格**（無加價、無首年低價後續暴漲手法），且管理介面與 DNS 同一處 — 對非工程背景者最簡單。

## Decision

域名註冊 **建議使用 Cloudflare Registrar**（at-cost、無價差）；DNS authoritative 維持 Cloudflare（per ADR-0010），DNS A / CNAME 紀錄指向 Vercel edge。其他 registrar（GoDaddy / Namecheap）若已持有 → 可保留，但建議在續約週期 transfer 至 Cloudflare Registrar 統一管理。

子域名分配：
- `rrms.pro080.com` → Vercel production
- `rrms-dev.pro080.com` → Vercel preview / dev
- 未來多租戶 `*.pro080.com` → Cloudflare for SaaS（見 ADR-0010 🔮）

## Consequences

### ✅ 好處
- At-cost 價格、無「首年 NT$50 後續 NT$1,500」陷阱
- 註冊 + DNS + CDN 同一介面，BigMike 學習成本最低
- DNSSEC、隱私註冊（WHOIS privacy）預設啟用

### ⚠️ 代價
- 不接受信用卡分期（Cloudflare Registrar 限信用卡 / PayPal）
- transfer-in 需 60 天 cooldown（剛註冊新域名不能立刻轉）

### 🔮 未來影響
- Cloudflare for SaaS 啟用後可發 wildcard cert 給多租戶
- 若 Cloudflare Registrar 將來不支援 .tw / 特殊 TLD → 該 TLD 須備案另一 registrar

## References

- Cloudflare Registrar: https://www.cloudflare.com/products/registrar/
- ICANN Transfer Policy: https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
- 記憶錨點: `project_domain_architecture.md`
