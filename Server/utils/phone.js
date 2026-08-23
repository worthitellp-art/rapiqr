/**
 * One definition of "these two phone numbers are the same", shared by sticker
 * auto-claim and profile phone uniqueness so the two can never disagree.
 *
 * Numbers reach us in whatever shape the entry form produced — "+91 9574713004",
 * "+919574713004", "09574713004", "9574713004" are all the same subscriber. We
 * compare the last 10 digits (the national significant number for India, this
 * product's market) and require an EXACT match on them.
 *
 * What this deliberately does not do is substring matching. The previous matcher
 * ended with `d1.includes(d2) || d2.includes(d1)`, which made any short digit run
 * match a longer number, so stickers surfaced in dashboards that had nothing to do
 * with them. A phone number either is this account's number or it is not.
 *
 * Caveat: two numbers from different countries that share their last 10 digits
 * would compare equal. Storing an explicit country code per profile is the fix if
 * RapiQR ever ships outside India.
 */
const PHONE_SIGNIFICANT_DIGITS = 10;

/**
 * Reduce a phone number to its comparable form, or null when it is too short to
 * identify anybody (blank fields, "N/A", a 4-digit extension typed into a phone box).
 */
function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < PHONE_SIGNIFICANT_DIGITS) return null;
  return digits.slice(-PHONE_SIGNIFICANT_DIGITS);
}

function isSamePhone(a, b) {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return Boolean(left && right && left === right);
}

module.exports = { normalizePhone, isSamePhone, PHONE_SIGNIFICANT_DIGITS };
