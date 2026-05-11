<!--
What:  Hexagonal "ports" layer for RRMS — the only place inside src/ allowed
       to know about platform-specific SDKs (Vercel Blob, LINE Bot SDK,
       Vercel Cron, Vercel AI SDK, Dropbox, etc.).
Why:   Per ADR-0110 every Vercel-specific or vendor-specific SDK call must
       be wrapped behind a port interface so the business layer can swap
       providers without rewriting itself. Per ADR-0112 this is one of
       five lock-in mitigation disciplines required by the spec.
Where: Consumed by src/app, src/lib, and src/components via type-only
       imports of the port (e.g. `import type { StorageAdapter } from
       '@/adapters/storage'`). The eslint-rules/no-platform-sdk-outside-adapter
       rule blocks all other paths from importing platform SDKs directly.
When:  Phase 1 ships only the port interfaces (this directory). Concrete
       adapter implementations land in Plan 5 (Dropbox storage), Plan 6
       (LINE Bot SDK), Plan 8 (Vercel Cron), and Phase 3+ (AI providers).
-->

# `src/adapters` — Ports & Adapters

This directory is the **ports** half of the Hexagonal / Ports-and-Adapters architecture mandated by [ADR-0110](../../docs/adr/0110-hexagonal-ports-and-adapters.md). All Vercel-specific and vendor-specific SDK access goes through here; nothing in `src/app`, `src/lib`, or `src/components` may `import` a platform SDK directly.

## Discipline

1. **Folder per port.** Each port lives in its own subfolder (`storage/`, `queue/`, `cron/`, `ai/`, `line/`). Phase 1 ships only the port interface (`index.ts`). Concrete adapters land in subsequent Plans and live in the same folder (e.g. `storage/DropboxAdapter.ts` from Plan 5).

2. **Business code imports the port, not the SDK.**

   ```ts
   // OK — allowed in src/app, src/lib, src/components
   import type { StorageAdapter } from "@/adapters/storage";

   // BLOCKED by eslint-rules/no-platform-sdk-outside-adapter
   import { put } from "@vercel/blob";
   ```

3. **Port interfaces use neutral contracts.** No Vercel-only return types, no LINE-only error codes leaking through. If a vendor field is needed, name it abstractly and translate inside the adapter (per [ADR-0112](../../docs/adr/0112-five-lock-in-mitigation-disciplines.md) discipline 2).

4. **Vendor-neutral libraries are exempted from re-wrapping.** Better Auth (per [ADR-0132](../../docs/adr/0132-better-auth-replaces-authjs-v5.md)) is itself a framework-agnostic abstraction — wrapping it in another adapter would be a false abstraction (Mortoray, _The False Abstraction Antipattern_). Business code imports `@/lib/auth` directly. See [ADR-0110 §Exceptions](../../docs/adr/0110-hexagonal-ports-and-adapters.md) for the full list and rationale. The ESLint rule still blocks alternate auth libraries (`next-auth`, `@clerk/*`, `lucia`, …) from sneaking in without a new ADR.

5. **New platform SDK = new ADR + new port.** Before a PR adds a new vendor-specific SDK, an ADR must justify the choice and a port interface must be designed first. Direct SDK use without a port is rejected at PR review and blocked by CI lint.

## Phase 1 status

| Port    | File                                               | Status         | Concrete adapter lands in                                                                                                                                                                                                    |
| ------- | -------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage | `storage/index.ts`                                 | Port-only      | Plan 5 (Dropbox media pipeline)                                                                                                                                                                                              |
| Queue   | `queue/index.ts`                                   | Port-only      | Phase 2+ (no Phase 1 consumer)                                                                                                                                                                                               |
| Cron    | `cron/index.ts`                                    | Port-only      | Plan 8 (Vercel Cron — anonymization)                                                                                                                                                                                         |
| AI      | `ai/index.ts`                                      | Port-only      | Phase 3+ (no Phase 1 consumer)                                                                                                                                                                                               |
| LINE    | `line/index.ts`                                    | Port-only      | Plan 6 (admin push) + Phase 7 (LIFF customer UI)                                                                                                                                                                             |
| Cache   | `cache/index.ts` + `cache/InMemoryCacheAdapter.ts` | Phase 1 active | `InMemoryCacheAdapter` ships now (per [ADR-0110](../../docs/adr/0110-hexagonal-ports-and-adapters.md) + Phase 4 finding #4 — Vercel KV deprecated, in-memory adapter chosen)                                                 |
| Email   | `email/index.ts`                                   | Port-only      | Plan 4 / 8 — `ResendEmailAdapter` (per [ADR-0110](../../docs/adr/0110-hexagonal-ports-and-adapters.md) + [ADR-0134](../../docs/adr/0134-better-auth-phase-1-security-configuration.md) — Resend pulled forward into Phase 1) |

## Why no `auth/` and no generic `messaging/`

- **No `auth/`**: Better Auth is already framework-agnostic. Adding a thin wrapper is the false-abstraction antipattern (single implementation, surface 1:1 with the library, swap-out cost paid in full anyway). Decision recorded in ADR-0110 §Exceptions; researcher analysis 2026-05-10 (Q2).
- **No generic `messaging/`**: LINE's reply-token + Flex Message + monthly push quota model differs structurally from Slack / SMS / Email. A unified port would collapse to lowest-common-denominator (text-only) and force every channel to bypass it for rich content. Phase 4 Resend gets its own `email/` port alongside this one. Decision: researcher analysis 2026-05-10 (Q3).

## Mapping to lock-in disciplines

This directory implements **discipline 1** of the five lock-in mitigations in [ADR-0112](../../docs/adr/0112-five-lock-in-mitigation-disciplines.md). Disciplines 2 (neutral contracts), 3 (no Vercel-only flagship products), 4 (export backups), and 5 (spec Platform Dependencies section) are enforced elsewhere — see [ADR-0111](../../docs/adr/0111-spec-platform-dependencies-section.md), ADR-0112, and [ADR-0114](../../docs/adr/0114-lock-in-target-5-to-8-percent.md).

## References

- [ADR-0110 — Hexagonal / Ports-and-Adapters mandatory](../../docs/adr/0110-hexagonal-ports-and-adapters.md)
- [ADR-0112 — Five lock-in mitigation disciplines](../../docs/adr/0112-five-lock-in-mitigation-disciplines.md)
- [ADR-0006 — Vercel Blob storage](../../docs/adr/0006-vercel-blob-storage-adapter.md)
- [ADR-0009 — Vercel Cron](../../docs/adr/0009-vercel-cron-adapter.md)
- [ADR-0022 — AI adapter abstraction](../../docs/adr/0022-ai-adapter-abstraction.md)
- [ADR-0132 — Better Auth pivot](../../docs/adr/0132-better-auth-replaces-authjs-v5.md)
- Hexagonal Architecture (Cockburn 2005): https://alistair.cockburn.us/hexagonal-architecture/
- AWS Prescriptive Guidance — Hexagonal Architecture: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html
- Mortoray — _The False Abstraction Antipattern_: https://mortoray.com/the-false-abstraction-antipattern/
