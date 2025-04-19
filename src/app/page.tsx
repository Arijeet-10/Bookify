'use client';

import React, {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Calendar} from '@/components/ui/calendar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {Icons} from '@/components/icons';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {suggestServiceProvider} from '@/ai/flows/suggest-service-provider';

const serviceCategories = [
  {
    id: '1',
    name: 'Haircuts',
    description: 'Stylish haircuts for all ages.',
    icon: 'haircut',
  },
  {
    id: '2',
    name: 'Massage',
    description: 'Relaxing massage therapy sessions.',
    icon: 'massage',
  },
  {
    id: '3',
    name: 'Nail Services',
    description: 'Manicures and pedicures for beautiful nails.',
    icon: 'nail',
  },
  {
    id: '4',
    name: 'Facials',
    description: 'Rejuvenating facial treatments.',
    icon: 'facial',
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

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [providerPreferences, setProviderPreferences] = useState('');
  const router = useRouter();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

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
    <div className="flex flex-col min-h-screen bg-light-gray p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">ScheduleEase</h1>
        <p className="text-muted-foreground">Book your next appointment with ease.</p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Service Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceCategories.map(category => (
            <Card key={category.id} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>More details about {category.name} will be here.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Service Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceProviders.map(provider => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={provider.photo} alt={provider.name} />
                    <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl text-primary">{provider.name}</CardTitle>
                    <CardDescription>{provider.specialty}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>{provider.bio}</p>
                <Button
                  className="mt-4 bg-accent text-foreground hover:bg-coral"
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
        <h2 className="text-2xl font-semibold mb-4 text-primary">Book Appointment</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Select Date</CardTitle>
              <CardDescription>Choose a date for your appointment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
            </CardContent>
          </Card>
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle className="text-xl text-primary">AI Provider Suggestion</CardTitle>
              <CardDescription>Enter your preferences to find the best provider.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferences">Preferences</Label>
                <Textarea
                  id="preferences"
                  placeholder="e.g., find someone with experience with curly hair"
                  value={providerPreferences}
                  onChange={e => setProviderPreferences(e.target.value)}
                />
              </div>
              <Button onClick={handleAISuggestion} className="bg-accent text-foreground hover:bg-coral">
                Suggest Provider
              </Button>
              {aiSuggestion && <p className="mt-4">{aiSuggestion}</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to book an appointment with {selectedProvider?.name} on{' '}
              {selectedDate?.toLocaleDateString()}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={confirmBooking}>Confirm</AlertDialogAction>
          <AlertDialogCancel onClick={() => setIsBookingOpen(false)}>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
