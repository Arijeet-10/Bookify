"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@radix-ui/react-label"; // Corrected import for Label
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { updateDoc } from 'firebase/firestore';

import { CldUploadWidget } from 'next-cloudinary';

interface ServiceProviderData {
  businessName: string;
  serviceCategory: string;
 address?: string;
 servicesOffered: string[];
 profileImageUrl?: string; // Add field for profile image URL
}

export default function ServiceProviderProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProviderData | null>(null);
  const [editedData, setEditedData] = useState<ServiceProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

 // Make sure your Cloudinary cloud name is set as an environment variable: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const userId = user?.uid;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userId = user.uid;
        try {
          const docRef = doc(db, "serviceProviders", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setServiceProviderData(docSnap.data() as ServiceProviderData);
          } else {
            setServiceProviderData(null);
            setError("Service provider data not found.");
          }
        } catch (err) {
          console.error("Error fetching service provider data:", err);
          setError("Failed to fetch service provider data.");
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login'); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router, user?.uid]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(serviceProviderData); // Initialize edited data with current data
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(null);
    setSaveSuccess(false); // Reset success message
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditedData(prevData => ({
      ...prevData!,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    if (!userId || !editedData) return;
    setIsSaving(true);
    setError(null);
    try {
      const docRef = doc(db, "serviceProviders", userId);
      await updateDoc(docRef, editedData as any); // Update the document
      setServiceProviderData(editedData); // Update displayed data
      setIsEditing(false);
      setSaveSuccess(true); // Set success message
    } catch (err) {
      console.error("Error updating service provider data:", err);
      setError("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = async (result: any) => {
    if (result.event === 'success' && userId) {
      const imageUrl = result.info.secure_url;
      setIsSaving(true);
      setError(null);
      try {
        const docRef = doc(db, "serviceProviders", userId);
        await updateDoc(docRef, { profileImageUrl: imageUrl });
        setServiceProviderData(prevData => ({ ...prevData!, profileImageUrl: imageUrl }));
      } catch (err) {
        console.error("Error updating profile image:", err);
        setError("Failed to update profile image.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    //     <Skeleton className="h-8 w-64 mb-4" />
    //     <Card>
    //       <CardHeader>
    //         <Skeleton className="h-6 w-48" />
    //       </CardHeader>
    //       <CardContent className="grid gap-4">
    //         <div className="grid grid-cols-2 items-center gap-4">
    //           <Skeleton className="h-4 w-24" />
    //           <Skeleton className="h-4 w-32" />
    //         </div>
    //         <div className="grid grid-cols-2 items-center gap-4">
    //           <Skeleton className="h-4 w-24" />
    //           <Skeleton className="h-4 w-32" />
    //         </div>
    //         <Separator />
    //         <Skeleton className="h-6 w-32" />
    //         <Skeleton className="h-4 w-full" />
    //         <Skeleton className="h-4 w-full" />
    //       </CardContent>
    //     </Card>
    //   </div>
    // );
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!serviceProviderData) {
    return <div className="container mx-auto p-4">No service provider data available.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Service Provider Profile</CardTitle>
 {serviceProviderData.profileImageUrl && (
 <img src={serviceProviderData.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
 )}
        </CardHeader>
        <CardContent className="grid gap-4">
          {isEditing ? (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  type="text"
                  id="businessName"
                  value={editedData?.businessName || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Input
                  type="text"
                  id="serviceCategory"
                  value={editedData?.serviceCategory || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  type="text"
                  id="address"
                  value={editedData?.address || ''}
                  onChange={handleInputChange}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="businessName">Business Name:</Label>
                <span id="businessName">{serviceProviderData.businessName}</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="serviceCategory">Service Category:</Label>
                <span id="serviceCategory">{serviceProviderData.serviceCategory}</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="location">Location:</Label>
                <span id="location">{serviceProviderData.address || 'N/A'}</span>
              </div>
              {serviceProviderData.address && (
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="address">Address:</Label>
                  <span id="address">{serviceProviderData.address}</span>
                </div>
              )}
            </>
          )}
          <Separator />
          <h2 className="text-lg font-semibold">Services Offered:</h2>
          {serviceProviderData.servicesOffered && serviceProviderData.servicesOffered.length > 0 ? (
            <ul className="list-disc list-inside">
              {serviceProviderData.servicesOffered.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          ) : (<p>No services listed yet.</p>)}
        </CardContent>
 {/* Cloudinary Upload Widget */}
 <div className="flex justify-center mb-4">
 <CldUploadWidget uploadPreset="bookify" onSuccess={handleUploadSuccess}>
 {( {open} ) => <Button onClick={(e) => { e.preventDefault(); open()}}>Upload Profile Image</Button>}
 </CldUploadWidget>
 </div>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {saveSuccess && (
            <span className="text-green-500 text-sm">Profile updated successfully!</span>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              Edit Profile
            </Button>
          )}
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};