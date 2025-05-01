
'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth'; // Added updateProfile
import {auth, db} from '@/lib/firebase';
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {setDoc, doc} from 'firebase/firestore';
import Link from 'next/link';

// WARNING: This page allows anyone to sign up as an admin.
// In a real application, admin creation should be secured (e.g., manual creation, invite-only).
// This is for demonstration purposes only.

const AdminSignUpPage = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
    const [adminSecret, setAdminSecret] = useState(''); // Simple secret key for basic protection
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // TODO: Replace 'YOUR_SUPER_SECRET_KEY' with an actual environment variable or secure method
  const ACTUAL_ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SIGNUP_SECRET || "YOUR_SUPER_SECRET_KEY";


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

     if (adminSecret !== ACTUAL_ADMIN_SECRET) {
       setError('Invalid Admin Secret Key.');
       setLoading(false);
       return;
     }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

     if (password.length < 6) {
       setError('Password must be at least 6 characters long');
       setLoading(false);
       return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

       // Update Firebase Auth profile display name
       if (auth.currentUser) {
         await updateProfile(auth.currentUser, { displayName: fullName });
       }

      // Store user details in Firestore 'users' collection with the 'admin' role
      await setDoc(doc(db, "users", user.uid), {
        role: 'admin', // Hardcode role to 'admin'
        email: email,
        fullName: fullName,
      });

      // Redirect to admin dashboard after signup
      router.push('/admin-dashboard'); // Adjust this route as needed
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/weak-password') {
         setError('The password is too weak.');
       }
      else {
        setError('Failed to create admin account. Please try again.');
        console.error("Admin Signup Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]"> {/* Added padding-bottom */}
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Admin Registration</CardTitle>
           <CardDescription className="text-destructive">For authorized personnel only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
             <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter admin name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min. 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                 disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                 disabled={loading}
              />
            </div>
              <div className="grid gap-2">
                <Label htmlFor="adminSecret">Admin Secret Key</Label>
                <Input
                  id="adminSecret"
                  type="password" // Use password type to obscure the key
                  placeholder="Enter the admin secret key"
                  value={adminSecret}
                  onChange={e => setAdminSecret(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

            <Button disabled={loading} type="submit" className="w-full mt-4">
              {loading ? 'Registering Admin...' : 'Register Admin Account'}
            </Button>
          </form>
           <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an admin account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSignUpPage;
