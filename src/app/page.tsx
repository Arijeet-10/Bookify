
'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Icons} from '@/components/icons.tsx'; // Updated import path
import {suggestServiceProvider} from '@/ai/flows/suggest-service-provider';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import { serviceCategories, specialOffers } from '@/lib/constants'; // Import from constants
import Footer from '@/components/Footer'; // Import Footer


const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
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
      description: `Your appointment with ${selectedProvider?.name} on ${selectedDate?.toLocaleDateString()} has been confirmed.`,
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 pb-[60px]"> {/* Added padding-bottom */}
      {/* Header with Logo and Search */}
      <header className="px-4 py-6 flex flex-col bg-[#152226] text-white">
        <div className="container mx-auto max-w-md w-full flex flex-col items-center">
          <div className="flex justify-center mb-6 text-xl font-bold">
            Bookify
          </div>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search services or businesses"
              className="rounded-full bg-white text-gray-700 pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
            />
             {/* Ensure Icons.search is rendered correctly */}
            <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </header>

       {/* Service Categories Section */}
        <div className="flex flex-col bg-[#152226]">
         <section className="p-4 pb-8 flex items-center overflow-x-auto">
           <ScrollArea className="w-full">
             <div className="flex space-x-4 p-2">
               {serviceCategories.map(category => (
                 <div key={category.id} className="flex-shrink-0">
                   <Card
                      className="w-32 h-32 flex flex-col items-center justify-center p-2 hover:shadow-md transition-shadow duration-300 bg-transparent border-none"
                      data-ai-hint={category['data-ai-hint']}
                    >
                     <Avatar className="mb-2 w-20 h-20">
                       <AvatarImage src={category.image} alt={category.name} className="object-cover" />
                       <AvatarFallback>{category.name.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <CardTitle className="text-sm text-center text-white dark:text-primary">
                       {category.name}
                     </CardTitle>
                   </Card>
                 </div>
               ))}
             </div>
           </ScrollArea>
         </section>
       </div>


      {/* Main Content */}
      <main className="flex-grow p-4">
        {/* Special Offers Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            Special Offers
          </h2>
          <div className="flex overflow-x-auto space-x-4 pb-8">
            {specialOffers.map(offer => (
              <div key={offer.id} className="flex-shrink-0 w-64">
                <Card className="overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800" data-ai-hint={offer['data-ai-hint']}>
                    <div className="relative">
                       <img
                         src={offer.imageUrl}
                         alt={offer.providerName}
                         className="w-full h-48 object-cover"
                         width={256} // Provide width hint
                         height={192} // Provide height hint
                       />
                       <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1 flex flex-col items-end backdrop-blur-sm">
                          <div className="flex items-center gap-1">
                            {/* Ensure Icons.star is rendered correctly */}
                            <Icons.star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-white">{offer.rating}</span>
                          </div>
                          <span className="text-xs text-gray-200 mt-0.5">{offer.reviews}</span>
                        </div>
                     </div>
                    <CardContent className="p-3">
                       <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate mb-1">
                         {offer.providerName}
                       </CardTitle>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate flex items-center">
                         {/* Ensure Icons.mapPin is rendered correctly */}
                         <Icons.mapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                         {offer.address}
                       </p>
                       <div className="flex items-center mt-3 justify-between">
                         <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full flex items-center font-medium dark:bg-teal-900 dark:text-teal-200">
                           {/* Ensure Icons.thumbsup is rendered correctly */}
                           <Icons.thumbsup className="w-4 h-4 mr-1" />
                           {offer.discount}
                         </span>
                         <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                           {/* Ensure Icons.share is rendered correctly */}
                           <Icons.share className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                         </button>
                       </div>
                     </CardContent>
                  </Card>
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
              <Label htmlFor="preferences" className="text-gray-700 dark:text-gray-300">
                Enter your preferences for a service provider:
              </Label>
              <Textarea
                id="preferences"
                className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                placeholder="e.g., find someone with experience with curly hair"
                value={providerPreferences}
                onChange={e => setProviderPreferences(e.target.value)}
              />
            </div>
            <Button onClick={handleAISuggestion} className="bg-primary hover:bg-primary/90 text-white dark:bg-accent dark:hover:bg-accent/90 dark:text-accent-foreground">
              Get AI Suggestion
            </Button>
            {aiSuggestion && (
              <Card className="mt-4 p-4 bg-gray-50 dark:bg-secondary dark:border-muted">
                <CardTitle className="text-lg font-semibold text-primary dark:text-primary mb-2">
                  AI Suggestion:
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
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
          <p className="text-gray-500 dark:text-gray-400">Recommendations based on your activity will appear here.</p>
        </section>
      </main>
    </div>
  );
};

export default Home;
