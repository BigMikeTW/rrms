/**
 * What:  AIAdapter port — the Hexagonal interface for large language model
 *        invocation (text generation; streaming and structured output to be
 *        added when Phase 3+ AI features need them).
 * Why:   Per ADR-0022 RRMS will adopt AI for case classification and
 *        dispatch in Phase 3+. The model market churns rapidly (provider /
 *        pricing / API every ~6 months), so business code must depend on
 *        a neutral port and never import @anthropic-ai/sdk / openai / ai
 *        directly. The port also funnels prompt logging, cost accounting,
 *        and PDPA PII scrubbing into one place.
 * Where: Consumed by Phase 3+ AI features. No Phase 1 caller. The first
 *        concrete adapter is expected to wrap the Vercel AI SDK or the
 *        Vercel AI Gateway (default per ADR-0022).
 * When:  Port-only in Phase 1. Method calls happen inside server actions
 *        and cron jobs — never in the browser.
 */

/** A single message in a chat-style prompt. */
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Common options for any AI generation call. */
export interface AIGenerateOptions {
  /** Logical model name (adapter maps to provider-specific id). */
  model: string;
  /** Sampling temperature in [0, 2]. */
  temperature?: number;
  /** Maximum tokens the model may emit in its response. */
  maxOutputTokens?: number;
}

/** Result of a non-streaming text generation call. */
export interface AIGenerateTextResult {
  text: string;
  /** Token usage for cost / quota accounting. */
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Hexagonal port for AI / LLM access. Concrete adapters live in this same
 * folder and must not be imported by business code.
 */
export interface AIAdapter {
  generateText(
    messages: AIMessage[],
    options: AIGenerateOptions,
  ): Promise<AIGenerateTextResult>;
}
