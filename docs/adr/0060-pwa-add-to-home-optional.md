# ADR 0060 — 技師端不安裝 App；可選「加到主畫面」變桌面圖示

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html` 決議 B37 (soft) |
| Related ADR | ADR-0032, ADR-0033 |

## Context

零安裝（B9）排除 App Store；但部分技師反而想要桌面圖示快速進入工單頁。PWA 的「Add to Home Screen」剛好是中間選項：使用者**可選**啟用，不違反零強制安裝原則。

## Decision

技師端**不安裝專屬 App**；提供 **PWA + Add to Home Screen** 作為**可選**功能：

- 進站時不主動彈窗要求加桌面（避免摩擦）
- 在工單頁角落放一個 "加到主畫面" tooltip 給願意的人
- 不裝也能完整使用所有功能（feature parity）

## Consequences

- ✅ 喜歡桌面圖示的技師有得選；不喜歡的不被打擾
- ⚠️ iOS Safari 與 Android Chrome 加桌面流程不一樣，UI 提示需適配
- 🔮 Phase 2/3 work, schema may preserve hooks but no implementation in Phase 1（功能本身 Phase 1 即啟用，但統計 / 推廣指標延後）

## References

- MDN Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest
