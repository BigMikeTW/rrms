/**
 * What:  `cn` className helper that merges Tailwind utility classes while
 *        resolving conflicts (e.g. last `p-2` wins over earlier `p-4`).
 * Why:   shadcn/ui components compose default classes with caller-provided
 *        `className` props; without conflict-aware merging we would get
 *        Tailwind specificity wars that depend on stylesheet order.
 * Where: Imported by every shadcn/ui component under src/components/ui/* and
 *        by any RRMS-authored UI component that accepts a `className` prop.
 * When:  Render time. Pure synchronous string manipulation; no I/O, safe in
 *        Server Components, Client Components, and middleware alike.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
