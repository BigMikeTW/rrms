/**
 * What:  LineAdapter port — the Hexagonal interface for LINE Messaging
 *        API operations (webhook signature verification, webhook event
 *        parsing, reply / push messages).
 * Why:   Per ADR-0110 + the Q3 design decision in the 2026-05-10
 *        researcher analysis, RRMS does NOT build a generic `messaging`
 *        port — LINE's reply-token + Flex Message + monthly push quota
 *        model differs too much from Slack / SMS / Email for a useful
 *        neutral contract. Each channel gets its own port (this one for
 *        LINE; Phase 4 will add `email/` for Resend per finding F-H3 B).
 *        Business code may NOT import @line/bot-sdk or @line/liff
 *        directly.
 * Where: Consumed by /api/line/webhook (verifyWebhookSignature +
 *        parseWebhookEvent), Plan 6 admin notification flows
 *        (replyToMessage / pushMessage), and Phase 7 LIFF customer query
 *        UI. The concrete adapter wrapping @line/bot-sdk lands in Plan 6.
 * When:  Port-only in Phase 1. verifyWebhookSignature runs at the very
 *        top of every webhook request before any handler logic.
 */

/**
 * One outbound LINE message. Phase 1 starts with text only; rich content
 * (Flex / sticker / template) gets added as discriminated-union variants
 * when Plan 6 needs them, so business code can construct one without
 * touching the SDK.
 */
export type LineOutboundMessage = { type: "text"; text: string };

/**
 * Inbound LINE webhook event subset that RRMS Phase 1 cares about. The
 * full event taxonomy (https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
 * is wider; the adapter MUST silently drop event types not enumerated
 * here so the SDK's full surface does not leak to business code (per
 * ADR-0112 discipline 2 — neutral contracts).
 */
export type LineWebhookEvent =
  | {
      type: "message";
      replyToken: string;
      source: { userId?: string; type: "user" | "group" | "room" };
      message: { type: "text"; id: string; text: string };
      timestamp: number;
    }
  | {
      type: "follow" | "unfollow";
      source: { userId?: string; type: "user" };
      timestamp: number;
    };

/** Result of `verifyWebhookSignature`. */
export interface LineSignatureCheckResult {
  ok: boolean;
  /** Reason when ok=false (for audit log; never echoed to LINE). */
  reason?: string;
}

/**
 * Hexagonal port for LINE Messaging API. Concrete adapter wrapping
 * @line/bot-sdk lives in this same folder (Plan 6) and must not be
 * imported by business code.
 */
export interface LineAdapter {
  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
  ): LineSignatureCheckResult;
  parseWebhookEvent(rawBody: string): LineWebhookEvent[];
  replyToMessage(
    replyToken: string,
    messages: LineOutboundMessage[],
  ): Promise<void>;
  pushMessage(userId: string, messages: LineOutboundMessage[]): Promise<void>;
}
