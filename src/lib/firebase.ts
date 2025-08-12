// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  "projectId": "meetup-mobile-nsygc",
  "appId": "1:881671217656:web:a50d0b70461d263250b60d",
  "storageBucket": "meetup-mobile-nsygc.firebasestorage.app",
  "apiKey": "AIzaSyDeWaPXkEJDfY8oDxhIIwAfuDDfLo2qLZM",
  "authDomain": "meetup-mobile-nsygc.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "881671217656",
  "databaseURL": "https://meetup-mobile-nsygc-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
