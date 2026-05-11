/**
 * What:  EmailAdapter port — the Hexagonal interface for transactional
 *        email send (admin magic-link invitation, anonymization completion
 *        notice, future password-reset). Method signature mirrors the
 *        lowest common denominator across Resend / Postmark / SendGrid /
 *        SES so the port is not Resend-specific (per ADR-0112 discipline
 *        2 — neutral contracts).
 * Why:   Per ADR-0110 (Hexagonal mandatory) + ADR-0132 (Better Auth
 *        magicLink plugin needs a sender callback) + ADR-0134 (Phase 4
 *        Better Auth security configuration enforces routing through this
 *        port — sendMagicLink callback MUST call emailAdapter, never
 *        import `resend` directly). Decision F-H3 B (per pre-Plan-2 audit
 *        2026-05-10) chose Resend over deferring to Phase 2. The port
 *        lands in Phase 4 alongside the Better Auth security config; the
 *        concrete ResendEmailAdapter lands in Plan 4 along with the React
 *        Email template for the admin invite mail.
 * Where: Consumed by src/lib/auth.ts (magicLink sendMagicLink callback)
 *        and Plan 8 anonymization cron handler (completion summary email
 *        to admin). Concrete adapter `ResendEmailAdapter.ts` lives in
 *        this same folder (Plan 4); ESLint rule
 *        rrms/no-platform-sdk-outside-adapter blocks `import "resend"`
 *        from any path outside src/adapters/email/.
 * When:  Phase 4 (rigorous foundation) — 2026-05-11. Method invocations
 *        happen inside Server Actions (admin invite) and cron handlers
 *        (anonymization summary). Never invoked from the browser.
 */

/**
 * One transactional email message. Mirrors the lowest common denominator
 * across Resend / Postmark / SendGrid / SES (verified 2026-05-11 per
 * Round-2 research Q4) so a future provider swap stays inside the
 * adapter without altering this contract.
 */
export interface EmailMessage {
  /** Recipient address(es). Max 50 (Resend limit; aligns with others). */
  to: string | readonly string[];
  /** Sender address. Must be a domain verified with the provider. */
  from: string;
  /** Subject line. */
  subject: string;
  /** HTML body. At least one of html / text MUST be set. */
  html?: string;
  /** Plain-text body. */
  text?: string;
  /**
   * Optional tags for analytics / categorization (e.g. ["magic-link"]).
   * Maps to Resend `tags`, Postmark `Tag`, SendGrid `categories`.
   */
  tags?: readonly string[];
  /** Optional Reply-To address. */
  replyTo?: string;
}

/** Result of a successful send. */
export interface EmailSendResult {
  /** Provider-assigned message ID for later tracking / webhooks. */
  messageId: string;
}

/**
 * Hexagonal port for transactional email. Concrete adapters live in this
 * same folder (e.g. ResendEmailAdapter.ts) and must not be imported by
 * business code — only this interface should be.
 */
export interface EmailAdapter {
  /**
   * Send a transactional email. Throws on hard failure (network / auth /
   * 4xx). Caller is responsible for retry policy. Soft bounces are
   * handled provider-side via the verified domain's bounce mailbox
   * (per Resend SPF MX record set up during DNS verification).
   */
  sendTransactional(message: EmailMessage): Promise<EmailSendResult>;
}
