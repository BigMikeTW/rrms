# ADR 0100 — 每次 release 前執行一次 /security-review（OWASP / SAST / 依賴 / secret scan）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `superpowers-toolkit.html` § E 決議 E12; `platform-rigorous-analysis.html` 對應 |
| Related ADR | ADR-0101, ADR-0117 |

## Context

RRMS 處理個資、含金流（收款 / 結帳）、公開 form 為攻擊面。release 前若無系統性安全檢查，極易把 SQL injection、IDOR、洩漏 secret、過時依賴漏洞帶上 production。手動 review 費時且不可靠；需自動化 + 半結構化 review 流程。

## Decision

**每次 release（merge to main → production deploy）前必須執行一次 `/security-review` skill**，掃描範圍：

| 類別 | 工具 / 檢查項 |
|---|---|
| **OWASP Top 10** | injection、broken access control、cryptographic failures、SSRF、IDOR |
| **SAST**（靜態分析） | 程式碼層級漏洞（候選：Snyk Code / SonarCloud / Semgrep） |
| **依賴漏洞** | `pnpm audit` + Snyk dependencies |
| **Secret scan** | git history 中的 API key / token / credential（gitleaks 或同等） |

review 結果以 PR comment 呈現；critical / high 必須處理或明確 risk-accept 後才能 merge。release 不通過 review 不上 production。

## Consequences

### ✅ 好處
- 系統性堵 OWASP 常見漏洞，避免 release 帶 bug 上線
- Secret scan 防止憑證外洩（GitHub history 永久公開）
- 對應 brainstorm G section process discipline

### ⚠️ 代價
- 每次 release 多 10-30 分鐘（含修 false positive）
- 部分工具付費（Snyk / SonarCloud）— 列入 ADR-0102 多模型協作預算

### 🔮 未來影響
- 正式上 production 前累積 baseline 後，可建立「歷次 review 漏洞分布」儀表板
- ADR-0101 重大版本前再加 /ultrareview 多 agent 把關

## References

- Brainstorm: `superpowers-toolkit.html` 決議 E12
- OWASP Top 10 (2021): https://owasp.org/Top10/
- Snyk: https://snyk.io/
- SonarCloud: https://sonarcloud.io/
- gitleaks: https://github.com/gitleaks/gitleaks
- 對應 G section process discipline
