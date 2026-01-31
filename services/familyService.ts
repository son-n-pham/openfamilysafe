// services/familyService.ts
import {
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  doc,
  DocumentReference,
  DocumentSnapshot
} from 'firebase/firestore';
import { db, familiesCollection, usersCollection, familyDoc, userDoc } from '../firebase';
import { Family, UserProfile, FilterLevel, ApprovalStatus, UserRole } from '../types';
import { getUserProfile } from './userService';

// Helper for invites collection
const invitesCollection = collection(db, 'invites');

// ==========================================
// Family CRUD Functions
// ==========================================

/**
 * Create a new family for a parent.
 * Typically called when a parent is approved by an admin.
 * 
 * @param parentUid The UID of the parent creating the family
 * @returns The created Family object
 */
export async function createFamily(parentUid: string): Promise<Family> {
  // Create a new document in the families collection with an auto-generated ID
  const newFamilyRef = doc(familiesCollection);
  const currentTimestamp = Date.now();

  const newFamily: Family = {
    id: newFamilyRef.id,
    parentUid,
    childrenUids: [],
    createdAt: currentTimestamp,
    settings: {
      filterLevel: FilterLevel.MODERATE
    }
  };

  await setDoc(newFamilyRef, newFamily);
  
  // Also update the parent's profile to link to this family
  await updateDoc(userDoc(parentUid), {
    familyId: newFamilyRef.id,
    updatedAt: Date.now()
  });

  return newFamily;
}

/**
 * Get a family by its ID.
 * 
 * @param familyId The ID of the family to retrieve
 * @returns The Family object or null if not found
 */
export async function getFamily(familyId: string): Promise<Family | null> {
  const docSnap = await getDoc(familyDoc(familyId));
  if (docSnap.exists()) {
    return docSnap.data() as Family;
  }
  return null;
}

/**
 * Get a family associated with a specific parent UID.
 * 
 * @param parentUid The UID of the parent
 * @returns The Family object or null if not found
 */
