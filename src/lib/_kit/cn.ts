/**
 * Minimal class-name combiner. Drops falsy values, joins with spaces.
 * Use for conditional Tailwind classes. We import clsx directly when a
 * keyed-object API helps readability.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
