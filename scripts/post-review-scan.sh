#!/usr/bin/env bash
# What:  Layer 1 (Claude Code in-session) security/quality scan that runs five
#        checks in sequence and counts violations across all of them:
#          1. gitleaks scan of the working tree (uncommitted edits) using the
#             repo's .gitleaks.toml allowlist + rules.
#          2. gitleaks scan of the last 50 commits of git history (catches
#             secrets a Claude session may have introduced into earlier
#             commits but not yet pushed).
#          3. ESLint on the entire repo with --max-warnings=0 (enforces
#             rrms/no-public-secret-vars and other repo rules).
#          4. TypeScript --noEmit typecheck via `pnpm typecheck`.
#          5. Conditional client-bundle secret scan via
#             `node scripts/check-bundle-secrets.mjs`, only if .next/static
#             exists (i.e. a build was run in this workspace).
#        On any violation, the script accumulates a count, finishes every
#        check, prints all findings, then exits 2 (block). On clean state
#        it exits 0.
# Why:   Implements spec section 6.7.4 Layer 1 of the defense-in-depth
#        secret-leak / quality-regression prevention strategy. Layer 1 is
#        the only layer that fires DURING a Claude Code session — before
#        the developer reviews changes, before `git add`, and well before
#        the Husky pre-commit hook (Layer 2) runs. That early-warning gap
#        is what catches violations introduced by an autonomous AI edit
#        loop in real time, so the human reviewer never sees a "ready"
#        state that already contains a leaked secret, a type error, or a
#        lint regression. We deliberately use `set -uo pipefail` (NOT
#        `-euo pipefail`) so that one failing check does NOT short-circuit
#        the rest — the report needs to surface ALL violations at once so
#        Claude can fix them in a single pass instead of N round trips.
# Where: Wired into Claude Code via .claude/settings.json:
#          - Stop hook: this script's exit code 2 BLOCKS Claude from
#            ending its turn until the violations are fixed.
#          - PostToolUse(matcher=Task) hook: invoked with `|| true` so
#            it informs (writes to stderr) but does NOT block, since
#            Stop is the authoritative gate. Keeping PostToolUse
#            non-blocking avoids cascading failures inside a multi-step
#            agent run.
#        Also runnable manually from a developer shell:
#          bash scripts/post-review-scan.sh
# When:  Effectively continuous during AI-assisted development sessions:
#          - After every Task tool invocation (PostToolUse, advisory).
#          - Before every Stop event (blocking gate at end of turn).
#        Complements Layer 2 (Husky pre-commit: gitleaks + lint-staged +
#        typecheck) and Layer 3 (CI on push/PR) which fire later in the
#        lifecycle. Total runtime target: under ~30s on a typical
#        Phase 1 working tree (gitleaks ~1.5s, ESLint ~5–15s, tsc ~5–15s).

set -uo pipefail

# Resolve repo root via $CLAUDE_PROJECT_DIR (set by Claude Code) or fall back
# to the script's location. This makes the hook robust against the agent
# launching with a different cwd.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(dirname "$SCRIPT_DIR")}"
cd "$REPO_ROOT"

VIOLATIONS=0
SKIPPED=0

# Helper: distinguish "tool missing" (warn, skip — not a violation) from
# "tool found a real problem" (count violation). Without this, a developer
# whose PATH lacks gitleaks/pnpm/node would see misleading "VIOLATION"
# messages instead of an actionable "tool missing" hint.
require_tool() {
  if command -v "$1" >/dev/null 2>&1; then
    return 0
  fi
  echo "WARN: '$1' not on PATH — skipping the check that depends on it" >&2
  SKIPPED=$((SKIPPED + 1))
  return 1
}

echo "::group::gitleaks scan (working tree + last 50 commits)"
if require_tool gitleaks; then
  # 1) Working tree
  if ! gitleaks detect --source . --no-git --redact --config .gitleaks.toml --no-banner; then
    echo "VIOLATION: gitleaks detected secret in working tree"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
  # 2) Last 50 commits
  if ! gitleaks detect --source . --redact --config .gitleaks.toml --log-opts="-50" --no-banner; then
    echo "VIOLATION: gitleaks detected secret in recent git history"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi
echo "::endgroup::"

echo "::group::ESLint"
if require_tool pnpm; then
  if ! pnpm exec eslint . --max-warnings=0; then
    echo "VIOLATION: ESLint errors"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi
echo "::endgroup::"

echo "::group::TypeScript typecheck"
if require_tool pnpm; then
  if ! pnpm typecheck; then
    echo "VIOLATION: TypeScript errors"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi
echo "::endgroup::"

# Bundle scan only if there's a build output
if [ -d ".next/static" ]; then
  echo "::group::Client bundle scan"
  if require_tool node; then
    if ! node scripts/check-bundle-secrets.mjs; then
      echo "VIOLATION: client bundle contains secret pattern"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
  echo "::endgroup::"
fi

if [ "$SKIPPED" -gt 0 ]; then
  echo "WARN: $SKIPPED check(s) skipped due to missing tools — install them and re-run" >&2
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "Blocking: $VIOLATIONS violation(s) detected. Fix before stopping." >&2
  exit 2
fi

echo "All security checks passed."
exit 0
