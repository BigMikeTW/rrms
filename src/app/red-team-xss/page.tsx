/**
 * What:  Intentionally-vulnerable reflected XSS test page for Plan 2
 *        Task 9 red-team verification of ZAP detection. Uses
 *        `dangerouslySetInnerHTML` to inject unsanitized `?q=` query
 *        parameter directly into HTML, producing a textbook reflected
 *        XSS vector that ZAP baseline rule 40012 / 40014 should flag.
 * Why:   Closes the loop on Plan 2 Task 9 acceptance — proves the ZAP
 *        baseline workflow (Task 4) catches a planted XSS on Vercel
 *        preview, fails the CI, and auto-creates a GitHub issue (Task
 *        6 acceptance bundled). File will be DELETED in same red-team
 *        branch cleanup; never reaches `main`.
 * Where: `src/app/red-team-xss/page.tsx` — Next.js 16 App Router page
 *        component. Triggered by Vercel preview at
 *        `<preview-url>/red-team-xss?q=<script>alert(1)</script>`.
 * When:  Exists only on `red-team/zap-xss-verify` branch during Task
 *        9 verification (2026-05-11). Branch deleted after issue +
 *        ZAP fail confirmed.
 */

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<p>You searched: ${q ?? ""}</p>`,
      }}
    />
  );
}
