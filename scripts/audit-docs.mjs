#!/usr/bin/env node
/**
 * What:  Doc-lint automation for RRMS. Runs six cross-document consistency
 *        checks against `docs/`, the repo's package.json, and `.env.example`,
 *        then emits a categorized report and exits 0 (clean) or 1 (issues
 *        found, blocks CI).
 *
 *        The six checks:
 *        1. ADR-reference consistency — every `[ADR-XXXX](path)` in spec /
 *           plans / other ADRs must resolve to an existing ADR file with the
 *           matching numeric prefix.
 *        2. ADR file integrity — every ADR file in docs/adr/ has a valid
 *           Status field (Proposed / Accepted / Superseded by / Deprecated)
 *           and consistent Supersedes ⇄ Superseded-by chain (mutual link).
 *        3. Deprecated-term scan — `Auth.js`, `NEXTAUTH_SECRET`,
 *           `@auth/drizzle-adapter`, `argon2`, `users.id`, `@/auth/auth`
 *           must not appear AS PRESCRIPTIVE GUIDANCE in active spec / plans
 *           (research/ + ADRs may reference them as historical context).
 *        4. Package-version drift — versions named in spec / plans (e.g.
 *           "Drizzle 0.45.2", "Next.js 16.x") must match package.json's
 *           actual installed range.
 *        5. Env-var naming consistency — names in `.env.example` must match
 *           the names listed in spec §6.7.2 and any Plan that enumerates
 *           env vars (Plan 8 Task 9 in particular).
 *        6. Markdown link integrity — every `[text](relative/path.md#anchor)`
 *           in active spec / plans / ADRs / research / runbook resolves to
 *           an existing file (anchors not yet validated; future work).
 *
 * Why:   Implements招式 1 of the four anti-doc-debt tactics from the
 *        2026-05-10 pre-Plan-2 audit (see audit report's
 *        "文件債緩解" section). The 2026-05-09 consistency-audit found
 *        21 issues stemming from undisciplined doc edits after the Auth.js
 *        → Better Auth pivot. This script automates the same audit so a
 *        future drift never reaches `main` undetected: Phase 5 wires this
 *        into `.github/workflows/ci.yml` as a required status check, and
 *        the per-Plan mini-audit feedback rule
 *        (`feedback_per_plan_mini_audit.md`) requires this script to pass
 *        before any Plan PR opens.
 *
 *        Defense-in-depth corollary: catching docs drift in CI is to docs
 *        what spec §6.7.4 Layer 4 (CI) is to code — the platform layer
 *        that cannot be bypassed by an inattentive contributor.
 *
 * Where: Repo root: `scripts/audit-docs.mjs`. Invoked manually via
 *        `pnpm audit:docs` (npm script added in package.json) or
 *        automatically via the `doc-audit` CI job (Phase 5 work).
 *        Reads docs/, .env.example, package.json. Writes nothing — pure
 *        report-and-exit. No external dependencies; uses Node 22 native
 *        fs/promises, path, url.
 *
 * When:  - Manually before any spec/plan/ADR commit (recommended).
 *        - Automatically in CI on every push / PR (Phase 5 onwards).
 *        - Required to pass before per-Plan mini-audit reports may
 *          declare the Plan's docs clean (per feedback_per_plan_mini_audit.md).
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const DOCS = join(REPO_ROOT, "docs");
const ADR_DIR = join(DOCS, "adr");
const SPECS_DIR = join(DOCS, "superpowers", "specs");
const PLANS_DIR = join(DOCS, "superpowers", "plans");
const RESEARCH_DIR = join(DOCS, "superpowers", "research");
const RUNBOOK_DIR = join(DOCS, "runbook");

// Files to lint with prescriptive checks (deprecated-term scan applies here).
// Research/ADR pages may reference deprecated terms historically.
const ACTIVE_PRESCRIPTIVE = [SPECS_DIR, PLANS_DIR];

// Files that participate in markdown-link integrity (broader set).
const LINKED_FROM = [SPECS_DIR, PLANS_DIR, ADR_DIR, RESEARCH_DIR, RUNBOOK_DIR];

const issues = [];
function reportIssue(category, severity, file, message, line = null) {
  issues.push({ category, severity, file, message, line });
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  if (!(await exists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) yield full;
  }
}

// --------------------------------------------------------------------------
// Check 1 + 2: ADR system integrity
// --------------------------------------------------------------------------

async function checkAdrIntegrity() {
  if (!(await exists(ADR_DIR))) return;
  const adrFiles = [];
  for await (const f of walk(ADR_DIR)) adrFiles.push(f);

  const adrByNumber = new Map();
  for (const f of adrFiles) {
    const base = f.split(/[\\/]/).pop();
    if (base === "README.md" || base === "_template.md") continue;
    const m = base.match(/^(\d{4})-/);
    if (!m) {
      reportIssue("ADR", "error", relPath(f), `ADR filename doesn't start with 4-digit number: ${base}`);
      continue;
    }
    adrByNumber.set(m[1], f);
  }

  // Verify each ADR's Status / Supersedes / Superseded-by fields
  for (const [num, file] of adrByNumber) {
    const text = await readFile(file, "utf8");
    const status = text.match(/^\|\s*Status\s*\|\s*([^|]+?)\s*\|/m)?.[1]?.trim();
    if (!status) {
      reportIssue("ADR", "error", relPath(file), `ADR ${num} missing Status field`);
      continue;
    }
    const validStatus =
      /^(Proposed|Accepted|Deprecated)$/.test(status) ||
      /^Superseded by ADR-\d{4}$/.test(status);
    if (!validStatus) {
      reportIssue("ADR", "error", relPath(file), `ADR ${num} has invalid Status: "${status}"`);
    }

    // Mutual supersede chain
    const supersedes = text.match(/^\|\s*Supersedes\s*\|\s*([^|]+?)\s*\|/m)?.[1]?.trim();
    if (supersedes && supersedes !== "—") {
      const supersededNum = supersedes.match(/ADR-(\d{4})/)?.[1];
      if (!supersededNum) {
        reportIssue("ADR", "error", relPath(file), `ADR ${num} Supersedes field "${supersedes}" not in "ADR-XXXX" form`);
      } else {
        const target = adrByNumber.get(supersededNum);
        if (!target) {
          reportIssue("ADR", "error", relPath(file), `ADR ${num} Supersedes ADR-${supersededNum} but that ADR doesn't exist`);
        } else {
          const targetText = await readFile(target, "utf8");
          const targetSupersededBy = targetText.match(/^\|\s*Superseded by\s*\|\s*([^|]+?)\s*\|/m)?.[1]?.trim();
          if (!targetSupersededBy?.includes(`ADR-${num}`)) {
            reportIssue("ADR", "error", relPath(file), `ADR ${num} Supersedes ADR-${supersededNum} but ADR-${supersededNum}'s "Superseded by" doesn't link back`);
          }
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// Check 3: ADR-reference consistency in spec/plans/research
// --------------------------------------------------------------------------

async function checkAdrReferences() {
  const adrSet = new Set();
  if (await exists(ADR_DIR)) {
    for await (const f of walk(ADR_DIR)) {
      const base = f.split(/[\\/]/).pop();
      const m = base.match(/^(\d{4})-/);
      if (m) adrSet.add(m[1]);
    }
  }

  for (const dir of LINKED_FROM) {
    for await (const file of walk(dir)) {
      const text = await readFile(file, "utf8");
      const refs = text.matchAll(/ADR-(\d{4})/g);
      for (const m of refs) {
        const num = m[1];
        if (num === "0000") continue; // meta-ADR always exists
        if (!adrSet.has(num)) {
          // Phase 2A allowance: ADR 0001-0131 are populated in Phase 2B.
          // Surface as warning, not error, until Phase 2B completes.
          reportIssue(
            "ADR-ref",
            "warn",
            relPath(file),
            `References ADR-${num} but no such ADR file exists yet (expected in Phase 2B)`
          );
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// Check 4: deprecated-term scan in active prescriptive docs
// --------------------------------------------------------------------------

const DEPRECATED_TERMS = [
  // [pattern, replacement-or-explanation]
  [/\bAuth\.js\b/g, "Better Auth (per ADR-0006 / brainstorm A5 reversal)"],
  [/\bNEXTAUTH_SECRET\b/g, "BETTER_AUTH_SECRET"],
  [/\bAUTH_SECRET\b(?!.*BETTER_AUTH)/g, "BETTER_AUTH_SECRET"],
  [/@auth\/drizzle-adapter/g, "better-auth/adapters/drizzle"],
  [/\bargon2\b/g, "scrypt (Better Auth built-in)"],
  [/users\.id\b/g, "user.id (Better Auth singular table)"],
  [/@\/auth\/auth/g, "@/lib/auth"],
];

// Allow-list: lines that mention deprecated terms in CONTEXTUAL / HISTORICAL
// form (explanations, comparisons, rule-definitions, banners) — must not flag.
const HISTORICAL_CONTEXT_PATTERNS = [
  // Headings & sections that announce historical comparison
  /Why Better Auth/i,
  /and not Auth\.js/i,
  /\(NOT Auth\.js/i,

  // Explicit "rejected / replaced / migrated" prose
  /not Auth\.js/i,
  /Replaces Auth\.js/i,
  /Auth\.js → Better Auth/i,
  /Better Auth.*取代.*Auth\.js/, // "Better Auth ... 取代 Auth.js"
  /取代.*Auth\.js/, // "取代 Auth.js"
  /not\s+`?@auth\/drizzle-adapter/i,
  /無\s*`?@auth\/drizzle-adapter/i,
  /不需要\s*`?@auth\/drizzle-adapter/i,
  /不再需要\s*`?bcryptjs/,
  /無需 bcrypt/,
  /無需\s+bcrypt/,
  /per maintainership transfer/i,
  /maintainership transferred to Better Auth/i,
  /維護權移轉/, // "維護權移轉" (Chinese)
  /移轉協議/,

  // Comparison context: line mentions BOTH Better Auth AND Auth.js
  // (i.e., we're explaining a difference, not prescribing Auth.js)
  /Better Auth.*Auth\.js/i,
  /Auth\.js.*Better Auth/i,
  /跟 Auth\.js/, // "跟 Auth.js" (Chinese comparison particle)
  /與 Auth\.js/, // "與 Auth.js"
  /和 Auth\.js/, // "和 Auth.js"

  // Banners that explicitly mark a doc / section as historical
  /historical document/i,
  /\bhistorical\b/i,
  /\bsuperseded\b/i,
  /已淘汰/,
  /no longer applicable/i,
  /path was rejected/i,
  /entries are historical/i,
  /Auth\.js sections/i,

  // Gitleaks / bundle-scan / regex rule lines (we WANT them to detect leaks
  // of these env names — that's correct, not a usage of the deprecated thing)
  /^\s*(description|regex|id|name|rules?)\s*[=:]/i,
  /BETTER_AUTH_SECRET\s*\|\s*NEXTAUTH_SECRET/, // regex alternation
  /\(BETTER_AUTH_SECRET\|/,
  /BETTER_AUTH_SECRET\s*\/\s*NEXTAUTH_SECRET/,
  /BETTER_AUTH_SECRET\s*\/\s*AUTH_SECRET/,
];

// Detect whether the matched position is inside backticks on the same line.
// Inline-code references (e.g. `@auth/drizzle-adapter`) are documentation
// quotes, not prescriptions.
function isInsideInlineCode(line, matchIndex) {
  let backtickCount = 0;
  for (let i = 0; i < matchIndex; i++) {
    if (line[i] === "`") backtickCount++;
  }
  return backtickCount % 2 === 1;
}

function isHistoricalContextLine(line) {
  return HISTORICAL_CONTEXT_PATTERNS.some((p) => p.test(line));
}

// Track whether we're currently inside a Markdown section whose heading marks
// the section as historical comparison (e.g., "## Why Better Auth (and not Auth.js v5)").
function isHistoricalSection(headingStack) {
  return headingStack.some((h) =>
    /Why Better Auth|and not Auth\.js|historical|deprecated|superseded/i.test(h)
  );
}

async function checkDeprecatedTerms() {
  for (const dir of ACTIVE_PRESCRIPTIVE) {
    for await (const file of walk(dir)) {
      const text = await readFile(file, "utf8");
      const lines = text.split(/\r?\n/);
      const headingStack = []; // track active section headings
      let inFencedCodeBlock = false; // track ``` fenced blocks

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track fenced code blocks (``` opens / closes; ignore content inside)
        // — these are illustrative code/example, not prescription
        if (/^```/.test(line)) {
          inFencedCodeBlock = !inFencedCodeBlock;
          continue;
        }
        if (inFencedCodeBlock) continue;

        // Update heading stack on # / ## / ### lines
        const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
        if (headingMatch) {
          const depth = headingMatch[1].length;
          while (headingStack.length >= depth) headingStack.pop();
          headingStack.push(headingMatch[2]);
        }

        if (isHistoricalSection(headingStack)) continue;
        if (isHistoricalContextLine(line)) continue;

        for (const [pattern, hint] of DEPRECATED_TERMS) {
          pattern.lastIndex = 0;
          let m;
          while ((m = pattern.exec(line))) {
            if (isInsideInlineCode(line, m.index)) continue;
            reportIssue(
              "deprecated-term",
              "error",
              relPath(file),
              `Line ${i + 1}: deprecated term "${m[0]}" — use ${hint}`,
              i + 1
            );
            break; // one report per pattern per line
          }
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// Check 5: package-version drift
// --------------------------------------------------------------------------

async function checkPackageVersionDrift() {
  const pkgPath = join(REPO_ROOT, "package.json");
  if (!(await exists(pkgPath))) return;
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  const installed = { ...pkg.dependencies, ...pkg.devDependencies };

  // Sample of locked packages mentioned in plans (exact pin or caret)
  const expectations = [
    // [package-in-pkg, regex-in-docs, docs-says (for error message)]
    ["@vercel/config", /@vercel\/config@(\d+\.\d+\.\d+)/, "exact pin"],
    ["next", /Next\.js\s+(\d+)\.x/i, "major version"],
    ["typescript", /TypeScript\s+(\d+)\.x/i, "major version"],
  ];

  // Walk specs/plans, scan for version claims, cross-check with package.json
  for (const dir of [SPECS_DIR, PLANS_DIR]) {
    for await (const file of walk(dir)) {
      const text = await readFile(file, "utf8");
      for (const [pkgName, re, kind] of expectations) {
        const matches = text.matchAll(new RegExp(re.source, re.flags + "g"));
        for (const m of matches) {
          const docVersion = m[1];
          const installedRange = installed[pkgName];
          if (!installedRange) continue; // not installed yet (e.g. Plan 3 deps)
          // For exact-pin: compare full version
          // For major-version: compare leading major
          const installedMajor = installedRange.match(/(\d+)/)?.[1];
          if (kind === "exact pin" && !installedRange.includes(docVersion)) {
            reportIssue(
              "version-drift",
              "warn",
              relPath(file),
              `Doc says ${pkgName}@${docVersion} but package.json has "${installedRange}"`
            );
          } else if (kind === "major version" && installedMajor !== docVersion) {
            reportIssue(
              "version-drift",
              "warn",
              relPath(file),
              `Doc says ${pkgName} v${docVersion}.x but package.json has "${installedRange}"`
            );
          }
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// Check 6: env-var naming consistency (.env.example ⇄ docs)
// --------------------------------------------------------------------------

async function checkEnvVarConsistency() {
  const envPath = join(REPO_ROOT, ".env.example");
  if (!(await exists(envPath))) return;
  const envText = await readFile(envPath, "utf8");
  const envVars = new Set();
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]+)=/);
    if (m) envVars.add(m[1]);
  }

  // Scan spec & plans for env-var mentions; collect anything that looks like
  // an env name and compare. This catches drift like "DATABASE_URL_POOLED"
  // vs ".env.example DATABASE_URL_UNPOOLED".
  const docEnvVars = new Set();
  for (const dir of [SPECS_DIR, PLANS_DIR]) {
    for await (const file of walk(dir)) {
      const text = await readFile(file, "utf8");
      // Only treat all-caps identifiers as env candidates (avoids false positives)
      const matches = text.matchAll(/\b([A-Z][A-Z0-9_]{4,})\b/g);
      for (const m of matches) {
        const name = m[1];
        // Filter common false positives
        if (
          name === "OWASP" || name === "OAUTH" || name === "OIDC" ||
          name === "HTTPS" || name === "PUT" || name === "GET" ||
          name === "POST" || name === "DELETE" || name === "JSON" ||
          name === "HTML" || name === "CSV" || name === "PDF" ||
          name === "SQL" || name === "URL" || name === "URI" ||
          name === "API" || name === "SDK" || name === "CLI" ||
          name === "RRMS" || name === "CRUD" || name === "RBAC" ||
          name === "CSRF" || name === "XSS" || name === "IDOR" ||
          name === "GDPR" || name === "PDPA" || name === "TOS" ||
          name === "NULL" || name === "TEXT" || name === "UUID" ||
          name === "HASH" || name === "EMAIL" || name === "PHONE" ||
          name === "PASS" || name === "FAIL" || name === "WARN" ||
          name === "ERROR" || name === "INFO" || name === "DEBUG" ||
          name === "TRUE" || name === "FALSE" || name === "MERGE" ||
          name === "PUSH" || name === "PULL" || name === "FETCH" ||
          name === "STAT" || name === "DIFF" || name === "BLOB"
        ) continue;
        if (name.length > 50) continue; // probably a long ALL_CAPS narrative
        docEnvVars.add(name);
      }
    }
  }

  // Known false-positives we explicitly don't want to flag:
  //   - Truncated names ending in "_" (e.g. "BETTER_AUTH_", "NEXT_PUBLIC_")
  //   - Names appearing only inside regex alternation (`(A|B|C)`) or rule
  //     definitions (gitleaks .gitleaks.toml mentions of past secret names)
  //   - Test fixture names (LINE_CHANNEL_SECRET in red-team scripts)
  //   - GitHub Actions native env (GITHUB_TOKEN)
  //   - Truncated narrative all-caps (e.g. ALL_CAPS_TITLES)
  const KNOWN_NON_RRMS_ENV = new Set([
    "GITHUB_TOKEN", // GitHub Actions native, not RRMS app config
    "FAKE_SECRET",  // red-team-test.sh script variable
    "PAYLOAD_NAME", // ditto
    "NEXTAUTH_SECRET", // historical, only in rule patterns
    "AUTH_SECRET",     // historical, only in rule patterns
    "POSTGRES_URL",        // Vercel/Neon legacy auto-injected, RRMS uses DATABASE_URL
    "POSTGRES_PRISMA_URL", // same
    "POSTGRES_URL_NON_POOLING", // same
    "TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD",
    "TEST_STAFF_EMAIL", "TEST_STAFF_PASSWORD",
    "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD",
    // Red-team test fixtures (Plan 1 Task 4 Step 4 violation-public-secret.tsx):
    "NEXT_PUBLIC_LINE_CHANNEL_SECRET",
    // Red-team test payload (red-team-test.sh PAYLOAD_NAME):
    "LINE_CHANNEL_SECRET",
  ]);

  const candidateEnvVars = [...docEnvVars].filter((v) =>
    v.includes("_") &&
    !v.endsWith("_") && // truncated like "NEXT_PUBLIC_"
    !v.startsWith("RPR_") &&
    !envVars.has(v) &&
    !KNOWN_NON_RRMS_ENV.has(v) &&
    // Only flag patterns that LOOK like RRMS env vars
    (
      /_(SECRET|TOKEN|URL|KEY|ID)$/.test(v) ||
      /^(LINE_|GOOGLE_|DROPBOX_|BETTER_AUTH_|NEXT_PUBLIC_|CRON_|DATABASE_)/.test(v)
    )
  );

  for (const name of candidateEnvVars) {
    reportIssue(
      "env-var-drift",
      "warn",
      ".env.example",
      `Doc references ${name} but it's not in .env.example`
    );
  }
}

// --------------------------------------------------------------------------
// Check 7: markdown link integrity (relative paths)
// --------------------------------------------------------------------------

async function checkMarkdownLinks() {
  for (const dir of LINKED_FROM) {
    for await (const file of walk(dir)) {
      const text = await readFile(file, "utf8");
      const lines = text.split(/\r?\n/);
      let inFencedCodeBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip lines inside fenced code blocks — they're illustrative templates
        // (e.g., the README content inside Plan 1 Task 13 code fence)
        if (/^```/.test(line)) {
          inFencedCodeBlock = !inFencedCodeBlock;
          continue;
        }
        if (inFencedCodeBlock) continue;

        const linkRe = /\[([^\]]+)\]\(([^)#]+\.md)(#[^)]*)?\)/g;
        let m;
        while ((m = linkRe.exec(line))) {
          const [, , target] = m;
          if (target.startsWith("http://") || target.startsWith("https://")) continue;

          // Skip URL-encoded paths leading to user-level memory storage
          if (target.includes("%20") || target.includes("Mike Lin/.claude")) continue;

          // Skip placeholder paths in templates and examples
          if (
            target.startsWith("path/to/") ||
            target.includes("<your>") ||
            target.includes("<owner>") ||
            target.includes("<#>") ||
            target.includes("<PR")
          ) continue;

          const resolved = resolve(dirname(file), target);
          if (!(await exists(resolved))) {
            reportIssue(
              "broken-link",
              "error",
              relPath(file),
              `Broken markdown link: "${target}" (line ${i + 1})`,
              i + 1
            );
          }
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// Reporter
// --------------------------------------------------------------------------

function relPath(absPath) {
  return relative(REPO_ROOT, absPath).replace(/\\/g, "/");
}

function printReport() {
  if (issues.length === 0) {
    console.log("✓ audit-docs: no issues found across all 7 checks.");
    return 0;
  }

  const byCategory = new Map();
  let errorCount = 0;
  let warnCount = 0;
  for (const issue of issues) {
    if (!byCategory.has(issue.category)) byCategory.set(issue.category, []);
    byCategory.get(issue.category).push(issue);
    if (issue.severity === "error") errorCount++;
    else warnCount++;
  }

  for (const [cat, list] of byCategory) {
    console.log(`\n[${cat}] ${list.length} issue(s):`);
    for (const i of list) {
      const tag = i.severity === "error" ? "ERROR" : "WARN ";
      const where = i.line ? `${i.file}:${i.line}` : i.file;
      console.log(`  ${tag} ${where}\n        ${i.message}`);
    }
  }

  console.log(`\nSummary: ${errorCount} error(s), ${warnCount} warning(s).`);
  return errorCount > 0 ? 1 : 0;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

const checks = [
  ["ADR file integrity", checkAdrIntegrity],
  ["ADR reference consistency", checkAdrReferences],
  ["Deprecated-term scan", checkDeprecatedTerms],
  ["Package-version drift", checkPackageVersionDrift],
  ["Env-var naming consistency", checkEnvVarConsistency],
  ["Markdown link integrity", checkMarkdownLinks],
];

for (const [name, fn] of checks) {
  try {
    await fn();
  } catch (e) {
    console.error(`audit-docs: check "${name}" threw:`, e);
    process.exit(2);
  }
}

process.exit(printReport());
