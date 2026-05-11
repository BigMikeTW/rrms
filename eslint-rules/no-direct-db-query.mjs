/**
 * 4W Documentation
 * ----------------
 * What:  Custom ESLint rule that bans the business layer from importing
 *        the Drizzle DB client (`@/db/client`) or runtime values from
 *        `drizzle-orm`. All DB queries MUST go through a tenant-scoped
 *        repository under `src/db/repositories/` (per ADR-0017 multi-
 *        tenant Level 3). Type-only imports are exempted because
 *        TypeScript erases them at compile time and they cannot bypass
 *        the runtime tenant filter.
 * Why:   Per ADR-0017 + ADR-0089 + ADR-0133 every DB query must filter
 *        by tenant_id (Phase 1 application-layer; Phase 2 enforced by
 *        Postgres RLS once `ENABLE ROW LEVEL SECURITY` lands). Without
 *        lint enforcement, a new contributor or AI-generated code can
 *        quietly `import { db } from "@/db/client"; db.select().from(...)`
 *        from a Server Action and silently bypass the tenant boundary
 *        — leading to cross-tenant data leakage that is invisible until
 *        a multi-tenant Phase 2 customer notices their data appearing in
 *        another tenant's view. The rule complements the other custom
 *        rules (no-public-secret-vars, no-server-sdk-in-client,
 *        no-platform-sdk-outside-adapter) as Layer 4 (static analysis)
 *        of spec §6.7.4 defense-in-depth.
 * Where: Registered as `rrms/no-direct-db-query` in `eslint.config.mjs`.
 *        Runs across the project on `pnpm lint` and in CI. Files inside
 *        the following allowlist paths are exempted (these are the
 *        infrastructure layer, not business code):
 *          - src/db/repositories/** (the repositories themselves)
 *          - src/db/schema/** (schema definitions need Drizzle pgTable / pgPolicy / sql etc.)
 *          - src/db/client.ts (the client itself)
 *          - src/db/with-tenant.ts (the transaction wrapper)
 *          - src/lib/auth.ts (Better Auth drizzleAdapter must take db)
 *          - drizzle.config.ts (drizzle-kit configuration)
 *          - drizzle/migrations/** (migrations)
 *          - scripts/seed*.ts, scripts/migrate*.ts, scripts/backfill*.ts
 *          - __tests__/integration/** (integration tests build DB fixtures)
 * When:  Triggered on every `ImportDeclaration` AST node. The rule first
 *        detects whether the file path matches the allowlist (early-exits
 *        if so), then checks the import source. `drizzle-orm/pg-core` is
 *        whitelisted everywhere because schema definition files need
 *        pgTable / uuid / etc. — only the runtime helpers (`drizzle-orm`
 *        bare and `drizzle-orm/expressions` etc.) are blocked outside
 *        the allowlist.
 */

// Forbidden import sources outside allowlist paths.
// These trigger violations from any non-allowlisted file.
const BLACKLIST_EXACT = [
  "@/db/client",       // the singleton DB handle — repos own this
  "drizzle-orm",       // runtime helpers (eq, and, sql, etc.) — repos own these
];

// Exact-match sub-paths that ARE allowed (schema-builder / type-level only).
const SUBPATH_WHITELIST = new Set([
  "drizzle-orm/pg-core",     // pgTable / uuid / text / etc. — schema definitions
  "drizzle-orm/relations",   // type-level relations definition
]);

// File-path allowlist (regex against forward-slash-normalized filename).
const ALLOWLIST_PATH_RE = [
  /\/src\/db\/repositories\//,
  /\/src\/db\/schema(\.|\/)/,
  /\/src\/db\/client\.ts$/,
  /\/src\/db\/with-tenant\.ts$/,
  /\/src\/lib\/auth\.ts$/,
  /\/drizzle\.config\.(ts|mts|js|mjs)$/,
  /\/drizzle\/migrations\//,
  /\/scripts\/(seed|migrate|backfill)/,
  /\/__tests__\/integration\//,
];

function isAllowlistedFile(filename) {
  if (!filename) return false;
  const normalized = filename.replace(/\\/g, "/");
  return ALLOWLIST_PATH_RE.some((re) => re.test(normalized));
}

function isBlacklisted(pkg) {
  if (SUBPATH_WHITELIST.has(pkg)) return false;
  if (BLACKLIST_EXACT.includes(pkg)) return true;
  // Sub-path of @/db/client (e.g. "@/db/client/foo")
  if (pkg.startsWith("@/db/client/")) return true;
  // Sub-path of drizzle-orm (e.g. "drizzle-orm/expressions") — block unless
  // explicitly whitelisted above.
  if (pkg.startsWith("drizzle-orm/")) return true;
  return false;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow business-layer code (outside src/db/repositories/ and other infra paths) from importing @/db/client or drizzle-orm runtime helpers; route through a repository instead",
    },
    messages: {
      forbiddenImport:
        "'{{pkg}}' is the DB infrastructure layer. Import the matching repository from '@/db/repositories/...' instead (per ADR-0017 + ADR-0133). If you are writing a repository / schema / migration, place the file under one of the allowlisted paths listed in the rule definition.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    if (isAllowlistedFile(filename)) return {};
    return {
      ImportDeclaration(node) {
        // Allow `import type { Foo } from "..."` — types disappear at
        // compile time, no runtime DB access introduced.
        if (node.importKind === "type") return;
        const pkg = node.source.value;
        if (typeof pkg !== "string") return;
        if (isBlacklisted(pkg)) {
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
