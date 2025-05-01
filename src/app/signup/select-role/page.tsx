'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserRound, Briefcase, ArrowRight, LogIn } from 'lucide-react';

const SelectRolePage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Bookify</h1>
          <p className="text-gray-600 dark:text-gray-400">The modern platform for seamless appointment booking</p>
        </div>
        
        <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-6">
            <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">
              Choose Your Account Type
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid gap-6">
              <div 
                onClick={() => router.push('/signup/user')}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white text-lg">User Account</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Book services from our network of professionals</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div
                onClick={() => router.push('/signup/service-provider')} 
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white text-lg">Service Provider</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Offer your services and manage bookings</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          By continuing, you agree to Bookify's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SelectRolePage;