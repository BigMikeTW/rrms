# ADR 0020 — 不使用 Web3 / 區塊鏈智慧合約；自動化合約走 e-sign 模板

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html` 決議 A20 |
| Related ADR | — |

## Context

腦力激盪曾討論「自動化合約 / 智慧合約」概念。Web3 區塊鏈智慧合約（Ethereum / Solana / etc.）對 RRMS 場景（B2B 物業維修費結算）幾無價值：(a) 合約對手是已知商業實體 → 無 trustless 需求；(b) 結算貨幣為新台幣法幣 → 上鏈反成阻力；(c) gas 費 / 鏈上 latency / 法規灰區 → 反作用；(d) 廣義「自動化合約」需求其實是 e-sign（電子簽章法 §4）+ 規則引擎（自動依設定計費）。

## Decision

**RRMS 不採用任何 Web3 / 區塊鏈 / 智慧合約技術**。「自動化合約」需求以下列方式滿足：(a) 合約模板化（合約條款變數化，存於 DB）；(b) **電子簽章** — 走台灣《電子簽章法》合規 e-sign 流程（簡訊 OTP / email 確認 / 簽核時間戳記）；(c) **規則引擎** — 計費 / 通知 / 流程 trigger 走 application logic；(d) 未來若需第三方公正性 → 接 docusign / 全球認證 e-sign provider。

## Consequences

### ✅ 好處
- 不引入無收益的技術複雜度
- 與台灣《電子簽章法》直接對齊；不踩法規灰區
- 客戶（物業 / 服務商）熟悉 e-sign 流程 — 採用阻力低

### ⚠️ 代價
- 永久放棄 Web3 / token / NFT 的潛在敘事（無實際業務影響）

### 🔮 未來影響
- 若 Phase N 客戶要求區塊鏈存證（極不可能）→ 走 hash-on-chain 證明而非完整智慧合約
- e-sign provider 整合可走 adapter pattern（同 ADR-0006 思想）

## References

- 中華民國《電子簽章法》: https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=J0080037
