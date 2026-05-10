# Architecture Decision Records

本資料夾收錄 RRMS 全部架構決議。格式採 [Michael Nygard 2011 ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)。

**讀這裡之前先讀**：[ADR-0000 — Record architecture decisions](0000-record-architecture-decisions.md)（解釋為什麼採用 ADR 系統、編號分配、不可變性紀律）

---

## Index

| ID | Title | Status | Date | Brainstorm |
|---|---|---|---|---|
| [0000](0000-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-05-10 | (meta) |

> Phase 2B of [pre-Plan-2 rigorous foundation](../superpowers/plans/2026-05-10-pre-plan-2-rigorous-foundation.md) populates ADRs 0001-0131 from the brainstorm hard decisions.

---

## 編號分配

| Range | Topic | Brainstorm 段 | 數量 |
|---|---|---|---|
| 0000 | Meta | (this folder's reason for existing) | 1 |
| 0001-0023 | A — Tech stack | A1-A23 | 23 |
| 0024-0063 | B — Business rules | B1-B40 | 40 |
| 0064-0074 | C — Phase scope | C1-C11 | 11 |
| 0075-0088 | D — Law / privacy / compliance | D1-D14 | 14 |
| 0089-0103 | E — Security / RBAC | E1-E15 | 15 |
| 0104-0115 | F — Architecture / deployment | F1-F12 | 12 |
| 0116-0125 | G — Process / discipline | G1-G10 | 10 |
| 0126-0131 | H — Platform registration | H1-H6 | 6 |

---

## 新增 ADR 流程

1. 開 `_template.md` copy 一份到下一個未用編號
2. 填 Status / Date / Context / Decision / Consequences / References
3. 把 entry 加進本檔的 Index 表
4. 跑 `pnpm audit:docs` 驗證編號連續、status 合法、引用一致
5. commit（commit message 含 ADR 編號）

ADR 一旦 Accepted **不可改動實質內容**（typo OK）；決議變更 → 新開 ADR + 標舊 ADR `Superseded by`。詳見 [ADR-0000 § 不可變性紀律](0000-record-architecture-decisions.md#不可變性紀律)。
