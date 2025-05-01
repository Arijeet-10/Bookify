
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Footer from './Footer';
import ServiceProviderFooter from './ServiceProviderFooter';
import { Skeleton } from './ui/skeleton'; // Optional: for loading state

const ConditionalFooter = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data()?.role || 'user'); // Default to 'user' if role missing
          } else {
            // Handle case where user is authenticated but doc doesn't exist (might happen with Google Sign-In edge cases)
            setUserRole('user'); // Assume 'user' role
            console.warn("User document not found for UID:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('user'); // Default to 'user' on error
        }
      } else {
        setUserRole(null); // No user logged in
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Optional: Render a placeholder or skeleton while loading auth state
     // Return null or a minimal placeholder to avoid layout shift
     return null;
    // Or a skeleton:
    // return (
    //   <div className="bg-[#152226] p-4 fixed bottom-0 left-0 w-full border-t border-gray-700 dark:border-gray-800 mt-[50px] h-[69px]">
    //      <Skeleton className="h-full w-full bg-gray-700" />
    //   </div>
    // );
  }

  if (userRole === 'serviceProvider') {
    return <ServiceProviderFooter />;
  }

  // Render default footer for 'user', null (guest), 'admin', or any other role
  return <Footer />;
};

export default ConditionalFooter;
