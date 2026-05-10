# ADR 0018 — 部署模式 Serverless 主、Docker 輔（本地開發 / CI test / 退路 / 特殊 worker）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `docker-vs-serverless.html` 決議 A18 |
| Related ADR | ADR-0002, ADR-0006, ADR-0008, ADR-0009 |

## Context

Serverless（Vercel Functions, ADR-0002）優點：scale-to-zero、自動擴展、零 ops；缺點：cold-start、timeout 上限（300s, ADR-0014）、不適合常駐 worker / WebSocket。Docker 優點：環境完全可控、可跑常駐 process；缺點：須 ops、固定成本。RRMS 主要 workload（表單、CRUD、PDF、cron）serverless 完全勝任，但仍須保留 Docker 退路以對應未來特殊需求（重型 worker、大型 PDF batch、若離開 Vercel）。

## Decision

部署模式：**Serverless 主、Docker 輔**。Production 走 Vercel Functions（ADR-0002）；同時維護一份 `Dockerfile` + `docker-compose.yml`，用途：(a) 本地開發環境（含 Postgres + Redis 等 service）；(b) CI 整合測試（Playwright + DB）；(c) 緊急退路（若 Vercel outage 或須遷移）；(d) 未來特殊 worker（heavy PDF batch / video transcode 等不適合 serverless 的場景）。Docker image 必須能跑同一份 Next.js source — 避免分叉。

## Consequences

### ✅ 好處
- Phase 1 享受 serverless 零 ops；同時保留 disaster recovery 退路
- 本地開發環境一致（無 Vercel CLI 也能跑）
- 重型 worker 未來可拆出，不重寫主程式

### ⚠️ 代價
- 須維護 Dockerfile 與 Vercel build 雙路徑相容（next standalone output 模式）
- CI 跑 Docker 測試時間 / 資源成本

### 🔮 未來影響
- 若離開 Vercel → 已有 Docker base，遷移成本大幅降低
- 若工作負載出現「不能跑在 serverless」項目 → 直接拉 Docker worker 加入架構，不影響主程式

## References

- Next.js standalone output: https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
- brainstorm `docker-vs-serverless.html`
