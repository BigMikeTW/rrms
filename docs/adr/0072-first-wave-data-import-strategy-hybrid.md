# ADR 0072 — 第一波資料匯入策略（混合）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `location-and-coverage-v2.html`, `flexible-architecture-qa.html` 決議 C9 |
| Related ADR | ADR-0073 |

## Context

MVP 上線時面對 100+ 棟大樓的歷史資料如何進系統。Brainstorm `location-and-coverage-v2` 提出 4 個選項：(a) 上線前全匯入、(b) 上線後逐筆人工建、(c) 開放 API 由業主自填、(d) 混合策略。BigMike 以 100+ 棟既有業務量考量，全匯入工作量過大、逐筆建又拖延上線；採混合策略最務實。

## Decision

第一波資料匯入採**選項 (d) 混合策略**：

1. **開站前 Excel 匯入主檔**
   - `owner`（業主）
   - `building`（大樓）
   - `contract`（合約）
2. **戶級資料邊用邊補**
   - 樓層 / 戶 / 房間 = 樓管自助補
   - 補完進入 review queue → admin 審核生效

## Consequences

- ✅ 上線速度與資料完整性兼顧；100+ 棟可在 MVP 上線首日就有完整主檔
- ✅ 戶級資料以「使用驅動補建」方式自然累積，避免一次性建立大量未用資料
- ⚠️ 樓管自助補建需要 UI + 審核機制；Phase 1 plan 必含此功能
- 🔮 第二波（Phase 2 加入新業主時）可沿用此策略；Excel 匯入工具可重用

## References

- `docs/superpowers/brainstorm/location-and-coverage-v2.html`
- `docs/superpowers/brainstorm/flexible-architecture-qa.html`
- ADR-0073 — Excel 匯入彈性樹格式
