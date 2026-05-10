# RRMS Phase 1 — Plan 2: Cross-Cutting Security Testing Platform

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **給人類使用者**：本計畫為 Phase 1 第 2/8 份計畫。**依賴 Plan 1 已完成**（CI、Branch protection、五層中 L1/L2/L4 已就位）。本計畫加上跨 feature 的水平資安測試與監控基礎設施。

**Goal:** 建立四層跨 feature 的水平資安基礎設施：(1) Dependabot 套件供應鏈漏洞自動偵測與修補 PR、(2) `npm audit` 在 CI 強制檢查、(3) OWASP ZAP baseline scan 在 PR 與排程觸發、(4) 偵測失敗自動開 GitHub issue 並 email 通知。完成後，無論後續 Plan 3-8 寫了什麼 feature，每個 PR 都會被掃描，每天凌晨會被排程掃，已知 CVE 的套件都會被自動偵測並提示升級。

**Architecture:** GitHub Dependabot（GitHub 內建免費）監控 npm + GitHub Actions 套件版本，命中漏洞時開 PR 升級；新增 GitHub Actions workflow `security-zap.yml` 在 PR 與每日凌晨對 Vercel preview / production URL 跑 ZAP baseline scan；新增 `npm-audit` job 在主 CI 強制執行；任一掃描出問題 → `actions/github-script` 自動開 GitHub issue 並標記 `security` label，repo 預設會把該 issue email 給 maintainer。

**Tech Stack:**
- GitHub Dependabot（GitHub 原生功能；零成本）
- `dependabot.yml` 設定檔（v2 schema）
- `npm audit`（pnpm 內建）
- OWASP ZAP（透過 `zaproxy/action-baseline` GitHub Action）
- `actions/github-script`（自動開 issue）
- GitHub REST API（透過 `gh` CLI 開啟 vulnerability alerts）

> **⚠ 必做的順手修：GitHub Actions Node 20 deprecation**
> Plan 1 落地的 `ci.yml` 用了 `gitleaks-action@v2`、`pnpm/action-setup@v4`、`actions/setup-node@v4` — 這三個 action 的 underlying Node 20 runtime 將於 **2026-06-02** 停用。Plan 2 第一個 task 在動 `ci.yml` 之前，先 fetch 各 action 的最新 release，看是否已有 Node 24 版本可升；若無，加 workflow-level env：`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` 提前 opt-in。Dependabot 設好後也會自動偵測這條並開升級 PR。

---

## Spec 對照

對應 spec [docs/superpowers/specs/2026-05-07-rrms-phase1-design.md](../specs/2026-05-07-rrms-phase1-design.md):

| Spec 章節 | 本計畫覆蓋 |
|---|---|
| 6.7.4 共用掃描清單第 6 項「semgrep OWASP rule pack」 | Plan 1 已部分；本計畫補 ZAP baseline 為動態驗證 |
| 6.7.4 Phase 1 啟用清單第 9 項「驗證五層皆能正確擋下故意植入的 secret」 | Task 9 + Task 10 紅隊驗證 |
| 6.8 外洩通報 SOP（內部文件） | Task 8 提供實作版 incident response playbook |
| 9. 風險與假設 | Dependabot 自動處理「依賴套件突發漏洞」這類風險 |

---

## File Structure

完成本計畫後新增：

```
RRMS/
├── .github/
│   ├── dependabot.yml                                # Dependabot 設定
│   └── workflows/
│       ├── ci.yml                                    # 已存在；本計畫修改加 npm-audit job
│       ├── security-zap-pr.yml                       # 每 PR 跑 ZAP baseline
│       └── security-zap-daily.yml                    # 每日 02:00 跑 ZAP baseline
├── docs/
│   └── security/
│       └── incident-response-playbook.md             # 安全事件回應流程
└── .zap/
    └── rules.tsv                                     # ZAP 規則配置（哪些警告升 fail、哪些 warn）
```

---

## Pre-Tasks: 確認 Plan 1 已完成

繼續之前必須先確認 Plan 1 完整通過：

