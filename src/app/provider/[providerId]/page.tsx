
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { serviceCategories } from '@/lib/constants';
import { Icons } from '@/components/icons';

// Define structure for provider and service data
interface ServiceProviderData {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  imageURL?: string;
  rating?: string;
  reviews?: string;
  // Add other relevant fields
}

interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  createdAt?: Timestamp;
  // Add other relevant fields
}

const ProviderServicePage = () => {
  const params = useParams();
  const providerId = params.providerId as string; // Get providerId from URL

  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch provider details
  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!providerId) {
        setError("Provider ID is missing.");
        setLoadingProvider(false);
        return;
      }
      setLoadingProvider(true);
      setError(null);
      try {
        const providerDocRef = doc(db, 'serviceProviders', providerId);
        const providerDocSnap = await getDoc(providerDocRef);

        if (providerDocSnap.exists()) {
          setProviderData({ id: providerDocSnap.id, ...providerDocSnap.data() } as ServiceProviderData);
        } else {
          setError("Service provider not found.");
        }
      } catch (err) {
        console.error('Error fetching provider details:', err);
        setError('Failed to load provider details.');
      } finally {
        setLoadingProvider(false);
      }
    };

    fetchProviderDetails();
  }, [providerId]);

  // Fetch services for the provider
  useEffect(() => {
    const fetchServices = async () => {
      if (!providerId) return; // Don't fetch if providerId is missing
      setLoadingServices(true);
      setError(null); // Reset error specific to services
      try {
        const servicesCollectionRef = collection(db, 'serviceProviders', providerId, 'services');
        const q = query(servicesCollectionRef); // Add ordering if needed
        const querySnapshot = await getDocs(q);
        const fetchedServices: Service[] = [];
        querySnapshot.forEach((doc) => {
          fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
        });
        fetchedServices.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
        setServices(fetchedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services.'); // Set error specific to services
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [providerId]); // Depend on providerId

  // Helper function to get category details
  const getCategory = (categoryId: string) => {
    return serviceCategories.find(cat => cat.id === categoryId);
  }

  // Placeholder image function (same as search page)
  const getPlaceholderImage = (categoryHint: string = 'business service') => {
    let hash = 0;
    for (let i = 0; i < categoryHint.length; i++) {
      hash = categoryHint.charCodeAt(i) + ((hash << 5) - hash);
    }
    const width = 200 + (hash % 50);
    const height = 200 + (hash % 50);
    return `https://picsum.photos/${width}/${height}?random=${hash}`;
  }

  const handleBookNow = (service: Service) => {
    // Placeholder for booking logic
    toast({
        title: "Booking Initiated (Placeholder)",
        description: `Ready to book "${service.name}" with ${providerData?.businessName}?`,
        // Add action button or link to actual booking flow later
    });
    // Example: router.push(`/book?providerId=${providerId}&serviceId=${service.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      {loadingProvider ? (
        <Card className="w-full max-w-4xl mx-auto dark:bg-card p-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
      ) : error && !providerData ? ( // Only show main error if provider data failed completely
         <Card className="w-full max-w-4xl mx-auto dark:bg-card p-6 text-center">
           <CardTitle className="text-destructive">Error</CardTitle>
           <CardDescription className="text-destructive">{error}</CardDescription>
         </Card>
      ) : providerData ? (
        <Card className="w-full max-w-4xl mx-auto dark:bg-card mb-6">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border">
              <AvatarImage
                src={providerData.imageURL || getPlaceholderImage(providerData.serviceCategory)}
                alt={providerData.businessName}
                className="object-cover"
              />
              <AvatarFallback className="text-3xl">
                {providerData.businessName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold">{providerData.businessName}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">{providerData.fullName}</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">{providerData.address || 'Address not provided'}</p>
              <p className="text-sm text-muted-foreground">Category: {getCategory(providerData.serviceCategory)?.name || providerData.serviceCategory}</p>
              {/* Placeholder for rating */}
              {(providerData.rating || providerData.reviews) && (
                <div className="flex items-center mt-2">
                  <Icons.star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm ml-1">{providerData.rating || '?'} ({providerData.reviews || 'No reviews'})</span>
                </div>
              )}
            </div>
          </CardHeader>
          {/* Optional: Add more content like description, gallery etc. */}
        </Card>
      ) : null} {/* Don't render provider card if not found */}


      {/* Services List Section */}
       <Card className="w-full max-w-4xl mx-auto dark:bg-card">
           <CardHeader>
               <CardTitle className="text-2xl">Services Offered</CardTitle>
               {error && providerData && <CardDescription className="text-destructive pt-2">{error}</CardDescription>} {/* Show service-specific error here */}
           </CardHeader>
           <CardContent>
               {loadingServices ? (
                   <ul className="space-y-4">
                       {[...Array(3)].map((_, index) => (
                           <li key={index} className="border p-4 rounded-md flex justify-between items-center dark:border-gray-700">
                               <div>
                                   <Skeleton className="h-5 w-32 mb-2" />
                                   <Skeleton className="h-4 w-48" />
                               </div>
                               <Skeleton className="h-9 w-24 rounded-md" />
                           </li>
                       ))}
                   </ul>
               ) : services.length === 0 ? (
                   <p className="text-center text-muted-foreground py-8">This provider has not listed any services yet.</p>
               ) : (
                   <ul className="space-y-4">
                       {services.map((service) => (
                           <li key={service.id} className="border p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center dark:border-muted hover:bg-muted/50 transition-colors">
                               <div className="mb-3 sm:mb-0">
                                   <p className="font-semibold text-lg">{service.name}</p>
                                   <p className="text-sm text-muted-foreground">
                                       Price: {service.price ? (service.price.startsWith('₹') ? service.price : `₹${service.price}`) : 'N/A'} | Duration: {service.duration || 'N/A'}
                                   </p>
                               </div>
                               <Button
                                 size="sm"
                                 className="self-end sm:self-center"
                                 onClick={() => handleBookNow(service)}
                                >
                                    Book Now
                                </Button>
                           </li>
                       ))}
                   </ul>
               )}
           </CardContent>
       </Card>
    </div>
  );
};

export default ProviderServicePage;
