# ADR 0127 — 推薦註冊平台（非必要）：Sentry Free

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-registration.html` 決議 H2（soft） |
| Related ADR | ADR-0013, ADR-0126 |

## Context

ADR-0013 已決議採用 Sentry 做 error monitoring。Sentry Free Plan 提供 5,000 errors / 月，足夠 MVP（情境 A 1-3 業主、情境 B 10-30 業主）使用，且 TOS 允許商用。註冊與否不阻塞 Plan 1 開發，但若上線後才補裝 → 早期 production error 會丟失（無歷史可追）。

## Decision

**推薦** 在 MVP 開發初期（Plan 1-2 期間）註冊 Sentry Free Plan，但不列入 ADR-0126 必註冊清單；BigMike 可依時間餘裕選擇是否提早建。一旦註冊，DSN 寫入 `.env`（per ADR-0013），即可開始收 production / preview error。

## Consequences

### ✅ 好處
- 上線首日即有 error 可追、避免「為什麼壞了不知道」
- Free 5K errors / 月足以支撐情境 A / B 全期
- 商用 TOS 無慮

### ⚠️ 代價
- 多一個帳號要管（DSN secret 也是一條 .env 維護負擔）
- 若延後註冊 → 早期 error 永久遺失

### 🔮 未來影響
- 量超 5K / 月 → 升 Team US$26/月（情境 C 約此級距）
- 未來若加 Performance Monitoring → quota 計算方式變、需重評

## References

- Sentry Pricing: https://sentry.io/pricing/
- Sentry Free Plan TOS: https://sentry.io/legal/terms/
- ADR-0013（Sentry monitoring 採用決議）
