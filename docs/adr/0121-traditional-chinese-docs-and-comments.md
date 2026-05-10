# ADR 0121 — 設計文件與程式碼註解採繁體中文 + BigMike 可讀層次

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `platform-comparison.html` 決議 G6 |
| Related ADR | ADR-0116 |

## Context

RRMS 唯一人類讀者是 BigMike（非工程背景，台灣中文母語）；唯一 AI 讀者是 Claude（中英雙語）。若文件使用「外部 RD 慣例的英文縮寫 / 行話」，BigMike 半年後重讀會失去語境，且未來若有外部接手者也未必懂這些縮寫。

user memory `feedback_communication_style.md`（plain language with examples）與 `feedback_4w_code_documentation.md`（4W 中文 doc comment）已建立此偏好；本 ADR 將其鎖定為架構紀律。

## Decision

RRMS 所有設計文件、程式碼註解採以下規則：

1. **語言**：繁體中文（台灣用語）為主；技術名詞首次出現用「中文（English）」格式（例：「資料庫遷移（database migration）」）
2. **可讀層次**：以「BigMike 半年後重讀仍能理解」為基準；不假設讀者已具備工程背景
3. **禁止項目**：
   - 外部 RD 圈內縮寫（如 `IIRC`、`WIP` 不寫成這樣）
   - 未說明的設計 pattern 名稱（首次提到 CQRS / Hexagonal 必附一句解釋）
   - 純英文長段技術描述（除非引用官方文件原文，需附中文摘要）
4. **程式可讀性優先**：
   - 變數／函式命名仍用英文（業界慣例）
   - 但 doc comment（4W：What / Why / Where / When）必為繁體中文
   - 複雜邏輯加入「為什麼這樣寫」中文註解，而非僅描述「做了什麼」

## Consequences

### ✅ 好處
- BigMike 任何時刻能讀懂任何文件 → 維持「PM 對系統有完整心智模型」
- 對齊 user memory 既有偏好（plain language、4W 中文註解）
- 中文註解對 Claude 不構成負擔（雙語模型）

### ⚠️ 代價
- 引用國際技術社群文章時需要翻譯／摘要 → 增加文件成本
- 若未來找到外部協作者必為繁中讀者 → 限縮人才池（與 ADR-0116 零委外政策一致，影響有限）

### 🔮 未來影響
- 新建檔（含測試／script）依 `feedback_4w_code_documentation.md` 規則寫 4W 註解
- ADR 本身亦遵循此規則（本 ADR 即範例）

## References

- `docs/superpowers/brainstorm/platform-comparison.html`
- `MEMORY.md` → `feedback_communication_style.md`、`feedback_4w_code_documentation.md`
- `docs/CODING_STANDARDS.md`
