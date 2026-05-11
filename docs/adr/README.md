# Architecture Decision Records

本資料夾收錄 RRMS 全部架構決議。格式採 [Michael Nygard 2011 ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)。

**讀這裡之前先讀**：[ADR-0000 — Record architecture decisions](0000-record-architecture-decisions.md)（解釋為什麼採用 ADR 系統、編號分配、不可變性紀律）

整體性檢查由 `pnpm audit:docs` 自動驗證（編號連續、Status 合法、Supersede 雙向連結、跨檔引用一致）。

---

## Index

| ID | Title | Status |
|---|---|---|
| [0000](0000-record-architecture-decisions.md) | Record architecture decisions (meta) | Accepted |

### A 段 — 技術棧（0001-0023）

| ID | Title | Status |
|---|---|---|
| [0001](0001-nextjs-16-app-router.md) | Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui | Accepted |
| [0002](0002-server-actions-vercel-functions.md) | Server Actions + Vercel Functions（Fluid Compute） | Accepted |
| [0003](0003-neon-postgres.md) | 資料庫 = Neon Postgres | Accepted |
| [0004](0004-drizzle-orm.md) | ORM = Drizzle | Accepted |
| [0005](0005-authjs-v5.md) | 認證 = Auth.js v5（原始） | Superseded by ADR-0132 |
| [0006](0006-vercel-blob-storage-adapter.md) | 檔案儲存 = Vercel Blob via storage adapter | Accepted |
| [0007](0007-line-messaging-api-liff.md) | LINE 整合 = Messaging API + LIFF | Accepted |
| [0008](0008-pdf-puppeteer-sparticuz-pdflib.md) | PDF = Puppeteer + @sparticuz/chromium + pdf-lib | Accepted |
| [0009](0009-vercel-cron-adapter.md) | Cron = Vercel Cron Jobs via cron adapter | Accepted |
| [0010](0010-cloudflare-cdn-dns.md) | CDN / DNS = Cloudflare Free | Accepted |
| [0011](0011-github-github-actions.md) | Source / CI = GitHub + GitHub Actions | Accepted |
| [0012](0012-vercel-git-integration-cd.md) | CD = Vercel Git Integration（Preview + Rolling Releases） | Accepted |
| [0013](0013-sentry-monitoring.md) | 監控 = Sentry Free Plan（soft） | Accepted |
| [0014](0014-vercel-pro-plan-required.md) | Vercel 必用 Pro Plan（禁 Hobby Free 商用） | Accepted |
| [0015](0015-ui-style-linear-stripe.md) | UI 風格 = Linear / Stripe 路線 | Accepted |
| [0016](0016-postgres-ltree-tree-structure.md) | 樹狀結構 = PostgreSQL ltree | Accepted |
| [0017](0017-multitenancy-pool-rls.md) | 多租戶 = AWS Pool 模式 + tenant_id + RLS | Accepted |
| [0018](0018-serverless-primary-docker-fallback.md) | 部署 = Serverless 主 + Docker 輔 | Accepted |
| [0019](0019-rbac-jsonb-attributes-catalog.md) | 動態 RBAC = jsonb attributes + catalog | Accepted |
| [0020](0020-no-web3-blockchain.md) | 不採 Web3 / 區塊鏈 | Accepted |
| [0021](0021-realtime-polling-sse-no-websocket.md) | 即時通知 = polling / SSE，不導 WebSocket（soft） | Accepted |
| [0022](0022-ai-adapter-abstraction.md) | AI 整合走 ai-adapter 抽象 | Accepted |
| [0023](0023-uuid-v7-primary-keys.md) | 核心 entity 主鍵 = UUID v7（soft） | Accepted |

### B 段 — 商業規則（0024-0063）

