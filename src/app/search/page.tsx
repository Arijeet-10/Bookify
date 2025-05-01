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
import { serviceCategories } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the structure of a Service Provider from Firestore
interface ServiceProvider {
  id: string;
  businessName: string;
  serviceCategory: string;
  email: string;
  fullName: string;
  address?: string;
  rating?: string;
  imageURL?: string;
  reviews?: string;
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [whereQuery, setWhereQuery] = useState('');
  const [whenDate, setWhenDate] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [sortBy, setSortBy] = useState('Relevance');
  const [filters, setFilters] = useState<string[]>([]);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all service providers from Firestore on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const providersCollectionRef = collection(db, 'serviceProviders');
        const q = query(providersCollectionRef);
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

    // Filter by search query
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

    return tempProviders;
  }, [providers, filters, searchQuery]);

  // Handle filter button clicks
  const handleFilterChange = (filterId: string) => {
    setFilters(prevFilters =>
      prevFilters.includes(filterId) ? prevFilters.filter(f => f !== filterId) : [...prevFilters, filterId]
    );
  };

  // Handle sort button clicks
  const handleSortByChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <Icons.calendar className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Bookify</h1>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search services or businesses"
                  className="rounded-lg border-slate-200 bg-white text-slate-800 pl-10 h-12 w-full dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus-visible:ring-indigo-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Icons.search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>

              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Where?"
                  className="rounded-lg border-slate-200 bg-white text-slate-800 pl-10 h-12 w-full dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus-visible:ring-indigo-500"
                  value={whereQuery}
                  onChange={e => setWhereQuery(e.target.value)}
                />
                <Icons.mapPin
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>
              
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-12 md:w-64 justify-start text-left font-normal bg-white border-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus-visible:ring-indigo-500',
                      !whenDate && 'text-muted-foreground'
                    )}
                  >
                    <Icons.calendar className="mr-2 h-5 w-5" />
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
                    onSelect={(date) => {
                      setWhenDate(date);
                      setIsDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="w-full lg:w-64 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                <Icons.filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3 text-slate-600 dark:text-slate-300">Categories</h4>
                  <ScrollArea className="h-48 pr-3">
                    <div className="space-y-2">
                      {serviceCategories.map(category => (
                        <Button
                          key={category.id}
                          variant={filters.includes(category.id) ? "default" : "outline"}
                          onClick={() => handleFilterChange(category.id)}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left",
                            filters.includes(category.id) 
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          )}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-slate-600 dark:text-slate-300">Sort By</h4>
                  <div className="space-y-2">
                    {['Relevance', 'Rating', 'Distance'].map(sortOption => (
                      <Button
                        key={sortOption}
                        variant={sortBy === sortOption ? "default" : "outline"}
                        onClick={() => handleSortByChange(sortOption)}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left",
                          sortBy === sortOption 
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                            : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        )}
                      >
                        {sortOption}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Results
              </h2>
              <div className="flex items-center">
                {filters.length > 0 && (
                  <Badge variant="outline" className="mr-2 px-3 py-1">
                    {filters.length} filter{filters.length > 1 ? 's' : ''} applied
                  </Badge>
                )}
              </div>
            </div>

            {loading ? (
              // Loading Skeletons with improved design
              <div className="grid grid-cols-1 gap-4">
                {[...Array(4)].map((_, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-md dark:bg-slate-800">
                    <div className="p-5 flex items-center gap-5">
                      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              // Error Message with better styling
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <Icons.alertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : filteredProviders.length === 0 ? (
              // No Results Message with better styling
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-12 text-center">
                <Icons.searchX className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No service providers found</p>
                <p className="text-slate-500 dark:text-slate-500 mb-6">Try adjusting your search or filter criteria</p>
                {filters.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters([])}
                    className="bg-white dark:bg-slate-800"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              // Display Filtered Providers with improved design
              <div className="space-y-4">
                {filteredProviders.map(provider => {
                  const category = serviceCategories.find(cat => cat.id === provider.serviceCategory);
                  const aiHint = category ? `${category['data-ai-hint'] || category.name}` : 'business service';
                  const imageSrc = provider.imageURL || getPlaceholderImage(aiHint);

                  return (
                    <Link href={`/provider/${provider.id}`} key={provider.id} passHref className="block">
                      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 dark:bg-slate-800">
                        <div className="p-5 flex items-center gap-5">
                          <img
                            src={imageSrc}
                            alt={provider.businessName}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            width={96}
                            height={96}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                  {provider.businessName}
                                </CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{provider.fullName}</p>
                              </div>
                              {category && (
                                <Badge className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                  {category.name}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                              {provider.address && (
                                <div className="flex items-center">
                                  <Icons.mapPin className="w-4 h-4 mr-1 text-slate-400" />
                                  <span>{provider.address}</span>
                                </div>
                              )}
                              
                              {(provider.rating || provider.reviews) && (
                                <div className="flex items-center">
                                  <div className="flex items-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded">
                                    <Icons.star className="w-4 h-4 mr-1 fill-current" />
                                    <span>{provider.rating || '?'}</span>
                                  </div>
                                  <span className="ml-1 text-slate-500 dark:text-slate-400">
                                    ({provider.reviews || 'No reviews'})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Map with improved styling */}
            <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="bg-slate-200 dark:bg-slate-800 h-96 relative">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <Icons.map className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Map View Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-800/50 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Icons.calendar className="h-4 w-4" />
            <span className="font-medium">Bookify</span>
          </div>
          <p>© {new Date().getFullYear()} Bookify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SearchPage;