- [ ] Plan 1 Task 14 Step 7 已回報「Vercel preview pipeline 通過」
- [ ] `bash scripts/red-team-test.sh` 在 Plan 1 結束時顯示 `Pass: 2 / 2`
- [ ] GitHub repo Settings → Branches 顯示 `main` 分支有 protection rule，required status checks 含 4 個 jobs
- [ ] 本機 `pnpm dev` 跑得起來、看到 RRMS 首頁

**全部通過才進 Task 0。**

---

## Plan 2 整體分支策略

依 [`feedback_pr_flow.md`](../../../../Users/Mike%20Lin/.claude/projects/c--APP-Project-RRMS/memory/feedback_pr_flow.md) 工作規則 — 1 PR per Plan + Plan 2-7 走 auto-merge + 禁直接 push `main`。

整個 Plan 2（Task 1-12 + 紅隊驗證）在**單一** feature branch 上做：

```powershell
git checkout main
git pull --ff-only
git checkout -b feat/plan-2-cross-cutting-security
```

> **Task 4/6/8/9 中另外開的「test PR」與本 implementation branch 平行**，是短命 red-team branch（如 `test/zap-pipeline`、`red-team/dependabot`、`red-team/zap-xss`）。驗證後 `gh pr close --delete-branch` 關掉，不 merge。它們和 implementation branch 無關。

收尾 PR 流程：

```powershell
git push -u origin feat/plan-2-cross-cutting-security
gh pr create --title "feat: Plan 2 — Cross-Cutting Security Platform" --body "..."
gh pr merge <PR#> --auto --merge
```

> **Branch Protection 變更紀律**：本 plan 中所有 `gh api .../branches/main/protection -X PUT` 指令統一在 **Task 10 Step 1** 一次完成。理由：GitHub branch protection [PUT API](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection) 是整個 protection object 取代，多次 PUT 容易因省略欄位（例如 `enforce_admins`、`required_pull_request_reviews.dismiss_stale_reviews`、`restrictions=null`）誤關現有保護。Task 3 / Task 5 / Task 7 等中間 task 不再單獨動 protection。

---

## Task 0: Pre-code Research Gate

> 本任務不寫程式，只查證、回報、等使用者確認。對應 [feedback_pre_code_research_gate.md](../../../../Users/Mike%20Lin/.claude/projects/c--APP-Project-RRMS/memory/feedback_pre_code_research_gate.md) 工作規則。

- [ ] **Step 1：fetch 各官方文件，記錄當下 latest stable 版本與 API 變化**

| 技術 / 工具 | 官方文件 |
|---|---|
| GitHub Dependabot 配置 | https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file |
| Dependabot Security Updates 啟用 | https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates |
| `gh api` repos vulnerability-alerts | https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts |
| OWASP ZAP Baseline GitHub Action | https://github.com/zaproxy/action-baseline |
| GitHub Actions schedule cron 語法 | https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule |
| `actions/github-script` 開 issue 範例 | https://github.com/actions/github-script |

- [ ] **Step 2：記錄到 `docs/superpowers/research/2026-05-08-security-platform-versions.md`**

每項記下：版本號、官方 URL、是否與本計畫所列一致、是否有 breaking change 須注意。

- [ ] **Step 3：報告給使用者，等回「OK 繼續」再進 Task 1**

- [ ] **Step 4：commit research 報告**

```bash
git add docs/superpowers/research/2026-05-08-security-platform-versions.md
git commit -m "docs: research security platform versions"
```

---

## Task 1: 啟用 Dependabot Vulnerability Alerts + Security Updates（透過 gh API）

對應供應鏈漏洞偵測層。

- [ ] **Step 1：跟使用者確認要對哪個 repo 操作**

> ⚠️ 修改 GitHub repo 設定屬於「shared state」。執行前必須使用者確認。

執行前對使用者說：
> 「我準備跑兩個 `gh api` 指令對 `<owner>/rrms` 啟用 Dependabot vulnerability alerts 與 automated security fixes。這會修改你 GitHub repo 設定，效果是當套件被公告漏洞時自動發 email 通知 + 自動開升級 PR。OK 嗎？」

得「OK」後繼續。

