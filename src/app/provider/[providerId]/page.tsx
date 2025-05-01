
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { serviceCategories } from '@/lib/constants';
import { Icons } from '@/components/icons';
import { PlusIcon, MinusIcon, Trash2 } from 'lucide-react'; // Added icons
import { Separator } from '@/components/ui/separator'; // Added Separator

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
  price: string; // Keep as string, parse when calculating
  duration: string;
  createdAt?: Timestamp;
  // Add other relevant fields
}

// Interface for items in the booking summary
interface BookingItem extends Service {
  quantity: number;
}

const ProviderServicePage = () => {
  const params = useParams();
  const providerId = params.providerId as string; // Get providerId from URL
  const router = useRouter(); // Initialize router

  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<BookingItem[]>([]); // State for selected services

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
           // Optionally redirect if provider not found
           // router.push('/search');
        }
      } catch (err) {
        console.error('Error fetching provider details:', err);
        setError('Failed to load provider details.');
      } finally {
        setLoadingProvider(false);
      }
    };

    fetchProviderDetails();
  }, [providerId, router]); // Add router to dependency array if used for redirect

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

    if (providerId) { // Fetch services only if providerId is valid
        fetchServices();
    }
  }, [providerId]); // Depend on providerId

  // Helper function to get category details
  const getCategory = (categoryId: string) => {
    return serviceCategories.find(cat => cat.id === categoryId);
  }

  // Placeholder image function
  const getPlaceholderImage = (categoryHint: string = 'business service') => {
    let hash = 0;
    for (let i = 0; i < categoryHint.length; i++) {
      hash = categoryHint.charCodeAt(i) + ((hash << 5) - hash);
    }
    const width = 200 + (hash % 50);
    const height = 200 + (hash % 50);
    return `https://picsum.photos/${width}/${height}?random=${hash}`;
  }

  // Function to add a service to the booking
  const handleAddToBooking = (service: Service) => {
    setSelectedServices(prev => {
      const existingItem = prev.find(item => item.id === service.id);
      if (existingItem) {
        // Optionally increase quantity if needed in future, for now, just add once
        // return prev.map(item => item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
        toast({
            title: "Already Added",
            description: `"${service.name}" is already in your booking summary.`,
            variant: "default", // Or 'destructive' if you prefer
        })
        return prev; // Or handle quantity increase
      } else {
        return [...prev, { ...service, quantity: 1 }];
      }
    });
    toast({
      title: "Service Added",
      description: `"${service.name}" added to booking.`,
    });
  };

  // Function to remove a service from the booking
  const handleRemoveFromBooking = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(item => item.id !== serviceId));
     toast({
      title: "Service Removed",
      description: `Service removed from booking.`,
       variant: "destructive",
    });
  };

  // Function to parse price string (e.g., "₹500" or "500") into a number
  const parsePrice = (priceStr: string): number => {
    const numericString = priceStr.replace(/[^0-9.]/g, ''); // Remove non-numeric characters except dot
    const price = parseFloat(numericString);
    return isNaN(price) ? 0 : price; // Return 0 if parsing fails
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [selectedServices]);

  const handleProceedToBook = () => {
      // Placeholder for actual booking submission logic
      toast({
          title: "Proceeding to Book (Placeholder)",
          description: `Total: ₹${totalPrice.toFixed(2)}. Ready to finalize?`,
      });
      // Example: Navigate to a checkout/confirmation page
      // router.push(`/checkout?providerId=${providerId}&services=${JSON.stringify(selectedServices)}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]"> {/* Increased pb */}
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
      ) : error && !providerData ? (
         <Card className="w-full max-w-4xl mx-auto dark:bg-card p-6 text-center">
           <CardTitle className="text-destructive">Error</CardTitle>
           <CardDescription className="text-destructive">{error}</CardDescription>
           <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
         </Card>
      ) : providerData ? (
        <Card className="w-full max-w-4xl mx-auto dark:bg-card mb-6">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
             <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border flex-shrink-0">
               <AvatarImage
                src={providerData.imageURL || getPlaceholderImage(providerData.serviceCategory)}
                alt={providerData.businessName}
                className="object-cover"
                data-ai-hint={`logo ${providerData.serviceCategory}`}
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
              {(providerData.rating || providerData.reviews) && (
                <div className="flex items-center mt-2">
                  <Icons.star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm ml-1">{providerData.rating || '?'} ({providerData.reviews || 'No reviews'})</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      ) : null}


       {/* Services List Section */}
       <Card className="w-full max-w-4xl mx-auto dark:bg-card mb-6">
           <CardHeader>
               <CardTitle className="text-2xl">Select Services</CardTitle>
               {error && providerData && <CardDescription className="text-destructive pt-2">{error}</CardDescription>}
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
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-9 w-9 rounded-md" />
                                </div>
                           </li>
                       ))}
                   </ul>
               ) : services.length === 0 && providerData ? ( // Show only if provider exists but has no services
                   <p className="text-center text-muted-foreground py-8">This provider has not listed any services yet.</p>
               ) : (
                   <ul className="space-y-4">
                       {services.map((service) => {
                           const isSelected = selectedServices.some(item => item.id === service.id);
                           const formattedPrice = service.price ? (service.price.startsWith('₹') ? service.price : `₹${service.price}`) : 'N/A';
                           return (
                               <li key={service.id} className="border p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center dark:border-muted hover:bg-muted/50 transition-colors">
                                   <div className="mb-3 sm:mb-0">
                                       <p className="font-semibold text-lg">{service.name}</p>
                                       <p className="text-sm text-muted-foreground">
                                            Duration: {service.duration || 'N/A'}
                                       </p>
                                   </div>
                                   <div className="flex items-center gap-4 self-end sm:self-center">
                                       <span className="font-semibold text-md">{formattedPrice}</span>
                                       <Button
                                         size="sm"
                                         variant="outline"
                                         onClick={() => handleAddToBooking(service)}
                                         disabled={isSelected} // Disable if already selected
                                         aria-label={`Add ${service.name} to booking`}
                                         className={isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            <span className="ml-1">Add</span>
                                        </Button>
                                   </div>
                               </li>
                           );
                        })}
                   </ul>
               )}
           </CardContent>
       </Card>

        {/* Booking Summary Card */}
        {selectedServices.length > 0 && (
            <Card className="w-full max-w-4xl mx-auto dark:bg-card mt-6 sticky bottom-[70px] z-10 shadow-lg border border-primary/20"> {/* Added sticky positioning */}
                <CardHeader>
                    <CardTitle className="text-xl">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedServices.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Price: ₹{parsePrice(item.price).toFixed(2)}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFromBooking(item.id)}
                                    aria-label={`Remove ${item.name} from booking`}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            {index < selectedServices.length - 1 && <Separator className="my-1" />}
                        </React.Fragment>
                    ))}
                    <Separator className="my-3 border-t-2 border-dashed" />
                     <div className="flex justify-between items-center font-bold text-lg mt-3">
                        <span>Total Price:</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button
                        onClick={handleProceedToBook}
                        disabled={totalPrice === 0}
                    >
                        Proceed to Book
                    </Button>
                </CardFooter>
            </Card>
        )}
    </div>
  );
};

export default ProviderServicePage;
