'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { serviceCategories } from '@/lib/constants';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, MinusIcon, Trash2, Clock, MapPin, CalendarIcon, CheckCircle2, CalendarCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Define structure for provider and service data
interface ServiceProviderData {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  profileImageUrl?: string;
  rating?: string;
  reviews?: string;
}

interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  createdAt?: Timestamp;
}

// Interface for items in the booking summary
interface BookingItem extends Service {
  quantity: number;
}

const ProviderServicePage = () => {
  const params = useParams();
  const providerId = params.providerId as string;
  const router = useRouter();

  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<BookingItem[]>([]);

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
      if (!providerId) return;
      setLoadingServices(true);
      setError(null);
      try {
        const servicesCollectionRef = collection(db, 'serviceProviders', providerId, 'services');
        const q = query(servicesCollectionRef);
        const querySnapshot = await getDocs(q);
        const fetchedServices: Service[] = [];
        querySnapshot.forEach((doc) => {
          fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
        });
        fetchedServices.sort((a, b) => a.name.localeCompare(b.name));
        setServices(fetchedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services.');
      } finally {
        setLoadingServices(false);
      }
    };

    if (providerId) {
        fetchServices();
    }
  }, [providerId]);

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
        toast({
            title: "Already Selected",
            description: `"${service.name}" is already in your booking.`,
            variant: "default",
        })
        return prev;
      } else {
        return [...prev, { ...service, quantity: 1 }];
      }
    });
    toast({
      title: "Service Added",
      description: `"${service.name}" added to your booking.`,
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

  // Function to parse price string
  const parsePrice = (priceStr: string): number => {
    const numericString = priceStr.replace(/[^0-9.]/g, '');
    const price = parseFloat(numericString);
    return isNaN(price) ? 0 : price;
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [selectedServices]);

  const handleProceedToBook = () => {
      const servicesQueryParam = encodeURIComponent(JSON.stringify(selectedServices.map(s => ({id: s.id, name: s.name, price: s.price, duration: s.duration}))));
      router.push(`/booking/${providerId}?services=${servicesQueryParam}&total=${totalPrice.toFixed(2)}`);
  }

  // Calculate estimated total time
  const totalDuration = useMemo(() => {
    let minutes = 0;
    selectedServices.forEach(service => {
      // Extract numeric part of duration (assuming format like "30 mins" or "1 hr")
      const durationMatch = service.duration.match(/(\d+)/);
      if (durationMatch && durationMatch[1]) {
        const value = parseInt(durationMatch[1], 10);
        if (!isNaN(value)) {
          // If duration contains "hr" or "hour", convert to minutes
          if (service.duration.includes('hr') || service.duration.includes('hour')) {
            minutes += value * 60;
          } else {
            minutes += value;
          }
        }
      }
    });
    
    // Format as hours and minutes
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours} hr ${remainingMins} mins` : `${hours} hr`;
    }
  }, [selectedServices]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24">
      {/* Hero section with breadcrumb */}
      <div className="bg-gradient-to-b from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 py-6 mb-6">
        <div className="container mx-auto px-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            <button onClick={() => router.push('/search')} className="hover:text-blue-600 dark:hover:text-blue-400">
              Search
            </button>
            <span className="mx-2">›</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {loadingProvider ? 'Loading...' : providerData?.businessName || 'Provider'}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {loadingProvider ? (
          <Card className="w-full max-w-5xl mx-auto shadow-md mb-8">
            {/* Provider Header Skeleton */}
            <div className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
              <Separator className="my-6"/>
              {/* Services List Skeleton */}
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 dark:border-slate-700">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <div className="flex justify-between items-center mt-4">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : error && !providerData ? (
          <Card className="w-full max-w-5xl mx-auto shadow-md text-center p-8 mb-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <Icons.alertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-600 dark:text-red-400">Error</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {error}
              </CardDescription>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                Go Back
              </Button>
            </div>
          </Card>
        ) : providerData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Provider Profile Card */}
 <Card className="shadow-md dark:bg-slate-800/50 overflow-hidden">
 <CardHeader
 className="h-48 md:h-64 bg-cover bg-center relative"
 style={{
 backgroundImage: `url(${providerData.profileImageUrl || getPlaceholderImage(providerData.serviceCategory)})`,
 }}
 >
 <div className="absolute inset-0 bg-black/30"></div> {/* Overlay for text readability */}
 </CardHeader>
                <div className="px-6 pb-6 pt-12 relative">
 {/* Position the avatar if you still want it, otherwise remove */}
 {/* <AvatarImage
                      alt={providerData.fullName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      {providerData.businessName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
 */}
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{providerData.businessName}</h1>
                      <p className="text-slate-500 dark:text-slate-400">{providerData.fullName}</p>
                    </div>
                    
                    {(providerData.rating || providerData.reviews) && (
                      <div className="mt-2 md:mt-0 flex items-center bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                        <Icons.star className="w-5 h-5 text-amber-500 fill-current mr-1" />
                        <span className="font-medium text-amber-700 dark:text-amber-400">{providerData.rating || '?'}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">({providerData.reviews || 'No reviews'})</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-3">
                    {providerData.address && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                        {providerData.address}
                      </div>
                    )}
                    
                    <Badge variant="outline" className="flex items-center gap-1 text-sm font-normal">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {getCategory(providerData.serviceCategory)?.name || providerData.serviceCategory}
                    </Badge>
                  </div>
                </div>
              </Card>
              
              {/* Services Section */}
              <Card className="shadow-md dark:bg-slate-800/50">
                <CardHeader className="border-b dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Available Services</CardTitle>
                    <Badge variant="secondary" className="font-normal">
                      {services.length} {services.length === 1 ? 'service' : 'services'}
                    </Badge>
                  </div>
                  {error && providerData && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
                      {error}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-6">
                  {loadingServices ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="border rounded-lg p-4 dark:border-slate-700">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : services.length === 0 && providerData ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                        <Icons.alertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">This provider has not listed any services yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((service) => {
                        const isSelected = selectedServices.some(item => item.id === service.id);
                        const formattedPrice = service.price ? (service.price.startsWith('₹') ? service.price : `₹${service.price}`) : 'N/A';
                        
                        return (
                          <div 
                            key={service.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected 
                                ? 'border-blue-300 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-medium text-lg text-slate-800 dark:text-slate-100">
                                {service.name}
                              </h3>
                              {isSelected && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                              <Clock className="w-4 h-4 mr-1" />
                              {service.duration || 'Duration not specified'}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formattedPrice}</span>
                              <Button
                                size="sm"
                                variant={isSelected ? "secondary" : "default"}
                                onClick={() => isSelected ? handleRemoveFromBooking(service.id) : handleAddToBooking(service)}
                                className={isSelected ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50" : ""}
                              >
                                {isSelected ? (
                                  <>
                                    <MinusIcon className="h-4 w-4 mr-1" />
                                    Remove
                                  </>
                                ) : (
                                  <>
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Select
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Booking Summary Column - Sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {selectedServices.length > 0 ? (
                  <Card className="shadow-md dark:bg-slate-800/50 overflow-hidden">
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b dark:border-slate-700 pb-4">
                      <div className="flex items-center">
                        <CalendarCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-lg text-blue-700 dark:text-blue-300">Booking Summary</CardTitle>
                      </div>
                      <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                        {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className="max-h-64 overflow-y-auto">
                        <ul className="divide-y dark:divide-slate-700">
                          {selectedServices.map((item) => (
                            <li key={item.id} className="p-4 flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-red-500 dark:hover:text-red-400 mr-2 flex-shrink-0"
                                onClick={() => handleRemoveFromBooking(item.id)}
                                aria-label={`Remove ${item.name} from booking`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                <div className="flex items-center mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  {item.duration}
                                </div>
                              </div>
                              
                              <span className="ml-2 text-right font-medium text-slate-700 dark:text-slate-300">
                                ₹{parsePrice(item.price).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/70 p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Estimated Duration:</span>
                          <div className="flex items-center text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 mr-1 text-blue-500" />
                            {totalDuration}
                          </div>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-slate-800 dark:text-slate-200">Total Amount:</span>
                          <span className="text-xl text-blue-700 dark:text-blue-300">₹{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t dark:border-slate-700">
                      <Button
                        onClick={handleProceedToBook}
                        disabled={totalPrice === 0 || loadingProvider || loadingServices}
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        Proceed to Booking
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  !loadingProvider && !loadingServices && providerData && (
                    <Card className="shadow-md dark:bg-slate-800/50 text-center p-6">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                          <CalendarIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg mb-2">Start Your Booking</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 mb-4">
                          Select services from the list to add them to your booking
                        </CardDescription>
                        <div className="w-full max-w-xs mx-auto mt-2">
                          <Button 
                            variant="outline" 
                            className="w-full border-dashed border-2"
                            onClick={() => {
                              document.querySelector('.services-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Select Services
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProviderServicePage;