# Product Roadmap

## Phase 1: Infrastructure Deployment (Next Steps)
The immediate goal is to move from "Demo Mode" to a fully functional live environment.

1.  **Deploy Cloudflare Worker:**
    *   Write the `worker.js` script to handle `fetch` events.
    *   Implement JWT validation within the Worker environment.
    *   Deploy using `wrangler`.
2.  **Firebase Connection:**
    *   Create a real Firestore database.
    *   Replace mock user profiles with real Firestore documents.
    *   Implement "Custom Claims" in Firebase Auth to secure Admin routes on the server side.

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
