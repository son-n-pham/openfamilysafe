import { User } from 'firebase/auth';

// ==============================================================================
// 🚀 DEPLOYMENT CONFIGURATION
// ==============================================================================

// Cloudflare Worker URL from Environment Variables
const WORKER_ENDPOINT: string = import.meta.env.VITE_PROXY_WORKER_URL || '';

export const getProxyMode = (): 'LIVE' | 'DEMO' => {
  return WORKER_ENDPOINT ? 'LIVE' : 'DEMO';
};

// ==============================================================================

export const fetchProxiedContent = async (targetUrl: string, user: User | null): Promise<string> => {
  // 1. Auth Check
  if (!user) {
    throw new Error("User must be authenticated to use the proxy.");
  }

  // 1a. Configuration Check
  if (!WORKER_ENDPOINT) {
    throw new Error("Proxy Worker URL is not configured (VITE_PROXY_WORKER_URL missing).");
  }

  // 2. URL Normalization
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    let response: Response;

    // 3. Proxy Method: Cloudflare Worker with Auth
    // The Worker handles the fetch and CORS headers.
    
    const token = await user.getIdToken();
    try {
      const proxyUrl = new URL(WORKER_ENDPOINT);
      proxyUrl.searchParams.set('url', targetUrl);
      
      response = await fetch(proxyUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      throw new Error(`Invalid Worker Endpoint URL: ${WORKER_ENDPOINT}`);
    }

    if (response.status === 403) {
      throw new Error("Access Denied: Parental controls have blocked this site.");
    }
    
    if (!response.ok) {
      throw new Error(`Proxy connection failed: ${response.status} ${response.statusText}`);
    }

    let html = await response.text();

    if (!html || html.trim().length === 0) {
        throw new Error("The website returned empty content.");
    }

    // 4. Content Rewriting (Client-Side Backup)
    // Even though the Worker rewrites URLs, we keep the <base> tag as a backup
    // for scripts that might dynamically load assets.
    const baseTag = `<base href="${targetUrl}" target="_blank" />`; 

    if (html.toLowerCase().includes('<head>')) {
      html = html.replace(/<head>/i, `<head>${baseTag}`);
    } else {
      html = `${baseTag}${html}`;
    }

    return html;

  } catch (error: any) {
    console.error("Proxy Service Error:", error);
    throw new Error(error.message || "Failed to load the website. It might be blocking proxy access.");
  }
};