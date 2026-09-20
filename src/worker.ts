/**
 * Cloudflare Worker Handler — Single Page Application (SPA) Fallback
 * Safely routes client-side QR scan URLs (e.g., /QR805ERB, /emergency/QR805ERB)
 * to index.html while serving static assets directly.
 */

export interface CloudflareEnvironment {
  ASSETS: { fetch(request: Request | string): Promise<Response> };
}

export default {
  async fetch(incomingRequest: Request, environment: CloudflareEnvironment): Promise<Response> {
    try {
      // Cloudflare Assets runtime automatically serves static files from ./dist
      // and performs single-page-application fallback to index.html for client routes
      return await environment.ASSETS.fetch(incomingRequest);
    } catch {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