| ID | Title | Status |
|---|---|---|
| [0024](0024-three-business-lines.md) | 三條業務線範疇定義 | Accepted |
| [0025](0025-mvp-business-line-2.md) | MVP = 業務線 2（大樓維保 100+ 棟） | Accepted |
| [0026](0026-dual-track-billing.md) | 雙軌結帳：合約內 / 合約外 | Accepted |
| [0027](0027-two-tier-user-model.md) | 客戶端兩層使用者模型（L1 / L2） | Accepted |
| [0028](0028-line-primary-channel.md) | 報修主管道 = LINE OA + 每棟 LIFF + QRcode | Accepted |
| [0029](0029-technician-as-service-provider-resource.md) | 技師資料 = 服務商全局資源 | Accepted |
| [0030](0030-technician-roster-composition.md) | 技師組成：內部 2-3 + 外包 80% | Accepted |
| [0031](0031-backoffice-headcount.md) | 後台 3-4 人含派工 / 客服 | Accepted |
| [0032](0032-technician-ux-zero-friction.md) | 技師端 UX = 零訓練 / 零安裝 | Accepted |
| [0033](0033-technician-ui-line-pwa-hybrid.md) | 技師端 = LINE 推播 + PWA | Accepted |
| [0034](0034-mvp-manual-dispatch.md) | MVP 派工 = 純人工 | Accepted |
| [0035](0035-structured-dispatch-decision-log.md) | 派工結構化記錄（為 AI 訓練資料） | Accepted |
| [0036](0036-three-stage-photo-and-onsite-evidence.md) | 工單必要欄位：三段拍照 + GPS + 簽名 + 工時 | Accepted |
| [0037](0037-internal-rating-mvp.md) | 內部評分機制提前 MVP（4 維度） | Accepted |
| [0038](0038-contract-clause-rating-affects-pay.md) | 外包合約明示評分影響工資 | Accepted |
| [0039](0039-technician-monthly-statement.md) | 外包技師月度對帳進 MVP | Accepted |
| [0040](0040-rate-card-rbac.md) | 費率表 RBAC | Accepted |
| [0041](0041-rate-card-uuid-scd2.md) | 費率 UUID + Type 2 SCD versioning | Accepted |
| [0042](0042-case-amount-snapshot-on-close.md) | 案件結案金額快照 | Accepted |
| [0043](0043-approval-points-a1-a4.md) | 簽核 A1-A4 全部進 MVP | Accepted |
| [0044](0044-approval-overdue-no-auto-escalation.md) | 簽核逾期不自動升級 | Accepted |
| [0045](0045-single-stage-approval-mvp.md) | MVP 單關簽核（多關 Phase 2，soft） | Accepted |
| [0046](0046-billing-cycle-per-contract.md) | 結帳週期每合約自訂 | Accepted |
| [0047](0047-invoice-pdf-excel-mvp.md) | 發票 MVP = PDF + Excel | Accepted |
| [0048](0048-ar-simple-mvp.md) | 應收帳款 MVP 簡單版 | Accepted |
| [0049](0049-six-standard-reports-plus-saved-filter.md) | 6 報表 + 自訂篩選 | Accepted |
| [0050](0050-scheduled-email-reports-phase2.md) | 排程 email 報表延 Phase 2（soft） | Accepted |
| [0051](0051-data-granularity-by-org-tree.md) | 業主資料粒度依組織樹 | Accepted |
| [0052](0052-c3-bi-defer-enterprise.md) | C3 BI 延 Enterprise tier（soft） | Accepted |
| [0053](0053-case-status-10-stages.md) | 案件狀態 10 階段機 | Accepted |
| [0054](0054-two-pdf-reports-resolved-and-closed.md) | 兩種 PDF 報告（Resolved / Closed） | Accepted |
| [0055](0055-pdf-report-two-channels.md) | PDF 報告兩種生成管道 | Accepted |
| [0056](0056-pdf-immutable-snapshot-with-versioning.md) | PDF Immutable Snapshot + Version | Accepted |
| [0057](0057-billing-attachment-with-resolved-reports.md) | 對帳單附區間派工結案報告 | Accepted |
| [0058](0058-reopened-historical-versions-downloadable.md) | Reopened 歷史 PDF 仍可下載 | Accepted |
| [0059](0059-owner-granularity-flexible.md) | 業主粒度建立時自由決定 | Accepted |
| [0060](0060-pwa-add-to-home-optional.md) | 技師端可選加到主畫面（soft） | Accepted |
| [0061](0061-customer-rating-and-low-rating-review-phase2.md) | Phase 2 客戶端評分（soft） | Accepted |
| [0062](0062-technician-onboarding-automation-phase2.md) | Phase 2 技師 onboarding 自動化（soft） | Accepted |
| [0063](0063-dynamic-rate-phase3-schema-preserved.md) | Phase 3 動態費率（schema hard / 時程 soft） | Accepted |

