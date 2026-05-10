/**
 * 4W Documentation
 * ----------------
 * What:  Custom ESLint rule that bans the business layer (everything under
 *        src/ except src/adapters/**) from importing platform-specific or
 *        vendor-specific SDKs. Such imports MUST go through one of the
 *        Hexagonal ports under src/adapters/ (per ADR-0110). Type-only
 *        imports (`import type { Foo } from 'pkg'`) are allowed because
 *        types disappear at compile time and do not introduce runtime
 *        lock-in (per typescript-eslint convention `allowTypeImports`).
 * Why:   Per ADR-0110 + ADR-0112 RRMS commits to Hexagonal / Ports-and-
 *        Adapters architecture so a future platform / vendor swap is a
 *        one-folder change. Without lint enforcement, a new contributor
 *        or AI-generated code can quietly import @vercel/blob or
 *        @line/bot-sdk from a Server Action and the lock-in budget
 *        (ADR-0114, target 5-8%) is silently spent. The rule complements
 *        the other custom rules (no-public-secret-vars,
 *        no-server-sdk-in-client) as Layer 4 (static analysis) of spec
 *        §6.7.4.
 * Where: Registered as `rrms/no-platform-sdk-outside-adapter` in
 *        `eslint.config.mjs`. Runs across the project on `pnpm lint` and
 *        in CI. Files whose path contains `/src/adapters/` are exempted
 *        — those are the adapters themselves and MUST import the SDKs
 *        they wrap.
 * When:  Triggered on every `ImportDeclaration` AST node. The rule first
 *        detects whether the file is inside `src/adapters/` (early-exits
 *        if so), then matches the import source against the blacklist
 *        of exact package names (dropbox, @line/bot-sdk, pg, …) and
 *        prefix patterns (@vercel/* with @vercel/og + @vercel/analytics
 *        + @vercel/config negation, @auth/*, @clerk/*, @lucia-auth/*).
 *        Sub-paths of an exact package (e.g. `next-auth/react`) are also
 *        treated as violations.
 */

// Exact package names — also matches sub-paths like `next-auth/react`.
const BLACKLIST_EXACT = [
  // File / blob storage SDKs (per ADR-0006 — go through StorageAdapter)
  "dropbox",
  // LINE SDKs (per Plan 6 — go through LineAdapter)
  "@line/bot-sdk",
  "@line/liff",
  // Raw Postgres drivers — Drizzle (ADR-0004) is the only DB surface.
  // Bypassing Drizzle also bypasses Phase 4 multi-tenant tenant_id filters.
  "pg",
  "postgres",
  // Alternative auth libraries — RRMS uses Better Auth (ADR-0132).
  // A second auth source must come with its own ADR before being introduced.
  "next-auth",
  "lucia",
];

// Prefix patterns with optional excludes (escape hatches for safe sub-packages).
const BLACKLIST_PATTERNS = [
  // All Vercel platform SDKs except client-safe / build-time helpers that
  // do not bring server credentials or runtime platform binding.
  {
    prefix: "@vercel/",
    excludes: new Set([
      "@vercel/og",         // OG image generation; no platform binding
      "@vercel/analytics",  // client-side analytics SDK; safe in business code
      "@vercel/config",     // build-time vercel.ts config schema; not runtime
    ]),
  },
  // Alternative auth ecosystems — same reasoning as `next-auth` above.
  { prefix: "@auth/", excludes: new Set() },
  { prefix: "@clerk/", excludes: new Set() },
  { prefix: "@lucia-auth/", excludes: new Set() },
];

const ADAPTER_PATH_RE = /[\\/]src[\\/]adapters[\\/]/;

function isAdapterFile(filename) {
  if (!filename) return false;
  return ADAPTER_PATH_RE.test(filename);
}

function isExactBlacklisted(pkg) {
  return BLACKLIST_EXACT.some((p) => pkg === p || pkg.startsWith(`${p}/`));
}

function isPatternBlacklisted(pkg) {
  for (const { prefix, excludes } of BLACKLIST_PATTERNS) {
    if (!pkg.startsWith(prefix)) continue;
    if (excludes.has(pkg)) continue;
    return true;
  }
  return false;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow business-layer code (outside src/adapters/) from importing platform / vendor SDKs; route through a Hexagonal port instead",
    },
    messages: {
      forbiddenImport:
        "'{{pkg}}' is a platform / vendor SDK. Import the matching port from '@/adapters/...' instead (per ADR-0110). If you are writing the adapter itself, place the file under 'src/adapters/'.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    if (isAdapterFile(filename)) return {};
    return {
      ImportDeclaration(node) {
        // Allow `import type { Foo } from 'pkg'` — types disappear at compile
        // time, so no runtime lock-in is introduced.
        if (node.importKind === "type") return;
        const pkg = node.source.value;
        if (typeof pkg !== "string") return;
        if (isExactBlacklisted(pkg) || isPatternBlacklisted(pkg)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: { pkg },
          });
        }
      },
    };
  },
};

export default rule;
