/**
 * What:  QueueAdapter port — the Hexagonal interface for asynchronous
 *        message delivery (durable enqueue + worker handler registration).
 * Why:   Phase 1 has no queue consumer, but the port exists today so a
 *        future Vercel Queues / SQS / self-hosted Redis Streams swap is a
 *        one-file change. Per ADR-0110 the discipline is enforced even
 *        when there is no Phase 1 implementation, so the AI / human urge
 *        to import a vendor SDK ad hoc the first time it is needed is
 *        pre-empted by the lint rule.
 * Where: Will be consumed by Phase 2+ background jobs (e.g. media-processing
 *        pipeline, bulk anonymization). No Phase 1 caller. The first
 *        concrete adapter is expected to wrap @vercel/queue (singular —
 *        per the official npm package name; not @vercel/queues).
 * When:  Port-only in Phase 1. Enqueue happens in request handlers; handler
 *        registration runs at module load on dedicated worker endpoints.
 */

/** Options accepted by `enqueue`. */
export interface EnqueueOptions {
  /** Delay in seconds before the message becomes visible to consumers. */
  delaySeconds?: number;
  /** De-duplication key — adapter MAY drop a duplicate within a window. */
  dedupeKey?: string;
}

/** Result of a successful `enqueue`. */
export interface EnqueueResult {
  /** Adapter-issued message identifier (opaque to caller). */
  messageId: string;
}

/**
 * Handler signature registered against a queue name. Receives one message
 * payload at a time; throwing causes the adapter to retry per its policy.
 */
export type QueueHandler<T> = (message: T) => Promise<void>;

/**
 * Hexagonal port for asynchronous message delivery. Concrete adapters live
 * in this same folder and must not be imported by business code.
 */
export interface QueueAdapter {
  enqueue<T>(
    queueName: string,
    message: T,
    options?: EnqueueOptions,
  ): Promise<EnqueueResult>;
  registerHandler<T>(queueName: string, handler: QueueHandler<T>): void;
}
