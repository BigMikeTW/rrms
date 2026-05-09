/**
 * What:  Root layout for the RRMS App Router tree. Wraps every page in the
 *        Geist sans/mono variable fonts and sets the canonical <head>
 *        metadata (title, description) consumed by browsers, search engines,
 *        and OG/Twitter card scrapers.
 * Why:   Phase 1 ships with a real product title rather than the
 *        create-next-app placeholder so the production tab + SEO + share
 *        previews already read "RRMS" before the public form lands. Per spec
 *        §6.7.1 nothing here is allowed to leak server secrets — `Metadata`
 *        is plain strings only, no `process.env.*` reads.
 * Where: src/app/layout.tsx — Next.js 16 App Router root layout, applied to
 *        every route segment (public form, /admin/*, LIFF, etc).
 * When:  Render-time on every server response. Font variables are injected at
 *        build time via next/font; metadata is statically rendered into <head>
 *        and may be overridden by per-route `metadata` exports later.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RRMS — Repair Request Management System",
  description: "Phase 1 報修系統：公開表單 + 後台管理 + LINE 通知",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
