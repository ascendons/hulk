import { initializeApp, getApps, setLogLevel } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, logEvent } from "firebase/analytics"; // Import for Analytics


const firebaseConfig = {
  apiKey: "AIzaSyAQt3wC9b3D11kTpYxAQ5tLTSxjRbuTyxE",
  authDomain: "campusconnect-a9fd9.firebaseapp.com",
  databaseURL: "https://campusconnect-a9fd9-default-rtdb.firebaseio.com",
  projectId: "campusconnect-a9fd9",
  storageBucket: "campusconnect-a9fd9.appspot.com",
  messagingSenderId: "856272800171",
  appId: "1:856272800171:web:d18054d53ef7ecb778eaee",
  measurementId: "G-G9MDK6QHKZ",
};

setLogLevel("silent");

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = initializeAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);  

logEvent(analytics, 'app_started');


export { db, auth, storage, analytics };
