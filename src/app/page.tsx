'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {Icons} from '@/components/icons';
import {suggestServiceProvider} from '@/ai/flows/suggest-service-provider';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';

const serviceCategories = [
  {
    id: '1',
    name: 'Dental & Orthodontics',
    image: '/images/dental.jpg',
  },
  {
    id: '2',
    name: 'Health & Fitness',
    image: '/images/health.jpg',
  },
  {
    id: '3',
    name: 'Professional Services',
    image: '/images/professional.jpg',
  },
  {
    id: '4',
    name: 'Other',
    image: '/images/other.jpg',
  },
  {
    id: '5',
    name: 'Barbershop',
    image: '/images/barbershop.jpg',
  },
];

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

const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [providerPreferences, setProviderPreferences] = useState('');
  const router = useRouter();

  const handleBookAppointment = (provider: any) => {
    setSelectedProvider(provider);
    setIsBookingOpen(true);
  };

  const confirmBooking = () => {
    toast({
      title: 'Appointment Booked!',
      description: `Your appointment with ${selectedProvider.name} on ${selectedDate?.toLocaleDateString()} has been confirmed.`,
    });
    setIsBookingOpen(false);
  };

  const handleAISuggestion = async () => {
    if (!providerPreferences) {
      toast({
        title: 'Error',
        description: 'Please enter your preferences.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const suggestion = await suggestServiceProvider({preferences: providerPreferences});
      setAiSuggestion(
        `Based on your preferences, we suggest: ${suggestion?.providerName} - ${suggestion?.providerDescription}`
      );
    } catch (error: any) {
      console.error('AI Suggestion Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestion. Please try again.',
        variant: 'destructive',
      });
      setAiSuggestion('Failed to get AI suggestion. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-700 dark:text-gray-300">
      {/* Header with Logo */}
      <header className="bg-black p-4 flex justify-center">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-6">
            <img src="/images/booksy-logo.svg" alt="Booksy" className="h-8" />
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search services or businesses"
              className="rounded-full bg-white text-gray-700 pl-10"
            />
            <Icons.search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4">
        {/* Service Categories - circular images with text below */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            Service Categories
          </h2>
          <div className="flex overflow-x-auto space-x-4">
            {serviceCategories.map(category => (
              <div key={category.id} className="flex-shrink-0">
                <Card className="w-32 h-32 flex flex-col items-center justify-center p-2 hover:shadow-md transition-shadow duration-300 dark:bg-secondary dark:border-muted">
                  <Avatar className="mb-2">
                    <AvatarImage src={category.image} alt={category.name} />
                    <AvatarFallback>{category.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-sm text-center text-primary dark:text-primary">
                    {category.name}
                  </CardTitle>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Special Offers Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            Special Offers
          </h2>
          <div className="flex overflow-x-auto space-x-4">
            {specialOffers.map(offer => (
              <div key={offer.id} className="flex-shrink-0 w-64">
                <div className="relative">
                  <img
                    src={offer.imageUrl}
                    alt={offer.providerName}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-lg px-2 py-1">
                    <div className="flex items-center">
                      <Icons.star className="h-5 w-5 text-white" />
                      <span className="text-xl font-bold text-white">{offer.rating}</span>
                      <div className="flex flex-col text-xs ml-2 text-white">
                        <span>{offer.reviews}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{offer.providerName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{offer.address}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs border border-teal-500 text-teal-500 px-2 py-1 rounded-full flex items-center">
                      <Icons.check className="w-4 h-4 mr-1" />
                      {offer.discount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Provider Suggestion Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            AI Provider Suggestion
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferences">
                Enter your preferences for a service provider:
              </Label>
              <Textarea
                id="preferences"
                className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary"
                placeholder="e.g., find someone with experience with curly hair"
                value={providerPreferences}
                onChange={e => setProviderPreferences(e.target.value)}
              />
            </div>
            <Button onClick={handleAISuggestion}>
              Get AI Suggestion
            </Button>
            {aiSuggestion && (
              <Card className="mt-4 p-4 dark:bg-secondary dark:border-muted">
                <CardTitle className="text-primary dark:text-primary">
                  AI Suggestion:
                </CardTitle>
                <CardDescription>
                  {aiSuggestion}
                </CardDescription>
              </Card>
            )}
          </div>
        </section>

        {/* Recommended Section */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            Recommended
          </h2>
          {/* Content for recommended section would go here */}
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white p-4 fixed bottom-0 left-0 w-full border-t border-gray-200 dark:border-gray-800">
        <ul className="flex justify-between items-center">
          <li className="flex flex-col items-center">
            <a href="#" className="flex flex-col items-center">
              <Icons.home className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">My Booksy</span>
            </a>
          </li>
          <li className="flex flex-col items-center">
            <a href="#" className="flex flex-col items-center">
              <Icons.search className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Search</span>
            </a>
          </li>
          <li className="flex flex-col items-center">
            <a href="#" className="flex flex-col items-center">
              <Icons.calendar className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Calendar</span>
            </a>
          </li>
          <li className="flex flex-col items-center">
            <a href="#" className="flex flex-col items-center">
              <Icons.user className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Profile</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;
