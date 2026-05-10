/**
 * What:  StorageAdapter port — the Hexagonal interface for binary file
 *        storage (case attachments: photos, videos, generated PDFs, CSV
 *        exports).
 * Why:   Per ADR-0006 RRMS uses Vercel Blob for Phase 1 storage but must
 *        not import @vercel/blob from business code. This port defines
 *        the neutral contract the business layer depends on; the concrete
 *        adapter (Vercel Blob in Phase 1, Dropbox / R2 / S3 later)
 *        implements it. Per ADR-0110 the indirection is mandatory.
 * Where: Consumed by src/app/report (uploads), src/app/admin (downloads),
 *        and any cron job that reads or deletes attachments. The concrete
 *        implementation arrives in Plan 5 (Dropbox media pipeline) and is
 *        injected via a factory whose wiring lands in Phase 4.
 * When:  Port-only in Phase 1 (no callers yet). Method invocations happen
 *        inside server-side request handlers and cron jobs — never in the
 *        browser.
 */

/**
 * Options accepted by `put`. Kept minimal in Phase 1; extend per concrete
 * vendor capability without leaking vendor-specific names (per ADR-0112
 * discipline 2 — neutral contracts).
 */
export interface PutOptions {
  /** MIME content-type of the uploaded blob. */
  contentType?: string;
  /** Whether the resulting URL must be publicly readable without auth. */
  access?: "public" | "private";
}

/** Result of a successful `put` operation. */
export interface PutResult {
  /** Stable storage key the caller uses for later get / delete / sign. */
  key: string;
  /** Direct URL to the object (may be signed; lifetime depends on access). */
  url: string;
  /** Size of stored object in bytes. */
  size: number;
}

/** Options accepted by `getSignedUrl`. */
export interface SignedUrlOptions {
  /** Lifetime of the signed URL in seconds. Default decided by adapter. */
  expiresInSeconds?: number;
}

/**
 * Hexagonal port for binary file storage. Concrete implementations live in
 * this same folder (e.g. VercelBlobAdapter.ts, DropboxAdapter.ts) and must
 * not be imported by business code — only this interface should be.
 */
export interface StorageAdapter {
  put(
    key: string,
    data: Buffer | Uint8Array | Blob,
    options?: PutOptions,
  ): Promise<PutResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}
