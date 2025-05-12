'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CldUploadButton } from 'next-cloudinary';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from 'firebase/auth';


interface UserData {
  fullName: string;
  email: string;
  profileImageUrl?: string;
  role: string;
}

const EditProfilePage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
   const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              fullName: data.fullName || '',
              email: user.email || '',
              role: data.role || 'user',
              profileImageUrl: data.profileImageUrl || '',
            });
          } else {
            setError('User data not found.');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load profile information.');
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!userData) {
      setError('No user data to update.');
      setIsSubmitting(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in.');
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: userData.fullName,
        profileImageUrl: userData.profileImageUrl || '',
      });
      toast({
        variant: 'default',
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      router.push('/profile');
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Failed to update profile information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageUploadSuccess = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      setUserData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          profileImageUrl: secureUrl,
        };
      });
      toast({
        description: 'Profile image uploaded successfully.',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    return <div>No user data available.</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[120px]">
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Make changes to your profile here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
             <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={userData.profileImageUrl || ''} alt={userData.fullName || 'User'} />
                <AvatarFallback>{userData.fullName ? userData.fullName.charAt(0) : 'U'}</AvatarFallback>
              </Avatar>
               <CldUploadButton uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} onSuccess={handleImageUploadSuccess}>
                <Button type="button" variant="outline">Upload Profile Image</Button>
              </CldUploadButton>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={userData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={userData.email} readOnly disabled />
            </div>
            {error && <p className="text-red-500">{error}</p>}
             <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
                 Back
                </Button>
                 <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
             </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfilePage;