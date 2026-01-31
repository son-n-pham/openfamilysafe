import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// TODO: Replace these with your actual Firebase project configuration
// These are placeholders to prevent the app from crashing on start in the demo environment
const firebaseConfig = {
  apiKey: "AIzaSyAOTt2uoaV5sPszXuAwqY2hVlSIP4mpE90",
  authDomain: "openfamilysafe.firebaseapp.com",
  projectId: "openfamilysafe",
  storageBucket: "openfamilysafe.firebasestorage.app",
  messagingSenderId: "355726338299",
  appId: "1:355726338299:web:5b8f5a3193fc005282685e",
  measurementId: "G-ZVVE0P3LGB"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();