/**
 * Authenticated API responses carry personal data (owner phones, order
 * addresses, alert GPS). `private` keeps them out of shared/proxy caches;
 * `no-cache` still lets the browser revalidate with the ETag Express already
 * attaches, so an unchanged list costs a 304 with no body instead of a full
 * re-download.
 */
function privateCacheControl(req, res, next) {
  if (req.headers.authorization) res.setHeader('Cache-Control', 'private, no-cache');
  next();
}

module.exports = { privateCacheControl };
