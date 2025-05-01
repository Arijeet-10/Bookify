
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SelectRolePage = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4">
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl">Join Bookify</CardTitle>
          <CardDescription>Choose how you want to sign up:</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            onClick={() => router.push('/signup/user')}
            className="w-full"
            size="lg"
          >
            Sign up as a User
          </Button>
          <Button
            onClick={() => router.push('/signup/service-provider')}
            className="w-full"
            variant="secondary"
             size="lg"
          >
            Sign up as a Service Provider
          </Button>
           <p className="text-sm text-center text-gray-500 dark:text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRolePage;
