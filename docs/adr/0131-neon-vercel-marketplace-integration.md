# ADR 0131 — Neon 透過 Vercel Marketplace 一鍵連動

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H6（soft） |
| Related ADR | ADR-0003, ADR-0017, ADR-0126 |

## Context

ADR-0003 鎖定 Neon Postgres 為主資料庫。連接 Vercel ↔ Neon 有三條路徑：(a) Vercel Marketplace 一鍵連動（auto-provisioned env vars `DATABASE_URL` / `DATABASE_URL_UNPOOLED`、unified billing）、(b) Neon 直開帳號 + 手動複製 connection string 到 Vercel env、(c) IaC（Terraform）。BigMike 為非工程背景，路徑 (b) 需手動處理 pooled / unpooled 雙 URL（ADR-0017 RLS pool mode 必需）易出錯，路徑 (c) 過度工程化。

## Decision

Neon 透過 **Vercel Marketplace 一鍵連動**（路徑 a）。具體流程：
1. Vercel Dashboard → Storage → Browse Marketplace → Neon → Add
2. Marketplace 自動：建 Neon project、auto-provision `DATABASE_URL`（pooled）+ `DATABASE_URL_UNPOOLED`（direct）入 Vercel env（per `.env.example`）
3. 帳單統一由 Vercel 收（unified billing）— 不需另外開 Neon 信用卡帳戶
4. dev / preview / prod 各環境獨立 branch（Neon branching 自動 wired 到 Vercel preview deployment）

## Consequences

### ✅ 好處
- 零手動 env 設定，避開「忘記設 unpooled URL → migration script 跑不動」常見坑（ADR-0017 RLS pool mode 必要）
- 統一帳單、單一信用卡、不需多帳戶對帳
- Neon branching ↔ Vercel preview 自動連動，PR 預覽即帶獨立 DB branch
- 取消整合時 env vars 自動清除、無殘留 secret

### ⚠️ 代價
- 帳號擁有權綁在 Vercel team 下，未來若要拆出獨立 Neon org 須走 transfer 流程
- Marketplace pricing 與 Neon 直購可能略有差異（一般 ≤ 5%）

### 🔮 未來影響
- 多租戶啟用（ADR-0017）時 Neon project 內可加新 database / role；不影響 Marketplace 連動
- 若改 Phase 3 自架 Postgres → 須走 ADR supersede 流程、解除 Marketplace 整合

## References

- Vercel Marketplace — Neon: https://vercel.com/marketplace/neon
- Neon Vercel Native Integration: https://neon.tech/docs/guides/vercel
- ADR-0003（Neon Postgres 採用）
- ADR-0017（多租戶 pool mode + RLS — 需 unpooled URL）
