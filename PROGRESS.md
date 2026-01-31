# Project Progress

## ✅ Completed Features

### Frontend Core
*   [x] **Project Structure:** React with TypeScript configured.
*   [x] **Routing:** `react-router-dom` set up with Protected Routes.
*   [x] **Styling:** Tailwind CSS integration with a custom "Brand" color palette.
*   [x] **Responsive Layout:** Mobile-friendly Navbar, Cards, and Inputs.

### Authentication System
*   [x] **Auth Context:** Global state management for User and UserProfile.
*   [x] **Login Page:** Integrated toggle for **Sign Up** and **Sign In**. Supports "Parent" and "Child" flows.
*   [x] **Error Handling:** Graceful fallback to "Demo Mode" if Firebase keys are missing or invalid.
*   [x] **Role Management:** Support for SUPER_ADMIN, PARENT, CHILD, PENDING_PARENT, and PENDING_CHILD roles.

### Two-Tier Approval System (Phase 14 - Completed)
*   [x] **User Roles & Status:**
    *   `SUPER_ADMIN`, `PARENT`, `CHILD` (active roles)
    *   `PENDING_PARENT`, `PENDING_CHILD` (pending roles)
    *   `ApprovalStatus`: PENDING, APPROVED, REJECTED, SUSPENDED
*   [x] **Firestore Schema:**
    *   `users` collection with approval fields (approvalStatus, approvedBy, approvedAt, rejectedReason)
    *   `families` collection linking parents to children
    *   `invites` collection for family invite codes
    *   `approvalRequests` collection for audit trail
*   [x] **Admin Console (`/admin`):**
    *   View pending parent requests
    *   Approve/Reject parent registrations with reasons
    *   View all users with search functionality
    *   Suspend/Unsuspend any user
*   [x] **Family Management (`/family`):**
    *   View pending child requests for approval
    *   Approve/Reject child registrations with reasons
    *   View all family children with status
    *   Suspend/Unsuspend children
    *   Generate family invite codes (6-character, 48-hour expiry)
    *   Update family filter level settings
*   [x] **Pending Approval Page (`/pending-approval`):**
    *   Different messaging for pending parents vs children
    *   Display rejection/suspension reasons
    *   "Check Status" button for manual refresh
    *   Auto-redirect when approved
*   [x] **Service Layer:**
    *   `userService.ts`: Full CRUD, approval/rejection functions, suspension
    *   `familyService.ts`: Family creation, child management, invite codes
    *   `authContext.tsx`: Real-time profile updates via Firestore listeners

### User Interface (UI)
*   [x] **Dashboard:**
    *   URL Input bar.
    *   Proxy content viewer (supports Preview and Raw Code modes).
    *   **Full Screen Mode:** Immersive toggle to expand the proxy preview to the full viewport.
    *   Visual indicators for current "Safety Level".
*   [x] **Admin Console:**
    *   List of pending parent requests with approve/reject.
    *   Tabbed interface: Pending Requests and All Users.
    *   Search/filter functionality.
    *   Modal dialogs for rejection/suspension with reason input.
*   [x] **Family Management Console:**
    *   Pending child requests approval queue.
    *   Children grid with status badges.
    *   Family invite code generation.
    *   Filter level settings.

### Services
*   [x] **Proxy Service:**
    *   Interface defined for communicating with Cloudflare.
    *   **Asset Injection:** Automatically injects `<base>` tags to fix relative image/CSS paths in the preview.
*   [x] **User Service:**
    *   Complete user profile management.
    *   Approval/rejection workflows for parents and children.
    *   Role transitions (PENDING_PARENT → PARENT, PENDING_CHILD → CHILD).
    *   Suspension functionality.
*   [x] **Family Service:**
    *   Family creation upon parent approval.
    *   Child-to-family linking.
    *   Invite code generation and validation.
    *   Filter level management.

### Security
*   [x] **Security Hardening (2026-01-31):**
    *   Moved Firebase config to environment variables.
    *   Removed insecure public proxy fallback; Cloudflare Worker now strictly enforces `Authorization` headers.
    *   Implemented `.env` configuration workflow.
*   [x] **Worker-Side JWT Verification:**
    *   `FIREBASE_PROJECT_ID` configured in `wrangler.toml`.
    *   JWT validation: structure, expiration, issuer, audience checks.
    *   Filter level extraction via `X-Filter-Level` header.
*   [x] **Role-Based Access Control:**
    *   Route protection based on approval status.
    *   SUPER_ADMIN-only access to admin console.
    *   PARENT-only access to family management.
    *   Approved users only can access proxy.

## 🚧 In Progress

*   **Full Signature Verification:** Current JWT verification validates claims but not cryptographic signature. Consider using Google's public keys for full verification.

## ❌ Known Issues (Demo Mode)

*   **Public Proxy Limits:** The demo gateway (`allorigins`) may be blocked by high-security sites (Google, Facebook, Banking sites).
*   **Persistence:** User changes in the Admin panel (approving/blocking) are local state only and do not persist on refresh in Demo Mode.

## 📋 Future Enhancements

*   **Cryptographic JWT Signature Verification:** Use Google's public keys for complete token validation.
*   **Email Notifications:** Notify users when their status changes (approved, rejected, suspended).
*   **Activity Logging:** Log visited domains to Firestore for parent review.
*   **Time-Based Restrictions:** Add allowed hours to user profiles.
*   **Category Filtering:** Integrate domain categorization for content filtering.
