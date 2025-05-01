'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { serviceCategories } from '@/lib/constants';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define Zod schema for validation
const signUpSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required' }),
  businessName: z.string().min(1, { message: 'Business name is required' }),
  serviceCategory: z.string().min(1, { message: 'Service category is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const ServiceProviderSignUpPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      businessName: '',
      serviceCategory: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Update Firebase Auth profile display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.fullName });
      }

      // Store basic user info with role in 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        role: 'serviceProvider',
        email: data.email,
        fullName: data.fullName,
      });

      // Store detailed provider info in 'serviceProviders' collection
      await setDoc(doc(db, "serviceProviders", user.uid), {
        userId: user.uid,
        email: data.email,
        fullName: data.fullName,
        businessName: data.businessName,
        serviceCategory: data.serviceCategory,
      });

      setSuccess("Account created successfully! Redirecting...");
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/service-provider-dashboard');
      }, 1500);
      
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
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      {/* Left panel with image/branding for desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-primary">Service Connect</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Your business, our platform.</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
            <p className="text-gray-600 dark:text-gray-300">Connect with new customers and expand your reach.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Easy Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-300">Manage appointments and bookings all in one place.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
            <p className="text-gray-600 dark:text-gray-300">Get paid faster with our integrated payment system.</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          © 2025 Service Connect. All rights reserved.
        </div>
      </div>
      
      {/* Right panel with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create your provider account
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Join our marketplace and start growing your business today
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your business name" 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" 
                          {...field} 
                          disabled={loading} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Service Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Select a service category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Business Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="yourname@business.com" 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Min. 6 characters" 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Re-enter password" 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full py-6 text-lg font-medium transition-all hover:scale-[1.01]"
                >
                  {loading ? 'Creating your account...' : 'Create Provider Account'}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center space-y-2 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Looking to create a customer account?{' '}
              <Link href="/signup/user" className="font-medium text-primary hover:underline">
                Sign up as user
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderSignUpPage;