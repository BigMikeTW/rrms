# ADR 0102 — 多模型協作（Claude 主寫 + Vercel Agent + GPT-5 / Gemini + Snyk + Sentry AI）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-rigorous-analysis.html` § E 決議 E14（soft, 理念，部分付費） |
| Related ADR | ADR-0100, ADR-0101, ADR-0103 |

## Context

單一 AI 模型（無論 Opus / GPT-5 / Gemini）都有盲點與 hallucination 模式，且各自擅長領域不同。BigMike 為非工程背景的產品擁有者（記憶錨點 `user_background.md`），更需要多視角 cross-check 把關決策品質。但無限堆疊工具會失焦並導致預算爆炸。需明確協作分工。

## Decision

採多模型 / 多工具協作架構，明確分工（理念採用，部分工具為付費，視預算啟用）：

| 角色 | 模型 / 工具 |
|---|---|
| **主寫實作** | Claude Opus 4.7（Code，1M context） |
| **PR review** | Vercel Agent（自動化） |
| **第二意見** | GPT-5 / Gemini 2.5 Pro（複雜決策時） |
| **安全工具** | Snyk（依賴與 SAST） / SonarCloud（程式品質） |
| **異常調查** | Sentry AI（runtime issue triage） |

「soft」表示本 ADR 為理念紀錄；個別工具（GPT-5 API、Snyk Pro 等）視預算與必要性逐一啟用，啟用時不需新 ADR；停用主寫 Claude 或核心工作流則需新 ADR supersede 本決議。

## Consequences

### ✅ 好處
- 多視角 cross-check 降低單一 LLM hallucination 風險
- 各工具發揮專長（Claude 寫長 context / Vercel Agent 熟悉部署 / Snyk 強在依賴漏洞庫）
- 異常調查（Sentry AI）解放 BigMike 不需自己讀 stack trace

### ⚠️ 代價
- 工具集合複雜度上升、學習曲線
- 月度成本累計（Pro tier API + Snyk + SonarCloud）— 須年度 review

### 🔮 未來影響
- 模型版本演進時逐一更新（如 Claude 4.7 → 5.0）— 不需新 ADR 除非主寫角色換
- Phase 2+ 可加入自家 AI 派工模型，作為第六個協作者

## References

- Brainstorm: `platform-rigorous-analysis.html` 決議 E14（soft）
- ADR-0100 security review
- ADR-0101 ultrareview
- 記憶錨點: `user_background.md`（非工程背景）