- [ ] **Step 2：用 gh CLI 啟用 vulnerability alerts**

```powershell
gh api repos/<owner>/rrms/vulnerability-alerts -X PUT
```
> 把 `<owner>` 換成你的 GitHub 帳號。

預期：HTTP 204 No Content（無輸出，return 0）。

- [ ] **Step 3：啟用 automated security fixes（自動開升級 PR）**

```powershell
gh api repos/<owner>/rrms/automated-security-fixes -X PUT
```

預期：HTTP 204 No Content。

- [ ] **Step 4：使用者手動驗證**

到 `https://github.com/<owner>/rrms/settings/security_analysis`，確認：
- Dependabot alerts：**Enabled**
- Dependabot security updates：**Enabled**

跟我回報「兩項已啟用」。

---

## Task 2: 寫 .github/dependabot.yml

對應 Dependabot 排程式套件升級檢查。

- [ ] **Step 1：建立 .github/dependabot.yml**

```yaml
# .github/dependabot.yml
# 版本: 2 (官方目前唯一支援版本)
# 來源: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file

version: 2
updates:
  # npm 套件（所有 RRMS 直接 / 間接依賴）
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
      timezone: "Asia/Taipei"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    commit-message:
      prefix: "chore(deps)"
    groups:
      # 把同類 minor / patch 升級合併成一個 PR，減少 PR 噪音
      minor-and-patch:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions 自身的版本（example: actions/checkout@v6）
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
      timezone: "Asia/Taipei"
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "chore(actions)"
```

- [ ] **Step 2：commit + push**

```powershell
git add .github/dependabot.yml
git commit -m "feat(security): enable Dependabot weekly version updates"
git push
```

- [ ] **Step 3：使用者驗證 Dependabot 開始運作**

去 `https://github.com/<owner>/rrms/network/updates`，確認：
- 看到 Dependabot 列表
- 「Last checked」有時間戳

第一次掃可能要等幾分鐘到一小時。回報「Dependabot 已啟動」。

---

## Task 3: 加 npm audit job 到 CI

對應 spec 6.7.4 共用掃描清單。

- [ ] **Step 1：修改 .github/workflows/ci.yml 加上 npm-audit job**

開 `.github/workflows/ci.yml`，在 `jobs:` 區塊內補：

```yaml
  npm-audit:
    name: npm audit (high+)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Audit dependencies (fail on high+ severity)
        run: pnpm audit --audit-level=high
```

> 為什麼選 `high`：讓 low / moderate 級別的漏洞由 Dependabot 處理（自動開 PR），CI 只擋 high / critical 等級避免太多 PR 被擋住。

- [ ] **Step 2：本機跑一次驗證可通過**

```powershell
pnpm audit --audit-level=high
```

預期：可能列出一些 low/moderate（OK，會被忽略），不應有 high/critical。

- [ ] **Step 3：commit + push，CI 跑出綠勾**

```powershell
git add .github/workflows/ci.yml
git commit -m "ci(security): add npm audit job (high+ severity)"
git push
```

去 GitHub Actions 看 npm-audit job 通過。

> **Branch Protection 整合**：本 task 不單獨動 main 的 branch protection（避免多次 PUT 誤關欄位）。`npm audit (high+)` 連同其他新增 jobs 在 Task 10 Step 1 一次加進 required status checks。

---

## Task 4: 加 OWASP ZAP Baseline Scan 到 PR CI

對應 spec 6.7.4 共用掃描清單第 6 項（semgrep OWASP）動態版本。

- [ ] **Step 1：建立 `.zap/rules.tsv`（自訂 ZAP 規則）**

```tsv
# .zap/rules.tsv
# Plugin ID	Threshold	New Threshold
# 把雜訊高、又非 RRMS 重點的警告降為 warn
10038	IGNORE	# Content Security Policy header missing - 之後再加
10063	IGNORE	# Permissions Policy header missing - 之後再加
10009	WARN	# In-page banner information leak - 警告但不 fail
```

> 來源：ZAP rule list https://www.zaproxy.org/docs/alerts/

- [ ] **Step 2：建立 `.github/workflows/security-zap-pr.yml`**

