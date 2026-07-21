// Cloudflare Worker — SPA fallback for Workers + Assets
// Static files (JS/CSS/images) are served automatically by the asset runtime.
// This handler only runs for routes that don't match a file (e.g. /QR-XXXX).
// It serves index.html so the React SPA can handle the routing.

export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);
    const indexUrl = new URL("/index.html", url.origin);
    const indexRequest = new Request(indexUrl.toString(), request);
    return env.ASSETS.fetch(indexRequest);
  },
};