### C 段 — Phase 範圍（0064-0074）

| ID | Title | Status |
|---|---|---|
| [0064](0064-mvp-scope-business-line-2-only.md) | MVP 範圍 = 業務 2 only | Accepted |
| [0065](0065-mvp-feature-set.md) | MVP 12 項功能集 | Accepted |
| [0066](0066-mvp-explicit-exclusions.md) | MVP 11 項排除清單 | Accepted |
| [0067](0067-schema-reserved-but-disabled-fields.md) | schema 預留欄位（不啟用） | Accepted |
| [0068](0068-phase-2-enablement-roadmap.md) | Phase 2 啟用路線圖（soft） | Accepted |
| [0069](0069-phase-3-enablement-roadmap.md) | Phase 3 啟用路線圖（soft） | Accepted |
| [0070](0070-ai-dispatch-four-phase-roadmap.md) | AI 派工 4 階段路線圖 | Accepted |
| [0071](0071-ai-three-foundations-required-in-mvp.md) | AI 三道地基（必在 MVP 做） | Accepted |
| [0072](0072-first-wave-data-import-strategy-hybrid.md) | 第一波資料匯入混合策略 | Accepted |
| [0073](0073-excel-import-flexible-tree-format.md) | Excel 匯入 parent_code + node_code 格式 | Accepted |
| [0074](0074-paid-analytics-threshold-100-owners.md) | 付費分析 100 業主滿載前不啟用（soft） | Accepted |

### D 段 — 法規 / 個資 / 合規（0075-0088）

| ID | Title | Status |
|---|---|---|
| [0075](0075-compliance-reference-standards.md) | 合規參考標準清單（ISO 27001 / SOC 2 / GDPR / SOX） | Accepted |
| [0076](0076-audit-log-append-only-event-sourcing.md) | audit_log Append-only 事件溯源 | Accepted |
| [0077](0077-audit-log-mandatory-fields.md) | audit_log 強制欄位 schema | Accepted |
| [0078](0078-change-reason-catalog.md) | 變更理由分類庫 | Accepted |
| [0079](0079-node-deletion-rules.md) | 節點刪除規則 | Accepted |
| [0080](0080-node-type-deletion-guards.md) | node_type 三道護欄 | Accepted |
| [0081](0081-immutable-financial-data-defense-in-depth.md) | 不可變財務資料三道防禦 | Accepted |
| [0082](0082-compensation-amount-high-sensitivity-audit.md) | compensation_amount 高敏感欄位審計 | Accepted |
| [0083](0083-resolution-pdf-immutable-permanent-retention.md) | 結案 PDF 永久保留 + 下載 audit | Accepted |
| [0084](0084-billing-statement-immutable-versioning.md) | 對帳單 immutable 版本管理 | Accepted |
| [0085](0085-electronic-signature-mvp-vs-qualified.md) | 電子簽名 MVP / Phase 2 升級 | Accepted |
| [0086](0086-pdfa-iso-19005-long-term-archive.md) | PDF/A ISO 19005 長期保存（soft） | Accepted |
| [0087](0087-internal-audit-auto-reports.md) | 內稽報表自動產生 | Accepted |
| [0088](0088-reporter-pii-pdpa-handling.md) | 報修者個資 PDPA 處理（細則 TBD） | Accepted |

