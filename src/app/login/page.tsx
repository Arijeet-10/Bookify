
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';

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
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'user'; // Default role

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userRole = userData?.role || 'user';
      } else {
        // If user doc doesn't exist (e.g., first Google sign-in), create it
        await setDoc(userDocRef, {
          role: 'user', // Default to 'user' for Google sign-ins not previously registered
          email: user.email,
          fullName: user.displayName || 'User',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      redirectBasedOnRole(userRole);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-in cancelled.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account exists with this email using a different sign-in method.');
      } else {
        setError('Google sign-in failed. Please try again.');
        console.error("Google sign-in error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    if (role === "serviceProvider") {
      router.push('/service-provider-dashboard');
    } else if (role === "admin") {
      router.push('/admin-dashboard'); // Ensure admin redirect
    } else {
      router.push('/'); // Default for 'user'
    }
  }

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        redirectBasedOnRole(userData?.role || 'user');
      } else {
        // This case should ideally not happen if signup creates the user document
        // For robustness, create a default user doc and redirect to home
        console.warn("User document not found for UID:", user.uid, "This should not happen after signup.");
        await setDoc(userDocRef, { // Create a basic user doc if it's missing
          role: 'user',
          email: user.email,
          fullName: user.displayName || 'User', // Or a default name
          createdAt: new Date().toISOString(),
        }, { merge: true });
        router.push('/'); // Fallback redirect
      }
    } catch (err: any) {
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(err.code)) {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please try again.');
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-background px-4 py-10 pb-[120px]">
      <Card className="w-full max-w-md shadow-lg border dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-semibold">Login to Bookify</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <form onSubmit={handleEmailPasswordSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center mt-1">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-card px-2 text-muted-foreground">
                Or login with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <FcGoogle size={20} />
            Continue with Google
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-2">
            Don&apos;t have an account?{' '}
            <Link href="/signup/select-role" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
