# ADR 0062 — Phase 2 擴充：技師 onboarding 自動化（KYC + 模板 + 電子簽）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `contract-and-dynamic-rate.html` 決議 B39 (soft) |
| Related ADR | ADR-0038, ADR-0043 |

## Context

外包技師上線前需簽多份文件（合約、保密協議、評分同意書 B15）。MVP 走線下紙本即可（量小）。Phase 2 量擴張後線下作業負擔大、檔案管理混亂，需自動化。

## Decision

Phase 2 引入技師 onboarding 自動化流程：

- **KYC** — 身分證 OCR + 銀行帳戶驗證
- **模板填入** — 從技師基本資料自動填合約模板
- **電子簽** — DocuSign / 法 OK / Adobe Sign 擇一

Phase 1 走線下簽紙本，掃描存於 `technician_document` 表（schema 已含 `document_type`, `signed_at`, `signature_method` 欄位）。

## Consequences

- ✅ Phase 2 規模化時 onboarding 從天級降到分鐘級
- ⚠️ 電子簽 API 費用（DocuSign 約 USD 10-40 / 月）
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1

## References

- DocuSign API: https://developers.docusign.com
- 法 OK: https://www.fa-ok.com/
- Adobe Sign: https://www.adobe.com/sign.html
