# ADR 0113 — 未來遷移採 Strangler Fig + Blue-Green 並行模式，目標停機 < 1 分鐘

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `migration-and-ai-governance.html` 決議 F10 |
| Related ADR | ADR-0003, ADR-0006, ADR-0010, ADR-0110, ADR-0112 |

## Context

ADR-0110/0112 的紀律確保「能換」，但「怎麼換」須事先設計。直接 cut-over（停機切流量）對營運中的物業報修系統不可接受 — 報修是 24/7 服務，停機 1 小時可能違反合約 SLA。業界成熟做法：

- **Strangler Fig**（Martin Fowler 2004）— 新舊系統並行，逐 feature / 逐 endpoint 遷移，舊系統 traffic 越來越少直到全死
- **Blue-Green Deployment** — 新（Green）與舊（Blue）兩套 production 並行，DNS / load balancer 切流量
- **Postgres Logical Replication** — 跨 Postgres instance 即時同步資料，切流量瞬間新 DB 已 catch-up

組合三者，停機可壓至 < 1 分鐘。

## Decision

未來若需從 Vercel + Neon 遷移到他平台（多雲、自管、新 SaaS），採以下並行模式：

| 層 | 機制 | 工具 |
|---|---|---|
| **DB** | Postgres Logical Replication | Neon → 目標 PG，pgcopydb / native logical replication |
| **App** | Strangler Fig + DNS weight 漸進切流量 | Cloudflare DNS（ADR-0010）weight routing |
| **檔案** | rclone 雙寫過渡（同時寫舊 + 新 storage） | rclone + StorageAdapter port（ADR-0110） |
| **部署** | Blue-Green | Vercel（Blue）+ 目標平台（Green）並行 |

**目標停機 < 1 分鐘**（DNS TTL 切換時間，不含資料同步）。完整 runbook 在 Phase 2+ 啟動遷移時撰寫。

## Consequences

### ✅ 好處
- 停機時間極短，符合 24/7 報修服務需求
- 風險可逆 — 切完發現問題可 DNS weight 回切
- adapter 雙寫過渡無資料遺失

### ⚠️ 代價
- 過渡期雙倉成本（兩套 storage / DB / compute 同時付費）
- Logical replication 對 schema 變更敏感（過渡期凍結 DDL）
- runbook 撰寫與演練成本

### 🔮 未來影響
- Phase 2+ 多租戶 SaaS 啟用前可先做 dry-run 演練（拉一個 staging 環境試切）
- 遷移工具鏈（rclone + pgcopydb）的選型本身在 ADR-0110 紀律下是 adapter，可換

## References

- Strangler Fig (Martin Fowler): https://martinfowler.com/bliki/StranglerFigApplication.html
- Blue-Green Deployment: https://martinfowler.com/bliki/BlueGreenDeployment.html
- PostgreSQL Logical Replication: https://www.postgresql.org/docs/current/logical-replication.html
- pgcopydb: https://github.com/dimitri/pgcopydb
- rclone: https://rclone.org/
- Brainstorm: `migration-and-ai-governance.html` 決議 F10
