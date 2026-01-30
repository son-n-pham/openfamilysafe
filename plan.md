This detailed execution plan outlines a **Serverless Hybrid Architecture**. It combines **Firebase** (for its excellent authentication and static hosting) with **Cloudflare Workers** (for the proxy backend).

### **Why this hybrid approach?**
*   **The Problem:** The free Firebase "Spark" plan **blocks outbound networking** to non-Google services. You cannot build a proxy on the free tier of Firebase Functions.
*   **The Solution:** Cloudflare Workers. It has a generous free tier (100,000 requests/day), is extremely fast (edge computing), and allows outbound requests to any URL.

---

### **1. Architecture Overview**

*   **Frontend:** A static React or Vue app hosted on **Firebase Hosting**.
*   **Authentication:** **Firebase Auth** handles user login (Google, Email/Password).
*   **User Management:** **Firebase Firestore** stores user roles (Admin/Parent vs. Child) and approved allowlists/blocklists.
*   **The Proxy (Backend):** A **Cloudflare Worker** acts as the secure tunnel. It receives requests from your frontend, checks the user's permission, fetches the blocked website, and returns it to the user.

---

### **2. Detailed Execution Steps**

#### **Phase 1: Firebase Setup (Auth & Hosting)**
1.  **Create a Firebase Project:** Go to the Firebase Console and create a new project (e.g., "FamilyNetProxy").
2.  **Enable Authentication:**
    *   Enable **Email/Password** and **Google Sign-In**.
    *   **Tiered Security:** You need "Custom Claims" to distinguish Parents from Children.
    *   *Implementation:* Write a small script (or use the Firebase Admin SDK locally) to set your account as `admin`.
3.  **Database (Firestore):**
    *   Create a `users` collection.
    *   Document structure:
        ```json
        users/{userId}
        {
          "role": "child", // or "admin"
          "parentEmail": "parent@example.com",
          "restrictions": "strict" // strict, moderate, none
        }
        ```
4.  **Frontend Deployment:**
    *   Initialize a web app (e.g., `npm create vite@latest`).
    *   Install Firebase SDK: `npm install firebase`.
    *   Deploy to Firebase Hosting: `firebase deploy --only hosting`.

#### **Phase 2: The Proxy Backend (Cloudflare Workers)**
*This is the engine that bypasses blocks.*

1.  **Set up Cloudflare:**
    *   Sign up for a free Cloudflare account.
    *   Install the CLI: `npm install -g wrangler`.
    *   Create a new worker: `wrangler init proxy-worker`.
2.  **The Proxy Logic (Worker Script):**
    *   The worker will intercept HTTP requests.
    *   **Security Check:** It must validate the Firebase Auth Token sent from the frontend to ensure only *your* family uses it.
    *   **Fetching Content:** Use the native `fetch()` API to request the target URL.
    *   **Rewriting:** Modify headers (CORS) so the browser accepts the response.

**Sample Worker Logic (Pseudo-code):**
```javascript
import { parse } from 'cookie';
// Library to verify Firebase JWT tokens (jose or similar)

export default {
  async fetch(request, env, ctx) {
    // 1. Security: Get the Authorization header (Firebase Token)
    const token = request.headers.get("Authorization");
    if (!validateFirebaseToken(token)) {
      return new Response("Unauthorized", { status: 403 });
    }

    // 2. Extract Target URL
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    // 3. Parental Control Check (Optional: Check domain against blocklist)
    if (isBlocked(targetUrl, userRole)) {
      return new Response("Ask your parent for access!", { status: 403 });
    }

    // 4. Fetch the content (The Bypass)
    const originalResponse = await fetch(targetUrl, {
      headers: request.headers // Pass along user agent, etc.
    });

    // 5. Return to User with CORS headers
    return new Response(originalResponse.body, {
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": originalResponse.headers.get("Content-Type") 
      }
    });
  }
};
```

#### **Phase 3: Frontend Integration**
1.  **The UI:** Create a simple search bar.
2.  **The Request:** When a user types a URL (e.g., `blocked-site.com`), your frontend app does not go there directly. instead, it fetches:
    `https://your-proxy.your-name.workers.dev/?url=https://blocked-site.com`
3.  **Authentication Header:** Ensure every `fetch` request includes the user's ID token:
    ```javascript
    const user = firebase.auth().currentUser;
    const token = await user.getIdToken();
    fetch(proxyUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    ```

#### **Phase 4: Admin Dashboard (Parental Control)**
*   Create a special `/admin` route in your frontend.
*   **Features:**
    *   **Approve Users:** A list of "pending" sign-ups (e.g., your daughter's account) that you must click "Approve" to activate.
    *   **View Logs:** (Optional) You can log requests to Firestore to see which sites are being accessed.

---

### **3. Legal & Open Source Strategy**

Since you are open-sourcing this, you must protect yourself from liability regarding how others use the proxy.

**License:**
Use the **MIT License**. It is permissive and includes a standard limitation of liability.

**Required Disclaimer (README & App Footer):**
You must add a specific disclaimer section. The proxy nature of the app carries risks regarding ISP terms of service or local laws.

> **LEGAL DISCLAIMER:**
> This software is provided for educational and parental control purposes only. It is intended to help users manage their own network traffic and ensure family safety.
>
> 1. **"As Is" Basis:** The software is provided "as is" without warranty of any kind. The developers assume no liability for damages or data loss.
> 2. **Compliance with Laws:** Users are solely responsible for ensuring that their use of this software complies with all applicable local, state, and federal laws, as well as the Terms of Service of their Internet Service Provider (ISP).
> 3. **No Circumvention:** This tool should not be used for illegal activities, including but not limited to bypassing copyright protections or engaging in cyber-attacks. The project maintainers are not responsible for any misuse of this software.

---

### **4. Cost Analysis (Free Tier)**

| Service | Tier | Limits | Your Status |
| :--- | :--- | :--- | :--- |
| **Firebase Auth** | Spark (Free) | 50,000 monthly active users | **Free** |
| **Firebase Hosting** | Spark (Free) | 10 GB storage / 360 MB per day | **Free** |
| **Firestore** | Spark (Free) | 1 GB storage / 50k reads per day | **Free** |
| **Cloudflare Workers** | Free | 100,000 requests per day | **Free** |
| **SSL/DNS** | Firebase/Cloudflare | Included | **Free** |

**Total Estimated Cost:** **$0.00 / month** for family use.

### **5. Security Considerations**
*   **Token Verification:** Never allow the Cloudflare Worker to proxy requests without a valid Firebase Token. If you do, the public will find your worker and use it to route their traffic, exhausting your free limits.
*   **CORS:** Configure Cloudflare to only allow requests from your specific Firebase Hosting domain.
*   **HTTPS:** Both Firebase and Cloudflare provide free SSL. Ensure strictly HTTPS everywhere.
