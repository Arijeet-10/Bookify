
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Eye, Trash2, Flag, ChevronLeft, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

interface ServiceProvider {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
}

const AdminAllProvidersPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [providerSearchTerm, setProviderSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
                    setIsAdmin(true);
                    fetchServiceProviders();
                } else {
                    setIsAdmin(false);
                    setError("Access Denied. You are not authorized to view this page.");
                    setLoadingProviders(false);
                }
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchServiceProviders = async () => {
        setLoadingProviders(true);
        setError(null);
        try {
            const providersCollectionRef = collection(db, 'serviceProviders');
            const q = query(providersCollectionRef, orderBy('businessName', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedProviders: ServiceProvider[] = [];
            querySnapshot.forEach((doc) => {
                fetchedProviders.push({ id: doc.id, ...doc.data() } as ServiceProvider);
            });
            setServiceProviders(fetchedProviders);
        } catch (err) {
            console.error("Error fetching service providers:", err);
            setError("Failed to load service providers.");
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleRemoveProvider = async (providerId: string, providerName: string) => {
      try {
        await deleteDoc(doc(db, 'serviceProviders', providerId));
        const userDocRef = doc(db, 'users', providerId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'serviceProvider') {
            await deleteDoc(userDocRef);
        }
        setServiceProviders(prev => prev.filter(p => p.id !== providerId));
        toast({
          title: "Provider Removed",
          description: `${providerName} has been removed successfully.`,
        });
      } catch (error) {
        console.error("Error removing provider:", error);
        toast({
          title: "Error",
          description: `Failed to remove ${providerName}. Please try again.`,
          variant: "destructive",
        });
      }
    };

    const handleReportProvider = (providerId: string, providerName: string) => {
      // Placeholder for reporting functionality
      console.log(`Reporting provider: ${providerName} (ID: ${providerId})`);
      toast({
        title: "Provider Reported",
        description: `${providerName} has been reported. This is a placeholder action.`,
      });
    };

    const filteredProviders = serviceProviders.filter(provider =>
        provider.businessName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.fullName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(providerSearchTerm.toLowerCase())
    );
    
    if (!user || (!isAdmin && !loadingProviders)) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]">
                <Card className="w-full max-w-md dark:bg-card text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6">{error || "You are not authorized to view this page."}</p>
                        <Button onClick={() => router.push('/login')}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 pb-[80px]">
            <div className="max-w-7xl mx-auto">
                <Button 
                    onClick={() => router.push('/admin-dashboard')} 
                    variant="outline" 
                    className="mb-6 dark:text-white dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Main Dashboard
                </Button>

                <Card className="w-full dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-t-lg">
                        <div className="flex items-center">
                            <Users className="h-7 w-7 mr-3 text-primary" />
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">Manage Service Providers</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">View, search, and manage all registered service providers.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center">
                               <AlertCircle className="h-5 w-5 mr-2" /> {error}
                            </div>
                        )}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <Input
                                    type="search"
                                    placeholder="Search providers by name, email, or category..."
                                    className="pl-10 w-full md:w-1/2 dark:bg-slate-800 dark:border-slate-700"
                                    value={providerSearchTerm}
                                    onChange={(e) => setProviderSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {loadingProviders ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
                            </div>
                        ) : (
                            <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                <Table>
                                    <TableHeader className="bg-slate-100 dark:bg-slate-800/70">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Business Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Email</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Category</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProviders.map((provider) => (
                                            <TableRow 
                                                key={provider.id} 
                                                className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                                            >
                                                <TableCell 
                                                    className="font-medium text-slate-800 dark:text-slate-200 flex items-center cursor-pointer"
                                                    onClick={() => router.push(`/admin-dashboard/provider-services/${provider.id}`)}
                                                >
                                                    {provider.businessName}
                                                    <Eye className="ml-2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                </TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-300">{provider.fullName}</TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-300">{provider.email}</TableCell>
                                                <TableCell><Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{provider.serviceCategory}</Badge></TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-300">{provider.phoneNumber || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently remove the service provider "{provider.businessName}" and their data.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveProvider(provider.id, provider.businessName)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, remove provider
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300" onClick={() => handleReportProvider(provider.id, provider.businessName)}>
                                                        <Flag className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredProviders.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-10">
                                                    No service providers found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAllProvidersPage;
