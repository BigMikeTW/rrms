/**
 * 4W Documentation
 * ----------------
 * What:  Red-team fixture for the custom ESLint rule
 *        `rrms/no-public-secret-vars`. This file intentionally references
 *        `process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET`, which IS a violation
 *        because the name combines the `NEXT_PUBLIC_` prefix (browser-bundled)
 *        with the forbidden token `SECRET`.
 * Why:   We need a known-bad input to prove the linter detects the pattern.
 *        Without a fixture, a future regression in the rule (e.g. a typo in
 *        the regex) would silently pass CI. The fixture is the canary.
 * Where: Lives under `__tests__/__fixtures__/`, which is added to ESLint's
 *        global ignores so this file does NOT fail `pnpm lint`. It is only
 *        linted via `pnpm exec eslint --no-ignore __tests__/__fixtures__/`,
 *        which is the manual verification step in Plan 1 Task 4 Step 4.
 * When:  Use whenever you change `eslint-rules/no-public-secret-vars.mjs` —
 *        re-run the --no-ignore command and confirm exactly one error fires
 *        on this file mentioning `NEXT_PUBLIC_LINE_CHANNEL_SECRET`.
 *
 * !!! INTENTIONAL VIOLATION — DO NOT "FIX" THIS FILE !!!
 * The forbidden env var below is the test subject. Removing or renaming it
 * would silently break our defense-in-depth secret-leak guard.
 */
export const apiKey = process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET;
