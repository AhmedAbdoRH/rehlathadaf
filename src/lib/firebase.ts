import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "domainview",
  "appId": "1:226934922867:web:db492564c92b9b95f79406",
  "storageBucket": "domainview.firebasestorage.app",
  "apiKey": "AIzaSyA-AuKkPZiuQdA-NIPjObheWabwnrqwG7g",
  "authDomain": "domainview.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "226934922867"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
