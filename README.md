# OpenFamilySafe

**OpenFamilySafe** is a secure, parent-controlled web proxy interface designed for family safety and content management. It allows parents to provide a safe "tunnel" for their children to access specific web content while maintaining oversight and control.

## 🚀 Overview

The application is built as a **Serverless Hybrid** system. It bypasses the limitations of traditional free-tier hosting by utilizing **Cloudflare Workers** as a proxy backend and **Firebase** for authentication and state management.

### Key Features

*   **Two-Tier Approval System:** Admin-gated parent registration and parent-gated child registration. Parents are approved by a SUPER_ADMIN; children are approved by their Parent.
*   **Secure Authentication:** Powered by Firebase Auth, supporting both **Sign Up** (Registration) and **Sign In** via Email/Password.
*   **Content Filtering:** Configurable restriction levels (Strict, Moderate, None).
*   **Admin Dashboard:** Super admin can approve/reject parent registrations; parents can approve/reject child registrations and toggle family filter settings.
*   **Full Screen Mode:** Immersive proxy browsing experience that mimics a native browser window.
*   **Live Demo Mode:** Uses a public CORS gateway to demonstrate real-time web access without requiring immediate backend deployment.

*   **Worker JWT Verification:** The Cloudflare Worker performs worker-side JWT verification using FIREBASE_PROJECT_ID set in `wrangler.toml`.

## 🛠 Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
*   **Authentication:** Firebase Auth (Email/Password).
*   **Database:** Firebase Firestore (User profiles & settings).
*   **Proxy Engine:** Cloudflare Workers (Edge computing).
*   **Hosting:** Firebase Hosting.

## ⚠️ Legal Disclaimer

This software is provided for **educational and parental control purposes only**.

1.  **"As Is" Basis:** The software is provided "as is" without warranty of any kind. The developers assume no liability for damages or data loss.
2.  **Compliance with Laws:** Users are solely responsible for ensuring that their use of this software complies with all applicable local, state, and federal laws, as well as the Terms of Service of their Internet Service Provider (ISP).
3.  **No Circumvention:** This tool should not be used for illegal activities, including but not limited to bypassing copyright protections or engaging in cyber-attacks.

## 🏃‍♂️ Getting Started

1.  Clone the repository.
2.  **Configure Environment:**
    *   Copy `.env.example` to `.env`: `cp .env.example .env`
    *   Edit `.env` and fill in your Firebase credentials and Cloudflare Worker URL.
3.  Install dependencies: `npm install`.
4.  Run locally: `npm run dev`.

## ☁️ Deployment Guide

### 1. Cloudflare Worker (Backend)
The worker acts as the secure proxy.

1.  Install the CLI: `npm install -g wrangler`
2.  Login: `wrangler login`
3.  **Deploy:** `wrangler deploy`
    *   *First Time Setup:* If prompted to "register a workers.dev subdomain", type a unique name (e.g., `my-family-proxy-app`) and press Enter.
4.  **Copy the URL:** The terminal will output a URL like: `https://open-family-safe-proxy.my-family-proxy-app.workers.dev`
5.  **Update Config:** Add this URL to your `.env` file as `VITE_PROXY_WORKER_URL`.

### 2. Frontend (Firebase)
1.  Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2.  Enable **Authentication** (Email/Google).
3.  **Configure Environment:** Ensure your environment variables (from `.env`) are correctly set in your deployment environment or build process.
4.  Deploy: `firebase deploy`

### 3. Frontend (GitHub Pages)
This option uses GitHub Actions and repo secrets to build and deploy the app.

1.  Add the Firebase and proxy values from `.env.example` as GitHub Actions secrets.
2.  Ensure `vite.config.ts` has `base: '/openfamilysafe/'` for this repo name.
3.  Push to `main` to trigger the Pages deployment workflow.
4.  In Firebase Console, add `https://<your-username>.github.io` to **Authentication → Settings → Authorized domains**.
