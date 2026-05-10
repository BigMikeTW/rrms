# ADR 0065 — MVP 功能集鎖定

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q9-quick-decisions.html`, `honest-comparison.html` 決議 C2 |
| Related ADR | ADR-0064, ADR-0066 |

## Context

Phase 1 MVP 必須一次定義「做什麼」與「不做什麼」的清單，否則開發過程中會持續被誘惑加功能。本 ADR 鎖定 MVP 必含功能集；ADR-0066 鎖定 MVP 不做的功能。兩者互補。

## Decision

MVP 必含功能集（每項皆為 hard 決議）：

1. **彈性樹（5 層）** — owner / building / floor / unit / room
2. **多租戶隔離** — owner 為頂層租戶
3. **報修管道四入口** — LINE、QR Code、Web 表單、Email
4. **派工 = 純人工**（無 AI / 規則引擎；per ADR-0070 路線圖第①階段）
5. **技師端 PWA**（離線可用、相機上傳）
6. **簽核 4 段（A1-A4）** — 收件、派工、完工、結案
7. **月結 + 對帳單** 出帳流程
8. **PDF 報告兩種** — 派工結案、完整結案
9. **客製化查詢**（C2 — 自由欄位查詢介面）
10. **評分機制（4 維度）** — 內部對技師評分
11. **技師月度對帳**
12. **Audit Trail**（per Hexagonal F-M2 紀律）

## Consequences

- ✅ Phase 1 範圍清晰，可作為 plan 切分依據
- ⚠️ 功能集涵蓋面廣（12 項），開發時程須確實控管
- 🔮 任何「能否加 X？」的問題，先檢查是否在此清單；不在 → 進 Phase 2 候選池

## References

- `docs/superpowers/brainstorm/q9-quick-decisions.html`
- `docs/superpowers/brainstorm/honest-comparison.html`
- ADR-0064 — MVP 業務線範圍
- ADR-0066 — MVP 不做清單
