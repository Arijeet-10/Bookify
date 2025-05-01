'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { setDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UserSignUpPage = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength validation
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        role: 'user',
        email: user.email,
        fullName: user.displayName || 'User',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-in was cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in method');
      } else {
        setError('Google sign-in failed. Please try again');
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
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        role: 'user',
        email: email,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please choose a stronger password');
      } else {
        setError('Failed to create account. Please try again');
        console.error("Signup Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div>
          <Link 
            href="/signup" 
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-6"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to signup options
          </Link>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Your Account</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Join Bookify to discover and book services from qualified professionals
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-0 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Registration
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Password strength indicators */}
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      {hasMinLength ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-gray-400" />}
                      <span className={hasMinLength ? "text-green-600 dark:text-green-500" : "text-gray-500"}>
                        Min. 6 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {hasUpperCase ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-gray-400" />}
                      <span className={hasUpperCase ? "text-green-600 dark:text-green-500" : "text-gray-500"}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {hasNumber ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-gray-400" />}
                      <span className={hasNumber ? "text-green-600 dark:text-green-500" : "text-gray-500"}>
                        Number
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Password match indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {passwordsMatch ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <XCircle className="h-3 w-3 text-red-500" />}
                    <span className={passwordsMatch ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}>
                      {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                disabled={loading} 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : 'Create Account'}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                disabled={loading} 
                variant="outline" 
                onClick={handleGoogleSignIn} 
                className="w-full flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Looking to offer services?{' '}
              <Link href="/signup/service-provider" className="font-medium text-primary hover:underline">
                Sign up as a Service Provider
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-8">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default UserSignUpPage;