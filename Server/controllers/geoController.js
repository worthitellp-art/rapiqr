/**
 * Server-side geocoding proxy.
 *
 * The browser used to call Nominatim, postalpincode.in and BigDataCloud
 * directly — exposing the visitor's exact coordinates to three third parties
 * with no rate limit or caching on our side. Now the frontend only talks to
 * RepiQR, and RepiQR talks to the provider:
 *
 *   Frontend → /api/geo/* → Nominatim / India Post
 *
 * No provider key is needed today; if one is added later (e.g. Google Geocoding)
 * it stays here in server env and the frontend contract does not change.
 */
const { logger } = require('../middleware/loggerMiddleware');

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/reverse';
// Nominatim's usage policy requires an identifying User-Agent.
const USER_AGENT = process.env.GEO_USER_AGENT || 'RepiQR/1.0 (https://repiqr.com)';
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;

const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en', Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Provider responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const first = (...values) => values.find((v) => typeof v === 'string' && v.trim()) || '';

/** Flattens a Nominatim address object into the fields the forms need. */
function normaliseNominatim(data) {
  const a = data?.address || {};
  const area = first(a.suburb, a.neighbourhood, a.quarter, a.city_district, a.residential, a.hamlet);
  const city = first(a.city, a.town, a.village, a.municipality, a.county, a.state_district);
  const road = first(a.road, a.pedestrian, a.footway);
  const line = [first(a.house_number), first(a.building), road].filter(Boolean).join(', ');
  return {
    address: line || first(a.amenity, a.shop, a.office) || '',
    area,
    city,
    state: first(a.state, a.region),
    pincode: first(a.postcode).replace(/\s+/g, ''),
    country: first(a.country),
    formatted: first(data?.display_name),
  };
}

class GeoController {
  /** GET /api/geo/reverse?lat=..&lng=.. — coordinates → structured address. */
  static async reverse(req, res) {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng are required.' });
    }

    // ~11 m grid: nearby taps share a cached answer and Nominatim is hit less.
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ success: true, data: cached });

    try {
      const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
      const raw = await fetchJson(url);
      if (!raw || raw.error) {
        return res.status(404).json({ success: false, error: "Couldn't find an address for this location." });
      }
      const data = { ...normaliseNominatim(raw), latitude: lat, longitude: lng };
      cacheSet(key, data);
      return res.json({ success: true, data });
    } catch (err) {
      logger.warn('GEO_REVERSE', `Reverse geocode failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      const timedOut = err.name === 'AbortError';
      return res.status(timedOut ? 504 : 502).json({
        success: false,
        error: timedOut ? 'Location lookup timed out.' : "Couldn't look up this location right now.",
      });
    }
  }

  /** GET /api/geo/forward?q=Mumbai, Maharashtra — place name → coordinates (for the coverage map). */
  static async forward(req, res) {
    const q = String(req.query.q || '').trim().slice(0, 150);
    if (q.length < 2) return res.status(400).json({ success: false, error: 'A place name is required.' });

    const key = `fwd:${q.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ success: true, data: cached });

    try {
      const searchUrl = NOMINATIM_URL.replace(/\/reverse$/, '/search');
      const raw = await fetchJson(`${searchUrl}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
      const hit = Array.isArray(raw) ? raw[0] : null;
      const latitude = Number(hit?.lat);
      const longitude = Number(hit?.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(404).json({ success: false, error: "Couldn't find that place." });
      }
      const data = { latitude, longitude };
      cacheSet(key, data);
      return res.json({ success: true, data });
    } catch (err) {
      logger.warn('GEO_FORWARD', `Forward geocode failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      return res.status(err.name === 'AbortError' ? 504 : 502).json({ success: false, error: "Couldn't look up that place right now." });
    }
  }

  /** GET /api/geo/suggest?q=...&kind=city|state — live place suggestions. */
  static async suggest(req, res) {
    const query = String(req.query.q || '').trim().slice(0, 80);
    const kind = String(req.query.kind || '');
    if (query.length < 2 || !['city', 'state'].includes(kind)) {
      return res.status(400).json({ success: false, error: 'A valid city or state search is required.' });
    }

    const key = `suggest:${kind}:${query.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ success: true, data: cached });

    try {
      const searchUrl = NOMINATIM_URL.replace(/\/reverse$/, '/search');
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: '8',
        countrycodes: 'in',
        [kind]: query,
      });
      const raw = await fetchJson(`${searchUrl}?${params.toString()}`);
      const values = [...new Set(
        (Array.isArray(raw) ? raw : [])
          .map((item) => {
            const address = item?.address || {};
            return kind === 'city'
              ? first(address.city, address.town, address.village, address.municipality, address.hamlet)
              : first(address.state, address.region);
          })
          .filter(Boolean)
      )];
      cacheSet(key, values);
      return res.json({ success: true, data: values });
    } catch (err) {
      logger.warn('GEO_SUGGEST', `Place suggestions failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      return res.status(err.name === 'AbortError' ? 504 : 502).json({
        success: false,
        error: "Couldn't load location suggestions right now.",
      });
    }
  }

  /** GET /api/geo/pincode/:pin — Indian PIN → area / city / state. */
  static async pincode(req, res) {
    const pin = String(req.params.pin || '');
    if (!/^[1-9]\d{5}$/.test(pin)) {
      return res.status(400).json({ success: false, error: 'Enter a valid 6-digit PIN code.' });
    }
    const cached = cacheGet(`pin:${pin}`);
    if (cached) return res.json({ success: true, data: cached });

    try {
      const raw = await fetchJson(`https://api.postalpincode.in/pincode/${pin}`);
      const office = raw?.[0]?.Status === 'Success' ? raw[0].PostOffice?.[0] : null;
      if (!office) return res.status(404).json({ success: false, error: 'PIN code not found.' });
      const data = {
        area: office.Name || '',
        city: office.District || office.Block || '',
        state: office.State || '',
        pincode: pin,
        country: 'India',
      };
      cacheSet(`pin:${pin}`, data);
      return res.json({ success: true, data });
    } catch (err) {
      logger.warn('GEO_PINCODE', `PIN lookup failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      return res.status(502).json({ success: false, error: "Couldn't look up this PIN code right now." });
    }
  }
}

module.exports = GeoController;