### E 段 — 資安 / RBAC（0089-0103）

| ID | Title | Status |
|---|---|---|
| [0089](0089-multi-tenant-pool-mode-rls.md) | 多租戶 Pool 模式 + RLS | Accepted |
| [0090](0090-rbac-four-roles-plus-owner-admin.md) | 四業務角色 + owner_admin | Accepted |
| [0091](0091-rbac-tree-inheritance-three-rules.md) | RBAC 樹狀繼承三條規則 | Accepted |
| [0092](0092-rbac-fine-grained-permissions.md) | 權限細分 6 種動作 | Accepted |
| [0093](0093-dynamic-rbac-engine-casbin-openfga.md) | 動態 RBAC 採 Casbin / OpenFGA 理念（soft） | Accepted |
| [0094](0094-node-type-and-role-creation-internal-only.md) | MVP 新增 node_type / 角色限內部 | Accepted |
| [0095](0095-plan-tier-feature-gating.md) | Plan Tier feature gating | Accepted |
| [0096](0096-archival-workflow-by-reason-code.md) | 封存 workflow 依 reason_code 分流 | Accepted |
| [0097](0097-audit-trail-dual-layer-storage.md) | Audit Trail 雙層儲存 | Accepted |
| [0098](0098-three-question-deepening-template.md) | 模組三題深化模板 | Accepted |
| [0099](0099-vercel-platform-compliance-certifications.md) | Vercel 平台合規認證 | Accepted |
| [0100](0100-pre-release-security-review.md) | Release 前 /security-review | Accepted |
| [0101](0101-major-release-ultrareview.md) | 重大版本前 /ultrareview | Accepted |
| [0102](0102-multi-model-collaboration.md) | 多模型協作（soft） | Accepted |
| [0103](0103-ai-augments-not-replaces-decision.md) | AI 增強不取代 BigMike 決策 | Accepted |

### F 段 — 架構 / 部署（0104-0115）

| ID | Title | Status |
|---|---|---|
| [0104](0104-platform-choice-vercel-neon-hexagonal.md) | 平台 Bundle B = Vercel + Neon + Hexagonal | Accepted |
| [0105](0105-cloud-saas-architecture.md) | Cloud SaaS 架構 | Accepted |
| [0106](0106-five-layer-location-hierarchy.md) | 五層位置 hierarchy | Accepted |
| [0107](0107-flexible-tree-with-default-type-library.md) | 彈性樹 + 預設 type 庫 + 可組態角色 | Accepted |
| [0108](0108-default-node-type-library.md) | 預設 node_type 庫（11 種） | Accepted |
| [0109](0109-node-internal-id-code-and-display-path.md) | 節點 internal_id + node_code + display_path | Accepted |
| [0110](0110-hexagonal-ports-and-adapters.md) | Hexagonal / Ports-and-Adapters 強制 | Accepted |
| [0111](0111-spec-platform-dependencies-section.md) | spec 必含 Platform Dependencies 章節 | Accepted |
| [0112](0112-five-lock-in-mitigation-disciplines.md) | 5 條 lock-in 緩解紀律 | Accepted |
| [0113](0113-strangler-fig-blue-green-migration.md) | Strangler Fig + Blue-Green 遷移 | Accepted |
| [0114](0114-lock-in-target-5-to-8-percent.md) | Lock-in 目標 5-8%（soft） | Accepted |
| [0115](0115-multi-tenant-subdomain-default.md) | 多租戶 subdomain 為主（soft） | Accepted |

### G 段 — 流程 / 紀律（0116-0125）

