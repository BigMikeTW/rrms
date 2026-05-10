# ADR 0028 — 報修主管道為 LINE 官方帳號 + 每棟 LIFF + QRcode

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-05-10 |
| Supersedes | — |
| Superseded by | — |
| Brainstorm 來源 | `user-tiers.html` 決議 B5 |
| Related ADR | ADR-0027 |

## Context

L1 報修人（ADR-0027）需要零阻力管道。台灣住戶 LINE 滲透率近 100%，且 LIFF 提供瀏覽器級 UI 又能取得 LINE userId（免註冊識別）。實體 QRcode 貼牌可消除「找不到入口」問題。Web 與 Email 雖然普及度高但非首選。

## Decision

報修管道分層：

- **主管道** — LINE 官方帳號 + 每棟一個 LIFF 報修頁 + 實體 QRcode 貼牌
- **輔助管道** — Web 報修頁（同 form schema）
- **過渡管道** — Email（人工錄入，給尚未轉到 LINE 的客戶）

每棟 LIFF endpoint 帶 `building_id`，報修進來自動歸屬正確大樓。

## Consequences

- ✅ 零安裝、零註冊；LINE userId 天然識別 L1
- ⚠️ 對 LINE Platform 有強依賴；LINE 若停服需切換 Web 為主
- 🔮 業務線 3（零售品牌）可能用同樣 LIFF 模式

## References

- LINE LIFF docs: https://developers.line.biz/en/docs/liff/
