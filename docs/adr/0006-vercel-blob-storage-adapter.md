# ADR 0006 — 檔案儲存採用 Vercel Blob，透過 storage adapter 抽象包裝

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html` 決議 A6; `migration-and-ai-governance.html` |
| Related ADR | ADR-0008, ADR-0018 |

## Context

RRMS 需儲存：(1) 維修案件的照片 / 影片 / 文件附件；(2) 生成的 PDF 報告（ADR-0008）；(3) 其他匯出檔（CSV、Excel）。候選：Vercel Blob（Vercel Marketplace 原生、簡單 SDK、Pro Plan 起包流量）/ AWS S3 / Cloudflare R2 / Dropbox。Vercel Blob 對 Phase 1 來說最快上線；但鎖死 vendor 風險須以抽象層緩解。

## Decision

Phase 1 採用 **Vercel Blob** 作為主檔案儲存。所有寫入 / 讀取 / 簽名 URL 操作必須透過 `lib/storage/storage-adapter.ts` 抽象介面（`put`, `get`, `delete`, `getSignedUrl`），**禁止 application code 直接 import `@vercel/blob`**。未來切換 S3 / R2 / 自建 MinIO 時只需實作新 adapter。

## Consequences

### ✅ 好處
- Phase 1 上線最快、與 Vercel 平台計費合一
- Adapter 抽象讓未來 vendor 換手成本可控（估計 1-3 天）

### ⚠️ 代價
- Vercel Blob 計價較 R2 高；流量大時須評估遷移
- Adapter 層增加少量 code，需 4W 文件化

### 🔮 未來影響
- Phase 2+ 大客戶 / 高流量 → 可能遷移至 R2（cheap egress）或客戶自家 S3
- 與 Dropbox 整合（若客戶要求）走另一個 adapter 實作，不污染主程式

## References

- Vercel Blob: https://vercel.com/docs/storage/vercel-blob
- Storage adapter pattern: brainstorm `migration-and-ai-governance.html`
