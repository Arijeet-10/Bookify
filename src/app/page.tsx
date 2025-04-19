'use client';

import React, {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {Icons} from '@/components/icons';
import {suggestServiceProvider} from '@/ai/flows/suggest-service-provider';

const serviceCategories = [
  {
    id: '1',
    name: 'Dental & Orthodontics',
    description: 'Stylish haircuts for all ages.',
    icon: 'haircut',
    image: 'https://picsum.photos/id/237/100/100',
  },
  {
    id: '2',
    name: 'Health & Fitness',
    description: 'Relaxing massage therapy sessions.',
    icon: 'massage',
    image: 'https://picsum.photos/id/238/100/100',
  },
  {
    id: '3',
    name: 'Professional Services',
    description: 'Manicures and pedicures for beautiful nails.',
    icon: 'nail',
    image: 'https://picsum.photos/id/239/100/100',
  },
  {
    id: '4',
    name: 'Other',
    description: 'Rejuvenating facial treatments.',
    icon: 'facial',
    image: 'https://picsum.photos/id/240/100/100',
  },
  {
    id: '5',
    name: 'Barbershop',
    description: 'Stylish haircuts for all ages.',
    icon: 'haircut',
    image: 'https://picsum.photos/id/241/100/100',
  },
];

const serviceProviders = [
  {
    id: '101',
    name: 'Alice Johnson',
    specialty: 'Haircuts',
    bio: 'Expert stylist with 10 years of experience.',
    photo: 'https://picsum.photos/id/1027/200/300',
  },
  {
    id: '102',
    name: 'Bob Smith',
    specialty: 'Massage',
    bio: 'Certified massage therapist specializing in deep tissue.',
    photo: 'https://picsum.photos/id/1005/200/300',
  },
  {
    id: '103',
    name: 'Charlie Brown',
    specialty: 'Nail Services',
    bio: 'Professional nail technician with a passion for art.',
    photo: 'https://picsum.photos/id/1011/200/300',
  },
];

const specialOffers = [
  {
    id: '201',
    providerName: 'LA Barber Downey',
    imageUrl: 'https://picsum.photos/id/100/400/300',
    rating: '5.0',
    reviews: '245 reviews',
    address: '8317 Firestone Blvd, Downey, CA 90241',
    discount: 'SAVE UP TO 10%',
  },
  {
    id: '202',
    providerName: 'BarberEze',
    imageUrl: 'https://picsum.photos/id/101/400/300',
    rating: '4.8',
    reviews: '120 reviews',
    address: '1140 W State Rd',
    discount: 'SAVE UP TO 15%',
  },
  {
    id: '203',
    providerName: 'Glow Salon',
    imageUrl: 'https://picsum.photos/id/102/400/300',
    rating: '4.9',
    reviews: '302 reviews',
    address: '789 Oak Street, Anytown, CA 91234',
    discount: 'SAVE UP TO 20%',
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
    <div className="flex flex-col min-h-screen dark:bg-dark-background dark:text-dark-foreground">
      {/* Search Bar */}
      <header className="bg-background dark:bg-dark-background p-4 sticky top-0 z-10">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search services or businesses"
            className="rounded-full dark:bg-secondary dark:border-muted"
          />
          <Icons.search
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-dark-foreground"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4">
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
                <Card className="dark:bg-secondary dark:border-muted">
                  <CardHeader className="p-0">
                    <img
                      src={offer.imageUrl}
                      alt={offer.providerName}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl text-primary dark:text-primary">
                      {offer.providerName}
                    </CardTitle>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icons.star className="mr-1 h-5 w-5 text-yellow-500" />
                        <span>{offer.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground dark:text-dark-foreground">
                        {offer.reviews}
                      </span>
                    </div>
                    <CardDescription className="dark:text-dark-foreground">
                      {offer.address}
                    </CardDescription>
                    <Button className="mt-4 bg-accent text-foreground hover:bg-coral dark:bg-accent dark:text-dark-foreground w-full">
                      {offer.discount}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            Service Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceProviders.map(provider => (
              <Card
                key={provider.id}
                className="hover:shadow-md transition-shadow duration-300 dark:bg-secondary dark:border-muted"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={provider.photo} alt={provider.name} />
                      <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl text-primary dark:text-primary">
                        {provider.name}
                      </CardTitle>
                      <CardDescription className="dark:text-dark-foreground">
                        {provider.specialty}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-dark-foreground">{provider.bio}</p>
                  <Button
                    className="mt-4 bg-accent text-foreground hover:bg-coral dark:bg-accent dark:text-dark-foreground"
                    onClick={() => handleBookAppointment(provider)}
                  >
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary dark:text-primary">
            AI Provider Suggestion
          </h2>
          <div className="flex flex-col items-center">
            <Card className="w-full max-w-md dark:bg-secondary dark:border-muted">
              <CardHeader>
                <CardTitle className="text-xl text-primary dark:text-primary">
                  Find Your Ideal Provider
                </CardTitle>
                <CardDescription className="dark:text-dark-foreground">
                  Enter your preferences to get a personalized suggestion.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferences" className="dark:text-dark-foreground">
                    Preferences
                  </Label>
                  <Textarea
                    id="preferences"
                    placeholder="e.g., find someone with experience with curly hair"
                    value={providerPreferences}
                    onChange={e => setProviderPreferences(e.target.value)}
                    className="dark:bg-secondary dark:border-muted dark:text-dark-foreground"
                  />
                </div>
                <Button
                  onClick={handleAISuggestion}
                  className="bg-accent text-foreground hover:bg-coral dark:bg-accent dark:text-dark-foreground"
                >
                  Suggest Provider
                </Button>
                {aiSuggestion && <p className="mt-4 dark:text-dark-foreground">{aiSuggestion}</p>}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-nav-background dark:bg-nav-background p-4 fixed bottom-0 left-0 w-full z-10">
        <ul className="flex justify-around items-center">
          <li>
            <a
              href="#"
              className="flex flex-col items-center dark:text-nav-foreground hover:text-nav-active dark:hover:text-nav-active"
            >
              <Icons.home />
              <span className="text-xs">My Booksy</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex flex-col items-center dark:text-nav-foreground hover:text-nav-active dark:hover:text-nav-active"
            >
              <Icons.search />
              <span className="text-xs">Search</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex flex-col items-center dark:text-nav-foreground hover:text-nav-active dark:hover:text-nav-active"
            >
              <span className="text-xs">Calendar</span>
              <Icons.calendar />
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex flex-col items-center dark:text-nav-foreground hover:text-nav-active dark:hover:text-nav-active"
            >
              <Icons.user />
              <span className="text-xs">Profile</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;
