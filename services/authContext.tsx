// services/authContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, userDoc } from '../firebase';
import { UserRole, UserProfile, ApprovalStatus } from '../types';
import { createUserProfile, getUserProfile } from './userService';

interface AuthContextType {
  user: User | null;                    // Firebase Auth user
  userProfile: UserProfile | null;      // Firestore user profile
  loading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;                  // Convenience: approvalStatus === APPROVED
  isPending: boolean;                   // Convenience: approvalStatus === PENDING
  isSuperAdmin: boolean;                // Convenience: role === SUPER_ADMIN
  isParent: boolean;                    // Convenience: role === PARENT
  isChild: boolean;                     // Convenience: role === CHILD
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'parent' | 'child', parentEmail?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;  // Manually refresh user profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (firebaseUser) {
        // Fetch user profile from Firestore and listen for changes
        const ref = userDoc(firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(ref, (doc) => {
          if (doc.exists()) {
             const data = doc.data() as UserProfile;
             setUserProfile(data);
          } else {
             // Profile might not exist yet (e.g., immediate post-creation race or legacy user)
             setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          // If error occurs (e.g. permission denied), we stop loading to avoid indefinite spinner
          setLoading(false);
        });
      } else {
        // User logged out
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, role: 'parent' | 'child', parentEmail?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userRole = role === 'parent' ? UserRole.PENDING_PARENT : UserRole.PENDING_CHILD;
      
      await createUserProfile(firebaseUser, userRole, parentEmail);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  // Helper computed values
  const isAuthenticated = !!user;
  const isApproved = userProfile?.approvalStatus === ApprovalStatus.APPROVED;
  const isPending = userProfile?.approvalStatus === ApprovalStatus.PENDING;
  const isSuperAdmin = userProfile?.role === UserRole.SUPER_ADMIN;
  const isParent = userProfile?.role === UserRole.PARENT;
  const isChild = userProfile?.role === UserRole.CHILD;

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    isApproved,
    isPending,
    isSuperAdmin,
    isParent,
    isChild,
    signIn,
    signUp,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