```yaml
# .github/workflows/security-zap-pr.yml
# 每個 PR 開立 / 更新時對 Vercel preview URL 跑 ZAP baseline

name: Security — ZAP baseline (PR)

on:
  pull_request:
    branches: [main]

jobs:
  zap-baseline:
    name: ZAP baseline scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write

    steps:
      - name: Wait for Vercel preview
        # Vercel 部署完 preview URL 才能掃。等 Vercel bot 留 deployment status
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.3
        id: vercel
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 600

      - name: Checkout
        uses: actions/checkout@v6

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.15.0
        with:
          target: ${{ steps.vercel.outputs.url }}
          rules_file_name: '.zap/rules.tsv'
          fail_action: true
          allow_issue_writing: true
          issue_title: '[Security] ZAP baseline scan failed on PR #${{ github.event.pull_request.number }}'
```

來源：
- ZAP Baseline Action https://github.com/zaproxy/action-baseline
- wait-for-vercel-preview Action https://github.com/patrickedqvist/wait-for-vercel-preview

- [ ] **Step 3：commit + push + 開 PR 驗證**

```powershell
git add .zap/rules.tsv .github/workflows/security-zap-pr.yml
git commit -m "ci(security): add OWASP ZAP baseline scan on PR"
git push

# 開測試 PR
git checkout -b test/zap-pipeline
"# trigger CI" >> README.md
git add README.md
git commit -m "test: trigger ZAP CI"
git push origin test/zap-pipeline
gh pr create --title "test: ZAP pipeline" --body "Verify ZAP scans Vercel preview"
```

到 PR 頁面確認：
- Vercel preview 部署完成
- `Security — ZAP baseline (PR)` workflow 啟動
- ZAP 掃 preview URL 通過（無 high alert）

驗證後關 PR 不 merge：
```powershell
gh pr close <PR 號碼> --delete-branch
git checkout main
```

---

## Task 5: 排程式每日 ZAP scan（02:00 Asia/Taipei）

對應 spec 6.7.4 中「持續安全監控」概念。

- [ ] **Step 1：建立 `.github/workflows/security-zap-daily.yml`**

```yaml
# .github/workflows/security-zap-daily.yml
# 每天凌晨 02:00 (Asia/Taipei = UTC 18:00 前一天) 對 production URL 跑 ZAP baseline

name: Security — ZAP daily

on:
  schedule:
    - cron: '0 18 * * *'  # 18:00 UTC = 02:00 Asia/Taipei
  workflow_dispatch:  # 也允許手動觸發以便測試

jobs:
  zap-daily:
    name: ZAP baseline scan (production)
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.15.0
        with:
          target: 'https://rrms.pro080.com'
          rules_file_name: '.zap/rules.tsv'
          fail_action: true
          allow_issue_writing: true
          issue_title: '[Security] Daily ZAP scan failed (production)'
```

> 把 `rrms.pro080.com` 換成你的真實 production 域名（Plan 8 設定 DNS 後才有真值；本任務先填 Vercel 預設 `https://rrms.vercel.app`，未來 Plan 8 再改）。

- [ ] **Step 2：手動觸發測試**

```powershell
git add .github/workflows/security-zap-daily.yml
git commit -m "ci(security): add daily ZAP scan against production"
git push
gh workflow run "Security — ZAP daily"
```

到 GitHub Actions 看新 workflow run，確認可以對 production URL 完成掃描。

---

## Task 6: 失敗 → 自動開 GitHub Issue

兩個 ZAP workflow 已內建 `allow_issue_writing: true`。本任務驗證失敗時 issue 真的會被建立。

- [ ] **Step 1：暫改 `.zap/rules.tsv`，把某個常見警告強制升 fail**

```tsv
# 暫時：把 X-Content-Type-Options missing 升為 FAIL（Vercel 預設可能沒給）
10021	FAIL
```

- [ ] **Step 2：開 PR 觸發 ZAP**

```powershell
git checkout -b test/zap-issue-creation
git add .zap/rules.tsv
git commit -m "test: force ZAP fail to verify issue creation"
git push origin test/zap-issue-creation
gh pr create --title "test: ZAP issue creation" --body "Verify issue auto-created on fail"
```

