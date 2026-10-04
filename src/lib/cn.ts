/** Joins class names, skipping falsy values — the only bit of `cn()` the UI primitives need. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
