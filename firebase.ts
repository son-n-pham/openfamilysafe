import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getFirestore, collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { UserProfile, Family, ApprovalRequest } from './types';

// TODO: Replace these with your actual Firebase project configuration
// These are placeholders to prevent the app from crashing on start in the demo environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = getFirestore(app);
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Collection references
export const usersCollection = collection(db, 'users') as CollectionReference<UserProfile>;
export const familiesCollection = collection(db, 'families') as CollectionReference<Family>;
export const approvalRequestsCollection = collection(db, 'approvalRequests') as CollectionReference<ApprovalRequest>;

// Document reference helpers
export const userDoc = (uid: string) => doc(db, 'users', uid) as DocumentReference<UserProfile>;
export const familyDoc = (familyId: string) => doc(db, 'families', familyId) as DocumentReference<Family>;
export const approvalRequestDoc = (requestId: string) => doc(db, 'approvalRequests', requestId) as DocumentReference<ApprovalRequest>;