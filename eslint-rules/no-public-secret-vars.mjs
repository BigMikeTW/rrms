/**
 * 4W Documentation
 * ----------------
 * What:  Custom ESLint rule that flags any access to `process.env.NEXT_PUBLIC_*`
 *        whose variable name contains SECRET / KEY / TOKEN / PASSWORD (case-insensitive).
 * Why:   Anything prefixed with `NEXT_PUBLIC_` is inlined by Next.js into the
 *        client bundle and shipped to every browser. If a name like
 *        `NEXT_PUBLIC_LINE_CHANNEL_SECRET` ever appears in code, the secret value
 *        will be exposed publicly. This rule is Layer 4 (static analysis) of the
 *        defense-in-depth secret-leak prevention defined in RRMS spec 6.7.1 / 6.7.5.
 * Where: Registered as `rrms/no-public-secret-vars` in `eslint.config.mjs`. Runs
 *        across the whole project on `pnpm lint` and in CI.
 * When:  Triggered on every `MemberExpression` AST node that matches the
 *        `process.env.<NAME>` pattern. Reports an ESLint error if NAME matches
 *        the forbidden regex. The author must rename the variable.
 */
const FORBIDDEN_PATTERN = /^NEXT_PUBLIC_.*(SECRET|KEY|TOKEN|PASSWORD)/i;

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow NEXT_PUBLIC_* env vars whose names contain SECRET/KEY/TOKEN/PASSWORD",
    },
    messages: {
      forbiddenName:
        "'{{name}}' is forbidden: NEXT_PUBLIC_* variables are exposed to the browser. Rename without NEXT_PUBLIC_, or rename to remove SECRET/KEY/TOKEN/PASSWORD if it's truly public.",
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object?.type === "MemberExpression" &&
          node.object.object?.name === "process" &&
          node.object.property?.name === "env" &&
          node.property?.type === "Identifier" &&
          FORBIDDEN_PATTERN.test(node.property.name)
        ) {
          context.report({
            node,
            messageId: "forbiddenName",
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};

export default rule;
