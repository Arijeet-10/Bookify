// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
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

import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

export const fetchBookingsByProviderAndDate = async (providerId: string, date: Date) => {
  try {
    // Create start and end timestamps for the selected date
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const bookingsRef = collection(db, "appointments");
    const q = query(
      bookingsRef,
      where("providerId", "==", providerId),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay))
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error; // Rethrow the error for handling in the component
  }
};
