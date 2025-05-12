'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { User } from 'firebase/auth';

interface UserData {
  fullName?: string;
  email?: string | null;
  role?: string;
  profileImageUrl?: string | null;
  // Add fields specific to service providers if needed, fetched conditionally
  businessName?: string;
  serviceCategory?: string;
}

const ProfilePage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          // Fetch basic user data (including role) from 'users' collection
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const baseUserData = userDocSnap.data();
             let profileData: UserData = {
              fullName: baseUserData.fullName || user.displayName, // Prioritize Firestore name
              email: user.email,
              role: baseUserData.role || 'user', // Default role if not found
              profileImageUrl: baseUserData.profileImageUrl || undefined, // Get photo from auth provider
            };

            // If the role is serviceProvider, fetch additional data from 'serviceProviders' collection
            if (profileData.role === 'serviceProvider') {
                const providerDocRef = doc(db, 'serviceProviders', user.uid);
                const providerDocSnap = await getDoc(providerDocRef);
                if (providerDocSnap.exists()) {
                    const providerData = providerDocSnap.data();
                    // Correctly merge provider data into profileData
                    profileData = {
                        ...profileData,
                        businessName: providerData.businessName, // Use correct field name from Firestore
                        serviceCategory: providerData.serviceCategory, // Use correct field name from Firestore
                         // Add other provider fields as needed
                    };
                } else {
                     console.warn("Service provider document not found in Firestore for user:", user.uid);
                     // Optionally handle this case, maybe show a message or default values
                     // Ensure the fields exist even if the doc doesn't, to avoid undefined issues later
                     profileData.businessName = 'N/A'; // Use 'N/A' as fallback
                     profileData.serviceCategory = 'N/A'; // Use 'N/A' as fallback
                }
            }
             setUserData(profileData);

          } else {
            // User exists in Auth but not 'users' Firestore (should ideally not happen after signup fixes)
            // Provide defaults and log a warning
             setUserData({
              fullName: user.displayName || 'N/A',
              email: user.email,
              role: 'user', // Default role
              profileImageUrl: user.profileImageUrl,
            });
            console.warn("User document not found in 'users' collection for UID:", user.uid);
             setError("Profile data incomplete. Please contact support.");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load profile information.");
          // Still set basic info from auth as fallback
           setUserData({
            fullName: user.displayName || 'N/A',
            email: user.email,
            role: 'N/A',
            profileImageUrl: user.profileImageUrl,
          });
        } finally {
          setLoading(false);
        }
      } else {
        // No user logged in, redirect to login
        router.push('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login page after logout
    } catch (err) {
      console.error("Logout Error:", err);
      setError("Failed to logout. Please try again.");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    // Ensure name is treated as a string before splitting
    return String(name).split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[120px]">
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4">
            {loading ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <>
                <AvatarImage src={userData?.profileImageUrl ?? undefined} alt={userData?.fullName ?? 'User'} />
                <AvatarFallback className="text-3xl">{getInitials(userData?.fullName)}</AvatarFallback>
              </>
            )}
          </Avatar>
          <CardTitle className="text-2xl">
             {loading ? <Skeleton className="h-8 w-3/4 mx-auto" /> : userData?.fullName || 'User Profile'}
          </CardTitle>
           <CardDescription>
             {loading ? <Skeleton className="h-4 w-1/2 mx-auto mt-1" /> : `Role: ${userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'N/A'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="space-y-2">
            <h4 className="font-medium">Email</h4>
             {/* Changed p to div to avoid hydration error with Skeleton */}
            <div className="text-sm text-muted-foreground">
               {loading ? <Skeleton className="h-5 w-full" /> : userData?.email || 'No email provided'}
            </div>
          </div>

           {/* Display Service Provider specific details if applicable */}
           {userData?.role === 'serviceProvider' && (
             <>
              <div className="space-y-2">
                 <h4 className="font-medium">Business Name</h4>
                 <div className="text-sm text-muted-foreground">
                    {loading ? <Skeleton className="h-5 w-full" /> : userData?.businessName || 'N/A'}
                 </div>
               </div>
                <div className="space-y-2">
                 <h4 className="font-medium">Service Category</h4>
                 <div className="text-sm text-muted-foreground">
                   {loading ? <Skeleton className="h-5 w-full" /> : userData?.serviceCategory || 'N/A'}
                 </div>
               </div>
                {/* Add more provider details here */}
             </>
           )}


           {/* Add other common profile details here as needed */}

          <Button onClick={handleLogout} variant="destructive" className="w-full mt-4">
            Logout
          </Button>
           <Button onClick={() => router.push('/')} variant="outline" className="w-full mt-2">
            Back to Home
          </Button>
           <Button onClick={() => router.push('/edit-profile')} variant="outline" className="w-full mt-2">
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;