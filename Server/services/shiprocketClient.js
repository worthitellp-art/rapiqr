const https = require('https');

// Shiprocket's v1 external API authenticates with an account email/password
// (POST /auth/login) rather than a static API key, and returns a bearer token
// valid for ~10 days. We cache it in-memory and re-login once it's stale —
// same "fetch + cache a token" shape as other server-side integrations here,
// just JSON-bodied instead of Exotel's form-encoded Basic-auth calls (see
// exotelClient.js).
const SHIPROCKET_HOST = 'apiv2.shiprocket.in';
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // refresh a day before Shiprocket's ~10-day expiry

let cachedToken = null;
let cachedTokenAt = 0;

function getShiprocketCredentials() {
  return {
    email: (process.env.SHIPROCKET_EMAIL || '').trim(),
    password: (process.env.SHIPROCKET_PASSWORD || '').trim(),
    pickupLocation: (process.env.SHIPROCKET_PICKUP_LOCATION || '').trim(),
  };
}

function rawRequest(method, apiPath, body, token) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (dataString) headers['Content-Length'] = Buffer.byteLength(dataString);

    const req = https.request({ hostname: SHIPROCKET_HOST, port: 443, path: apiPath, method, headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function getShiprocketToken() {
  const { email, password } = getShiprocketCredentials();
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured — set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Server/.env or the project root .env.');
  }

  if (cachedToken && Date.now() - cachedTokenAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const res = await rawRequest('POST', '/v1/external/auth/login', { email, password }, null);
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Shiprocket login failed (${res.status}): ${res.body?.message || JSON.stringify(res.body)}`);
  }

  cachedToken = res.body.token;
  cachedTokenAt = Date.now();
  return cachedToken;
}

/** Authed Shiprocket API call — apiPath is relative to /v1/external, e.g. '/orders/create/adhoc' */
async function callShiprocketApi(method, apiPath, body = null) {
  const token = await getShiprocketToken();
  let res = await rawRequest(method, `/v1/external${apiPath}`, body, token);

  if (res.status === 401) {
    // Token expired earlier than our TTL estimate — force a fresh login and retry once.
    cachedToken = null;
    const freshToken = await getShiprocketToken();
    res = await rawRequest(method, `/v1/external${apiPath}`, body, freshToken);
  }

  return res;
}

/**
 * Shiprocket reports a courier's own status vocabulary — which varies by
 * courier and is far wider than the four states an order row can hold. Collapse
 * it to one of ours, and keep the raw label for display so the customer still
 * sees "Out for delivery" rather than a flat "Shipped".
 *
 * Anything unrecognised maps to `null`, meaning "leave the order status alone":
 * a courier inventing a new label must never silently move an order backwards.
 */
function mapShiprocketStatus(rawStatus) {
  const s = String(rawStatus || '').trim().toUpperCase();
  if (!s) return null;

  // RTO first: "RTO DELIVERED" means the parcel got back to US, not to the
  // customer, and matching on DELIVERED first would mark it a successful delivery.
  if (s.includes('RTO') || s.includes('RETURN')) return 'cancelled';
  if (s.includes('CANCEL')) return 'cancelled';              // CANCELED / CANCELLED
  if (s.includes('UNDELIVERED')) return 'shipped';           // failed attempt — still in the courier's hands
  if (s.includes('DELIVERED')) return 'delivered';
  if (
    s.includes('PICKED') || s.includes('PICKUP') || s.includes('TRANSIT') ||
    s.includes('OUT FOR DELIVERY') || s.includes('SHIPPED') || s.includes('DISPATCH') ||
    s.includes('UNDELIVERED') || s.includes('REACHED') || s.includes('MANIFEST')
  ) return 'shipped';

  return null;
}

/**
 * Flatten a Shiprocket tracking response into the shape we store and render.
 * The v1 API nests it as { [shipmentId]: { tracking_data: {...} } }; a webhook
 * posts the same information flat. Accept either.
 */
function normalizeTracking(raw) {
  const data = raw?.tracking_data || raw || {};
  const activities = data.shipment_track_activities || data.scans || [];
  const track = Array.isArray(data.shipment_track) ? data.shipment_track[0] : data.shipment_track;

  return {
    currentStatus: data.current_status || data.shipment_status || track?.current_status || null,
    etd: data.etd || track?.edd || null,
    awbCode: data.awb || track?.awb_code || null,
    courierName: data.courier_name || track?.courier_name || null,
    trackingUrl: data.track_url || data.awb_data?.track_url || null,
    events: activities
      .map((a) => ({
        status: a.status || a['sr-status-label'] || a.activity || '',
        at: a.date || a.updated_date || a.timestamp || null,
        location: a.location || null,
        note: a.activity || a.status || null,
      }))
      .filter((e) => e.status),
  };
}

module.exports = {
  getShiprocketCredentials,
  getShiprocketToken,
  callShiprocketApi,
  mapShiprocketStatus,
  normalizeTracking,
};
