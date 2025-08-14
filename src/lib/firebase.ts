// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCf1z9Yv0_RXZQkm_tRVgM2CS5koj0Edxc",
    authDomain: "dagu-meet.firebaseapp.com",
    projectId: "dagu-meet",
    storageBucket: "dagu-meet.appspot.com",
    messagingSenderId: "697525767644",
    appId: "1:697525767644:web:a984726480d4c388aed319",
    measurementId: "G-Q01ETPHRJ0",
    databaseURL: "https://dagu-meet-default-rtdb.firebaseio.com"
};


// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
    isSupported().then(supported => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    })
}

export { app, auth, db, analytics };
