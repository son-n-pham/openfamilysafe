import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserRole, UserProfile, FilterLevel } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean;
  simulateLogin: (email: string) => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock profile for demonstration since we don't have a live DB connection in this environment
const MOCK_ADMIN_PROFILE: UserProfile = {
  uid: 'admin-123',
  email: 'parent@example.com',
  displayName: 'Parent Admin',
  role: UserRole.ADMIN,
  filterLevel: FilterLevel.NONE,
  createdAt: Date.now()
};

const MOCK_CHILD_PROFILE: UserProfile = {
  uid: 'child-123',
  email: 'child@example.com',
  displayName: 'Alice',
  role: UserRole.CHILD,
  filterLevel: FilterLevel.STRICT,
  parentEmail: 'parent@example.com',
  createdAt: Date.now()
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // We add an error callback to onAuthStateChanged. 
    // If the API key is invalid, the error callback triggers, allowing us to stop loading.
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        if (user) {
          setCurrentUser(user);
          // In a real app, we would fetch the user profile from Firestore here.
          // For now, we simulate profile fetching based on the email.
          if (user.email?.includes('parent')) {
            setUserProfile({ ...MOCK_ADMIN_PROFILE, uid: user.uid, email: user.email });
          } else {
            setUserProfile({ ...MOCK_CHILD_PROFILE, uid: user.uid, email: user.email || 'child@test.com' });
          }
        } else {
          // Only clear if we aren't manually managing state (simple check)
          // For this demo, we assume if onAuthStateChanged fires with null, we are logged out.
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firebase Auth Error (likely invalid API Key). App will default to Demo Mode.", error);
        setIsDemo(true);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout failed (expected in Demo Mode). Clearing local state.");
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const simulateLogin = (email: string) => {
    setIsDemo(true);
    const mockUid = 'demo-user-' + Date.now();
    // Create a mock user object that satisfies the necessary parts of the User interface
    const mockUser = {
        uid: mockUid,
        email: email,
        displayName: email.includes('parent') ? 'Parent Admin' : 'Child User',
        emailVerified: true,
        isAnonymous: false,
        getIdToken: async () => "mock-token-demo",
        metadata: {},
        providerData: [],
        refreshToken: 'mock',
        tenantId: null,
        delete: async () => {},
        toJSON: () => ({}),
        reload: async () => {},
    } as unknown as User;

    setCurrentUser(mockUser);

    if (email?.includes('parent')) {
      setUserProfile({ ...MOCK_ADMIN_PROFILE, uid: mockUid, email: email });
    } else {
      setUserProfile({ ...MOCK_CHILD_PROFILE, uid: mockUid, email: email });
    }
  };

  const isAdmin = userProfile?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, isAdmin, simulateLogin, isDemo }}>
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