- [ ] **Step 3：驗證 issue 自動建立**

到 `https://github.com/<owner>/rrms/issues`，看到一個 title 含 `[Security] ZAP baseline scan failed on PR #...` 的 issue，內容含 ZAP 報告連結。

- [ ] **Step 4：復原 .zap/rules.tsv**

把 step 1 的修改改回 `10021	IGNORE` 或刪除該行。close test PR、close test issue。

```powershell
gh pr close <PR 號碼> --delete-branch
gh issue close <issue 號碼>
git checkout main
```

---

## Task 7: 文件化資安事件回應 Playbook

對應 spec 6.8 SOP 的具體可執行版。

- [ ] **Step 1：建立 `docs/security/incident-response-playbook.md`**

```markdown
# RRMS 資安事件回應 Playbook

對應 spec 6.8 外洩通報 SOP 與個資法第 12 條。

## 事件分類

| 類別 | 範例 | 嚴重度 |
|---|---|---|
| **A. 套件漏洞 (CVE)** | Dependabot alert / npm audit 警告 | low - critical |
| **B. 動態掃描警告** | ZAP daily scan 報 high+ | high |
| **C. 認證 / 授權異常** | 後台被未授權存取、cookie 被盜 | critical |
| **D. 資料外洩疑慮** | DB 誤刪、客戶反映看到別人資料、log 含個資 | critical |
| **E. 服務不可用** | Vercel 部署失敗、DB 連線異常 | medium-high |

## 各類別處理流程

### A. Dependabot / npm audit 警告

1. 收到 email / 看到 GitHub Security 分頁警告
2. 1 小時內：點開 alert 看影響版本與修復版本
3. 24 小時內：審 Dependabot 自動開的 PR；CI 通過 → merge
4. 如果 Dependabot 沒自動開 PR（套件無修復版本）：
   - 評估能否切換套件
   - 評估能否暫時移除使用該套件的 feature
   - 在 issue 紀錄處置決策
5. **不**忽略；不修就持續被 CI 擋

### B. ZAP daily scan 報 high+

1. 收到 issue 通知
2. 1 小時內：開 issue 看 ZAP 報告
3. 4 小時內：判斷是 false positive 還是真漏洞
   - false positive → 在 `.zap/rules.tsv` 加例外、commit、結 issue
   - 真漏洞 → 開修補 PR、含 regression test

### C. 認證 / 授權異常（critical）

1. **立即**：通報內部 LINE 群組
2. 1 小時內：管理員停用受影響帳號 / 輪替 secret
3. 24 小時內：依個資法第 12 條評估是否須通知當事人
4. 72 小時內：通知當事人 + 依需要通報主管機關
5. 全程紀錄：時間、判斷、處置 → 存 `docs/security/incidents/YYYY-MM-DD-<short>.md`

### D. 資料外洩疑慮（critical）

1. 同 C 1-5
2. 額外：立即停用該功能（feature flag / Vercel rollback）
3. 額外：抓出受影響範圍（哪些客戶、哪些欄位）
4. 額外：依匿名化 SOP 處理已外洩個資

### E. 服務不可用

1. 1 小時內：Vercel rollback 到上一版
2. 4 小時內：在 GitHub repo 開 incident issue 紀錄
3. 評估是否需通知客戶

## 通報窗口

- 內部首要窗口：（公司 LINE 群組 / Email，plan 8 上線時填）
- 個資法主管機關：依目的事業主管機關（待確認）
- 法律顧問：（公司聘請的，plan 8 上線時填）

## Secret 輪替清單

當需要輪替 secret 時依序處理（必須記在 audit log）：

| Secret | 輪替方式 | 影響 |
|---|---|---|
| `DATABASE_URL` | Neon dashboard 重設密碼 → 更新 Vercel env | 重新部署觸發新 connection |
| `BETTER_AUTH_SECRET` | 自行生成 32 字元 random → 更新 Vercel env | 所有現有 session 失效，使用者需重新登入 |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | LINE Developers Console reissue | 推播暫斷直到 token 更新；舊 token 30 分鐘內失效 |
| `LINE_MESSAGING_CHANNEL_SECRET` | LINE Developers Console reissue | webhook 簽章驗證會用新 secret |
| `DROPBOX_REFRESH_TOKEN` | Dropbox App Console revoke + 重新 OAuth | 媒體上傳暫停，需在後台重綁 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console reset | Google 登入暫停直到更新 |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Developers Console reissue | LINE 登入暫停直到更新 |

## 演練

每季一次紅隊演練（紙上推演）：
- 隨機抽一個情境（A-E）
- 計時走完一遍流程
- 檢討哪裡卡關 → 更新 playbook
```

