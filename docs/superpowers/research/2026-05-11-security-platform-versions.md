---
日期：2026-05-11
研究員：Claude（Plan 2 Task 0 — Pre-code Research Gate）
依據：使用者 evidence-first 紀律 + Plan 2 plan Task 0
---

<!--
What:  Plan 2 第 0 task 的 pre-code research 結果。記錄 6 個核心技術 +
       4 個 γ-2 bundle 補充技術的官方來源驗證、當前 latest 版本、與 plan
       原引用版本的差異、是否有 breaking change。
Why:   Per feedback_pre_code_research_gate.md 紀律，寫程式前先研究官方
       文件並等使用者確認。Plan 2 plan 撰寫於 2026-05-08；2026-05-11 執
       行時某些版本可能已 bump，需驗證 plan 還活著。同時整合 γ-2 bundle
       (F-15 semgrep / F-19 Node 20 deprecation) 的版本查證，避免日後重做。
Where: docs/superpowers/research/2026-05-11-security-platform-versions.md
When:  Plan 2 Task 0 執行時（一次性；後續 task 直接讀此報告）。
-->

# Plan 2 Pre-code Research — Security Platform Versions

## 摘要表

| #   | 工具 / API                                       | Plan 引用版本           | 當前 latest (accessed 2026-05-11)           | 差異                            | Breaking change?                                |
| --- | ------------------------------------------------ | ----------------------- | ------------------------------------------- | ------------------------------- | ----------------------------------------------- |
| 1   | Dependabot config schema                         | v2                      | v2                                          | 無                              | 否                                              |
| 2   | Dependabot Security Updates                      | repository setting      | 相同                                        | 無                              | 否                                              |
| 3   | `PUT /repos/{owner}/{repo}/vulnerability-alerts` | 同                      | 同；admin 權限                              | 無                              | 否                                              |
| 4   | `zaproxy/action-baseline`                        | v0.15.0                 | v0.15.0 (2024-10-24)                        | 持平                            | 否                                              |
| 5   | GitHub Actions `schedule` cron                   | 5-field cron, min 5 min | 同                                          | 無；新增 `timezone:` 例         | 否                                              |
| 6   | `actions/github-script`                          | — (Plan 未鎖版本)       | v9.0.0 (2026-04-09)                         | n/a                             | v9 移除 `require('@actions/github')` — ESM-only |
| 7   | `semgrep/semgrep` image                          | `:1.86.0` (ci.yml 當前) | `:1.162.0` (2026-05-07)                     | 落後 76 minor releases / ~18 月 | 否（CLI flags 穩定）；rule 內容更新             |
| 8   | Node 20 deprecation                              | n/a                     | 2026-06-02 default→Node 24；2026-09-16 移除 | 21 天後生效                     | 是（runner 行為）                               |
| 9   | `patrickedqvist/wait-for-vercel-preview`         | v1.3.3                  | v1.3.3 (2022-01-21)                         | 持平                            | 否；但 action 4 年未更新 — 風險                 |
| 10  | `actions/checkout@v6` (ci.yml)                   | v6                      | v6.0.2 (2025-01-09)；Node 24                | n/a                             | 否                                              |
| 11  | `pnpm/action-setup@v4` (ci.yml)                  | v4                      | v6.0.6（v4.x 已回填 Node 24）               | major bump 可選                 | v4 已升 Node 24，可不 bump                      |
| 12  | `actions/setup-node@v4` (ci.yml)                 | v4                      | v6.4.0 (2024-04-20)；Node 24                | major bump 可選                 | v5+ 才上 Node 24                                |
| 13  | `gitleaks/gitleaks-action@v2`                    | v2                      | v2.3.9；Node 20 only                        | 持平 major                      | 仍為 Node 20，**有 deprecation 風險**           |

## 詳細

### 1. GitHub Dependabot 配置（`dependabot.yml`）

