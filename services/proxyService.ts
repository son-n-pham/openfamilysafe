import { User } from 'firebase/auth';
import { isUserApproved, canAccessProxy, getUserProfile } from './userService';
import { UserProfile, ApprovalStatus } from '../types';

export class ProxyAccessDeniedError extends Error {
  constructor(public reason: 'PENDING' | 'REJECTED' | 'SUSPENDED', message: string) {
    super(message);
    this.name = 'ProxyAccessDeniedError';
  }
}

// ==============================================================================
// 🚀 DEPLOYMENT CONFIGURATION
// ==============================================================================

// Cloudflare Worker URL from Environment Variables
const WORKER_ENDPOINT: string = import.meta.env.VITE_PROXY_WORKER_URL || '';

export const getProxyMode = (): 'LIVE' | 'DEMO' => {
  return WORKER_ENDPOINT ? 'LIVE' : 'DEMO';
};

// ==============================================================================

export const fetchProxiedContent = async (targetUrl: string, user: User | null, userProfile?: UserProfile | null): Promise<string> => {
  // 1. Auth Check
  if (!user) {
    throw new Error("User must be authenticated to use the proxy.");
  }

  // 1a. Approval Status Check
  let profile = userProfile;
  
  if (!profile) {
    try {
      profile = await getUserProfile(user.uid);
    } catch (error) {
      console.error("Error fetching user profile for proxy check:", error);
      // Logic continues, handled by the next check
    }
  }

  if (!profile) {
    throw new Error("User profile not found. Access denied.");
  }

  if (!canAccessProxy(profile)) {
    const status = profile.approvalStatus;
    
    if (status === ApprovalStatus.PENDING) {
      throw new ProxyAccessDeniedError('PENDING', "Your account is pending approval. Please wait for admin/parent approval.");
    } else if (status === ApprovalStatus.REJECTED) {
      throw new ProxyAccessDeniedError('REJECTED', "Your account access has been denied.");
    } else if (status === ApprovalStatus.SUSPENDED) {
      throw new ProxyAccessDeniedError('SUSPENDED', "Your account has been suspended.");
    } else {
      throw new Error("Access Denied: You are not authorized to use this service.");
    }
  }

  // 1b. Configuration Check
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
          'Authorization': `Bearer ${token}`,
          'X-Filter-Level': profile.filterLevel || 'MODERATE'
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