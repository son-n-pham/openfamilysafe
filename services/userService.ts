// services/userService.ts
import {
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  runTransaction,
  doc,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  usersCollection,
  familiesCollection,
  approvalRequestsCollection,
  userDoc,
  familyDoc
} from '../firebase';
import {
  UserProfile,
  UserRole,
  ApprovalStatus,
  ApprovalRequest,
  FilterLevel,
  Family
} from '../types';

// ==========================================
// User CRUD Functions
// ==========================================

/**
 * Create a new user profile document in Firestore after Firebase Auth registration.
 *
 * @param user The Firebase Auth user object
 * @param role The initial role (PENDING_PARENT or PENDING_CHILD)
 * @param parentEmail Optional parent email for child accounts
 * @returns The created UserProfile
 */
export async function createUserProfile(
  user: User,
  role: UserRole.PENDING_PARENT | UserRole.PENDING_CHILD,
  parentEmail?: string
): Promise<UserProfile> {
  const currentTimestamp = Date.now();

  const newUserProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    role,
    filterLevel: FilterLevel.MODERATE, // Default filter level
    approvalStatus: ApprovalStatus.PENDING,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  };

  if (role === UserRole.PENDING_CHILD && parentEmail) {
    newUserProfile.parentEmail = parentEmail;
    // We will attempt to link parentUid during the approval process or if we do a lookup here.
    // For now, storing parentEmail is sufficient for the pending state.
  }

  await setDoc(userDoc(user.uid), newUserProfile);
  return newUserProfile;
}

/**
 * Retrieve a user's profile by their UID.
 *
 * @param uid The user's unique ID
 * @returns The UserProfile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(userDoc(uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

/**
 * Update specific fields of a user's profile.
 *
 * @param uid The user's unique ID
 * @param updates Partial UserProfile object containing fields to update
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  await updateDoc(userDoc(uid), {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Get all user profiles (Admin use).
 *
 * @returns Array of all UserProfiles
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => doc.data());
}

/**
 * Get users filtered by a specific role.
 *
 * @param role The UserRole to filter by
 * @returns Array of matching UserProfiles
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const q = query(usersCollection, where('role', '==', role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

/**
 * Get users filtered by their approval status.
 *
 * @param status The ApprovalStatus to filter by
 * @returns Array of matching UserProfiles
 */
