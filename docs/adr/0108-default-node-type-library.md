# ADR 0108 — 預設 node_type 庫包含 11 種：業主、集團、子業主、部門、園區、大樓、棟、樓層、戶、子空間、設備區

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture.html` 決議 F5 |
| Related ADR | ADR-0106, ADR-0107, ADR-0109 |

## Context

ADR-0107 鎖定「彈性樹 + 預設 type 庫」方案後，須明確列出預設庫項目。腦力激盪盤點 RRMS Phase 1 客群（物業 / 辦公 / 工廠 / 大型集團）後，整理出能涵蓋 95%+ 場景的 11 種 node_type；超出這 11 種的需求進 Phase 3 Enterprise tier 自定 type 機制處理。

## Decision

預設 `node_type` 庫含以下 **11 種**（值為 enum，DB 層 CHECK constraint enforced）：

| # | node_type | 說明 |
|---|---|---|
| 1 | `owner` | 業主（多租戶頂層 namespace） |
| 2 | `group` | 集團（多業主聯合體） |
| 3 | `sub_owner` | 子業主（集團底下的子公司） |
| 4 | `department` | 部門 |
| 5 | `campus` | 園區 |
| 6 | `building` | 大樓 |
| 7 | `block` | 棟 |
| 8 | `floor` | 樓層 |
| 9 | `unit` | 戶 |
| 10 | `sub_unit` | 子空間（戶內主臥、客廳等） |
| 11 | `equipment_zone` | 設備區（機房、配電室、屋頂機械等） |

新增 type 須走 ADR + DB migration。

## Consequences

### ✅ 好處
- 涵蓋物業 / 辦公 / 工廠 / 集團場景
- enum 鎖定 — DB 層拒絕拼錯字 / 不一致命名
- AI 派工可基於 type 做語意路由（如機房類報修預設派電工）

### ⚠️ 代價
- 新需求超出 11 種時不可隨手加，須走 ADR
- enum 擴增需 ALTER TYPE migration（PG 原生支援，但須謹慎）

### 🔮 未來影響
- Phase 3 Enterprise tier 開放自定 type（用 `custom_type` 旁通機制）
- 跨業主 AI 知識庫可用 type 分群統計（如「機房類報修平均處理時長」）

## References

- Brainstorm: `flexible-architecture.html` 決議 F5
- PostgreSQL Enum: https://www.postgresql.org/docs/current/datatype-enum.html
