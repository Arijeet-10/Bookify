'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword} from 'firebase/auth';
import {auth, db, provider} from '@/lib/firebase';
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {setDoc, doc} from 'firebase/firestore';

import { signInWithPopup } from "firebase/auth";

import {googleProvider} from "@/lib/firebase";
const SignUpPage = () => {
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
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                role: 'user',
                email: user.email,
                fullName: user.displayName
            }); // Store role, email and full name in Firestore
            router.push('/');
        } catch (error:any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }
  const [role, setRole] = useState('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), { 
          role: role,
          email: email,
          fullName:fullName
      }); // Store role, email and full name in Firestore

      router.push('/');
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
          <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
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
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
              <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={setRole} defaultValue={role}>
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="serviceProvider">Service Provider</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
              <Button disabled={loading}  onClick={handleGoogleSignIn} className="w-full mt-2" >
                  Sign up with google
              </Button>
          </form>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-primary">
              Login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
