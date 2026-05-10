# ADR 0128 — Phase 2/3 平台暫不註冊以降低帳號管理負擔

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H3（hard） |
| Related ADR | ADR-0068, ADR-0069, ADR-0126 |

## Context

ADR-0068 / ADR-0069 已標示 Phase 2 / Phase 3 啟用功能（電子簽章、線上金流、KYC、即時 BI）會引入新外部 SaaS。若 MVP 開發階段就先註冊全部，BigMike（非工程背景）需同時管理 14+ 個帳號、雙因素驗證、帳單卡片，認知負擔過大；且部分平台（如綠界 / 藍新）開戶需公司營利事業文件，提早申請後若決議方向轉變 → 帳號作廢。

## Decision

下列 Phase 2 / Phase 3 平台 **MVP 階段一律不註冊**，待對應 Phase 啟用前再評估：

| 平台 | 用途 | 啟用時點 |
|---|---|---|
| 法 OK | 電子簽章（合約 / 派工單） | Phase 2（per ADR-0068） |
| DocuSign | 電子簽章替代方案 | Phase 2 |
| 綠界（ECPay） | 金流 — 業主刷卡 | Phase 2 |
| 藍新（NewebPay） | 金流替代方案 | Phase 2 |
| Onfido | KYC — 技師身份驗證 | Phase 3（per ADR-0069） |
| Jumio | KYC 替代方案 | Phase 3 |
| Tinybird | 即時 BI 分析（≥100 業主） | Phase 3（per ADR-0074 100 業主門檻） |

任何 PR 在 Phase 1 範圍內若引入上述平台 SDK / API key → 視為違反本 ADR，須擋下。

## Consequences

### ✅ 好處
- BigMike 只管 7 個 MVP 帳號，認知負擔可控
- 避免 Phase 2/3 方向變更後帳號作廢的浪費
- 強化 Phase 1 scope 邊界（per ADR-0064 MVP scope）

### ⚠️ 代價
- Phase 2 啟用時需臨時申請 + 文件審核（綠界 / 法 OK 約 1-2 週）
- 若 Phase 2 倉促啟用 → 註冊時程可能拖延 release

### 🔮 未來影響
- Phase 2 開工前須開新 ADR 解凍對應平台、選定具體廠商（綠界 vs 藍新 / 法 OK vs DocuSign）
- Tinybird 啟用條件鎖在 ADR-0074（100 業主門檻），不到門檻即不註冊

## References

- ADR-0068 Phase 2 enablement roadmap
- ADR-0069 Phase 3 enablement roadmap
- ADR-0074 Paid analytics threshold（100 業主）
