'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, Timestamp, collection, addDoc, setDoc } from 'firebase/firestore'; // Added setDoc
import { onAuthStateChanged, type User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast'; // Ensure useToast hook is imported
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Structure for provider data
interface ServiceProviderData {
  id: string;
  businessName: string;
  fullName: string;
  // Add other needed fields like address
}

// Structure for selected services passed via query
interface SelectedService {
  id: string;
  name: string;
  price: string;
  duration: string;
}

// Define available time slots (adjust as needed)
const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM'
];

const BookingConfirmationPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast(); // Get the toast function

  const providerId = params.providerId as string;
  const servicesParam = searchParams.get('services');
  const totalParam = searchParams.get('total');

  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please login to book an appointment.",
          variant: "destructive"
        });
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router, toast]); // Added toast dependency

  // Fetch provider details and parse query params
  useEffect(() => {
    const initializeBooking = async () => {
      setLoading(true);
      setError(null);

      if (!providerId || !servicesParam || !totalParam) {
        setError("Missing booking information. Please go back and select services.");
        setLoading(false);
        return;
      }

      try {
        // Fetch provider data
        const providerDocRef = doc(db, 'serviceProviders', providerId);
        const providerDocSnap = await getDoc(providerDocRef);
        if (providerDocSnap.exists()) {
          setProviderData({ id: providerDocSnap.id, ...providerDocSnap.data() } as ServiceProviderData);
        } else {
          throw new Error("Service provider not found.");
        }

        // Parse services and total price
        const parsedServices = JSON.parse(decodeURIComponent(servicesParam));
        setSelectedServices(parsedServices);
        setTotalPrice(parseFloat(totalParam));

      } catch (err: any) {
        console.error('Error initializing booking:', err);
        setError(err.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    initializeBooking();
  }, [providerId, servicesParam, totalParam]);

  const handleConfirmBooking = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!selectedDate) {
      toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
      return;
    }
    if (!selectedTime) {
      toast({ title: "Error", description: "Please select a time slot.", variant: "destructive" });
      return;
    }
    if (!providerData) {
        toast({ title: "Error", description: "Provider data missing.", variant: "destructive"});
        return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      // Combine date and time into a single timestamp
      const [hours, minutesPart] = selectedTime.split(':');
      const [minutes, ampm] = minutesPart.split(' ');
      let hour = parseInt(hours);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0; // Midnight case

      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hour, parseInt(minutes), 0, 0);

      const appointmentTimestamp = Timestamp.fromDate(appointmentDateTime);

      // Data to be stored in the 'appointments' collection
      const appointmentData = {
        userId: user.uid,
        userName: user.displayName || user.email, // Use display name or email
        providerId: providerId,
        providerName: providerData.businessName, // Or providerData.fullName
        services: selectedServices, // Store the list of selected services
        totalPrice: totalPrice,
        date: appointmentTimestamp, // Store the combined Timestamp
        status: 'confirmed', // Initial status
        createdAt: Timestamp.now(),
      };

      // Store the appointment in Firestore (main 'appointments' collection)
      const appointmentsRef = collection(db, 'appointments');
      const mainDocRef = await addDoc(appointmentsRef, appointmentData); // Get the ref of the new doc

      // Store the same appointment data in the user's subcollection ('users/{userId}/appointments')
      const userAppointmentsRef = collection(db, 'users', user.uid, 'appointments');
      // Use the same ID as the main appointment document for consistency
      await setDoc(doc(userAppointmentsRef, mainDocRef.id), appointmentData);

      // Show success toast notification
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment with ${providerData.businessName} on ${format(appointmentDateTime, 'PPP p')} is confirmed.`,
      });

      // Redirect to the bookings (calendar) page
      router.push('/calendar');

    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Failed to confirm booking. Please try again.');
       toast({
          title: "Booking Failed",
          description: "Could not save your appointment. Please try again.",
          variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 pb-[80px]">
        <Card className="w-full max-w-lg dark:bg-card p-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-72 w-full mb-4" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 pb-[80px]">
        <Card className="w-full max-w-lg dark:bg-card p-6 text-center">
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription className="text-destructive mt-2">{error}</CardDescription>
          <Button onClick={() => router.back()} className="mt-6">Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]">
      <Card className="w-full max-w-2xl dark:bg-card shadow-lg rounded-lg overflow-hidden"> {/* Increased max-width, added shadow, rounded */}
        <CardHeader className="bg-muted/50 dark:bg-muted/20 p-6 border-b dark:border-muted"> {/* Added background and padding */}
          <CardTitle className="text-2xl text-center font-semibold">Confirm Your Booking</CardTitle> {/* Centered and styled title */}
          <CardDescription className="text-center text-muted-foreground pt-1">
            Review your selected services and choose a date and time for your appointment with {providerData?.businessName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8"> {/* Used grid for layout, increased gap */}

          {/* Left Column: Service Summary */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary dark:text-primary-foreground">Selected Services</h3>
              <div className="border dark:border-muted rounded-md p-4 space-y-3 bg-background dark:bg-card/50"> {/* Added bg color */}
                {selectedServices.map((service, index) => (
                  <div key={service.id}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">₹{parseFloat(service.price.replace(/[^0-9.]/g, '')).toFixed(2)}</span>
                    </div>
                    {index < selectedServices.length - 1 && <Separator className="my-2 dark:bg-muted/50" />}
                  </div>
                ))}
                 <Separator className="my-3 border-t-2 border-dashed dark:border-muted" />
                  <div className="flex justify-between items-center font-bold text-md">
                     <span>Total Price:</span>
                     <span>₹{totalPrice.toFixed(2)}</span>
                 </div>
              </div>
            </div>
             {/* Provider Info (Optional but professional) */}
             <div>
                <h3 className="text-lg font-semibold mb-2 text-primary dark:text-primary-foreground">Provider</h3>
                 <p className="text-sm text-muted-foreground">{providerData?.businessName}</p>
                 {/* Add address or other details if available in providerData */}
             </div>
          </div>

          {/* Right Column: Date & Time Selection */}
          <div className="space-y-6">
             {/* Date Selection */}
            <div className="flex flex-col items-center">
               <Label htmlFor="appointment-date" className="mb-2 font-semibold text-lg self-start text-primary dark:text-primary-foreground">Select Date</Label>
               <Calendar
                  id="appointment-date"
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  fromDate={new Date()} // Disable past dates
                  className="rounded-md border dark:border-muted w-full bg-background dark:bg-card/50" // Added background
                />
             </div>

            {/* Time Selection */}
             <div>
              <Label htmlFor="appointment-time" className="mb-2 font-semibold text-lg text-primary dark:text-primary-foreground">Select Time</Label>
              <Select onValueChange={setSelectedTime} value={selectedTime} disabled={!selectedDate}>
                  <SelectTrigger id="appointment-time" className="w-full dark:bg-card/50 dark:border-muted" disabled={!selectedDate}> {/* Added background */}
                      <SelectValue placeholder={selectedDate ? "Select a time slot" : "Select a date first"} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card"> {/* Ensure content has background */}
                      {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                              {time}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              {!selectedDate && <p className="text-xs text-muted-foreground mt-1">Please select a date to enable time slots.</p>}
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end p-6 bg-muted/50 dark:bg-muted/20 border-t dark:border-muted"> {/* Added background and padding */}
          <Button onClick={() => router.back()} variant="outline" className="mr-3">Cancel</Button> {/* Increased margin */}
          <Button
            onClick={handleConfirmBooking}
            disabled={!selectedDate || !selectedTime || bookingLoading || !user}
            size="lg" // Make button slightly larger
          >
            {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Use Suspense to handle client-side data fetching from searchParams
const BookingConfirmationPage = () => {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen p-4 pb-[80px]">
            <Skeleton className="h-[500px] w-full max-w-2xl" /> {/* Adjusted size */}
        </div>
    }>
      <BookingConfirmationPageContent />
    </Suspense>
  );
};

export default BookingConfirmationPage;
