import { User } from 'firebase/auth';

// ==============================================================================
// 🚀 DEPLOYMENT CONFIGURATION
// ==============================================================================
// 1. Run `npm install -g wrangler`
// 2. Run `wrangler login`
// 3. Run `wrangler deploy`
// 4. Copy the URL output (e.g., https://open-family-safe-proxy.yourname.workers.dev)
// 5. Paste it below inside the quotes:
// ==============================================================================

// TODO: PASTE YOUR CLOUDFLARE WORKER URL HERE
const WORKER_ENDPOINT: string = 'https://openfamilysafe.workers.dev'; 

// ==============================================================================

// Fallback for demo purposes (does not support Auth tokens effectively)
const DEMO_PROXY_BASE = 'https://api.allorigins.win/raw?url=';

export const getProxyMode = (): 'LIVE' | 'DEMO' => {
  // We consider it LIVE if the user has changed the default endpoint to their own workers.dev address
  const isDefault = WORKER_ENDPOINT === 'https://openfamilysafe.workers.dev' || WORKER_ENDPOINT === '';
  return (!isDefault && WORKER_ENDPOINT.includes('workers.dev')) ? 'LIVE' : 'DEMO';
};

export const fetchProxiedContent = async (targetUrl: string, user: User | null): Promise<string> => {
  // 1. Auth Check
  if (!user) {
    throw new Error("User must be authenticated to use the proxy.");
  }

  // 2. URL Normalization
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    let response: Response;
    const mode = getProxyMode();

    // 3. Determine Proxy Method
    if (mode === 'LIVE') {
      // --- LIVE MODE: Use Cloudflare Worker with Auth ---
      // The Worker handles the fetch and CORS headers.
      
      const token = await user.getIdToken();
      const proxyUrl = new URL(WORKER_ENDPOINT);
      proxyUrl.searchParams.set('url', targetUrl);

      response = await fetch(proxyUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        throw new Error("Access Denied: Parental controls have blocked this site.");
      }

    } else {
      // --- DEMO MODE: Use Public Proxy ---
      console.warn("Using Public Demo Proxy (Insecure, No Auth Headers sent to backend)");
      const proxyUrl = `${DEMO_PROXY_BASE}${encodeURIComponent(targetUrl)}`;
      response = await fetch(proxyUrl);
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