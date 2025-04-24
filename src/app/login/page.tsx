'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth, db} from '@/lib/firebase';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {getDoc, doc} from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful login, redirect based on user role (add role info to the user object on signup)
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid)); // Assuming you store user role in Firestore
        const userData = userDoc.data();
        if (userData?.role === "serviceProvider") {
          router.push('/service-provider-dashboard');
        } else if (userData?.role === "admin") {
          router.push('/admin-dashboard');
        } else {
          router.push('/'); // Default redirect
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-primary">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