- [ ] **Step 2：commit**

```powershell
git add docs/security/incident-response-playbook.md
git commit -m "docs(security): add incident response playbook"
```

---

## Task 8: 紅隊驗證 — Dependabot 真的能偵測 CVE

對應 spec 6.7.4 紅隊驗證精神。

- [ ] **Step 1：研究一個有公開 CVE 但 npm 上仍可安裝的舊版本套件**

例：`lodash@4.17.20` 有 CVE-2021-23337（Prototype Pollution）。

去 https://github.com/advisories?query=lodash 搜尋確認（findings 隨時間更新；以 fetch 當下為準）。

- [ ] **Step 2：故意安裝該漏洞版本**

```powershell
git checkout -b red-team/dependabot
pnpm add lodash@4.17.20
git add package.json pnpm-lock.yaml
git commit -m "RED TEAM: intentionally install vulnerable lodash"
git push origin red-team/dependabot
```

- [ ] **Step 3：等 npm-audit job 跑完**

預期：CI 的 `npm-audit` job **失敗**，列出 lodash 漏洞。

- [ ] **Step 4：等待 Dependabot 偵測（最多 24 小時，通常 1 小時內）**

去 `https://github.com/<owner>/rrms/security/dependabot`，看到 lodash 4.17.20 的 alert。

- [ ] **Step 5：驗證 Dependabot 自動開升級 PR**

到 PR 列表看 Dependabot 開的 PR：「Bump lodash from 4.17.20 to 4.17.21」。

- [ ] **Step 6：清理**

```powershell
gh pr close <Dependabot PR 號碼>
gh pr close <red-team PR 號碼> --delete-branch
git checkout main
```

- [ ] **Step 7：把驗證結果寫進 research 報告**

`docs/superpowers/research/2026-05-08-dependabot-redteam-result.md`：
```markdown
# Dependabot 紅隊驗證結果

日期：2026-05-08（執行當日填）
方法：故意安裝 lodash@4.17.20（有公開 CVE-2021-23337）

結果：
- npm-audit job：✅ FAIL（如預期擋下）
- Dependabot Security Advisory：✅ 偵測到（X 小時內）
- 自動升級 PR：✅ 出現
```

```powershell
git add docs/superpowers/research/2026-05-08-dependabot-redteam-result.md
git commit -m "test(security): verify Dependabot detects planted CVE"
```

---

## Task 9: 紅隊驗證 — ZAP 真的能偵測常見漏洞

- [ ] **Step 1：建立故意有 XSS 漏洞的測試頁**

```tsx
// src/app/red-team-xss/page.tsx
// RED TEAM TEST PAGE — 故意有 reflected XSS，測 ZAP 能不能抓到。
// 驗證後本檔會被刪除。

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // 故意：使用 dangerouslySetInnerHTML 反射使用者輸入（真實漏洞）
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<p>You searched: ${q ?? ""}</p>`,
      }}
    />
  );
}
```

- [ ] **Step 2：開 PR 觸發 ZAP**

```powershell
git checkout -b red-team/zap-xss
git add src/app/red-team-xss
git commit -m "RED TEAM: planted reflected XSS for ZAP verification"
git push origin red-team/zap-xss
gh pr create --title "RED TEAM: ZAP XSS detection" --body "Should fail"
```

- [ ] **Step 3：等 Vercel preview + ZAP scan 跑完**

預期：`Security — ZAP baseline (PR)` workflow **失敗**，issue 自動建立，標題含 `[Security] ZAP baseline scan failed`。

- [ ] **Step 4：清理**

```powershell
gh pr close <PR 號碼> --delete-branch
gh issue close <issue 號碼>
git checkout main
```

- [ ] **Step 5：把驗證結果寫進 research 報告**

`docs/superpowers/research/2026-05-08-zap-redteam-result.md`：
```markdown
# ZAP baseline 紅隊驗證結果

