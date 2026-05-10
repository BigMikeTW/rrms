# ADR 0030 — 技師組成：內部 2-3 人 + 外包 ~80%；無分區無分專業

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-final-technician-statement.html` 決議 B7 |
| Related ADR | ADR-0029, ADR-0032 |

## Context

派工模型若假設「按專業/區域 routing」就會建造複雜的 skill matrix 與 service area 表，但實況是 BigMike 目前以**通才外包**為主、不分北中南也不分電工/燈控。過度建模 = 過度工程。

## Decision

技師組成設定為：

- **內部技師** 2-3 人
- **外包技師** ~80% 工作量
- **不分區**（北中南由派工人員人工判斷）
- **不分專業**（無 skill matrix，目前都通才）

`technician` 表保留 `is_internal` boolean 與 `tags` JSONB（彈性標記，不索引）；不建立獨立 `technician_skills`、`service_areas` 表（Phase 1）。

## Consequences

- ✅ 模型輕量、與現況吻合
- ⚠️ 若未來引入專業分流，需 schema 演進（加表）
- 🔮 Phase 2/3 可加 skill / region 資料給 AI 派工（B11、B12）

## References

- `docs/superpowers/brainstorm/q7-final-technician-statement.html`