- **官方 URL**：<https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file>
- **accessed**：2026-05-11
- **v2 schema 仍為唯一支援**：是。原文：「Dependabot configuration syntax to use. Always: `2`.」
- **Top-level keys**：`version`（必填）、`updates`（必填）、`registries`（選填）、`multi-ecosystem-groups`（選填，新）。
- **新欄位 / breaking change since 2026-05-08**：
  - `multi-ecosystem-groups`：跨 ecosystem 合併 PR。
  - Cooldown periods、cross-directory grouping、新增 `quarterly` / `semiannually` / `yearly` schedule (GHES 3.19+)。
- **Deprecation**：無；`enable-beta-ecosystems` 標 "not currently in use"。

### 2. Dependabot Security Updates

- **官方 URL**：<https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates>
- **accessed**：2026-05-11
- **前置條件**：必須先開啟 dependency graph + Dependabot alerts。
- **觸發範圍**：只對 manifest / lock file 中列出的 dependencies 自動產生 PR（間接 dep 不會）。
- **無近期 breaking change**。

### 3. REST API：Enable vulnerability alerts

- **官方 URL**：<https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts>
- **accessed**：2026-05-11
- **Endpoint**：`PUT /repos/{owner}/{repo}/vulnerability-alerts`
- **權限**：authenticated user must have admin access to the repo。
- **回傳**：204 No Content on success。
- **Deprecation**：無。

### 4. `zaproxy/action-baseline`

- **官方 URL**：<https://github.com/zaproxy/action-baseline/releases>
- **accessed**：2026-05-11
- **Plan 引用**：v0.15.0
- **Latest**：v0.15.0（2024-10-24，"Update dependencies. Run with node24."）
- **差異**：無；plan 引用即 latest。
- **節點版本**：v0.15.0 已使用 Node 24 → **不受 6/2 deprecation 影響**。

### 5. GitHub Actions schedule cron 語法

- **官方 URL**：<https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule>
- **accessed**：2026-05-11
- **語法**：5 欄 POSIX cron（minute hour day-of-month month day-of-week）。
- **最小間隔**：5 分鐘。
- **新功能**：`timezone:` field（可指定時區，避免 UTC 與 DST 混淆）。
- **公開 repo 60 天無活動自動停用 schedule**（Plan 2 task 4 weekly ZAP 須注意）。

### 6. `actions/github-script`

- **官方 URL**：<https://github.com/actions/github-script>
- **accessed**：2026-05-11
- **Latest**：v9.0.0（2026-04-09）
- **Breaking change**：`require('@actions/github')` 不再可用（ESM-only）；改用 injected `getOctokit`。
- **Plan 2 task 5 影響**：plan 未指定版本；建議鎖 `@v9` 並用 ESM 寫法。

### γ-2 bundle 補充

#### 7. semgrep image 版本

- **官方 URL**：<https://github.com/semgrep/semgrep/releases>
- **accessed**：2026-05-11
- **ci.yml 當前**：`semgrep/semgrep:1.86.0`（從 git history 看為 2024-10 釘版）
- **Latest**：`semgrep/semgrep:1.162.0`（2026-05-07）
- **落後**：76 minor releases、~18 月
- **重要變化**（從 release notes 摘要）：
  - v1.162.0：JSON rule files parse 5× faster (134s → 28s)
  - 多版本含 credential redaction（防止 secrets 隨錯誤訊息洩出）
  - **OWASP Top Ten ruleset**：semgrep 官方 release notes 未列 ruleset 變更（ruleset 為 server-side maintained，`p/owasp-top-ten` 引用方式不變）— ❓ 無法從 releases 頁面直接驗證 ruleset rule 內容差異，需另查 `semgrep.dev` registry，**Plan 2 Task 4-mid-audit 補查**。
- **CLI breaking change**：未發現（`semgrep --config p/owasp-top-ten --error` 持續有效）。
- **建議**：Plan 2 PR 內 bump 至 `semgrep/semgrep:1.162.0`（γ-2 F-15 一併處理）。

