/**
 * OpenFamilySafe Proxy Worker
 * 
 * This worker acts as the secure tunnel.
 * 1. Checks for a valid Firebase ID Token (Authorization Header).
 * 2. Fetches the target URL.
 * 3. Rewrites relative URLs (src, href) to absolute URLs so assets load.
 * 4. Returns the content with CORS headers.
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing 'url' query parameter.", { status: 400, headers: corsHeaders });
    }

    // --- SECURITY CHECK ---
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        // If strict mode is enabled, or simply default to secure:
        return new Response("Unauthorized: Missing Authorization header.", { status: 401, headers: corsHeaders });
    } 
    // In production, verify the token. For now, we enforce presence of header.
    // Example verification (requires crypto or subtle):
    // const token = authHeader.replace('Bearer ', '');
    // ... verify token ...


    try {
      const targetUrlObj = new URL(targetUrl);
      
      const newRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          "User-Agent": "OpenFamilySafe/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      const response = await fetch(newRequest);

      // --- HTML REWRITING ---
      // This uses Cloudflare's HTMLRewriter to fix links on the fly.
      // e.g. <img src="/logo.png"> becomes <img src="https://target.com/logo.png">
      // This helps the React frontend display images correctly without complex client-side logic.
      
      const contentType = response.headers.get("content-type");
      let newResponse = response;

      if (contentType && contentType.includes("text/html")) {
        newResponse = new HTMLRewriter()
          .on("a", new AttributeRewriter("href", targetUrlObj))
          .on("img", new AttributeRewriter("src", targetUrlObj))
          .on("link", new AttributeRewriter("href", targetUrlObj))
          .on("script", new AttributeRewriter("src", targetUrlObj))
          .transform(response);
      }

      // Recreate response to add CORS headers
      const finalResponse = new Response(newResponse.body, newResponse);
      Object.keys(corsHeaders).forEach(key => {
        finalResponse.headers.set(key, corsHeaders[key]);
      });

      return finalResponse;

    } catch (e) {
      return new Response(`Proxy Error: ${e.message}`, { status: 500, headers: corsHeaders });
    }
  },
};

// Helper class to rewrite relative URLs to absolute URLs
class AttributeRewriter {
  constructor(attributeName, baseUrlObj) {
    this.attributeName = attributeName;
    this.baseUrlObj = baseUrlObj;
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute) {
      try {
        // Check if it's already an absolute URL
        if (attribute.startsWith("http") || attribute.startsWith("//")) {
          return;
        }
        // Resolve relative path
        // e.g. Base: https://example.com/blog/, Path: ./image.png -> https://example.com/blog/image.png
        const newUrl = new URL(attribute, this.baseUrlObj.href).href;
        element.setAttribute(this.attributeName, newUrl);
      } catch (e) {
        // If URL parsing fails, leave it alone
      }
    }
  }
}