| ID | Title | Status |
|---|---|---|
| [0116](0116-dev-resource-solo-bigmike-claude.md) | 純 BigMike + Claude Code 零委外 | Accepted |
| [0117](0117-mvp-timeline-6-7-months.md) | MVP 時程 6-7 個月 | Accepted |
| [0118](0118-mvp-budget-time-plus-platform-fee.md) | 預算 = 時間 + 平台月費（推翻 q9 金額選項） | Accepted |
| [0119](0119-end-to-end-7-step-development-cycle.md) | 端到端 7 步開發循環 | Accepted |
| [0120](0120-seven-ai-governance-rules.md) | 7 條 AI 治理紀律 | Accepted |
| [0121](0121-traditional-chinese-docs-and-comments.md) | 繁體中文文件 + 註解 | Accepted |
| [0122](0122-mandatory-superpowers-skills.md) | 強制 9 項 superpowers skills | Accepted |
| [0123](0123-github-actions-pr-pipeline.md) | GitHub Actions 6 道 PR pipeline | Accepted |
| [0124](0124-vercel-preview-url-per-pr.md) | 每 PR Vercel preview + LIFF 即時測試 | Accepted |
| [0125](0125-superpowers-github-vercel-three-roles.md) | superpowers / GitHub / Vercel 三方分工 | Accepted |

### H 段 — 平台註冊（0126-0131）

| ID | Title | Status |
|---|---|---|
| [0126](0126-mvp-required-platform-registrations.md) | MVP 必註冊 7 平台 | Accepted |
| [0127](0127-recommended-platform-registrations.md) | 推薦註冊 Sentry Free（soft） | Accepted |
| [0128](0128-deferred-phase-2-3-platforms.md) | Phase 2/3 平台暫不註冊 | Accepted |
| [0129](0129-mvp-monthly-cost-estimate.md) | MVP 三情境月費（soft） | Accepted |
| [0130](0130-domain-cloudflare-registrar.md) | 域名 Cloudflare Registrar | Accepted |
| [0131](0131-neon-vercel-marketplace-integration.md) | Neon via Vercel Marketplace（soft） | Accepted |

### Post-brainstorm pivots（0132+）

| ID | Title | Status |
|---|---|---|
| [0132](0132-better-auth-replaces-authjs-v5.md) | Better Auth 取代 Auth.js v5（supersedes ADR-0005） | Accepted |
| [0133](0133-audit-log-anonymization-strategy.md) | audit_log 真匿名化策略（A+B+C+D 4 方案組合） | Accepted |
| [0134](0134-better-auth-phase-1-security-configuration.md) | Better Auth Phase 1 強制安全配置清單 | Accepted |

---

## 編號分配

| Range | Topic | brainstorm 段 | 數量 |
|---|---|---|---|
| 0000 | Meta | (this folder's reason) | 1 |
| 0001-0023 | A — Tech stack | A1-A23 | 23 |
| 0024-0063 | B — Business rules | B1-B40 | 40 |
| 0064-0074 | C — Phase scope | C1-C11 | 11 |
| 0075-0088 | D — Law / privacy / compliance | D1-D14 | 14 |
| 0089-0103 | E — Security / RBAC | E1-E15 | 15 |
| 0104-0115 | F — Architecture / deployment | F1-F12 | 12 |
| 0116-0125 | G — Process / discipline | G1-G10 | 10 |
| 0126-0131 | H — Platform registration | H1-H6 | 6 |
| 0132+ | Post-brainstorm pivots | (amendments) | 1+ |

---

## 新增 ADR 流程

1. 開 `_template.md` copy 一份到下一個未用編號
2. 填 Status / Date / Context / Decision / Consequences / References
3. 把 entry 加進本檔的 Index 表
4. 跑 `pnpm audit:docs` 驗證編號連續、Status 合法、引用一致
5. commit（commit message 含 ADR 編號）

ADR 一旦 Accepted **不可改動實質內容**（typo OK）；決議變更 → 新開 ADR + 標舊 ADR `Superseded by`。詳見 [ADR-0000 § 不可變性紀律](0000-record-architecture-decisions.md#不可變性紀律)。
