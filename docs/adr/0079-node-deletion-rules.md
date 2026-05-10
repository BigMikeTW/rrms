# ADR 0079 — 節點刪除規則（硬刪 / 封存 / 解封）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `flexible-architecture-qa.html` § D 決議 D5 |
| Related ADR | ADR-0080, ADR-0076 |

## Context

組織節點（公司 → 部門 → 樓層 → 房間）使用 ltree 階層結構儲存歷史案件；若允許隨意硬刪，會讓報表 JOIN 失敗、歷史證據鏈斷裂。需明確區分「真正未使用」與「曾使用但目前停用」兩種情境。

## Decision

節點刪除三層判定：

1. **可硬刪**（rare）：無子節點 **且** 從未出現案件 **且** 無合約覆蓋 → DELETE row（仍寫 `NODE_HARD_DELETED` 到 audit_log）
2. **只能封存**：有子節點 / 有歷史案件 / 有合約覆蓋 → soft delete（`archived_at` 欄位）
3. **可解封**：archived 節點可隨時 unarchive（清空 `archived_at`）
4. **報表可查**：archived 節點底下舊案件仍可在歷史報表查詢與 JOIN

UI 層只暴露「封存 / 解封」兩個動作；硬刪僅限超管後台特殊指令。

## Consequences

### ✅ 好處
- 歷史案件 + 合約資料完整保留，符合內稽證據鏈要求
- 解封機制處理「誤封存」情境，不會永久損失
- 對齊 GDPR Art. 30 處理活動記錄不可遺失原則

### ⚠️ 代價
- ltree 查詢需處理 `archived_at IS NULL` 過濾，UI 默認隱藏
- 「曾用過」判定需 JOIN cases / contracts，DB 須加索引

### 🔮 未來影響
- Phase 2 可加 retention policy（archived >7 年自動移 cold storage）
- 解封事件可加二級審核（高敏感節點如財務部）

## References

- 個人資料保護法施行細則第 12 條第 2 項第 6 款: https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050022&flno=12
- PostgreSQL ltree extension: https://www.postgresql.org/docs/current/ltree.html
- Martin Fowler, Soft Deletes: https://www.martinfowler.com/bliki/EvansClassification.html
