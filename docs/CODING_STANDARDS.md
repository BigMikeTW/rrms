# RRMS Coding Standards

Canonical rules every contributor (human or AI subagent) must follow. Code review will reject PRs that violate these.

---

## 1. 4W Documentation Comments (mandatory)

Every file and every exported function / component / API route / server action / cron handler must carry a **4W comment block in English**.

### Why

Future project owners — especially non-engineer PMs taking over operations — must be able to skim a file or function and understand its purpose without reading internal code line-by-line.

### The 4W

| Letter | Meaning |
|---|---|
| **What** | One-line summary of what this code does |
| **Why** | Business or technical reason it exists. Cite spec section if relevant (e.g. `spec §4.4.3`) |
| **Where** | How this fits in the system. What calls it, what it calls, which feature module / route group it belongs to |
| **When** | When the code runs — request handler / cron / startup / build-time / on user action |

### Level A: file-level comment (top of every file)

```ts
/**
 * What:  Generates RPR-YYYYMMDDXXX case numbers safely under concurrency.
 * Why:   Each repair case needs a stable human-readable identifier referenced
 *        by customers via LINE OA queries (spec §4.4.3).
 * Where: Imported by app/report/actions.ts. Uses Postgres advisory lock from
 *        the cases table.
 * When:  Called once per submitted repair form, inside a DB transaction.
 */
```

### Level B: function / component / API / server action

```ts
/**
 * What:  Looks up the active consent version row from `consent_versions`.
 * Why:   Frozen consent text version is recorded with each case for PDPA
 *        Article 8 compliance (告知義務).
 * Where: Called by /report page render. Queries the consent_versions table.
 * When:  Each time the public report page is server-rendered.
 */
export async function getActiveConsent() { ... }
```

### Length

4-8 lines per block. Tighter is better. No fluff.

### Out of scope

- **Auto-generated files** (e.g. `drizzle/0000_*.sql`, `next-env.d.ts`) — no comment unless hand-edited.
- **Block-level inside a function** (no per-loop, per-if, per-try). Industry style guides (Google Engineering Practices Code Review, Clean Code Ch.4) call these counterproductive. Use clear variable / function names instead.

### Coverage

| Code type | 4W required? |
|---|---|
| Production app code (`src/`) | ✅ Yes |
| Tests (`__tests__/`, `*.spec.ts`) | ✅ Yes |
| Scripts (`scripts/`) | ✅ Yes |
| Hand-written SQL migrations | ✅ Yes |
| Config files (`vercel.ts`, `eslint.config.mjs`) | ✅ Level A only |
| YAML CI workflow files | ✅ Level A as YAML comment block at top |
| Generated migrations / framework-generated | ❌ No |
| Vendored / third-party | ❌ No |

---

## 2. Other Standards (will grow as project grows)

- **Language:** TypeScript strict mode. No `any` without `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + reason in the same line.
- **Imports:** Absolute paths via `@/*` alias. No relative `../../../`.
- **Server / client boundary:** Server-only modules import `"server-only"` at the top.
- **Secrets:** Per spec 6.7, no hardcoded secrets, no `NEXT_PUBLIC_*_SECRET` naming.
- **Tests:** Co-locate where natural; cross-cutting tests in `__tests__/`.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).

---

## References

- Google Engineering Practices — Code Review Comments: https://google.github.io/eng-practices/review/reviewer/comments.html
- Conventional Commits: https://www.conventionalcommits.org/
- TypeScript Handbook — Strict mode: https://www.typescriptlang.org/tsconfig#strict

---

## Enforcement

- ESLint custom rule (Plan 1 Task 4) flags missing 4W on exported declarations.
- Code review subagent (subagent-driven-development workflow) rejects PRs missing 4W.
- This standards doc is canonical; conflicts with example code in plans → this doc wins.
