#!/usr/bin/env bash
# What:  Automated red-team test of the RRMS Phase 1 secret-leak defenses.
#        Plants a deliberately-formatted fake LINE Channel Secret into a
#        scratch file, then exercises Layer 2 (Husky pre-commit hook) and
#        Layer 1 (Claude Code Stop hook via post-review-scan.sh) against it.
#        Reports pass/fail per layer and exits non-zero if any automated
#        layer let the secret through. Layer 4 (GitHub Actions gitleaks
#        scan) is logged as MANUAL — it has been verified separately per
#        Plan 1 Task 9 Step 3 (PR-level block on PR #2) and is not
#        automatable from a local shell.
# Why:   Implements spec section 6.7.4's acceptance condition that every
#        layer MUST actually fire when a real secret pattern is introduced.
#        Without this script, the security plumbing's correctness is only
#        assumed — wiring could regress (e.g., a Husky upgrade that breaks
#        the hook, or a .gitleaks.toml allowlist edit that is too broad)
#        and nobody would notice until a real leak slipped through. By
#        running this on demand, a developer or CI gets concrete evidence
#        the plumbing is live: gitleaks DID see the fake secret, the
#        pre-commit DID abort, and post-review-scan.sh DID exit 2.
# Where: Repository script — invoke manually from any shell that has
#        gitleaks, git, bash, and pnpm on PATH:
#          bash scripts/red-team-test.sh
#        The script self-cleans via a trap so the fake secret never
#        survives a run, even on abnormal exit. May be wired into CI in
#        Plan 2 if periodic verification is wanted; not wired today.
# When:  Run on demand:
#          - Any time the security stack changes (.gitleaks.toml, Husky
#            hooks, post-review-scan.sh, .claude/settings.json hooks).
#          - Before opening the Plan 1 final PR.
#          - Before any production cutover, to catch silent regressions.
#        NOT run automatically on every commit (gitleaks already runs
#        every commit via Layer 2; this script is the meta-test that
#        confirms Layer 2 itself still works).

set -uo pipefail

# Build the fake secret literal from three halves so this script's source
# does NOT contain (a) `channel_secret` + 32 contiguous hex chars on the
# same line, nor (b) any line that the gitleaks generic-api-key built-in
# rule recognises as a key-equals-value assignment of secret-like length.
# Variable names intentionally avoid the words SECRET / KEY / TOKEN for
# the same reason. The runtime payload assembles to the canonical form
# expected by spec 6.7.4 (LINE Channel Secret env var name = 32 hex).
PAYLOAD_NAME="LINE_CHANNEL_SECRET"
PAYLOAD_HI="0123456789012345"
PAYLOAD_LO="6789012345678abc"
FAKE_SECRET="${PAYLOAD_NAME}=${PAYLOAD_HI}${PAYLOAD_LO}"
TEST_FILE="red-team-secret.txt"
PASS=0
FAIL=0

cleanup() {
  rm -f "$TEST_FILE"
  git restore --staged "$TEST_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# === Layer 2: pre-commit ===
echo "=== L2: pre-commit hook ==="
echo "$FAKE_SECRET" > "$TEST_FILE"
git add "$TEST_FILE"
if git commit -m "RED TEAM SHOULD FAIL" 2>&1 | tee /tmp/red-l2.log; then
  echo "L2 FAIL: pre-commit allowed secret to commit"
  FAIL=$((FAIL+1))
else
  echo "L2 PASS: pre-commit blocked"
  PASS=$((PASS+1))
fi
git restore --staged "$TEST_FILE"

# === Layer 1: Claude Code Stop hook (post-review-scan.sh direct) ===
echo "=== L1: Claude Code Stop hook (post-review-scan.sh direct) ==="
if bash scripts/post-review-scan.sh > /tmp/red-l1.log 2>&1; then
  echo "L1 FAIL: post-review-scan exited 0 with secret present"
  FAIL=$((FAIL+1))
else
  EXIT=$?
  if [ "$EXIT" -eq 2 ]; then
    echo "L1 PASS: post-review-scan exit 2 as expected"
    PASS=$((PASS+1))
  else
    echo "L1 PARTIAL: post-review-scan exit $EXIT (expected 2 for blocking)"
    FAIL=$((FAIL+1))
  fi
fi

# === Layer 4: GitHub Actions ===
echo "=== L4: GitHub Actions ==="
echo "L4 MANUAL: Use Task 9 Step 3 procedure to verify; not automated here."

cleanup

echo
echo "=== Summary ==="
echo "Pass: $PASS / 2 automated layers (L1, L2)"
echo "Fail: $FAIL"
echo "L4 must be verified manually per Task 9 Step 3"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
