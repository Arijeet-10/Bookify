
'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {signInWithEmailAndPassword, signInWithPopup, updateProfile} from 'firebase/auth'; // Added signInWithPopup and updateProfile
import {auth, db, googleProvider} from '@/lib/firebase';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {getDoc, doc, setDoc} from 'firebase/firestore'; // Added setDoc
import Link from 'next/link'; // Import Link

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'user'; // Default to 'user' if no doc or role found

      if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userRole = userData?.role || 'user'; // Get role from Firestore
      } else {
        // Create a basic user doc in 'users' for Google sign-in users if they don't exist
         await setDoc(userDocRef, {
            role: 'user', // Default role for Google sign-in
            email: user.email,
            fullName: user.displayName || 'User', // Use Google display name
         }, { merge: true }); // Use merge to be safe
      }

      // Redirect based on role fetched or created
       redirectBasedOnRole(userRole);

    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-in cancelled.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
         setError('An account already exists with this email address using a different sign-in method.');
      }
       else {
        setError('Google sign-in failed. Please try again.');
         console.error("Google sign-in error:", error);
      }
    } finally {
        setLoading(false);
    }
  };

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: string) => {
      if (role === "serviceProvider") {
        router.push('/service-provider-dashboard');
      } else if (role === "admin") {
        router.push('/admin-dashboard');
      } else { // Default for 'user' or unknown roles
        router.push('/');
      }
  }


  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore 'users' collection after successful login
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
         redirectBasedOnRole(userData?.role || 'user'); // Default to user if role is missing
      } else {
        // This case might happen if a user authenticates but their Firestore doc failed to create during signup
        console.warn("User document not found in Firestore for logged-in user:", user.uid);
         // Attempt to create a basic user doc as a fallback, assuming they are a standard user
          try {
            await setDoc(userDocRef, {
              role: 'user', // Assume 'user' role as a fallback
              email: user.email,
              fullName: user.displayName || 'User', // Use auth display name if available
            }, { merge: true });
             router.push('/'); // Redirect to home after creating fallback doc
          } catch (docError) {
             console.error("Failed to create fallback user document:", docError);
             setError("Could not verify user details. Please contact support.");
             await auth.signOut(); // Sign out the user as we can't determine their role
          }
      }
    } catch (err: any) {
       if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
           setError('Invalid email or password.');
       } else {
           setError('Failed to login. Please try again.');
           console.error("Login error:", err);
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]"> {/* Added padding-bottom */}
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Login to Bookify</CardTitle>
           <CardDescription>Enter your credentials below</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleEmailPasswordSignIn}>
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
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            <Button disabled={loading} type="submit" className="w-full mt-4">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
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
            Login with Google
          </Button>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup/select-role" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
