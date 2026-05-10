import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noPublicSecretVars from "./eslint-rules/no-public-secret-vars.mjs";
import noServerSdkInClient from "./eslint-rules/no-server-sdk-in-client.mjs";
import noPlatformSdkOutsideAdapter from "./eslint-rules/no-platform-sdk-outside-adapter.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Red-team fixtures intentionally violate our custom rules to verify them.
    // They must be excluded from project-wide lint (see __tests__/__fixtures__/).
    "__tests__/__fixtures__/**",
  ]),
  {
    plugins: {
      rrms: {
        rules: {
          "no-public-secret-vars": noPublicSecretVars,
          "no-server-sdk-in-client": noServerSdkInClient,
          "no-platform-sdk-outside-adapter": noPlatformSdkOutsideAdapter,
        },
      },
    },
    rules: {
      "rrms/no-public-secret-vars": "error",
      "rrms/no-server-sdk-in-client": "error",
      "rrms/no-platform-sdk-outside-adapter": "error",
    },
  },
]);

export default eslintConfig;
