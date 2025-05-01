'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { serviceCategories } from '@/lib/constants'; // Keep service categories import
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define the structure of a Service Provider from Firestore
interface ServiceProvider {
  id: string;
  businessName: string;
  serviceCategory: string; // Matches the ID in serviceCategories
  email: string;
  fullName: string;
  // Add other fields like address, rating, imageURL etc. as they are added to Firestore
  address?: string; // Make optional for now
  rating?: string; // Make optional
  imageURL?: string; // Use a consistent field name (e.g., imageURL or profileImageURL)
  reviews?: string; // Make optional
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [whereQuery, setWhereQuery] = useState('');
  const [whenDate, setWhenDate] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [sortBy, setSortBy] = useState('Relevance'); // Default sort
  const [filters, setFilters] = useState<string[]>([]); // Store selected category IDs

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all service providers from Firestore on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const providersCollectionRef = collection(db, 'serviceProviders');
        const q = query(providersCollectionRef); // Basic query, can be extended later
        const querySnapshot = await getDocs(q);
        const fetchedProviders: ServiceProvider[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProviders.push({ id: doc.id, ...doc.data() } as ServiceProvider);
        });
        setProviders(fetchedProviders);
      } catch (err) {
        console.error('Error fetching service providers:', err);
        setError('Failed to load service providers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Filter providers based on search query and selected categories
  const filteredProviders = useMemo(() => {
    let tempProviders = providers;

    // Filter by search query (businessName, fullName, serviceCategory name)
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        tempProviders = tempProviders.filter(provider => {
             const category = serviceCategories.find(cat => cat.id === provider.serviceCategory);
             return (
                provider.businessName.toLowerCase().includes(lowerCaseQuery) ||
                provider.fullName.toLowerCase().includes(lowerCaseQuery) ||
                (category && category.name.toLowerCase().includes(lowerCaseQuery))
             );
        });
    }

    // Filter by selected categories
    if (filters.length > 0) {
      tempProviders = tempProviders.filter(provider => filters.includes(provider.serviceCategory));
    }

    // Add sorting logic if needed based on `sortBy` state
    // For now, just return the filtered list

    return tempProviders;
  }, [providers, filters, searchQuery]); // Add searchQuery dependency


  // Handle filter button clicks
  const handleFilterChange = (filterId: string) => {
    setFilters(prevFilters =>
      prevFilters.includes(filterId) ? prevFilters.filter(f => f !== filterId) : [...prevFilters, filterId]
    );
  };

  // Handle sort button clicks
  const handleSortByChange = (sortOption: string) => {
    setSortBy(sortOption);
    // Add sorting logic here if needed based on the selected option
    // e.g., sort filteredProviders array
  };

  // Placeholder image function
  const getPlaceholderImage = (categoryHint: string = 'business service') => {
    // Simple hash function to get somewhat consistent image based on hint
    let hash = 0;
    for (let i = 0; i < categoryHint.length; i++) {
      hash = categoryHint.charCodeAt(i) + ((hash << 5) - hash);
    }
    const width = 200 + (hash % 50); // Vary width slightly
    const height = 200 + (hash % 50); // Vary height slightly
    return `https://picsum.photos/${width}/${height}?random=${hash}`; // Add hash for variability
  }


  return (
    <div className="min-h-screen bg-gray-100 text-gray-700 dark:bg-background dark:text-gray-300 pb-[60px]"> {/* Added padding-bottom */}
      {/* Header */}
      <header className="p-4 flex justify-center bg-[#152226]">
        <div className="max-w-4xl w-full flex flex-col gap-4">
          <div className="flex justify-center mb-6 text-white font-bold text-xl">Bookify</div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search services or businesses"
                className="rounded-full bg-white text-gray-700 pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Icons.search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>

            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Where?"
                className="rounded-full bg-white text-gray-700 pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                value={whereQuery}
                onChange={e => setWhereQuery(e.target.value)}
              />
              <Icons.mapPin // Changed from Icons.map
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                   className={cn(
                     'w-full md:w-[280px] justify-start text-left font-normal bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100',
                     !whenDate && 'text-muted-foreground'
                   )}
                >
                  <Icons.calendar className="mr-2 h-4 w-4" />
                  {whenDate ? (
                    format(whenDate, 'LLL dd, y')
                  ) : (
                    <span className="text-muted-foreground">When?</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={whenDate}
                  onSelect={setWhenDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Filters and Sort By */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Filters by Category</h3>
          <div className="flex gap-2 flex-wrap">
            {/* Use serviceCategories from constants */}
            {serviceCategories.map(category => (
              <Button
                key={category.id}
                variant={filters.includes(category.id) ? 'default' : 'outline'}
                onClick={() => handleFilterChange(category.id)}
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Sort By</h3>
          <div className="flex gap-2 flex-wrap">
            {['Relevance', 'Rating', 'Distance'].map(sortOption => (
              <Button
                key={sortOption}
                variant={sortBy === sortOption ? 'default' : 'outline'}
                onClick={() => handleSortByChange(sortOption)}
                size="sm"
              >
                {sortOption}
              </Button>
            ))}
          </div>
        </section>

        {/* Special Offers Section Removed */}
        {/*
        <section className="mb-8">
           <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
             Special Offers
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialOffers.map(offer => (
              <Card key={offer.id} className="p-4 dark:bg-card" data-ai-hint={offer['data-ai-hint']}>
                 <div className="flex items-center gap-4">
                   <img
                     src={offer.imageUrl}
                     alt={offer.providerName}
                     className="w-20 h-20 rounded-lg object-cover"
                     width={80}
                     height={80}
                   />
                   <div>
                     <CardTitle className="text-lg font-semibold">{offer.providerName}</CardTitle>
                     <CardContent className="pt-2 px-0 pb-0"> {/* Remove default padding * / }
                       <p className="text-sm text-gray-500 dark:text-gray-400">{offer.address}</p>
                       <div className="flex items-center mt-1">
                         <Icons.star className="w-4 h-4 text-yellow-500 fill-current" />
                         <span className="text-sm ml-1">{offer.rating} ({offer.reviews})</span>
                       </div>
                       <div className="flex items-center mt-2">
                         <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full flex items-center font-medium dark:bg-teal-900 dark:text-teal-200">
                            <Icons.thumbsup className="w-4 h-4 mr-1" />
                            {offer.discount}
                         </span>
                       </div>
                     </CardContent>
                   </div>
                 </div>
               </Card>
            ))}
          </div>
         </section>
        */}

        {/* Results - Fetched and Filtered Providers */}
        <section className="mb-8">
           <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
             Results
           </h2>
           {loading ? (
            // Loading Skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                  <Card key={index} className="p-4 dark:bg-card">
                      <div className="flex items-center gap-4">
                          <Skeleton className="w-20 h-20 rounded-lg" />
                          <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-1/2" />
                          </div>
                      </div>
                  </Card>
              ))}
            </div>
           ) : error ? (
            // Error Message
             <p className="text-center text-destructive">{error}</p>
           ) : filteredProviders.length === 0 ? (
            // No Results Message
            <p className="text-center text-muted-foreground py-8">No service providers found matching your criteria.</p>
           ) : (
            // Display Filtered Providers
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredProviders.map(provider => {
                 const category = serviceCategories.find(cat => cat.id === provider.serviceCategory);
                 const aiHint = category ? `${category['data-ai-hint'] || category.name}` : 'business service';
                 const imageSrc = provider.imageURL || getPlaceholderImage(aiHint); // Use provider image or generate placeholder

                 return (
                   <Card key={provider.id} className="p-4 dark:bg-card" data-ai-hint={aiHint}>
                     <div className="flex items-center gap-4">
                       <img
                         src={imageSrc}
                         alt={provider.businessName}
                         className="w-20 h-20 rounded-lg object-cover"
                         width={80}
                         height={80}
                         // Add error handling for images if needed: onError={(e) => e.currentTarget.src = '/placeholder.png'}
                       />
                       <div>
                         <CardTitle className="text-lg font-semibold">{provider.businessName}</CardTitle>
                         <CardContent className="pt-2 px-0 pb-0"> {/* Remove default padding */}
                           <p className="text-sm text-muted-foreground">{provider.fullName}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400">{provider.address || 'Address not available'}</p>
                           {/* Display category name */}
                           <p className="text-sm text-gray-500 dark:text-gray-400">Category: {category?.name || provider.serviceCategory}</p>
                           {/* Placeholder for rating */}
                           {(provider.rating || provider.reviews) && (
                            <div className="flex items-center mt-1">
                                <Icons.star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm ml-1">{provider.rating || '?'} ({provider.reviews || 'No reviews'})</span>
                             </div>
                           )}
                           {/* Add Book button or link here eventually */}
                         </CardContent>
                       </div>
                     </div>
                   </Card>
                 );
                })}
             </div>
           )}
         </section>


        {/* Map Placeholder */}
        <section className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg mb-10">
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">Map Placeholder</div>
        </section>
      </main>
    </div>
  );
};

export default SearchPage;
