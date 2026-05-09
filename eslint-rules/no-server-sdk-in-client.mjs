/**
 * 4W Documentation
 * ----------------
 * What:  Custom ESLint rule that bans imports of server-only SDKs in any file
 *        whose first statement is the directive `"use client"`.
 * Why:   Next.js bundles the entire transitive dependency graph of a client
 *        component into the browser bundle. Importing the LINE bot SDK,
 *        Dropbox SDK, a database driver, or Better Auth in a client file would
 *        ship server credentials and server-only logic to every visitor.
 *        This is Layer 4 (static analysis) of the secret-leak prevention
 *        defined in RRMS spec 6.7.1 / 6.7.5, complementing runtime "server-only"
 *        guards.
 * Where: Registered as `rrms/no-server-sdk-in-client` in `eslint.config.mjs`.
 *        The list `SERVER_ONLY_PACKAGES` mirrors the server-only stack the
 *        project will adopt: LINE Messaging API, Dropbox file storage,
 *        Drizzle ORM with Postgres / Neon, Better Auth and its sub-paths.
 * When:  On every `Program` node, the rule remembers whether the file is a
 *        client component. On every `ImportDeclaration` in a client file, it
 *        compares the source against the forbidden list (exact match or
 *        `${pkg}/...` sub-path) and reports an error.
 */
const SERVER_ONLY_PACKAGES = [
  "@line/bot-sdk",
  "dropbox",
  "drizzle-orm/node-postgres",
  "drizzle-orm/neon-http",
  "@neondatabase/serverless",
  "better-auth",
  "better-auth/adapters/drizzle",
  "better-auth/plugins",
  "better-auth/next-js",
];

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing server-only SDKs in files marked 'use client'",
    },
    messages: {
      forbiddenImport:
        "'{{pkg}}' is server-only. Importing it in a 'use client' file would bundle it (and its credentials) to the browser.",
    },
    schema: [],
  },
  create(context) {
    let isClientFile = false;
    return {
      Program(node) {
        const firstStmt = node.body[0];
        if (
          firstStmt?.type === "ExpressionStatement" &&
          firstStmt.expression?.type === "Literal" &&
          firstStmt.expression.value === "use client"
        ) {
          isClientFile = true;
        }
      },
      ImportDeclaration(node) {
        if (!isClientFile) return;
        const pkg = node.source.value;
        if (
          SERVER_ONLY_PACKAGES.some((p) => pkg === p || pkg.startsWith(`${p}/`))
        ) {
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
