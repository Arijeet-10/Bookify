// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9xO33XC40YRiFC9fvDoaSOfxAt2poqdk",
  authDomain: "bookify-8c8e9.firebaseapp.com",
  projectId: "bookify-8c8e9",
  storageBucket: "bookify-8c8e9.firebasestorage.app",
  messagingSenderId: "291526500805",
  appId: "1:291526500805:web:29c3adcac7b17fd2382bac",
  measurementId: "G-Q1S3T6QV8X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
