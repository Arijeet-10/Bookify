'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, ChevronLeft, Package, Clock, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceProvider {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  imageURL?: string;
}

interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  createdAt?: Timestamp;
}

const AdminProviderServicesPage = () => {
  const params = useParams();
  const providerId = params.providerId as string;
  const router = useRouter();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [providerData, setProviderData] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
          setIsAdmin(true);
          if (providerId) { // Ensure providerId is available before fetching
            fetchProviderAndServices();
          } else {
            setError("Provider ID is missing in the URL.");
            setLoading(false);
          }
        } else {
          setIsAdmin(false);
          setError("Access Denied. You are not authorized to view this page.");
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, providerId]); 

  const fetchProviderAndServices = async () => {
    if (!providerId) {
      setError("Provider ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch provider data
      const providerDocRef = doc(db, 'serviceProviders', providerId);
      const providerDocSnap = await getDoc(providerDocRef);
      if (providerDocSnap.exists()) {
        setProviderData({ id: providerDocSnap.id, ...providerDocSnap.data() } as ServiceProvider);
      } else {
        throw new Error("Service provider not found.");
      }

      // Fetch services
      const servicesCollectionRef = collection(db, 'serviceProviders', providerId, 'services');
      const q = query(servicesCollectionRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedServices: Service[] = [];
      querySnapshot.forEach((doc) => {
        fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
      });
      setServices(fetchedServices);

    } catch (err: any) {
      console.error('Error fetching provider/services:', err);
      setError(err.message || 'Failed to load provider details and services.');
    } finally {
      setLoading(false);
    }
  };
  
  const getPlaceholderImage = (categoryHint: string = 'business service') => {
    let hash = 0;
    if(categoryHint) {
      for (let i = 0; i < categoryHint.length; i++) {
        hash = categoryHint.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const width = 200 + (hash % 50);
    const height = 200 + (hash % 50);
    return `https://picsum.photos/${width}/${height}?random=${hash}`;
  }


  if (loading && !providerData) { // Show main loading skeleton only if providerData is not yet loaded
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 flex justify-center items-center pb-[80px]">
        <Card className="w-full max-w-3xl dark:bg-slate-900 shadow-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-1/4 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
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


  if (error && !providerData && !loading) { // Show error only if loading is complete and still no providerData
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 flex justify-center items-center pb-[80px]">
        <Card className="w-full max-w-lg dark:bg-slate-900 shadow-lg text-center p-8">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center">
              <AlertCircle className="h-7 w-7 mr-2" /> Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <Button onClick={() => router.push('/admin-dashboard')} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950 p-4 md:p-8 pb-[80px]">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => router.push('/admin-dashboard')} variant="outline" className="mb-6 dark:text-white dark:border-slate-700">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>

        {providerData ? (
          <Card className="w-full dark:bg-slate-900 shadow-2xl mb-8 border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-t-lg">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={providerData.imageURL || getPlaceholderImage(providerData.serviceCategory)} alt={providerData.businessName} data-ai-hint="logo business" />
                  <AvatarFallback>{providerData.businessName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">{providerData.businessName}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">{providerData.fullName} - {providerData.email}</CardDescription>
                  <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{providerData.serviceCategory}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Services Offered</h2>
              {loading && services.length === 0 && ( // Show skeleton for services only if provider data is loaded but services are still loading
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md bg-slate-200 dark:bg-slate-800" />)}
                </div>
              )}
              {!loading && error && services.length === 0 && ( // Show error for services if loading is complete
                <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" /> {error.includes("services") || error.includes("Service provider not found") ? error : "Failed to load services."}
                </div>
              )}
              {!loading && services.length === 0 && !error && (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                  <Package className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  No services listed for this provider.
                </div>
              )}
              {!loading && services.length > 0 && (
                <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-800/70">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Service Name</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center"> <IndianRupee className="mr-1 h-4 w-4" /> Price </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                           <div className="flex items-center"> <Clock className="mr-1 h-4 w-4" /> Duration </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id} className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <TableCell className="font-medium text-slate-800 dark:text-slate-200">{service.name}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">₹{service.price}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{service.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ): (
          !loading && <p className="text-center text-slate-500 dark:text-slate-400">Provider details could not be loaded.</p>
        )}
      </div>
    </div>
  );
};

export default AdminProviderServicesPage;
