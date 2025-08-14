// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  "projectId": "dagu-meet",
  "appId": "1:697525767644:web:a984726480d4c388aed319",
  "storageBucket": "dagu-meet.firebasestorage.app",
  "apiKey": "AIzaSyCf1z9Yv0_RXZQkm_tRVgM2CS5koj0Edxc",
  "authDomain": "dagu-meet.firebaseapp.com",
  "measurementId": "G-Q01ETPHRJ0",
  "messagingSenderId": "697525767644",
  "databaseURL": "https://meetup-mobile-nsygc-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

let analytics: Analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics };
