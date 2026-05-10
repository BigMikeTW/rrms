# ADR 0033 — 技師端形式為 LINE 推播 + PWA + Service Worker + Background Sync

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `q7-deepdive.html` 決議 B10 |
| Related ADR | ADR-0032, ADR-0028 |

## Context

零安裝（B9）排除原生 App，但純 Web 又無法處理工地常見情境：訊號斷、相機 / GPS 權限、上傳離線重試。需要「看起來像 Web、實際有原生能力」的折衷。

## Decision

技師端採 **A+ 方案**：

- **表面** — LINE 推播 + 點連結進工單頁（與 B9 零安裝一致）
- **底層** — PWA + Service Worker + Background Sync，支援離線拍照、自動重傳、相機 / GPS 權限存取

技師可選擇「加到主畫面」（ADR-0060/B37）讓 PWA 變桌面圖示，但**不強制**。

## Consequences

- ✅ 不違反零安裝原則但取得近原生能力
- ⚠️ iOS Safari PWA 限制較多（背景同步、推播）需 fallback
- 🔮 Phase 2 若需更深推播 / 後台位置可改原生 App，但會破壞 B9

## References

- MDN Service Worker: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Background Sync: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