export async function getFamilyByParent(parentUid: string): Promise<Family | null> {
  const q = query(familiesCollection, where('parentUid', '==', parentUid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as Family;
  }
  return null;
}

/**
 * Update the settings for a family.
 * 
 * @param familyId The ID of the family to update
 * @param settings Partial settings object
 */
export async function updateFamilySettings(familyId: string, settings: Partial<Family['settings']>): Promise<void> {
  // Since settings is a nested object, we need to be careful not to overwrite the entire map if we only want partial updates.
  // However, the interface only has filterLevel currently.
  // Using dot notation for nested fields updating usually requires referencing the specific path e.g. "settings.filterLevel"
  // But here we accept a Partial of the settings object.
  
  // Construction the update object
  const updates: any = {};
  if (settings && settings.filterLevel) {
    updates['settings.filterLevel'] = settings.filterLevel;
  }
  
  if (Object.keys(updates).length > 0) {
    await updateDoc(familyDoc(familyId), updates);
  }
}

// ==========================================
// Child Management Functions
// ==========================================

/**
 * Add a child to a family.
 * Updates the Family document and the Child's UserProfile.
 * 
 * @param familyId The ID of the family
 * @param childUid The UID of the child to add
 */
export async function addChildToFamily(familyId: string, childUid: string): Promise<void> {
  // 1. Get the family to know the parentUid
  const family = await getFamily(familyId);
  if (!family) {
    throw new Error('Family not found');
  }

  // 2. Update Family document
  await updateDoc(familyDoc(familyId), {
    childrenUids: arrayUnion(childUid)
  });

  // 3. Update Child UserProfile
  await updateDoc(userDoc(childUid), {
    familyId: familyId,
    parentUid: family.parentUid, // Link child to parent
    updatedAt: Date.now()
  });

  // 4. Update Parent UserProfile to include this child
  await updateDoc(userDoc(family.parentUid), {
    childrenUids: arrayUnion(childUid),
    updatedAt: Date.now()
  });
}

/**
 * Remove a child from a family.
 * 
 * @param familyId The ID of the family
 * @param childUid The UID of the child to remove
 */
export async function removeChildFromFamily(familyId: string, childUid: string): Promise<void> {
  const family = await getFamily(familyId);
  if (!family) {
    throw new Error('Family not found');
  }

  // 1. Update Family document
  await updateDoc(familyDoc(familyId), {
    childrenUids: arrayRemove(childUid)
  });

  // 2. Update Child UserProfile (remove links)
  // We explicitly set fields to null or delete them? Firestore doesn't support undefined nicely.
  // UserProfile uses optional fields, so we can probably just ignore them or leave them?
  // It's cleaner to remove the association.
  await updateDoc(userDoc(childUid), {
    familyId: '', // Or use deleteField() if imported, but empty string or sentinel value is often easier
    parentUid: '',
    updatedAt: Date.now()
  } as any); // Type assertion needed if fields are not nullable in strict types, but they are optional string | undefined

  // 3. Update Parent UserProfile
  await updateDoc(userDoc(family.parentUid), {
    childrenUids: arrayRemove(childUid),
    updatedAt: Date.now()
  });
}

/**
 * Get all children profiles belonging to a family.
 * 
 * @param familyId The ID of the family
 * @returns Array of Child UserProfiles
 */
export async function getFamilyChildren(familyId: string): Promise<UserProfile[]> {
  const q = query(usersCollection, where('familyId', '==', familyId), where('role', '==', UserRole.CHILD));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get all approved children for a parent.
 * 
 * @param parentUid The UID of the parent
 * @returns Array of approved Child UserProfiles
 */
export async function getApprovedChildrenForParent(parentUid: string): Promise<UserProfile[]> {
  // This can be done by querying children where parentUid matches and status is APPROVED
  const q = query(
    usersCollection, 
    where('parentUid', '==', parentUid),
    where('approvalStatus', '==', ApprovalStatus.APPROVED),
    where('role', '==', UserRole.CHILD) // Double check role
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

// ==========================================
// Family Lookup Functions
// ==========================================

/**
 * Find a parent user profile by their email address.
 * Use this during child registration to find the parent.
 * 
 * @param email The email to search for
 * @returns The parent's UserProfile or null
 */
export async function findParentByEmail(email: string): Promise<UserProfile | null> {
  const q = query(usersCollection, where('email', '==', email), where('role', '==', UserRole.PARENT));
  // Note: Depending on logic, PENDING_PARENT might also be valid to find, but typically we want an approved parent.
  // Assuming 'PARENT' role means approved active parent.
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
}

/**
 * Generate a unique family invite code.
 * Stores the code in a separate 'invites' collection for validation.
 * 
 * @param familyId The ID of the family generating the invite
 * @returns The generated invite code string
 */
export async function generateFamilyInviteCode(familyId: string): Promise<string> {
  // Generate a rudimentary 6-character alphanumeric code
  // In production, use a library or better algorithm to ensure uniqueness and collision handling
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Store in firestore with expiration (e.g., 48 hours)
  // Not checking for collisions here for simplicity of task
  await addDoc(invitesCollection, {
    code,
    familyId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
  });

  return code;
}

/**
 * Validate a family invite code.
 * 
 * @param code The invite code to validate
 * @returns The Family object associated with the code, or null if invalid/expired
 */
export async function validateFamilyInviteCode(code: string): Promise<Family | null> {
  const q = query(invitesCollection, where('code', '==', code));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const inviteData = snapshot.docs[0].data();
  const now = Date.now();
  
  if (inviteData.expiresAt && now > inviteData.expiresAt) {
    return null; // Expired
  }
  
  // Return the family
  return getFamily(inviteData.familyId);
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Check if a user belongs to a specific family.
 * 
 * @param userUid The user's UID
 * @param familyId The family ID to check against
 * @returns boolean
 */
export async function userBelongsToFamily(userUid: string, familyId: string): Promise<boolean> {
  const user = await getUserProfile(userUid);
  if (!user) return false;
  
  return user.familyId === familyId;
}

/**
 * Get the filter level setting for a family.
 * 
 * @param familyId The ID of the family
 * @returns The FilterLevel enum value
 */
export async function getFamilyFilterLevel(familyId: string): Promise<FilterLevel> {
  const family = await getFamily(familyId);
  if (family && family.settings) {
    return family.settings.filterLevel;
  }
  return FilterLevel.MODERATE; // Default
}
