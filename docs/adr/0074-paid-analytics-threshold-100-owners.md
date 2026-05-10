# ADR 0074 — 付費深化分析啟用門檻（100 業主滿載前不啟用）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 C11 |
| Related ADR | ADR-0068 |

## Context

Tinybird、Clerk Pro 等付費分析 / 認證進階方案在 Phase 1 規模（100 業主以下）成本效益不佳。Brainstorm `platform-registration` 分析過：MVP 階段以 Vercel Pro + Neon + 自建 SQL 報表已足夠，付費深化分析在資料量未達臨界前無法發揮其優勢。

## Decision

**100 業主滿載前不啟用** Tinybird、Clerk Pro 等付費深化分析功能。MVP 階段：

- 分析需求用 Neon Postgres + 報表 SQL 滿足
- Auth 用 Better Auth（per ADR-0005 後續決議）+ 免費方案
- Event Stream（per ADR-0071）用 outbox + cron 過渡，不接 Tinybird

達到 100 業主滿載後，重新評估啟用條件。

## Consequences

- ✅ MVP 階段控制 SaaS 訂閱成本，避免付費功能閒置
- ✅ 強迫 MVP 用「自建簡單方案」，培養團隊對核心 stack 的掌握
- ⚠️ 資料量逼近 100 業主時需主動評估，不可拖到效能 / 體驗下降才補救
- 🔮 **Soft commitment, scope/timing may shift** — 100 業主僅是參考門檻；若 Phase 1 末出現特殊分析需求（如業主端要求即時 dashboard），可提前評估啟用個別工具

## References

- `docs/superpowers/brainstorm/platform-registration.html`
- ADR-0068 — Phase 2 路線圖（含 Tinybird 深化分析）
