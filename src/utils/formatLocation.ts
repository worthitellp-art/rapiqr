/**
 * Safely converts any location payload (string, coordinates object {lat, lng, accuracy, timestamp},
 * address object, etc.) into a safe human-readable string.
 * Prevents React child object runtime crashes.
 */
export function formatLocationString(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    if (loc.lat != null && loc.lng != null) {
      const acc = loc.accuracy ? ` (±${Math.round(loc.accuracy)}m)` : '';
      return `${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}${acc}`;
    }
    if (loc.address) return String(loc.address);
    if (loc.city || loc.state) {
      return [loc.city, loc.state].filter(Boolean).join(', ');
    }
    if (loc.name) return String(loc.name);
    return '';
  }
  return String(loc);
}
