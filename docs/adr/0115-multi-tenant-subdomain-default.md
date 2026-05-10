# ADR 0115 — 多租戶以 subdomain 為預設方案；path vs subdomain 細節於 spec 階段定案

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | （F12 — 未在 brainstorm HTML 鎖定；以 MEMORY `project_domain_architecture.md` + brainstorm 整體子網域思路彙整） |
| Related ADR | ADR-0010, ADR-0089, ADR-0105, ADR-0106 |

## Context

多租戶 SaaS 的 URL 結構通常二選一：

- **subdomain 模式** — 每業主 `<owner>.rrms.pro080.com`，cookie 範圍 `.pro080.com` 可實現跨子網域 SSO（MEMORY `project_domain_architecture.md` 已鎖定此方向）
- **path 模式** — `rrms.pro080.com/<owner>/...`，DNS / SSL 設定簡單但 cookie 隔離與業主品牌感弱

腦力激盪未在任何單一 HTML 鎖定此項決議，但多次提及 subdomain 思路（與 MEMORY 一致）。F12 因此標記為 soft，正式細節（如 DNS wildcard 設定、自訂網域支援、reserved subdomain 名單）於 spec 階段（Phase 1 design spec）落地。

## Decision

RRMS 多租戶 URL 採 **subdomain 為預設方案**：

- 生產：`<owner>.rrms.pro080.com`
- 開發：`<owner>.rrms-dev.pro080.com`
- Cookie scope：`.pro080.com`（達成與其他 pro080 子產品 SSO）
- 主站 `rrms.pro080.com`（無 subdomain）導向 marketing landing 或登入頁

進一步細節（reserved subdomain 名單、自訂網域 CNAME 流程、subdomain 命名規則 / 衝突解決）於 Phase 1 / Phase 2 spec 階段鎖定 — **本 ADR 僅鎖定方向**，不鎖細節。

## Consequences

### ✅ 好處
- 業主品牌感強（`acme.rrms.pro080.com`）
- Cookie scope `.pro080.com` 達成 pro080 全產品 SSO
- 對應 MEMORY `project_domain_architecture.md` 既有鎖定

### ⚠️ 代價
- DNS wildcard CNAME 須設定（Cloudflare，ADR-0010）
- SSL wildcard cert 須配置
- reserved subdomain 名單（`api`、`admin`、`www`、`mail`…）須維護

### 🔮 未來影響
- Phase 2+ Enterprise tier 可支援自訂網域（`rrms.acme.com` CNAME 到 RRMS）
- 此 ADR 為 soft（方向決議）；spec 階段細節決定後若有實質變更須新開 ADR supersede

## References

- Vercel Multi-tenant: https://vercel.com/guides/nextjs-multi-tenant-application
- Cloudflare Wildcard DNS: https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/
- MEMORY 錨點：`project_domain_architecture.md`
- Brainstorm: 未在單一 HTML 鎖定（F12 soft）
