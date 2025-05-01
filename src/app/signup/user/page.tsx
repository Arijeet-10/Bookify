'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, signInWithPopup, updateProfile} from 'firebase/auth'; // Added updateProfile
import {auth, db, googleProvider} from '@/lib/firebase';
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {setDoc, doc} from 'firebase/firestore';
import Link from 'next/link';

const UserSignUpPage = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Ensure Firestore document is created or updated for Google sign-in users in the 'users' collection
      // Correctly includes the role 'user'
      await setDoc(doc(db, "users", user.uid), {
        role: 'user', // Always 'user' for this page
        email: user.email,
        fullName: user.displayName || 'User', // Use display name or default
      }, { merge: true }); // Use merge to avoid overwriting existing data if they signed up manually first
      router.push('/'); // Redirect to home page after successful sign-in/up
    } catch (error: any) {
       if (error.code === 'auth/popup-closed-by-user') {
         setError('Google Sign-in cancelled.');
       } else if (error.code === 'auth/account-exists-with-different-credential') {
          setError('An account already exists with this email address using a different sign-in method.');
       } else {
         setError('Google sign-in failed. Please try again.');
         console.error("Google sign-in error:", error);
       }
    } finally {
      setLoading(false);
    }
  };

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
       // Update Firebase Auth profile display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }

      // Store user details in Firestore 'users' collection with the 'user' role
      // Correctly includes the role 'user'
      await setDoc(doc(db, "users", userCredential.user.uid), {
        role: 'user', // Explicitly set role to 'user'
        email: email,
        fullName: fullName,
      });

      router.push('/'); // Redirect to home page after successful signup
    } catch (err: any) {
       if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Try logging in or use a different email.');
      } else if (err.code === 'auth/weak-password') {
         setError('The password is too weak. Please choose a stronger password.');
       }
      else {
        setError('Failed to create account. Please try again.');
        console.error("Signup Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]"> {/* Added padding-bottom */}
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create User Account</CardTitle>
          <CardDescription>Sign up to start booking services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                 disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                placeholder="Enter your password (min. 6 characters)"
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
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                 disabled={loading}
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

            <Button disabled={loading} type="submit" className="w-full mt-4">
              {loading ? 'Creating account...' : 'Sign Up as User'}
            </Button>
             <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
             <Button disabled={loading} variant="outline" onClick={handleGoogleSignIn} className="w-full">
              Sign up with Google
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
           <p className="text-sm text-center text-muted-foreground mt-2">
             Signing up as a Service Provider?{' '}
            <Link href="/signup/service-provider" className="text-primary hover:underline">
              Click here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSignUpPage;
