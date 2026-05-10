# ADR 0114 — 整體 lock-in 評估目標：無紀律 ~30% / Hexagonal 紀律後 5-8%（軟性 KPI）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `honest-comparison.html`, `migration-and-ai-governance.html` 決議 F11 |
| Related ADR | ADR-0104, ADR-0110, ADR-0111, ADR-0112, ADR-0113 |

## Context

Lock-in 不是 0/1 是非題，而是「換家所需重寫的代碼比例 + 資料遷移工作量」的綜合指標。腦力激盪參考業界經驗（Gregor Hohpe《Cloud Strategy》、ThoughtWorks 多雲報告）+ 自家 codebase 結構評估：

- **Bundle A（含 Clerk）無紀律**：lock-in 約 30-40%，認證層幾乎完全綁死
- **Bundle B（Auth.js）無紀律**：lock-in 約 10-15%，主要在 Vercel SDK 直接呼叫
- **Bundle B + Hexagonal + 5 紀律**（ADR-0110/0112）：lock-in 預估壓到 **5-8%**

此為**軟性目標**（評估 KPI），非可機器量化的硬指標 — 不對 PR review 設 gate，但在年度架構 review 時量化評估。

## Decision

RRMS 將以下 lock-in 預期值列為**軟性架構 KPI**：

| 情境 | 預估 lock-in 比例 | 備註 |
|---|---|---|
| Bundle B 無紀律 | 10-15% | 假想對照 |
| **Bundle B + Hexagonal + 5 紀律（實際採用）** | **5-8%** | 目標值 |

評估方法（年度 review）：

1. 統計 codebase 中 `import @vercel/*` 的檔案數 / 總檔案數
2. 評估每個 adapter port 的「換家工時」估計
3. 加總並對比上次 review 數值，超過 8% 觸發紅線檢討

此非 PR / CI gate，因 lock-in 不適合單 PR 量化。

## Consequences

### ✅ 好處
- 給團隊一個量化錨點，避免「lock-in 漸進累積但無人察覺」
- 年度 review 機制讓紀律 1-5（ADR-0112）有可追蹤的指標
- 對潛在 Enterprise 客戶可量化展示「平台獨立性」

### ⚠️ 代價
- 評估方法本身有主觀成分（「換家工時」估計帶人工判斷）
- 5-8% 為估值非鐵律 — 跨過 8% 時是否觸發實際遷移仍須個案判斷

### 🔮 未來影響
- 數值若年年攀升（如 8% → 12% → 18%）為早期警訊，須觸發 ADR 重審
- Phase 2+ 多租戶啟用後可加入「資料遷移工時」維度

## References

- Gregor Hohpe, "Cloud Strategy" (lock-in 章節): https://architectelevator.com/cloud/lock-in-options/
- ThoughtWorks Tech Radar — Multi-cloud: https://www.thoughtworks.com/radar
- Brainstorm: `honest-comparison.html`; `migration-and-ai-governance.html` 決議 F11
