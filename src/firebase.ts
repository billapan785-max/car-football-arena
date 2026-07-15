import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0154442482",
  appId: "1:1009136262206:web:0092b1d730c9a0f5b8856f",
  apiKey: "AIzaSyD0VGm331MF39aoC5XzdP6BY5mBa-Lv9g8",
  authDomain: "gen-lang-client-0154442482.firebaseapp.com",
  storageBucket: "gen-lang-client-0154442482.firebasestorage.app",
  messagingSenderId: "1009136262206",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-boostball-08ca3144-fc07-4b2b-a934-c7701afddaec");