export async function getUsersByApprovalStatus(status: ApprovalStatus): Promise<UserProfile[]> {
  const q = query(usersCollection, where('approvalStatus', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

/**
 * Get all pending parent requests for admin review.
 *
 * @returns Array of UserProfiles with role PENDING_PARENT
 */
export async function getPendingParentRequests(): Promise<UserProfile[]> {
  return getUsersByRole(UserRole.PENDING_PARENT);
}

/**
 * Get pending child requests associated with a specific parent.
 * This currently relies on the 'parentUid' or 'parentEmail' linkage.
 *
 * @param parentUid The parent's UID
 * @returns Array of pending child UserProfiles
 */
export async function getPendingChildRequestsForParent(parentUid: string): Promise<UserProfile[]> {
  // First try seeing if they are already linked by parentUid
  const qByUid = query(
    usersCollection,
    where('role', '==', UserRole.PENDING_CHILD),
    where('parentUid', '==', parentUid)
  );
  const snapshotByUid = await getDocs(qByUid);
  
  if (!snapshotByUid.empty) {
    return snapshotByUid.docs.map(doc => doc.data());
  }

  // Fallback: If not linked by UID yet, we might need to look up by email match if we have the parent's email.
  // Ideally, the parentUid is set on creation if known, or we query by parentEmail.
  // Getting the parent profile to find their email
  const parentProfile = await getUserProfile(parentUid);
  if (parentProfile?.email) {
    const qByEmail = query(
      usersCollection,
      where('role', '==', UserRole.PENDING_CHILD),
      where('parentEmail', '==', parentProfile.email)
    );
    const snapshotByEmail = await getDocs(qByEmail);
    return snapshotByEmail.docs.map(doc => doc.data());
  }

  return [];
}

// ==========================================
// Approval Functions
// ==========================================

/**
 * Admin approves a parent request.
 * Creates a Family for the parent and updates their profile.
 *
 * @param adminUid The UID of the approving admin
 * @param parentUid The UID of the parent being approved
 */
export async function approveParentRequest(adminUid: string, parentUid: string): Promise<void> {
  const currentTimestamp = Date.now();

  await runTransaction(db, async (transaction) => {
    // Verify parent exists
    const parentRef = userDoc(parentUid);
    const parentSnap = await transaction.get(parentRef);
    if (!parentSnap.exists()) {
      throw new Error("Parent user not found");
    }
    const parentData = parentSnap.data() as UserProfile;

    // Create a new Family
    const newFamilyRef = doc(familiesCollection);
    const newFamily: Family = {
      id: newFamilyRef.id,
      parentUid: parentUid,
      childrenUids: [],
      createdAt: currentTimestamp,
      settings: {
        filterLevel: parentData.filterLevel || FilterLevel.MODERATE
      }
    };

    transaction.set(newFamilyRef, newFamily);

    // Update Parent Profile
    transaction.update(parentRef, {
      role: UserRole.PARENT,
      approvalStatus: ApprovalStatus.APPROVED,
      familyId: newFamilyRef.id,
      approvedBy: adminUid,
      approvedAt: currentTimestamp,
      updatedAt: currentTimestamp
    });
  });
}

/**
 * Admin rejects a parent request.
 *
 * @param adminUid The UID of the admin rejecting the request
 * @param parentUid The UID of the parent being rejected
 * @param reason The reason for rejection
 */
export async function rejectParentRequest(adminUid: string, parentUid: string, reason: string): Promise<void> {
  const currentTimestamp = Date.now();
  await updateDoc(userDoc(parentUid), {
    approvalStatus: ApprovalStatus.REJECTED,
    rejectedReason: reason,
    approvedBy: adminUid, // acting as "reviewed by"
    approvedAt: currentTimestamp, // acting as "reviewed at"
    updatedAt: currentTimestamp
  });
}

/**
 * Parent approves a child request.
 * Adds the child to the parent's family and updates child's profile.
 *
 * @param parentUid The UID of the approving parent
 * @param childUid The UID of the child being approved
 */
export async function approveChildRequest(parentUid: string, childUid: string): Promise<void> {
  const currentTimestamp = Date.now();

  await runTransaction(db, async (transaction) => {
    // 1. Get Parent Data to find Family ID
    const parentRef = userDoc(parentUid);
    const parentSnap = await transaction.get(parentRef);
    if (!parentSnap.exists()) {
      throw new Error("Parent not found");
    }
    const parentData = parentSnap.data() as UserProfile;
    
    if (!parentData.familyId) {
      throw new Error("Parent does not have a valid Family ID");
    }

    // 2. Get Child Data
    const childRef = userDoc(childUid);
    const childSnap = await transaction.get(childRef);
    if (!childSnap.exists()) {
      throw new Error("Child not found");
    }

    // 3. Get Family Data
    const familyRef = familyDoc(parentData.familyId);
    const familySnap = await transaction.get(familyRef);
    if (!familySnap.exists()) {
      throw new Error("Family not found");
    }
    const familyData = familySnap.data() as Family;

    // 4. Update Child Profile
    transaction.update(childRef, {
      role: UserRole.CHILD,
      approvalStatus: ApprovalStatus.APPROVED,
      parentUid: parentUid,
      familyId: parentData.familyId,
      approvedBy: parentUid,
      approvedAt: currentTimestamp,
      updatedAt: currentTimestamp
    });

    // 5. Update Parent Profile (add to childrenUids)
    const updatedParentChildren = [...(parentData.childrenUids || [])];
    if (!updatedParentChildren.includes(childUid)) {
      updatedParentChildren.push(childUid);
      transaction.update(parentRef, {
        childrenUids: updatedParentChildren,
        updatedAt: currentTimestamp
      });
    }

    // 6. Update Family Document (add to childrenUids)
    const updatedFamilyChildren = [...familyData.childrenUids];
    if (!updatedFamilyChildren.includes(childUid)) {
      updatedFamilyChildren.push(childUid);
      transaction.update(familyRef, {
        childrenUids: updatedFamilyChildren
      });
    }
  });
}

/**
 * Parent rejects a child request.
 *
 * @param parentUid The UID of the parent rejecting the request
 * @param childUid The UID of the child being rejected
 * @param reason The reason for rejection
 */
export async function rejectChildRequest(parentUid: string, childUid: string, reason: string): Promise<void> {
  const currentTimestamp = Date.now();
  await updateDoc(userDoc(childUid), {
    approvalStatus: ApprovalStatus.REJECTED,
    rejectedReason: reason,
    approvedBy: parentUid, // acting as reviewer
    approvedAt: currentTimestamp,
    updatedAt: currentTimestamp
  });
}

/**
 * Suspend a user account.
 *
 * @param suspenderUid The UID of the person performing the suspension
 * @param targetUid The UID of the user to suspend
 * @param reason Reason for suspension
 */
export async function suspendUser(suspenderUid: string, targetUid: string, reason: string): Promise<void> {
  const currentTimestamp = Date.now();
  // Note: In a real app, we should verify permissions here (Admin can suspend anyone, Parent can suspend own child)
  await updateDoc(userDoc(targetUid), {
    approvalStatus: ApprovalStatus.SUSPENDED,
    rejectedReason: reason, // Reusing rejectedReason for suspension reason
    updatedAt: currentTimestamp
  });
}

// ==========================================
// Approval Request Audit Trail
// ==========================================

/**
 * Create an audit record for an approval request.
 *
 * @param request The request data
 * @returns The ID of the created request document
 */
export async function createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'createdAt'>): Promise<string> {
  const newRequestRef = doc(approvalRequestsCollection);
  const newRequest: ApprovalRequest = {
    ...request,
    id: newRequestRef.id,
    createdAt: Date.now()
  };
  
  await setDoc(newRequestRef, newRequest);
  return newRequestRef.id;
}

/**
 * Get approval requests filtered by status.
 *
 * @param status The ApprovalStatus to filter by
 * @returns Array of matching ApprovalRequests
 */
export async function getApprovalRequestsByStatus(status: ApprovalStatus): Promise<ApprovalRequest[]> {
  const q = query(approvalRequestsCollection, where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

/**
 * Update the status of an approval request record.
 *
 * @param requestId The ID of the approval request
 * @param status The new status
 * @param reviewerId The ID of the reviewer
 * @param notes Optional notes
 */
export async function updateApprovalRequestStatus(
  requestId: string,
  status: ApprovalStatus,
  reviewerId: string,
  notes?: string
): Promise<void> {
  const ref = doc(approvalRequestsCollection, requestId);
  const updates: Partial<ApprovalRequest> = {
    status,
    reviewerId,
    reviewedAt: Date.now()
  };
  
  if (notes) {
    updates.notes = notes;
  }
  
  await updateDoc(ref, updates);
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Check if a user has been approved.
 */
export function isUserApproved(profile: UserProfile): boolean {
  return profile.approvalStatus === ApprovalStatus.APPROVED;
}

/**
 * Check if a user is allowed to access the proxy.
 * Must be approved and either a PARENT or CHILD (or SUPER_ADMIN).
 */
export function canAccessProxy(profile: UserProfile): boolean {
  if (profile.approvalStatus !== ApprovalStatus.APPROVED) {
    return false;
  }
  
  return [UserRole.SUPER_ADMIN, UserRole.PARENT, UserRole.CHILD].includes(profile.role);
}
