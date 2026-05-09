/**
 * What:  Public homepage placeholder for RRMS Phase 1.
 * Why:   Confirms the Next.js scaffold is wired up correctly and gives the
 *        eventual public form route a known landing page during bootstrap.
 * Where: Mounted at the application root path "/" via the Next.js App Router
 *        (src/app/page.tsx) under the root layout in src/app/layout.tsx.
 * When:  Rendered as a Server Component on every request to "/" until later
 *        Plan 1 tasks replace it with the real public repair-request form.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">RRMS</h1>
        <p className="mt-4 text-gray-600">Repair Request Management System</p>
        <p className="mt-2 text-sm text-gray-400">Phase 1 — Bootstrap</p>
      </div>
    </main>
  );
}
