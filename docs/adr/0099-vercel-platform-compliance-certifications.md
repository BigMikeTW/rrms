# ADR 0099 — Vercel 平台合規認證作為合規證明材料

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` § E 決議 E11 |
| Related ADR | ADR-0014, ADR-0075 |

## Context

RRMS 處理個人資料（住戶聯絡資訊、報修描述含位置）受 PDPA 規範；Phase 2 多租戶 SaaS 後客戶可能要求 SOC 2 / ISO 27001 等供應鏈合規證明。從零自建合規體系成本極高（數十萬美金 / 數年）。Vercel Pro Plan（ADR-0014）已具完整合規認證可作為 sub-processor 合規依據。

## Decision

採認 Vercel 平台已取得的合規認證作為 RRMS 合規證明的基礎材料：

| 認證 | Vercel 狀態 | RRMS 用途 |
|---|---|---|
| **SOC 2 Type II** | 已取得 | 供應鏈合規問卷、企業客戶採購審查 |
| **ISO 27001** | 已取得 | 國際資安管理標準佐證 |
| **HIPAA-ready**（BAA 可簽） | 可用 | Phase 3 若擴及醫療物業可援引 |

實作時於 RRMS 隱私政策 / DPA 文件明列 Vercel 為 sub-processor 並附上其 trust report 連結。RRMS 自身的 application-layer 合規（PDPA、audit_log、加密）仍須自做。

## Consequences

### ✅ 好處
- 平台層合規免費搭載（含於 Pro Plan 訂閱）
- 企業客戶 due diligence 可提交現成報告，加速 sales cycle
- HIPAA-ready 為未來醫療場景留路

### ⚠️ 代價
- 須持續關注 Vercel 認證 renewal 狀態（年度更新）
- 平台合規 ≠ 應用合規；RRMS 自身仍須做 application-layer 控制

### 🔮 未來影響
- Phase 2 SaaS 化時 trust center 可引用 Vercel 合規作為 baseline
- Enterprise tier（ADR-0095）可加入自家應用層 SOC 2 Type II（額外稽核）

## References

- Brainstorm: `platform-rigorous-analysis.html` 決議 E11
- Vercel Trust Center: https://vercel.com/trust-center
- Vercel Security & Compliance: https://vercel.com/security
- ADR-0014 Vercel Pro Plan required
- ADR-0075 合規參考標準
