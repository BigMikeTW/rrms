# ADR 0023 — 核心 entity 主鍵採 UUID v7（時序排序、索引友善, soft）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` 決議 A23 |
| Related ADR | ADR-0003, ADR-0017 |

## Context

主鍵候選：(a) 自增 BIGINT — 索引最快但暴露 ID 規模、不友善多租戶 / 分散合併；(b) UUID v4 — 隨機、不可猜，但對 B-tree index 不友善（隨機插入導致 page split）；(c) **UUID v7** — 時間前綴 + 隨機後綴，兼具 (i) 不可猜、(ii) 索引友善（時序近單調遞增）、(iii) 跨 DB 合併安全、(iv) 可從 ID 反推大致建立時間。RFC 9562（2024）正式定義 UUID v7。Postgres 17+ 內建 `uuidv7()` 函數；舊版可走 application 端產生（如 `uuid` npm package v10+）。

## Decision

核心 entity（`case`, `rate_card`, `case_report`, `user`, `tenant`, `attachment` 等）主鍵採 **UUID v7**（`UUID NOT NULL PRIMARY KEY DEFAULT uuidv7()` 或 application 端產生）。⚠️ **soft 決議**：若 Phase 1 落地遇到 Neon / Postgres 版本不支援 `uuidv7()` 內建函數的場景 — 暫以 `uuid_generate_v4()` 過渡，加 `created_at` index 補時序查詢，後續升版再 migrate。

## Consequences

### ✅ 好處
- 索引友善（vs UUID v4） — B-tree page split 大幅減少
- 跨租戶（ADR-0017）/ 跨 DB / future sharding 主鍵不衝突
- 從 ID 可反推大致時間 — debug / audit 友好（搭配 ADR-0017 RLS 不洩跨租戶資訊）

### ⚠️ 代價
- ⚠️ **Soft 決議：Phase 1 可暫退 UUID v4，後續 revisit**
- ID 長度（36 字元）比 BIGINT 大；URL slug / log 體積增
- 從 ID 推導時間是「不太精準」的近似 — 不可作為 audit 依據

### 🔮 未來影響
- Phase 2+ 多租戶大規模時索引效益顯著
- 若導入 sharding / 跨 region 複寫 — 主鍵已就緒不衝突

## References

- RFC 9562 — UUID Formats: https://datatracker.ietf.org/doc/rfc9562/
- PostgreSQL 17 UUID functions: https://www.postgresql.org/docs/17/functions-uuid.html
