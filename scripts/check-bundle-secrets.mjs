#!/usr/bin/env node
/**
 * What:  Scans the Next.js compiled client bundle output under
 *        `.next/static/**` for any file (.js, .mjs, .css) whose contents
 *        match a curated list of secret-shaped regex patterns (LINE channel
 *        secret/token, Dropbox token, Better Auth / NextAuth / Auth.js
 *        secret env values, generic API key assignments). Emits one
 *        `LEAK: <pattern> in <file>` line per match to stderr and exits
 *        with code 2 if any matches were found, otherwise prints a single
 *        success line and exits 0.
 * Why:   Next.js inlines any value referenced as `process.env.NEXT_PUBLIC_*`
 *        into the client JS at build time. A developer who accidentally
 *        names a server-only secret with the `NEXT_PUBLIC_` prefix, or who
 *        imports a module that reads such an env var into a Client
 *        Component, will ship that secret to every browser hitting the app
 *        with no runtime warning. The .gitleaks.toml pre-commit/CI checks
 *        only see source files, never the compiled bundle, so they cannot
 *        catch this class of leak. This script is the post-build line of
 *        defense that closes that gap. Implements spec section 6.7.4
 *        (Layer 5) of the defense-in-depth secret-leak prevention strategy.
 * Where: Invoked from three places, all using the npm script
 *        `pnpm scan:bundle` defined in package.json:
 *        - Local developer machines after running `pnpm build`.
 *        - GitHub Actions CI workflow (Plan 1 Task 8) as a required job
 *          step that fails the build on non-zero exit.
 *        - Claude Code post-edit hook (Plan 1 Task 10) running after AI
 *          edits that touch build output or env-using modules.
 *        The pattern list intentionally lives inline in this file (not a
 *        separate config) so the deliverable is a single self-contained
 *        script; the patterns are kept in sync by hand with the rules in
 *        `.gitleaks.toml`.
 * When:  Run after every `pnpm build` (manually, in CI, or via the post-
 *        edit hook). Exits 0 if the bundle is clean, exits 2 if one or
 *        more potential secrets were detected (CI treats exit 2 as a hard
 *        failure), and exits 2 with a "Bundle directory not found"
 *        message if `.next/static` does not exist (i.e., build was not
 *        run first).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TARGET_DIR = ".next/static";

// 與 .gitleaks.toml 同步維護的 client-side 禁字 pattern
const PATTERNS = [
  {
    name: "LINE Channel Secret",
    regex: /channel[_-]?secret[^a-z]+[a-f0-9]{32}/i,
  },
  {
    name: "LINE Channel Access Token",
    regex: /channel[_-]?access[_-]?token[^a-z]+[A-Za-z0-9+/=]{100,}/i,
  },
  { name: "Dropbox token", regex: /sl\.[A-Za-z0-9_-]{50,}/ },
  {
    name: "Better Auth / Auth.js secret",
    regex:
      /(BETTER_AUTH_SECRET|NEXTAUTH_SECRET|AUTH_SECRET)\s*=\s*["']?[A-Za-z0-9+/=]{32,}/,
  },
  {
    name: "Generic API key",
    regex:
      /(api[_-]?key|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_+/=-]{20,}["']/i,
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (stat.isFile() && /\.(js|mjs|css)$/.test(path)) yield path;
  }
}

let leaks = 0;
try {
  for (const file of walk(TARGET_DIR)) {
    const content = readFileSync(file, "utf8");
    for (const { name, regex } of PATTERNS) {
      if (regex.test(content)) {
        console.error(`LEAK: ${name} in ${file}`);
        leaks++;
      }
    }
  }
} catch (e) {
  if (e.code === "ENOENT") {
    console.error(
      `Bundle directory not found: ${TARGET_DIR}. Run 'pnpm build' first.`,
    );
    process.exit(2);
  }
  throw e;
}

if (leaks > 0) {
  console.error(`\n${leaks} potential secret leak(s) found in client bundle.`);
  process.exit(2);
}
console.log("Bundle scan: no secrets found in client output.");
