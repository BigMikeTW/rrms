# ADR 0134 — Better Auth Phase 1 強制安全配置清單

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-11 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | (post-brainstorm pivot — Round-3 source code audit 2026-05-11) |
| Related ADR | ADR-0005, ADR-0132 |

## Context

ADR-0132 鎖定 Better Auth ^1.6 取代 Auth.js v5。Round-3 直查 Better Auth GitHub source code（v1.6.10 tag）發現 5 個預設行為對 RRMS（處理租戶 PII + magic-link admin 邀請）有實質安全風險。這些不是「決策變動」（Better Auth pivot 仍成立），是「強制配置補強」— 不採即使用預設值上線會有 ATO（Account Takeover）等實質風險。

### 5 個源碼直驗證的 default 行為

| # | 預設值 | source code 證據 | 風險 |
|---|---|---|---|
| 1 | `magicLink({ storeToken: "plain" })` 寫死預設 | [packages/better-auth/src/plugins/magic-link/index.ts:151-156 @ v1.6.10](https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/plugins/magic-link/index.ts#L151-L156) | DB 讀權限洩漏 = 全 token 失效 → ATO |
| 2 | `signInMagicLink` INSERT 新 token 前**不 DELETE** 同 email pending tokens | [magic-link/index.ts:218-262 @ v1.6.10](https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/plugins/magic-link/index.ts#L218-L262) | 重發後舊 link 仍 valid 5 分鐘；同 email 多 IP 5 分鐘可累 25 個 valid token |
| 3 | `accountLinking.enabled = true` + `trustedProviders = []` 但 OAuth `userInfo.emailVerified === true` 即自動 link | [oauth2/link-account.ts:42-99 @ v1.6.10](https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/oauth2/link-account.ts#L42-L99) | LINE OIDC 回 `email_verified=true` → 第三方控制 victim email 即取得 RRMS 帳號 |
| 4 | `magicLink.rateLimit` 預設 5 req / 60 sec / IP（per-email 無限制） | [magic-link/index.ts:454-463 @ v1.6.10](https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/plugins/magic-link/index.ts#L454-L463) | 多 IP 對同 email 暴力索取仍可繞過 |
| 5 | 至少 3 條 GHSA Security Advisories 對 RRMS 相關（GHSA-vp58-j275-797x trustedOrigins bypass / GHSA-36rg-gfq2-3h56 + GHSA-hjpm-7mrm-26w8 Open Redirect on magic-link callback） | [Better Auth Security Advisories](https://github.com/better-auth/better-auth/security/advisories) | 舊版本含未修補 ATO |

## Decision

Phase 1 / Plan 3 啟用 Better Auth 時 **必設**下列 6 項（5 個 default 修正 + 1 個 application-layer wrapper）：

### 1. Magic-link token 必 hash 儲存

```ts
magicLink({
  storeToken: "hashed",   // ← MUST；預設 "plain" 是地雷
  expiresIn: 60 * 10,     // 10 分鐘（員工友善）
  allowedAttempts: 1,     // 已是 default；保持
  // ...sendMagicLink 略
})
```

理由：SHA-256 對於 32 字元 a-z A-Z token (~190 bits entropy) 已足；效能可忽略；DB 洩漏不再 = 全 token 失效。

### 2. 重發 magic-link 必先 invalidate 舊 token

`app/api/auth/[...all]/route.ts` 包一層 wrapper：當 `POST /sign-in/magic-link` 收到 `email` 時，先 DELETE `verification` table 中對應該 email 的 pending token，再 forward 給 `auth.api.signInMagicLink`。

具體實作見 Plan 3 Task 7.7。

### 3. 禁用「emailVerified=true 即自動 link」

```ts
betterAuth({
  account: {
    accountLinking: {
      enabled: true,                  // 仍允許「同人擁有 password + Google + LINE」
      trustedProviders: [],           // 空陣列；不信任任何 provider 的 emailVerified flag
      disableImplicitLinking: true,   // ← MUST；user 須先用既有 method 登入後手動 link
    },
  },
  // ...
})
```

理由：LINE OIDC 回 `email_verified=true` 但 RRMS 無法驗證 LINE 端 email 驗證的嚴謹度 → 不能信任 → ATO 風險。Risk-averse mode（per Round-3 Q3 建議方案 2）。

**ESLint 強制**：在新 ADR 發起前，**LINE provider 永遠不可加入 `trustedProviders` 名單**；CI 需有檢查（grep / regex）若 `trustedProviders` 含 `'line'` 即 fail。

### 4. 應用層 rate limit per email

Better Auth 內建 `rateLimit: { window: 60, max: 5 }` 為 per-IP；per-email 無限制 → 須補。

實作位置：Plan 3 Task 7.8 — 在 `sendMagicLink` callback 內加 `await rateLimitCheckByEmail(email, { window: 3600, max: 5 })`，store 用 in-memory + Fluid Compute warm reuse（Phase 1）或 Upstash Redis（Phase 2 評估）。

### 5. 鎖 `better-auth@^1.6.10`

`package.json` 鎖最低 v1.6.10（不能 `^1.6.0` 或 `^1.6.5`），含 2026-04 之前所有 GHSA fix（GHSA-vp58-j275-797x、GHSA-36rg-gfq2-3h56、GHSA-hjpm-7mrm-26w8 等）。

CI 加 `pnpm audit --audit-level=high` 步驟（Phase 4 落地）；新 advisory 揭露時即時 alert + Watch repo Security alerts。

### 6. Sign-in / role-change audit log integration

Better Auth 沒有原生 sign-in / role-change hook，但有 generic `before` / `after` hook + `ctx.path`。實作位置：Plan 3 Task 7.9 — 用 generic after-hook 過濾 `ctx.path` 寫 audit_log（per ADR-0076/0077 + ADR-0133 真匿名化 redactor）。

具體 path mapping：

| `ctx.path` | 對應 audit `what` |
|---|---|
| `/sign-in/magic-link` | `AUTH_SIGNIN_MAGICLINK` |
| `/sign-in/email` | `AUTH_SIGNIN_PASSWORD` |
| `/sign-in/social` | `AUTH_SIGNIN_OAUTH` |
| `/sign-out` | `AUTH_SIGNOUT` |
| `/admin/set-role` | `AUTH_ROLE_CHANGED` |
| `/admin/create-user` | `AUTH_USER_CREATED` |

## Consequences

### ✅ 好處

- 5 個源碼直驗證的 default 風險全部關掉
- 與 ADR-0076/0077/0133 的 audit_log 紀律完整整合
- ADR 形式固化「**LINE provider 永遠不入 trustedProviders**」這條紀律；未來任何 PR 想加皆需先開新 ADR 反轉

### ⚠️ 代價

- `disableImplicitLinking=true` 多一步 UX：user 第一次用 OAuth 登入若 email 已存在會被拒絕，引導他「先用既有 method 登入 → 在 settings 頁手動 add provider」
- magic-link wrapper 層多一道 DB DELETE；對 throughput 影響 ~1ms 可忽略
- per-email rate limit 需額外 storage（Phase 1 in-memory；Phase 2 視量決定是否裝 Upstash）

### 🔮 未來影響

- Better Auth 若未來 release 改善 default（如 `storeToken: "hashed"` 變預設），本 ADR 可加 Amendment 註記「自 vX.Y.Z 起 default 已對齊本 ADR，配置可省略」
- LINE OIDC 若未來提升 email 驗證嚴謹度（如官方公開 email_verified 來源證明 + RRMS 評估通過），可考慮新 ADR 反轉「LINE 入 trustedProviders」紀律
- Phase 2 多租戶啟用 + 各租戶自訂 SSO，accountLinking 規則須重新評估

## References

- ADR-0132 — Better Auth replaces Auth.js v5: ./0132-better-auth-replaces-authjs-v5.md
- Better Auth source code v1.6.10 — magic-link/index.ts: https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/plugins/magic-link/index.ts
- Better Auth source code v1.6.10 — oauth2/link-account.ts: https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/oauth2/link-account.ts
- Better Auth source code v1.6.10 — admin/routes.ts (createUser): https://github.com/better-auth/better-auth/blob/v1.6.10/packages/better-auth/src/plugins/admin/routes.ts
- Better Auth Security Advisories: https://github.com/better-auth/better-auth/security/advisories
- GitHub Issue #6481 — SAML vs OIDC linking inconsistency: https://github.com/better-auth/better-auth/issues/6481
- GitHub Issue #4216 — magic-link batch generate for invitation: https://github.com/better-auth/better-auth/issues/4216
- GitHub Issue #4226 — admin plugin invite without password: https://github.com/better-auth/better-auth/issues/4226
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Forgot Password Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- 研究員 Round-3 Better Auth source code 直驗證紀錄（本 session 2026-05-11；非 commit 檔，已內嵌於本 ADR Context 段）
