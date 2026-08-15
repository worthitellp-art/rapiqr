/**
 * Cloudflare Worker Handler — Single Page Application (SPA) Fallback
 * Safely routes client-side QR scan URLs (e.g., /QR805ERB, /emergency/QR805ERB)
 * to index.html while serving static assets directly.
 */

export interface CloudflareEnvironment {
  ASSETS: Fetcher;
}

export default {
  async fetch(incomingRequest: Request, environment: CloudflareEnvironment): Promise<Response> {
    try {
      // 1. Attempt to serve static asset from Cloudflare Assets runtime
      const assetResponse = await environment.ASSETS.fetch(incomingRequest);

      // 2. Return directly if asset is found (status !== 404)
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      // 3. For 404s (client-side SPA routes like /QR805ERB), fetch and serve index.html
      const currentUrl = new URL(incomingRequest.url);
      const indexFileUrl = new URL("/index.html", currentUrl.origin);

      const indexPageRequest = new Request(indexFileUrl.toString(), {
        method: "GET",
        headers: incomingRequest.headers,
      });

      return await environment.ASSETS.fetch(indexPageRequest);
    } catch (workerError) {
      // Safely catch any Worker runtime errors to avoid Cloudflare Error 1101
      try {
        const currentUrl = new URL(incomingRequest.url);
        const indexFileUrl = new URL("/index.html", currentUrl.origin);
        return await environment.ASSETS.fetch(new Request(indexFileUrl.toString(), { method: "GET" }));
      } catch {
        return new Response("Internal Server Error", { status: 500 });
      }
    }
  },
};

