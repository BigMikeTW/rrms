# ADR 0005 — 認證採用 Auth.js v5 (NextAuth)，避開 Clerk lock-in

| Field | Value |
|---|---|
| Status | Superseded by ADR-0132 |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | ADR-0132 |
| Brainstorm 來源 | `honest-comparison.html` 決議 A5; `migration-and-ai-governance.html` |
| Related ADR | ADR-0017, ADR-0019 |

## Context

候選認證方案：(1) Clerk — turnkey、UI 美觀，但價格高、認證資料儲在第三方、組織/RBAC 模型客製化受限、估計 30-40% 的認證層 lock-in；(2) Auth.js v5 (NextAuth) — open source、認證資料儲在自家 DB（ADR-0003）、組織/RBAC 完全自寫；(3) Better Auth — 同樣 OSS、type-safe、API 較新。腦力激盪當下選 Auth.js v5 以避開 Clerk lock-in。

## Decision

採用 **Auth.js v5 (NextAuth)**；多租戶 / Organization / RBAC 自寫於 `app/(auth)` 與 DB schema 內，不依賴 Clerk Organizations 或 Clerk RBAC。

> **此決議於 Plan 3 設計階段被推翻**，改用 Better Auth（見 ADR-0132）。原因摘要：Better Auth 的 type-safety、plugin 架構、與 Drizzle（ADR-0004）整合更好；Auth.js v5 在 Server Actions 場景下 session 管理較生硬。完整推翻論述見 ADR-0132 與 `docs/superpowers/research/2026-05-09-consistency-audit.md`。

## Consequences

### ✅ 好處（保留作歷史紀錄）
- 認證資料留在自家 Neon DB
- 避開 Clerk 商業條款與計價

### ⚠️ 代價
- 多租戶 / Organization 完全自寫；Phase 2 SaaS 啟用時工作量大
- Server Actions 場景下 session 管理 boilerplate 多（觸發 Plan 3 推翻）

### 🔮 未來影響
- 已被 ADR-0132（Better Auth）取代；本 ADR 保留不刪除（事件溯源紀律 / brainstorm D2）

## References

- Auth.js v5: https://authjs.dev
- 取代決議：[ADR-0132](./0132-better-auth-replaces-authjs-v5.md)
