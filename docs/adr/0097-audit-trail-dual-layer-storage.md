# ADR 0097 — Audit Trail 雙層儲存（OLTP baseline + 分析儲存深化）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `per-module-audit-analytics.html` § E 決議 E9 |
| Related ADR | ADR-0076, ADR-0098 |

## Context

audit_log 同時承擔兩種需求：(a) 法遵 / 稽核需要與業務 transactional 一致（不可漏寫、不可竄改）；(b) 分析需求需高效率聚合查詢（如「過去 30 天封存案件 by reason_code」）。OLTP 主庫適合前者但 analytical query 會拖慢業務；分析資料庫適合後者但無法保證 transactional 一致。需雙層設計。

## Decision

audit trail 採雙層儲存：

1. **Baseline（強一致層）** — `audit_log` 表寫在 OLTP 主庫（Neon Postgres，ADR-0003），與業務 transaction 同 commit；append-only（ADR-0076）。法遵 / 稽核以此為單一真理源。

2. **深化分析層** — Event 流出（CDC 或 outbox pattern）到獨立分析儲存（候選：ClickHouse / Tinybird / Postgres 物化視圖）；不影響主庫效能；用於 dashboard / KPI / 趨勢分析。

分析層資料丟失不影響法遵（baseline 為準）；可從 baseline 重建。

## Consequences

### ✅ 好處
- 法遵需求（強一致）與分析需求（高效）分離，互不拖累
- 分析層可橫向擴展或更換引擎不影響 baseline
- 對應 brainstorm 「OLTP 不做 OLAP」設計原則

### ⚠️ 代價
- CDC / outbox pipeline 須額外建構（Phase 2 工作）
- 兩層延遲不一致時要明確標記分析層為 eventually consistent

### 🔮 未來影響
- Phase 2+ 加入分析層後解鎖 ADR-0098 三題深化模板的「業務指標」維度
- 未來考慮 Tinybird（Vercel 整合）或 Neon 自帶的 analytical replica

## References

- Brainstorm: `per-module-audit-analytics.html` 決議 E9
- ADR-0076 audit_log append-only
- Martin Kleppmann, Designing Data-Intensive Applications, Ch.11 (Stream Processing)
- ClickHouse: https://clickhouse.com/
- Tinybird: https://www.tinybird.co/
