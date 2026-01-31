# OpenFamilySafe

**OpenFamilySafe** is a secure, parent-controlled web proxy interface designed for family safety and content management. It allows parents to provide a safe "tunnel" for their children to access specific web content while maintaining oversight and control.

## 🚀 Overview

The application is built as a **Serverless Hybrid** system. It bypasses the limitations of traditional free-tier hosting by utilizing **Cloudflare Workers** as a proxy backend and **Firebase** for authentication and state management.

### Key Features

*   **Tiered User System:** Distinct roles for Parents (Admins) and Children.
*   **Secure Authentication:** Powered by Firebase Auth, supporting both **Sign Up** (Registration) and **Sign In** via Email/Password.
*   **Content Filtering:** Configurable restriction levels (Strict, Moderate, None).
*   **Admin Dashboard:** Parents can approve/reject accounts and toggle filter settings.
*   **Full Screen Mode:** Immersive proxy browsing experience that mimics a native browser window.
*   **Live Demo Mode:** Uses a public CORS gateway to demonstrate real-time web access without requiring immediate backend deployment.

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
2.  Install dependencies: `npm install`.
3.  Run locally: `npm run dev`.
4.  **Test the Proxy:** Enter a URL (e.g., `wikipedia.org`) in the dashboard. The app will fetch the real live content using a demo gateway.