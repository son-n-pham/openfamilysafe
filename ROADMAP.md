# Product Roadmap

## Phase 1: Infrastructure Deployment (Completed)
The immediate goal was to move from "Demo Mode" to a fully functional live environment. Core work completed:

1.  **Deploy Cloudflare Worker:**
    *   `worker.js` implemented to handle `fetch` events and content rewriting.
    *   Worker-side JWT validation implemented (claims, issuer, audience, expiry checks). Note: signature verification is TODO.
    *   `wrangler` deployment configured via `wrangler.toml`.
2.  **Firebase Connection:**
    *   Firestore schema for `users`, `families`, `invites`, and `approvalRequests` implemented.
    *   User profile persistence implemented and integrated with Auth.
    *   Parent/Child approval workflows implemented in service layer.

## Phase 2: Advanced Proxy Features
Improving the browsing experience within the proxy tunnel.

1.  **HTML Rewriting:** Use `HTMLRewriter` (Cloudflare API) to dynamically rewrite `<a href="...">`, `<img src="...">`, and `<script src="...">` tags to route subsequent requests through the proxy automatically.
2.  **Cookie Management:** Securely handle session cookies for proxied sites (isolating them per user).
3.  **Allowlist/Blocklist Engine:** Move the filtering logic from the client side to the Worker for true security.

## Phase 3: Parental Control Suite
Expanding the features for Parents.

1.  **Activity Logging:**
    *   Log visited domains to Firestore.
    *   Create a "History" tab in the Admin Console.
2.  **Time Limits:**
    *   Add fields to User Profile for "Allowed Hours".
    *   Worker checks current time before allowing requests.
3.  **Category Filtering:** Integrate a third-party API or blocklist database to filter sites by category (e.g., "Social Media", "Gambling").

## Phase 4: Polish & Scale
1.  **PWA Support:** Make the web app installable on mobile devices.
2.  **Onboarding:** Create a "Setup Wizard" for parents to easily invite children via email.
