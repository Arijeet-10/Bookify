'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming firebase config is here
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Keep Avatar import if needed elsewhere, though removed from provider card
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast'; // Assuming this hook exists and works
import { serviceCategories } from '@/lib/constants'; // Assuming this constant exists
import { Icons } from '@/components/icons'; // Assuming this component exists for icons like star, alertCircle
import { Badge } from '@/components/ui/badge';
import { PlusIcon, MinusIcon, Trash2, Clock, MapPin, CalendarIcon, CheckCircle2, CalendarCheck, Phone, Image as ImageIconLucide } from 'lucide-react';

// Define structure for provider and service data
interface ServiceProviderData {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  address?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  // Optional fields often found in provider profiles
  operatingHours?: string; // Example: "Mon-Fri: 9 AM - 5 PM"
  openingTime?: string; // Example: "9:00 AM - 5:00 PM"
  closingTime?: string; // Example: "9:00 AM - 5:00 PM"
  rating?: string; // Example: "4.5"
  reviews?: string; // Example: "120" (number of reviews)
}

interface Service {
  id: string;
  name: string;
  price: string; // Store as string, parse when needed
  duration: string; // Example: "30 mins", "1 hr"
  createdAt?: Timestamp; // Optional Firestore timestamp
}

// Interface for items in the booking summary
interface BookingItem extends Service {
  quantity: number; // Keep quantity for potential future use, though currently always 1
}

