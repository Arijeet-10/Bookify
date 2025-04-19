'use client';

import React, {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Icons} from '@/components/icons';
import {Card, CardTitle, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [whereQuery, setWhereQuery] = useState('');
  const [whenDate, setWhenDate] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [sortBy, setSortBy] = useState('');
  const [filters, setFilters] = useState<string[]>([]);

  const handleFilterChange = (filter: string) => {
    setFilters(prevFilters =>
      prevFilters.includes(filter) ? prevFilters.filter(f => f !== filter) : [...prevFilters, filter]
    );
  };

  const handleSortByChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const specialOffers = [
    {
      id: '201',
      providerName: 'LA Barber Downey',
      imageUrl: '/images/la-barber.jpg',
      rating: '5.0',
      reviews: '245 reviews',
      address: '8317 Firestone Blvd, Downey, CA 90241, 5622506313, Downey, 90241',
      discount: 'SAVE UP TO 10%',
    },
    {
      id: '202',
      providerName: 'BarberEze',
      imageUrl: '/images/barbereeze.jpg',
      rating: '4.8',
      reviews: '120 reviews',
      address: '1140 W State Rd',
      discount: 'SAVE UP TO 15%',
    },
  ];

  const searchResults = [
    {
      id: '1',
      name: 'Dental Care Clinic',
      type: 'Dental',
      address: '123 Main St',
      rating: '4.5',
      image: '/images/dental.jpg',
    },
    {
      id: '2',
      name: 'Fitness Gym Pro',
      type: 'Fitness',
      address: '456 Oak Ave',
      rating: '4.8',
      image: '/images/health.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-700">
      <header className="p-4 flex justify-center bg-[#152226]">
        <div className="max-w-4xl w-full flex flex-col gap-4">
          <div className="flex justify-center mb-6 text-white font-bold text-xl">Bookify</div>
          <div className="flex gap-4 items-center">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search services or businesses"
                className="rounded-full bg-white text-gray-700 pl-10"
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
                className="rounded-full bg-white text-gray-700 pl-10"
                value={whereQuery}
                onChange={e => setWhereQuery(e.target.value)}
              />
              <Icons.mapPin
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !whenDate && 'text-muted-foreground'
                  )}
                >
                  {whenDate ? (
                    format(whenDate, 'LLL dd, y')
                  ) : (
                    <span>
                      <span className="text-gray-400">When?</span>
                    </span>
                  )}
                  <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
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
          <h3 className="text-lg font-semibold mb-2">Filters</h3>
          <div className="flex gap-2 flex-wrap">
            {['Dental', 'Fitness', 'Professional', 'Other'].map(filter => (
              <Button
                key={filter}
                variant={filters.includes(filter) ? 'default' : 'outline'}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
          <h3 className="text-lg font-semibold mt-4 mb-2">Sort By</h3>
          <div className="flex gap-2 flex-wrap">
            {['Relevance', 'Rating', 'Distance'].map(sortOption => (
              <Button
                key={sortOption}
                variant={sortBy === sortOption ? 'default' : 'outline'}
                onClick={() => handleSortByChange(sortOption)}
              >
                {sortOption}
              </Button>
            ))}
          </div>
        </section>

        {/* Special Offers */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Special Offers</h2>
          <div className="flex overflow-x-auto space-x-4 pb-8">
            {specialOffers.map(offer => (
              <div key={offer.id} className="flex-shrink-0 w-64">
                <div className="relative">
                  <img
                    src={offer.imageUrl}
                    alt={offer.providerName}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1">
                    <div className="flex flex-col items-end">
                      <span className="text-base font-bold text-white">{offer.rating}</span>
                      <span className="text-xs text-white">{offer.reviews}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {offer.providerName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{offer.address}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-teal-500 px-2 py-1 rounded-full flex items-center">
                      <div className="flex items-center gap-1">
                        {offer.discount}
                        <Icons.thumbsup className="w-4 h-4 mr-1" />
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(result => (
              <Card key={result.id} className="p-4">
                <div className="flex items-center gap-4">
                  <img src={result.image} alt={result.name} className="w-20 h-20 rounded-lg" />
                  <div>
                    <CardTitle className="text-lg font-semibold">{result.name}</CardTitle>
                    <CardContent>
                      <p className="text-sm">{result.address}</p>
                      <div className="flex items-center mt-1">
                        <Icons.star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm ml-1">{result.rating}</span>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="h-96 bg-gray-300 rounded-lg">
          <div className="w-full h-full flex items-center justify-center">Map</div>
        </section>
      </main>
    </div>
  );
};

export default SearchPage;
