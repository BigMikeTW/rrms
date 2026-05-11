# ADR 0000 — Record architecture decisions

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | (meta — establishes the ADR system itself) |
| Related ADR | — |

## Context

RRMS 的設計演進過程中已經累積大量決議，分散在不同型態的文件中：

| 文件型態 | 數量 | 角色 |
|---|---|---|
| brainstorm HTML | 30 | 腦力激盪、決議鎖定 |
| spec | 1 | 系統規範 |
| plans | 8 | 執行 task list |
| research | 4 | 版本驗證、紅隊結果、audit 報告 |
| memory | 14 | AI 跨 session 記憶 |
| coding standards | 1 | 撰碼規則 |
| README | 1 | repo 入口 |

文件之間的反向追蹤（哪個決議在哪個檔最早被鎖定？哪個檔的描述是 canonical？）幾乎不可能做。

已知後果：

1. **2026-05-09 consistency-audit** 發現 21 條 inconsistency（critical 7 + important 8 + minor 6），全部肇因於 brainstorm pivot（Auth.js → Better Auth）後 spec / plan 沒對齊（[`docs/superpowers/research/2026-05-09-consistency-audit.md`](../superpowers/research/2026-05-09-consistency-audit.md)）
2. **2026-05-10 pre-Plan-2 audit** 發現另外 4 條 brainstorm hard 決議完全沒進 Phase 1 spec / plan：F-M1（Hexagonal F7-F11）、F-M2（Audit Trail D2-D4 + D8 + D9 + D13）、F-M3（AI 三道地基 C8）、F-M4（多租戶 / RBAC / ltree A17 + E1 + F3-F6）（[`docs/superpowers/research/2026-05-10-pre-plan-2-audit.md`](../superpowers/research/2026-05-10-pre-plan-2-audit.md)）
3. 跨 session 與跨 AI 模型版本（將來）無法可靠重現決議軌跡 — 半年後 BigMike 自己會忘記、Claude 模型版本換代後也不一定接續得上

## Decision

採用 **Architecture Decision Records (ADR)** 作為 RRMS 的設計決議單一真理源。

格式採用 [Michael Nygard 2011 模板](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)：

```markdown
# ADR XXXX — <短標題>

| Field | Value |
|---|---|
| Status | Proposed / Accepted / Superseded by ADR-YYYY / Deprecated |
| Date | YYYY-MM-DD |
| Supersedes | ADR-XXXX |
| Superseded by | ADR-XXXX |
| Brainstorm 來源 | HTML 檔名 + 段落 + 決議編號 |
| Related ADR | <list> |

## Context
為什麼有這個決議要做？背景是什麼？

## Decision
我們決定做什麼？

## Consequences
- ✅ 好處
- ⚠️ 代價
- 🔮 未來影響
```

### 編號分配

每條 brainstorm hard 決議 → 1 個 ADR。編號區段：

| Range | Topic | brainstorm 段 | 數量 |
|---|---|---|---|
| 0000 | Meta — adopt ADR system | (this file) | 1 |
| 0001-0023 | A — Tech stack | A1-A23 | 23 |
| 0024-0063 | B — Business rules | B1-B40 | 40 |
| 0064-0074 | C — Phase scope | C1-C11 | 11 |
| 0075-0088 | D — Law / privacy | D1-D14 | 14 |
| 0089-0103 | E — Security / RBAC | E1-E15 | 15 |
| 0104-0115 | F — Architecture / deployment | F1-F12 | 12 |
| 0116-0125 | G — Process | G1-G10 | 10 |
| 0126-0131 | H — Platform registration | H1-H6 | 6 |
| **Total** | | | **131 + meta** |

### 不可變性紀律

ADR 一旦 `Status: Accepted`：

- **內容不可修改**（typo / 引用更新 OK；決議實質改動禁 — 細則見下方 Amendment Policy）
- 若決議被推翻 → 新開 ADR、舊 ADR 標 `Status: Superseded by ADR-YYYY` + 新 ADR `Supersedes: ADR-XXXX`
- 舊 ADR **永不刪除**（事件溯源原則 — 同 brainstorm D2 全系統 audit_log append-only 紀律）

### Amendment Policy

「不可變性」與「現實上需要修錯字 / 補欄位」之間需明確邊界。下表為允許／禁止判準：