const ProviderServicePage = () => {
  const params = useParams();
  const providerId = params.providerId as string; // Get providerId from URL
  const router = useRouter();

  // State variables
  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<BookingItem[]>([]);

  // Fetch provider details on component mount or when providerId changes
  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!providerId) {
        setError("Provider ID is missing.");
        setLoadingProvider(false);
        return;
      }
      setLoadingProvider(true);
      setError(null); // Reset error before fetching
      try {
        const providerDocRef = doc(db, 'serviceProviders', providerId);
        const providerDocSnap = await getDoc(providerDocRef);

        if (providerDocSnap.exists()) {
          // Combine ID and data into the state object
          setProviderData({ id: providerDocSnap.id, ...providerDocSnap.data() } as ServiceProviderData);
        } else {
          setError("Service provider not found.");
          setProviderData(null); // Ensure providerData is null if not found
        }
      } catch (err) {
        console.error('Error fetching provider details:', err);
        setError('Failed to load provider details. Please try again later.');
      } finally {
        setLoadingProvider(false);
      }
    };

    fetchProviderDetails();
  }, [providerId]); // Re-run effect if providerId changes

  // Fetch services for the provider when providerId is available
  useEffect(() => {
    const fetchServices = async () => {
      if (!providerId) return; // Don't fetch if providerId is missing

      setLoadingServices(true);
      // Keep existing error or reset if needed (depends on desired UX)
      // setError(null);
      try {
        // Reference to the 'services' subcollection for the specific provider
        const servicesCollectionRef = collection(db, 'serviceProviders', providerId, 'services');
        const q = query(servicesCollectionRef); // Add ordering or filtering here if needed
        const querySnapshot = await getDocs(q);

        const fetchedServices: Service[] = [];
        querySnapshot.forEach((doc) => {
          // Combine ID and data
          fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
        });

        // Sort services alphabetically by name
        fetchedServices.sort((a, b) => a.name.localeCompare(b.name));
        setServices(fetchedServices);

      } catch (err) {
        console.error('Error fetching services:', err);
        // Append to existing error or set a new one
        setError((prevError) => prevError ? `${prevError} Failed to load services.` : 'Failed to load services.');
      } finally {
        setLoadingServices(false);
      }
    };

    // Only fetch services if we have a valid provider ID
    if (providerId) {
        fetchServices();
    }
  }, [providerId]); // Re-run effect if providerId changes

  // Helper function to get category details from constants
  const getCategory = (categoryId: string) => {
    return serviceCategories.find(cat => cat.id === categoryId);
  }

  // Generates a placeholder image URL using picsum.photos based on a string hint
  const getPlaceholderImage = (categoryHint: string = 'business service') => {
    // Simple hash function to get somewhat consistent random images based on hint
    let hash = 0;
    if(categoryHint) {
       for (let i = 0; i < categoryHint.length; i++) {
        hash = categoryHint.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
      }
    }
    const width = 200 + (Math.abs(hash) % 51); // Width between 200 and 250
    const height = 200 + (Math.abs(hash >> 8) % 51); // Height between 200 and 250
    return `https://picsum.photos/seed/${encodeURIComponent(categoryHint)}/${width}/${height}`;
  }

  // Function to add a service to the booking summary
  const handleAddToBooking = (service: Service) => {
    setSelectedServices(prev => {
      const existingItem = prev.find(item => item.id === service.id);
      if (existingItem) {
        // Optionally, show a different toast or do nothing if already added
        toast({
            title: "Already Selected",
            description: `"${service.name}" is already in your booking summary.`,
            variant: "default", // Or maybe 'warning' if you have one
        });
        return prev; // Return previous state unchanged
      } else {
        // Add the new service with quantity 1
        toast({
          title: "Service Added",
          description: `"${service.name}" added to your booking summary.`,
        });
        return [...prev, { ...service, quantity: 1 }];
      }
    });
  };

  // Function to remove a service from the booking summary
  const handleRemoveFromBooking = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(item => item.id !== serviceId));
     toast({
      title: "Service Removed",
      description: `Service removed from booking summary.`,
       variant: "destructive", // Use destructive variant for removal feedback
    });
  };

  // Function to safely parse a price string (e.g., "₹500", "500", "$50.00") into a number
  const parsePrice = (priceStr: string | undefined | null): number => {
    if (!priceStr) return 0;
    // Remove currency symbols, commas, and keep only numbers and decimal point
    const numericString = String(priceStr).replace(/[^0-9.]/g, '');
    const price = parseFloat(numericString);
    // Return the parsed price or 0 if it's not a valid number
    return isNaN(price) ? 0 : price;
  };

  // Calculate total price using useMemo for efficiency
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((total, item) => {
      // Assumes quantity is always 1 for now
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [selectedServices]); // Recalculate only when selectedServices changes

  // Navigate to the booking page with selected services and total price
  const handleProceedToBook = () => {
      // Prepare data for query parameter: only include essential info
      const servicesToPass = selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price, // Pass original price string
          duration: s.duration // Pass original duration string
      }));
      // Encode the data as a JSON string for the query parameter
      const servicesQueryParam = encodeURIComponent(JSON.stringify(servicesToPass));
      // Navigate to the booking route
      router.push(`/booking/${providerId}?services=${servicesQueryParam}&total=${totalPrice.toFixed(2)}`);
  }

  // Calculate estimated total duration using useMemo
  const totalDuration = useMemo(() => {
    let totalMinutes = 0;
    selectedServices.forEach(service => {
      if (!service.duration) return; // Skip if duration is missing

      // Match numbers and units (hr, hour, min, mins)
      const durationParts = service.duration.toLowerCase().match(/(\d+)\s*(hr|hour|h|min|mins|m)?/g);

      if (durationParts) {
        durationParts.forEach(part => {
          const match = part.match(/(\d+)\s*(hr|hour|h|min|mins|m)?/);
          if (match && match[1]) {
            const value = parseInt(match[1], 10);
            const unit = match[2] || 'min'; // Default to minutes if no unit

            if (!isNaN(value)) {
              if (unit.startsWith('h')) {
                totalMinutes += value * 60; // Convert hours to minutes
              } else {
                totalMinutes += value; // Add minutes
              }
            }
          }
        });
      }
    });

    // Format the total minutes into hours and minutes
    if (totalMinutes === 0) {
        return 'N/A'; // Or '0 mins' if preferred
    } else if (totalMinutes < 60) {
      return `${totalMinutes} mins`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMins = totalMinutes % 60;
      return remainingMins > 0 ? `${hours} hr ${remainingMins} mins` : `${hours} hr`;
    }
  }, [selectedServices]); // Recalculate only when selectedServices changes

  // --- RENDER ---
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24">
      {/* Hero section with breadcrumb */}
      <div className="bg-gradient-to-b from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 py-6 mb-6 border-b border-slate-200 dark:border-slate-700/50">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => router.push('/search')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Search
                </button>
              </li>
              <li>
                <span className="mx-1">›</span>
              </li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-300" aria-current="page">
                  {loadingProvider ? 'Loading Provider...' : providerData?.businessName || 'Provider Details'}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Loading State Skeleton */}
        {loadingProvider ? (
          <Card className="w-full max-w-5xl mx-auto shadow-lg mb-8 border-slate-200 dark:border-slate-700/60">
            <Skeleton className="h-48 md:h-64 w-full" />
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
              <div className="space-y-2 mb-6">
                 <Skeleton className="h-5 w-full max-w-sm" />
                 <Skeleton className="h-5 w-full max-w-xs" />
              </div>
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 dark:border-slate-700 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        // Error State Display
        ) : error && !providerData ? ( // Show error only if provider data couldn't be loaded
          <Card className="w-full max-w-3xl mx-auto shadow-md text-center p-8 mb-8 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <Icons.alertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">Loading Error</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {error} {/* Display the specific error message */}
              </CardDescription>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                Go Back
              </Button>
            </div>
          </Card>
        // Provider Data Loaded Successfully
        ) : providerData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* --- Main Content Column (Provider Details + Services) --- */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg dark:bg-slate-800/50 overflow-hidden border border-slate-200 dark:border-slate-700/60">
                {/* Provider Header Image */}
                <CardHeader
                  className="h-48 md:h-64 bg-cover bg-center relative p-0" // Remove padding from header itself
                  style={{
                    backgroundImage: `url(${providerData.profileImageUrl || getPlaceholderImage(providerData.serviceCategory || providerData.businessName)})`,
                  }}
                  data-ai-hint={`${providerData.serviceCategory || ''} business`}
                >
                  {/* Dark overlay for better text contrast if needed over complex images */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </CardHeader>

                {/* Provider Details Section */}
                <div className="px-6 py-4">
                  {/* Basic Info: Name, Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{providerData.businessName}</h1>
                      <p className="text-slate-500 dark:text-slate-400">{providerData.fullName}</p>
                    </div>
                     {/* Rating Badge */}
                    {(providerData.rating || providerData.reviews) && (
                      <div className="mt-2 sm:mt-0 flex items-center bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-sm">
                        <Icons.star className="w-4 h-4 text-amber-500 fill-current mr-1.5" />
                        <span className="font-semibold text-amber-700 dark:text-amber-300">{providerData.rating || '?'}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">
                           ({providerData.reviews ? `${providerData.reviews} reviews` : 'No reviews'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact & Category Info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {providerData.address && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400 dark:text-slate-500" />
                        {providerData.address}
                      </div>
                    )}
                    {providerData.phoneNumber && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1.5 text-slate-400 dark:text-slate-500" />
                        {providerData.phoneNumber}
                      </div>
                    )}
                    {(providerData.openingTime || providerData.operatingHours) && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Clock className="w-4 h-4 mr-1.5 text-slate-400 dark:text-slate-500" />
                            {providerData.operatingHours ? providerData.operatingHours : 
                                (providerData.openingTime && providerData.closingTime ? `${providerData.openingTime} - ${providerData.closingTime}` : 
                                providerData.openingTime || 'N/A')
                            }
                        </div>
                    )}
                     {/* Category Badge */}
                    <Badge variant="outline" className="flex items-center gap-1.5 py-0.5 px-2 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       {getCategory(providerData.serviceCategory)?.name || providerData.serviceCategory}
                    </Badge>
                  </div>
                   {/* Display error related to services loading if it occurred */}
                  {error && error.includes('services') && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-800/50">
                      {error}
                    </div>
                  )}
                </div>

                {/* Services List Section */}
                <CardContent className="p-6 pt-4 border-t border-slate-200 dark:border-slate-700/60 services-section">
                  <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Available Services</h2>
                  {loadingServices ? (
                    // Service Loading Skeletons
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="border rounded-lg p-4 dark:border-slate-700 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : services.length === 0 ? (
                    // No Services Available Message
                    <div className="py-12 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                         {/* Use a relevant icon, e.g., service list or alert */}
                        <Icons.alertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">This provider hasn't listed any services yet.</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Please check back later.</p>
                    </div>
                  ) : (
                    // Services Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((service) => {
                        const isSelected = selectedServices.some(item => item.id === service.id);
                        // Ensure price is formatted consistently, handle missing price
                        const formattedPrice = service.price ? (String(service.price).startsWith('₹') ? service.price : `₹${parsePrice(service.price).toFixed(2)}`) : 'Price N/A';

                        return (
                          <div
                            key={service.id}
                            className={`border rounded-lg p-4 transition-all duration-200 ease-in-out ${
                              isSelected
                                ? 'border-blue-400 dark:border-blue-600 bg-blue-50/70 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                            }`}
                          >
                            {/* Service Name and Selected Badge */}
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-base md:text-lg text-slate-800 dark:text-slate-100 pr-2">
                                {service.name}
                              </h3>
                              {isSelected && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs px-1.5 py-0.5 shrink-0">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>

                            {/* Service Duration */}
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3">
                              <Clock className="w-4 h-4 mr-1.5" />
                              {service.duration || 'Duration not specified'}
                            </div>

                            {/* Price and Action Button */}
                            <div className="flex justify-between items-center mt-auto pt-2">
                              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formattedPrice}</span>
                              <Button
                                size="sm"
                                variant={isSelected ? "outline" : "default"}
                                onClick={() => isSelected ? handleRemoveFromBooking(service.id) : handleAddToBooking(service)}
                                className={`transition-colors ${isSelected
                                    ? "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                    : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" // Ensure dark mode button styles are good
                                  }`}
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
                <CardFooter className="p-6 border-t border-slate-200 dark:border-slate-700/60">
                   <Button 
                    variant="outline" 
                    onClick={() => router.push(`/provider/${providerId}/gallery`)}
                    disabled={loadingProvider || !providerData}
                    className="w-full"
                  >
                    <ImageIconLucide className="mr-2 h-4 w-4" />
                    Show Service Images
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* --- Booking Summary Column (Sticky Sidebar) --- */}
            <div className="lg:col-span-1">
              <div className="sticky top-6"> {/* Adjust top value as needed */}
                {selectedServices.length > 0 ? (
                  // Summary Card when services are selected
                  <Card className="shadow-lg dark:bg-slate-800/50 overflow-hidden border border-slate-200 dark:border-slate-700/60">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700/60 pb-4 pt-4">
                      <div className="flex items-center">
                        <CalendarCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Booking Summary</CardTitle>
                      </div>
                      <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                      {/* Scrollable list of selected services */}
                      <div className="max-h-72 overflow-y-auto custom-scrollbar"> {/* Increased max height */}
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                          {selectedServices.map((item) => (
                            <li key={item.id} className="p-4 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => handleRemoveFromBooking(item.id)}
                                aria-label={`Remove ${item.name} from booking`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              {/* Service Details */}
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate" title={item.name}>{item.name}</p>
                                <div className="flex items-center mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.duration || 'N/A'}
                                </div>
                              </div>

                              {/* Price */}
                              <span className="ml-auto text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {/* Format price nicely */}
                                {item.price ? `₹${parsePrice(item.price).toFixed(2)}` : 'N/A'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Totals Section */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/70 p-4 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Est. Duration:</span>
                          <div className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 mr-1.5 text-blue-500 dark:text-blue-400" />
                            {totalDuration}
                          </div>
                        </div>

                        <div className="flex justify-between items-center font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">Total Price:</span>
                          <span className="text-xl text-blue-700 dark:text-blue-300">₹{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 bg-slate-50/80 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700/60">
                      <Button
                        onClick={handleProceedToBook}
                        disabled={totalPrice === 0 || loadingProvider || loadingServices} // Disable if no price or still loading
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60"
                        size="lg"
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        Proceed to Booking
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  // Placeholder when no services are selected (and not loading)
                  !loadingProvider && !loadingServices && providerData && (
                    <Card className="shadow-md dark:bg-slate-800/50 text-center p-6 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/50">
                          <CalendarIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg mb-2 font-semibold text-slate-800 dark:text-slate-200">Start Your Booking</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                          Select one or more services from the list to add them to your booking summary.
                        </CardDescription>
                        <div className="w-full max-w-xs mx-auto mt-2">
                           {/* Button to scroll to services section */}
                          <Button
                            variant="outline"
                            className="w-full border-dashed border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => {
                              // Find the services section and scroll to it smoothly
                              document.querySelector('.services-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              </div> {/* End Sticky Wrapper */}
            </div> {/* End Sidebar Column */}
          </div> // End Grid
        ) : null /* Render nothing if loading finished but providerData is still null (e.g., initial state before fetch) */}
      </div> {/* End Container */}
    </div> // End Page Wrapper
  );
};

export default ProviderServicePage;