#### 8. Node 20 deprecation 2026-06-02

- **官方 URL**：<https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/>
- **accessed**：2026-05-11
- **Timeline**：
  - 2026-06-02：runners 預設 Node 24（21 天後生效）
  - 2026-09-16：Node 20 從 runner 完全移除
- **當前 ci.yml 涉及 actions 與 Node 版本狀態**：

  | Action                            | ci.yml 引用 | Node 20→24 狀態                        | 行動                                                                                                                        |
  | --------------------------------- | ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
  | `actions/checkout@v6`             | v6          | v6.0.0+ 用 Node 24                     | 已安全 ✓                                                                                                                    |
  | `pnpm/action-setup@v4`            | v4          | v4.3.0+ 已回填 Node 24（同 v5/v6）     | 已安全 ✓                                                                                                                    |
  | `actions/setup-node@v4`           | v4          | v5+ 才上 Node 24；**v4 仍 Node 20**    | **需 bump 至 v5 或 v6**                                                                                                     |
  | `gitleaks/gitleaks-action@v2`     | v2          | v2.3.9 仍 Node 20；上游無 Node 24 plan | **風險**：可加 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` env workaround，但官方 issue #4295 顯示該 flag 仍會觸發 warning |
  | `zaproxy/action-baseline@v0.15.0` | v0.15.0     | 已 Node 24                             | 已安全 ✓                                                                                                                    |

- **opt-out flag**：`ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true`（僅延緩至秋季 runner 升級）— **不建議使用，違背 security baseline 精神**。
- **建議**：
  1. ci.yml 將 `actions/setup-node@v4` → `@v6`（Plan 2 task 4 內完成）
  2. `gitleaks/gitleaks-action@v2` 持續關注上游 Node 24 release；γ-2 F-19 記錄 known-risk
  3. **不設** `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` 全域 env（會掩蓋 gitleaks-action 真實狀態）

#### 9. `zaproxy/action-baseline`

- **官方 URL**：<https://github.com/zaproxy/action-baseline/releases>
- **accessed**：2026-05-11
- **Plan 引用**：v0.15.0
- **Latest**：v0.15.0（2024-10-24；無更新）
- **差異**：無
- **建議**：Plan 2 task 4 維持 `@v0.15.0`。

#### 10. `patrickedqvist/wait-for-vercel-preview`

- **官方 URL**：<https://github.com/patrickedqvist/wait-for-vercel-preview/releases>
- **accessed**：2026-05-11
- **Plan 引用**：v1.3.3
- **Latest**：v1.3.3（2022-01-21）
- **差異**：無；但 **action 4 年未更新**。
- **風險**：
  - `action.yml` 內部仍使用 `node16`（v1.3.1 release note）；node16 早已 EOL。
  - 2026-06-02 起此 action 可能完全無法執行（runner default Node 24 但 action.yml 明確要求 node16）。
- **建議**：
  - Plan 2 task 4 暫時引用 `@v1.3.3`，但須在 mini-audit 標 **HIGH risk** + γ-2 raised P2 follow-up（找替代或自研 polling）。
  - 替代候選：直接用 `gh api repos/:owner/:repo/deployments` + retry loop 自寫（無第三方相依）。

## 對 Plan 2 後續 task 的影響

1. **Task 4 (ZAP baseline workflow)**：
   - `zaproxy/action-baseline@v0.15.0` ✓ 不動
   - `wait-for-vercel-preview@v1.3.3` ⚠️ 標 risk，併入 γ-2 mini-audit；考慮 inline polling 替代
   - `actions/setup-node` 若用到 → bump v6
2. **Task 5 (Dependabot security updates issue creator)**：
   - `actions/github-script@v9` 必須鎖版本，ESM 寫法。
3. **γ-2 bundle 在 Plan 2 PR 內處理**：
   - F-15：ci.yml 內 `semgrep/semgrep:1.86.0` → `:1.162.0` bump
   - F-19：`actions/setup-node@v4` → `@v6`；gitleaks-action 標 known-risk

## 待釐清 / 標 ❓

- semgrep `p/owasp-top-ten` ruleset 實際 rule diff（2024-10 vs 2026-05）— release notes 未列；需查 semgrep registry，**留 Plan 2 task 4 執行時補查**。
- `gitleaks/gitleaks-action` 上游 Node 24 timeline — 上游無公開承諾；**γ-2 F-19 標 P2 follow-up**。

## 引用清單（all accessed 2026-05-11）

- [Dependabot config options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [About Dependabot security updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates)
- [REST API: Enable vulnerability alerts](https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts)
- [zaproxy/action-baseline releases](https://github.com/zaproxy/action-baseline/releases)
- [GitHub Actions schedule cron](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [actions/github-script](https://github.com/actions/github-script)
- [semgrep/semgrep releases](https://github.com/semgrep/semgrep/releases)
- [patrickedqvist/wait-for-vercel-preview releases](https://github.com/patrickedqvist/wait-for-vercel-preview/releases)
- [Node 20 deprecation changelog (2025-09-19)](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
- [actions/checkout releases](https://github.com/actions/checkout/releases)
- [pnpm/action-setup releases](https://github.com/pnpm/action-setup/releases)
- [actions/setup-node releases](https://github.com/actions/setup-node/releases)
- [gitleaks/gitleaks-action releases](https://github.com/gitleaks/gitleaks-action/releases)

## Plan 2 執行紀錄

### Task 1: Dependabot 啟用（2026-05-11）

- `gh api repos/BigMikeTW/rrms/vulnerability-alerts -X PUT` → HTTP 204 ✓
- `gh api repos/BigMikeTW/rrms/automated-security-fixes -X PUT` → HTTP 204 ✓
- 驗證 readback：
  - vulnerability-alerts GET → 204（enabled）✓
  - automated-security-fixes GET → `{"enabled": true, "paused": false}` ✓

### Task 2: Dependabot config（2026-05-11）

- `.github/dependabot.yml` 已建立（v2 schema，npm + github-actions 兩 ecosystem）
- weekly Monday 06:00 Asia/Taipei
- minor + patch grouped；major 個別 PR
- 4W docstring 完整；引 ADR-0134 #5 + spec §6.7.4
- commit SHA: 7953b7d
- 驗證：等 Plan 2 PR merge 後檢查 GitHub Insights → Dependabot 是否 active

### Task 4: ZAP baseline scan on PR（2026-05-11）

- `.zap/rules.tsv` 建立（3 條 rule：CSP / Permissions-Policy IGNORE、in-page banner WARN）
- `.github/workflows/security-zap-pr.yml` 建立（Q1 decision: inline `gh api deployments` polling 取代 `wait-for-vercel-preview`；γ-2 F-19 用 `actions/setup-node@v6` + `actions/checkout@v6`）
- 跳過 plan 原 Step 3 test PR — 合併到 Task 9 XSS red-team 一次驗證（PR 數量精簡）
- 4W 完整；引 spec §6.7.4 + γ-2 F-19
- commit SHA (workflow): 89df91a
- commit SHA (research log): (this commit)

### Task 5: Daily ZAP scan（2026-05-11）

- `.github/workflows/security-zap-daily.yml` 建立
- cron: `0 18 * * *` (18:00 UTC = 02:00 Asia/Taipei)
- workflow_dispatch 加入（manual trigger 備援）
- target: `https://rrms-black.vercel.app`（Plan 8 DNS 換 rrms.pro080.com 時再改）
- 跳過 plan 原 Step 2 手動觸發測試（PR merge 後使用者自行 trigger 驗證）
- commit SHA: c15aaec