日期：2026-05-08（執行當日填）
方法：故意建立 src/app/red-team-xss/page.tsx，使用 dangerouslySetInnerHTML 反射 query string

結果：
- ZAP baseline workflow：✅ FAIL（如預期擋下）
- 自動開立 GitHub issue：✅ 已建立
- 偵測到的警告：（從 ZAP 報告貼相關內容）
```

```powershell
git add docs/superpowers/research/2026-05-08-zap-redteam-result.md
git commit -m "test(security): verify ZAP detects planted XSS"
```

---

## Task 10: 把新 jobs 加進 Branch Protection required checks

> **單次 PUT 統一所有 contexts**：本 plan 中所有 branch protection 變更僅在此 task 動一次。原因見 [Plan 2 整體分支策略](#plan-2-整體分支策略) 中對 GitHub PUT API 行為的說明。

- [ ] **Step 1：用 gh API 更新 branch protection（含 Phase 5 新增的 doc-audit job）**

```powershell
gh api repos/<owner>/rrms/branches/main/protection -X PUT `
  -F "required_status_checks.strict=true" `
  -F "required_status_checks.contexts[]=gitleaks" `
  -F "required_status_checks.contexts[]=ESLint + tsc" `
  -F "required_status_checks.contexts[]=Client bundle scan" `
  -F "required_status_checks.contexts[]=semgrep OWASP" `
  -F "required_status_checks.contexts[]=npm audit (high+)" `
  -F "required_status_checks.contexts[]=ZAP baseline scan" `
  -F "required_status_checks.contexts[]=doc-audit" `
  -F "enforce_admins=true" `
  -F "required_pull_request_reviews.dismiss_stale_reviews=true" `
  -F "restrictions=null"
```

> **欄位完整性 sanity check**：上述指令必須含 `enforce_admins=true` + `required_pull_request_reviews.dismiss_stale_reviews=true` + `restrictions=null`，因為 GitHub branch protection [PUT API](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection) 是整物件取代，省略的欄位 = 重置為預設值。Plan 1 既設的 `enforce_admins=true` 與 `dismiss_stale_reviews=true` **不能在此 task 被默默關掉**。
>
> Task 11 的 Vercel build secret scan / L5 是 Vercel 平台級檢查、**不是 GitHub Actions context**，因此不在 required_status_checks 列；改透過 vercel.ts buildCommand 強制（build fail = deploy fail = effectively block）。

- [ ] **Step 2：使用者驗證網頁設定**

到 `https://github.com/<owner>/rrms/settings/branches`，確認 main 的 protection rule 中 required status checks 含全部 7 項（Plan 1 的 4 個 + Plan 2 的 3 個：`npm audit (high+)`、`ZAP baseline scan`、`doc-audit`），且 `enforce_admins` 與 `dismiss_stale_reviews` 仍開啟。

- [ ] **Step 3：紅隊驗證 — 開 PR 故意製造任一 check fail，驗證不能 merge**

例如直接拿 Task 9 同樣方法（XSS 測試頁）開 PR，確認 PR 頁面 Merge 按鈕被鎖。

驗證後關 PR。

---

## Plan 2 驗收條件（Definition of Done）

✅ 全部達成才算完成：

