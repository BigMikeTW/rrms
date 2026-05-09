/**
 * 4W Documentation
 * ----------------
 * What:  Red-team fixture for the custom ESLint rule
 *        `rrms/no-server-sdk-in-client`. This file is marked `"use client"`
 *        and imports `@line/bot-sdk`, which IS a violation because importing
 *        a server-only SDK in a client component would bundle the SDK and its
 *        credentials into the browser.
 * Why:   We need a known-bad input to prove the linter detects the pattern.
 *        Without a fixture, a future regression in the rule (e.g. forgetting
 *        a package, or breaking the directive detection) would silently pass
 *        CI. The fixture is the canary.
 * Where: Lives under `__tests__/__fixtures__/`, which is added to ESLint's
 *        global ignores so this file does NOT fail `pnpm lint`. It is only
 *        linted via `pnpm exec eslint --no-ignore __tests__/__fixtures__/`,
 *        which is the manual verification step in Plan 1 Task 4 Step 4.
 * When:  Use whenever you change `eslint-rules/no-server-sdk-in-client.mjs`
 *        — re-run the --no-ignore command and confirm exactly one error fires
 *        on this file mentioning `@line/bot-sdk`.
 *
 * !!! INTENTIONAL VIOLATION — DO NOT "FIX" THIS FILE !!!
 * The `"use client"` directive plus the server SDK import are the test
 * subjects. Removing either would silently break our defense-in-depth
 * secret-leak guard.
 */
"use client";
import { Client } from "@line/bot-sdk";
export const c = new Client({ channelAccessToken: "x", channelSecret: "y" });
