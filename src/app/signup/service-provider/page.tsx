
'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, signInWithPopup} from 'firebase/auth';
import {auth, db, googleProvider} from '@/lib/firebase';
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {setDoc, doc} from 'firebase/firestore';
import Link from 'next/link';

const ServiceProviderSignUpPage = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState(''); // Or Business Name
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

   // Google Sign-In is generally not recommended for distinct roles like Service Provider
   // as it might complicate role assignment logic. Sticking to email/password for clarity.
   // If needed, Google Sign-In could be implemented with a check to ensure the user doesn't
   // already exist with a different role or a prompt after sign-in to confirm details.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      // Store user details in Firestore with the 'serviceProvider' role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        role: 'serviceProvider', // Hardcode role to 'serviceProvider'
        email: email,
        fullName: fullName, // Consider renaming to businessName if more appropriate
        // Add other provider-specific fields here later (e.g., service type, address)
      });

      // Redirect to a service provider dashboard or setup page after signup
      router.push('/service-provider-dashboard'); // Adjust this route as needed
    } catch (err: any) {
       if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Try logging in or use a different email.');
      } else if (err.code === 'auth/weak-password') {
         setError('The password is too weak. Please choose a stronger password.');
       } else {
        setError('Failed to create account. Please try again.');
         console.error("Signup Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4">
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Service Provider Signup</CardTitle>
          <CardDescription>Create an account to list your services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              {/* Consider changing Label to "Business Name" if appropriate */}
              <Label htmlFor="fullName">Full Name / Business Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your name or business name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your business email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (min. 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
             {/* Add more provider-specific fields here if needed (e.g., service category, address) */}

            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

            <Button disabled={loading} type="submit" className="w-full mt-4">
              {loading ? 'Creating account...' : 'Sign Up as Service Provider'}
            </Button>
          </form>
           <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
           <p className="text-sm text-center text-muted-foreground mt-2">
             Signing up as a User?{' '}
            <Link href="/signup/user" className="text-primary hover:underline">
              Click here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderSignUpPage;