- [ ] GitHub repo Settings → Code security and analysis 顯示：Dependabot alerts + Dependabot security updates 兩個都 Enabled
- [ ] `.github/dependabot.yml` 存在且 GitHub 識別（看 `network/updates` 頁有列表）
- [ ] CI workflow 含 `npm-audit` job，PR 觸發時跑通
- [ ] `Security — ZAP baseline (PR)` workflow 在每個 PR 開立後對 Vercel preview URL 跑 ZAP，通過則綠勾
- [ ] `Security — ZAP daily` workflow 設定每日 02:00 Asia/Taipei 排程，並至少手動觸發過一次成功
- [ ] ZAP scan 失敗會自動開 GitHub issue（Task 6 驗證過）
- [ ] `docs/security/incident-response-playbook.md` 存在
- [ ] Dependabot 紅隊驗證通過（Task 8）
- [ ] ZAP 紅隊驗證通過（Task 9）
- [ ] Branch Protection required status checks 含 8 項：gitleaks、ESLint + tsc、Client bundle scan、semgrep OWASP、npm audit (high+)、ZAP baseline scan、**doc-audit**（Task 12）、**vercel build secret scan / L5**（Task 11）

---

## Phase 5 任務（pre-Plan-2 rigorous foundation 並行加入）

> 本 plan 原本止於 Task 10。為對應 [pre-Plan-2 audit](../research/2026-05-10-pre-plan-2-audit.md) 的 ⑩ 額外建議與「文件債緩解 4 招」之招式 1，加入 Task 11、12，併入 Plan 2 同 PR。具體 step 在實作期才寫詳細；本段為框架 + acceptance criteria。

### Task 11: vercel.ts buildCommand 加 secret 掃描（spec §6.7.4 Layer 5）

**目標**：把 spec 原本標 Phase 2 的 Layer 5 提前到 Phase 1 啟用。Vercel build 階段任一掃描 fail → build fail → 不部署。

**Acceptance**：
- [ ] `vercel.ts` 加 `buildCommand: 'pnpm install --frozen-lockfile && pnpm build && pnpm scan:bundle && gitleaks dir . --no-banner --config .gitleaks.toml'`
- [ ] 紅隊驗證：故意造 secret 進 client bundle、push、確認 Vercel preview deploy 失敗
- [ ] spec §6.7.4 Layer 5 從「Phase 2」改為「Phase 1 啟用」

**官方文獻**：[Vercel Project Configuration — buildCommand](https://vercel.com/docs/project-configuration/general#build-command)

### Task 12: doc-audit script + CI integration（文件債緩解招式 1）

**目標**：自動化檢查文件之間的一致性，防止 consistency-audit 第 1 輪那種 21 條 issue 級的 drift 再發生。

**Acceptance**：
- [ ] `scripts/audit-docs.mjs` 存在、含 6 條檢查（brainstorm hard 決議 → ADR 覆蓋；ADR 引用一致性；已淘汰術語；套件版本一致性；環境變數命名一致性；file path 引用存在）
- [ ] `package.json` 加 `"audit:docs": "node scripts/audit-docs.mjs"`
- [ ] `.github/workflows/ci.yml` 加 `doc-audit` job（runs `pnpm audit:docs`）
- [ ] `doc-audit` 加進 Task 10 Step 1 的 branch protection required checks 清單
- [ ] 紅隊驗證：故意改文件造 inconsistency、push、確認 CI fail

**前置依賴**：Phase 2 ADR 系統與文件結構重構必須先 merge（Task 12 的某些檢查依賴 ADR 編號存在）。

---

## Self-Review 結果

**Spec coverage**：對應 spec 6.7.4 + 6.8 全部章節都已覆蓋。

**Placeholder scan**：
- ZAP daily 中的 `rrms.pro080.com` 是必要 placeholder（DNS 在 Plan 8 才設定）— 已在 Task 5 Step 1 加註備案使用 vercel.app
- Task 7 playbook 中「LINE 群組 / Email / 法律顧問」是業務窗口資訊，須使用者填，這類「待真實資料」的 placeholder 不算 plan 失敗

**Type / 命名一致性**：
- Workflow 名稱 `Security — ZAP baseline (PR)` 與 `Security — ZAP daily` 在計畫內前後一致
- `npm audit (high+)` job 名稱在 ci.yml 與 branch protection 中一致

---

## 後續計畫

完成 Plan 2 後依序進入 Plan 3-8。每份 feature 計畫（3-8）會在自身範圍內加入該 feature 對應的攻擊測試（spec 6.7.4 紅隊清單第 3-15 項）。
