# ADR 0008 — PDF 生成採用 Puppeteer + @sparticuz/chromium + pdf-lib

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q8-pdf-report.html`, `q8-billing-attachment.html` 決議 A8; `migration-and-ai-governance.html` |
| Related ADR | ADR-0002, ADR-0006, ADR-0018 |

## Context

RRMS 需產生：(1) 維修案件報告 PDF（含案件資料、照片、簽名）；(2) 估價 / 帳單 PDF（含表格、印章）；(3) 月報 / 結案報告（多案件合併、加目錄頁碼）。候選：(a) PDFKit / jsPDF — 純 JS 但版面難精細；(b) headless Chromium 渲染 HTML → PDF — 版面接近設計稿但 binary 重；(c) LaTeX — 排版頂尖但 ops 複雜。Vercel Functions 限制：function bundle ≤ 250MB unzipped；標準 Chromium binary > 300MB。`@sparticuz/chromium` 是針對 serverless 優化的精簡 Chromium build。

## Decision

PDF 生成走兩段管線：**(1) Puppeteer + @sparticuz/chromium 渲染 HTML 模板 → 單頁 PDF**；**(2) pdf-lib 合併多份 PDF + 加目錄 / 頁碼 / 浮水印**。執行於 Vercel Function（Node runtime, Fluid Compute, 300s timeout）。長任務（>20 案件批次）拆為背景 job，產物寫入 Vercel Blob（ADR-0006）後 push LINE / email 取件連結。

## Consequences

### ✅ 好處
- HTML/CSS 模板可由設計師直接維護（不用學 PDF DSL）
- pdf-lib 純 JS — 合併 / 改頁碼極快、不需再啟 Chromium
- @sparticuz/chromium 把 binary 壓到能塞進 Vercel Function

### ⚠️ 代價
- Chromium 啟動成本 1-3 秒（Fluid Compute 的 warm 加成幫助大）
- Bundle size 接近 Vercel Function 上限 — 須持續監控

### 🔮 未來影響
- 若 PDF 任務量大 → 拆出獨立 Docker worker（ADR-0018 退路）走專用環境
- 字型 / 中文支援需在 build 時 bundle（@sparticuz 的字型坑）

## References

- Puppeteer: https://pptr.dev
- @sparticuz/chromium: https://github.com/Sparticuz/chromium
- pdf-lib: https://pdf-lib.js.org
