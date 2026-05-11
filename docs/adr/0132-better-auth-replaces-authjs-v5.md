# ADR 0132 — Better Auth 取代 Auth.js v5（post-brainstorm pivot）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-09 |
| Supersedes | ADR-0005 |
| Superseded by | — |
| Brainstorm 來源 | (post-brainstorm pivot — Plan 3 階段) |
| Related ADR | ADR-0005, ADR-0104, ADR-0134 |

## Context

ADR-0005（brainstorm A5）原本鎖定 Auth.js v5 (NextAuth)。但在 Plan 3 起草階段（2026-05-09）verified two adverse signals：

1. **Auth.js v5 仍標 `@beta` 超過 2 年**（驗證日：`docs/superpowers/research/2026-05-08-cross-plan-versions.md` row 6 — `next-auth@beta` = `5.0.0-beta.31`）
2. **2025 年 9 月維護權移轉**：Auth.js 核心維護者 Balázs Orbán 加入 Better Auth 團隊；Auth.js 進入安全性修補模式、不再做新功能（[GitHub discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252)）

繼續用 Auth.js v5 等於「賭 v5 GA」+「賭社群繼續維護」，與 RRMS 商業營運系統的可預測性需求衝突。

## Decision

**Phase 1 改用 Better Auth ^1.6 取代 Auth.js v5**。

具體採用：
- `better-auth` 主套件（內建 `drizzleAdapter`，無需 `@auth/drizzle-adapter`）
- `emailAndPassword` provider（內建 scrypt 雜湊，無需 `bcryptjs`）
- `socialProviders.google`（內建 Google OAuth）
- `genericOAuth` plugin（串 LINE OIDC discovery）
- `magicLink` plugin（admin 邀請流程）
- `admin` plugin（role-based access control）
- Session = DB token + HttpOnly cookie（非 JWT in cookie）

詳細實作規範見 Plan 3 [`docs/superpowers/plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md`](../superpowers/plans/2026-05-08-rrms-phase1-plan-3-database-and-auth.md)。

## Consequences

### ✅ 好處

- **API 已 v1 穩定**（不再是 v5 beta），降低 Phase 1 期間 lib breaking change 風險
- **依賴鏈簡化**：免裝 `bcryptjs`、`@auth/drizzle-adapter`，降低 supply-chain 攻擊面（per ADR-0096 / E12 security review 紀律）
- **plugin 直接覆蓋四個 RRMS 需求**：emailAndPassword、Google OAuth、LINE Login（via genericOAuth）、admin 邀請（via magicLink）— 不需要自寫 OAuth 流程
- **與 Drizzle ORM 一級整合**（per ADR-0004 / A4），無 adapter 版本 drift 風險

### ⚠️ 代價

- 偏離 brainstorm A5 原始決議；本 ADR 是顯式 supersede + 留軌跡
- 社群規模小於 Auth.js（雖然核心維護者重疊）— 出問題時搜得到答案的機率較低
- 沒有「2 年生產使用驗證」歷史；雖然 v1 stable，但廣泛使用案例較少

### 🔮 未來影響

- 本 ADR 是 RRMS 第一次 brainstorm-to-spec 階段的決議反轉，建立「post-brainstorm pivot 用新 ADR + supersede 舊 ADR」的範例
- ADR-0005 永不刪除，保留 Auth.js v5 階段的決議軌跡（per ADR-0000 不可變性紀律）
- 若 Better Auth 未來也出現維護問題，下次 pivot 應再開 ADR-0XXX、supersede 本 ADR；不修本 ADR

## References

- Better Auth 官方介紹：https://www.better-auth.com/docs/introduction
- Better Auth Drizzle adapter：https://www.better-auth.com/docs/adapters/drizzle
- Better Auth `emailAndPassword`：https://www.better-auth.com/docs/authentication/email-password
- Better Auth `genericOAuth` plugin（用於 LINE）：https://www.better-auth.com/docs/plugins/generic-oauth
- Better Auth `magicLink` plugin：https://www.better-auth.com/docs/plugins/magic-link
- Better Auth `admin` plugin：https://www.better-auth.com/docs/plugins/admin
- Auth.js v5 beta status：https://authjs.dev/getting-started/installation
- Auth.js maintainership transfer to Better Auth team (2025-09)：https://github.com/nextauthjs/next-auth/discussions/13252
- 驗證 paper trail：[`docs/superpowers/research/2026-05-08-cross-plan-versions.md`](../superpowers/research/2026-05-08-cross-plan-versions.md) HIGH 2 / row 6

## Amendments

| Date | PR | Reason | Change |
|---|---|---|---|
| 2026-05-11 | TBD (Phase 4) | Round-3 source code 直驗證（Better Auth v1.6.10）發現 5 個必修預設配置；屬「強制配置補強」非「決策變動」（pivot to Better Auth 仍成立）。詳見新 ADR-0134 | Related ADR 加 ADR-0134（強制配置清單）；版本 pin 從 `^1.6` 收緊為 `^1.6.10`（含已知 GHSA fixes）|
