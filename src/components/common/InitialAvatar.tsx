/**
 * The app's only profile "picture": the first letter of the person's name.
 *
 * Replaces the DiceBear cartoon avatars that used to sit in the client sidebar,
 * the admin user table and the Account Settings picker. Those pulled an image
 * from a third-party host on every render, which meant a network round trip, a
 * broken-image state when it failed, and a picker whose selection never showed
 * up anywhere else in the product.
 *
 * The colour is derived from the name, so the same person always gets the same
 * tile — recognisable at a glance in a long list without storing anything.
 */

/* Chosen to stay legible with white text; index picked from the name's hash. */
const PALETTE = [
  '#2563EB', // blue
  '#7C3AED', // violet
  '#DB2777', // pink
  '#DC2626', // red
  '#EA580C', // orange
  '#CA8A04', // amber
  '#059669', // emerald
  '#0891B2', // cyan
];

/** First letter of the name, falling back to the email, then a neutral dot. */
export function initialOf(name?: string | null, email?: string | null): string {
  const source = (name || '').trim() || (email || '').trim();
  const letter = source.replace(/[^\p{L}\p{N}]/gu, '').charAt(0);
  return letter ? letter.toUpperCase() : '•';
}

function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export interface InitialAvatarProps {
  name?: string | null;
  email?: string | null;
  /** Pixel size of the circle. */
  size?: number;
  className?: string;
}

export default function InitialAvatar({ name, email, size = 36, className = '' }: InitialAvatarProps) {
  const initial = initialOf(name, email);
  const background = colorFor((name || email || 'user').toLowerCase());

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full font-bold text-white select-none flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background,
        // Keeps the letter visually centred and proportionate at every size.
        fontSize: Math.round(size * 0.44),
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}