| ✅ 允許 Amendment（不需 supersede） | ❌ 必須 Supersede（決策變動） |
|---|---|
| Typo / 文法 / 翻譯修正 | 決策內容改變（如 Auth.js → Better Auth）|
| 欄位 / enum / 列表的 extension（決策精神不變）| 解決方案改變（A 改 B）|
| 參考 URL 失效 / fix broken link | 紀律強度改變（mandatory → optional 或反之）|
| Status 變更（Proposed → Accepted；Accepted → Deprecated）| 範圍縮減（適用情境變窄）|
| 新增 cross-link 到相關 ADR | 新增改變既有行為的強制要求 |

**Amendment 必要動作**：

1. ADR 末尾加 `## Amendments` 段（表格格式如下）
2. 每筆 amendment 必含：Date / PR / Reason / Change 4 欄
3. **Decision 段內容不可改動**（紀律 — 改動屬決策變動，須走 supersede）
4. Status 維持 `Accepted`（amendment 不改 status）
5. 既有 References 段不刪；新增 reference 加進去即可

```markdown
## Amendments

| Date | PR | Reason | Change |
|---|---|---|---|
| YYYY-MM-DD | #N | 簡述為何補 | 改了什麼（不重述決策） |
```

**判準有疑慮時 → 走 supersede**（過度 supersede 比錯誤 amend 一個決策變動安全 — 後者污染歷史紀錄）。

`scripts/audit-docs.mjs` Check 8 驗證：若 ADR 含 `## Amendments` 段，每列必有 Date / PR / Reason / Change 4 欄；缺任一即 fail。

### 引用紀律

spec / plan / 其他 ADR 引用一個 ADR：用 `[ADR-XXXX](path/to/file.md)` 連結語法，**不重述決議內容**。重述會導致兩處 drift。

## Consequences

### ✅ 好處

- **單一真理源** — 任何時點打開單一 ADR 即可了解該決議全部脈絡（context + decision + 為什麼這個 trade-off），不必跨 30 brainstorm HTML + 1 spec + 8 plans + 14 memory 拼湊
- **跨時間穩定** — BigMike 半年後忘記細節時，打開 ADR 即知當初為什麼這樣選；Claude 模型換代不影響閱讀
- **可機器驗證** — `scripts/audit-docs.mjs`（Phase 2A 同步建立）能掃描 ADR 編號連續性、status 合法、supersede chain、spec/plan 引用一致；CI 失敗 = block PR merge
- **去重** — spec / plan 引用 ADR 編號取代再次重述決議邏輯，drift 機率下降
- **對應 brainstorm D2 全系統 append-only 紀律的「文件層」實作** — ADR 一旦 Accepted 永不刪除、只能 Supersede，與 audit_log 同精神

### ⚠️ 代價

- **一次性建立成本**：131 個 ADR × 平均 5-15 分鐘短格式 ≈ **11-22 小時**（Phase 2B 工作）
- **持續維護**：後續每次設計變更要寫新 ADR + 維護 supersede 連結（每 ADR ~5 分鐘）
- **文件總量增加**：從 ~57 個檔變成 ~200+ 個檔（含 131 ADR + Phase 2A 建的 infrastructure）

### 🔮 未來影響

- 新加入專案的工程師（含 Claude 接手新 session）首先讀 spec + ADR 0000 即可建立心智模型
- Phase 2B 要寫 131 ADR；之後每個 PR 引入新決議 → 必含 1 ADR（per `feedback_per_plan_mini_audit.md` 紀律）
- 文件結構穩定後可作為未來 Phase 2 / 3 的設計依據（多租戶啟用、AI 派工建構等）— 不必重新對焦原始 brainstorm

## References

- Michael Nygard, "Documenting Architecture Decisions" (2011): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- ThoughtWorks Technology Radar — ADR (Adopt 2018-): https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records
- Spotify Engineering, "When should I write an Architecture Decision Record" (2020): https://engineering.atspotify.com/2020/04/when-should-i-write-an-architecture-decision-record/
- Joel Parker Henderson, ADR examples: https://github.com/joelparkerhenderson/architecture-decision-record
- Google SRE Book Ch.18 — Documentation as Code: https://sre.google/sre-book/documenting-development/
