# ADR 0015 — UI 風格走 Linear / Stripe 路線（去 AI 味）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `users-and-painpoint.html` 決議 A15 |
| Related ADR | ADR-0001 |

## Context

RRMS 目標客群為物業管理 / 維修服務商業用戶；介面須給人「成熟 SaaS 工具」感（Linear / Stripe / Notion 路線）— 重視 information density、鍵盤操作、清晰 hierarchy；**避免常見 AI 生成介面的視覺特徵**（過多漸層、emoji-heavy headers、「神奇 AI」風格小卡片、過度動畫）。設計參考：Linear（task）、Stripe Dashboard（金流）、Vercel Dashboard（dev tool）。

## Decision

UI 風格定義為 **Linear / Stripe 路線**。具體規則：(a) 中性色系為主（neutral grays + 1 brand accent）；(b) Inter / Geist 等 system-feel sans-serif 字型；(c) keyboard-first（含 cmd+K palette）；(d) 資訊密度高、不浪費 viewport；(e) 動畫克制（only transitions, no hero animations）；(f) **禁** emoji-as-icon、neon gradient、glassmorphism、AI-generated stock illustration。

## Consequences

### ✅ 好處
- 與商業客戶心智模型對齊（看起來像「真的工具」而非「AI demo」）
- shadcn/ui（ADR-0001）天然支援此風格、不需重寫 design system
- 鍵盤友善 → 高頻使用者效率提升

### ⚠️ 代價
- 設計師若習慣 marketing-style 漸層風 → 需 onboarding
- AI 生成 UI code 預設常帶 AI 味 → review 須抓出並修正

### 🔮 未來影響
- design token / component library 直接對應 Linear-style；未來 white-label 多租戶可換 brand color 不換 layout
- 若收 to-C 流量（民眾 LINE LIFF）→ 那一支可走更親和風格，但 admin 與 admin-like 介面守 Linear

## References

- Linear design: https://linear.app
- Stripe design: https://stripe.com
- Refactoring UI（同思想）: https://www.refactoringui.com
