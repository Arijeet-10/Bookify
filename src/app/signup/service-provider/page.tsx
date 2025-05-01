
'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth'; // Added updateProfile
import {auth, db} from '@/lib/firebase';
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {setDoc, doc} from 'firebase/firestore';
import Link from 'next/link';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import { serviceCategories } from '@/lib/constants'; // Import service categories

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
  path: ['confirmPassword'], // Set the error path to confirmPassword field
});

type SignUpFormValues = z.infer<typeof signUpSchema>;


const ServiceProviderSignUpPage = () => {
  const [error, setError] = useState<string | null>(null);
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

       // Update Firebase Auth profile display name
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.fullName });
        }

      // 1. Store basic user info with role in 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        role: 'serviceProvider',
        email: data.email,
        fullName: data.fullName,
      });

      // 2. Store detailed provider info in 'serviceProviders' collection
      await setDoc(doc(db, "serviceProviders", user.uid), {
        userId: user.uid, // Link back to the user ID in the 'users' collection
        email: data.email,
        fullName: data.fullName,
        businessName: data.businessName,
        serviceCategory: data.serviceCategory,
        // Add other provider-specific fields here later (e.g., address, phone)
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]"> {/* Added padding-bottom */}
      <Card className="w-full max-w-md dark:bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Service Provider Signup</CardTitle>
          <CardDescription>Create an account to list your services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} disabled={loading}/>
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
                    <FormLabel>Shop Name / Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your business name" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your business email" {...field} disabled={loading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password (min. 6 characters)" {...field} disabled={loading}/>
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} disabled={loading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <Button disabled={loading} type="submit" className="w-full mt-4">
                {loading ? 'Creating account...' : 'Sign Up as Service Provider'}
              </Button>
            </form>
          </Form>
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
