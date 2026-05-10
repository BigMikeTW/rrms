# ADR 0118 — MVP 預算重新定義為「BigMike 時間 + 平台月費 × 6」（推翻 q9 金額選項）

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-comparison.html` 決議 G3（推翻 `q9-quick-decisions.html` 預算選項） |
| Related ADR | ADR-0116, ADR-0117, ADR-0014 |

## Context

q9 brainstorm 提供三組 MVP 預算金額選項：NT$30-80 萬、NT$80-200 萬、NT$200-500 萬。這些區間預設「人力外包成本」為主要支出。但 ADR-0116 已鎖定零委外，q9 三個金額選項在單人 + AI 場景下完全失真（多估了實際不存在的人力外包費）。

platform-comparison brainstorm 重新檢討後，將預算公式改為「機會成本（BigMike 時間）+ 實際現金支出（平台月費）」。

## Decision

RRMS MVP 預算估算改採以下公式，q9 金額選項作廢：

```
預算 = (BigMike 自身時間 × 月份)  ← 機會成本，不計現金
     + (平台月費 × 6 個月)        ← 實際現金支出
```

實際現金支出主要項目（依 ADR-0014）：
- Vercel Pro：USD 20/月 × 用戶
- Neon Postgres、Vercel Blob、LINE Messaging API：依用量計費
- Cloudflare DNS、GitHub、Sentry：免費或低門檻方案
- Claude Code 訂閱：依方案選擇

此 ADR 不鎖定具體金額（依平台價格隨時間變動）；僅鎖定「公式」與「q9 金額選項作廢」這兩件事。

## Consequences

### ✅ 好處
- 預算估算對齊實際結構（單人 + AI）→ 不會因為記著舊的「萬元級預算」而誤判可行性
- 預算彈性：唯一現金壓力是平台月費，BigMike 可控

### ⚠️ 代價
- 機會成本不可量化 → 對外說明 MVP 投入時較難用「花了多少錢」概念溝通
- 任何引用 q9 金額選項的舊文件都需要標註「已被 ADR-0118 推翻」

### 🔮 未來影響
- 後續若有新平台（如付費 LINE 解決方案、Notion API 升級）需評估，以「月費 × 月份」直接加入此公式
- Phase 2／3 若要轉商業化，再另開 ADR 重新建立含人力的預算模型

## References

- `docs/superpowers/brainstorm/platform-comparison.html`
- `docs/superpowers/brainstorm/q9-quick-decisions.html`（原預算選項；已作廢）
- ADR-0014（Vercel Pro plan tier required）
