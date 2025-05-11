
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, Timestamp, collection, addDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar as CalendarIcon, CheckCircle, User, CreditCard, ChevronLeft, Loader2, ShieldCheck, Banknote } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Structure for provider data
interface ServiceProviderData {
  id: string;
  businessName: string;
  fullName: string;
}

// Structure for selected services passed via query
interface SelectedService {
  id:string;
  name: string;
  price: string;
  duration: string;
}

// Define available time slots
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
  const { toast } = useToast();

  const providerId = params.providerId as string;
  const servicesParam = searchParams.get('services');
  const totalParam = searchParams.get('total');

  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("pay_at_venue");


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
  }, [router, toast]);

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
      toast({ title: "Error", description: "Provider data missing.", variant: "destructive" });
      return;
    }

    // If 'Pay Online' is selected, this is where you would trigger the payment gateway.
    // For this example, we'll assume payment is successful or 'Pay at Venue' is chosen.
    if (paymentMethod === "pay_online") {
      // TODO: Implement payment gateway integration here.
      // For now, we'll simulate a successful payment for demonstration.
      console.log("Simulating online payment...");
      // If payment fails, show an error toast and return.
      // If payment succeeds, proceed to create the booking.
    }

    setBookingLoading(true);
    setError(null);

    try {
      const [hours, minutesPart] = selectedTime.split(':');
      const [minutes, ampm] = minutesPart.split(' ');
      let hour = parseInt(hours);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hour, parseInt(minutes), 0, 0);
      const appointmentTimestamp = Timestamp.fromDate(appointmentDateTime);

      const appointmentData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        providerId: providerId,
        providerName: providerData.businessName,
        services: selectedServices,
        totalPrice: totalPrice,
        date: appointmentTimestamp,
        status: 'confirmed', // Or 'pending_payment' if online payment is initiated
        paymentMethod: paymentMethod, // Store the chosen payment method
        createdAt: Timestamp.now(),
      };

      const appointmentsRef = collection(db, 'appointments');
      const mainDocRef = await addDoc(appointmentsRef, appointmentData);

      const userAppointmentsRef = collection(db, 'users', user.uid, 'appointments');
      await setDoc(doc(userAppointmentsRef, mainDocRef.id), appointmentData);

      toast({
        title: "Booking Confirmed!",
        description: `Your appointment with ${providerData.businessName} on ${format(appointmentDateTime, 'PPP p')} is confirmed.`,
      });

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
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 pb-[80px]">
        <div className="w-full max-w-4xl px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-[80px]">
        <Card className="w-full max-w-lg shadow-lg border border-red-200 dark:border-red-900">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900">
            <CardTitle className="text-red-700 dark:text-red-400 text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-slate-700 dark:text-slate-300 mb-6">{error}</p>
            <Button 
              onClick={() => router.back()} 
              className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 pb-[80px]">
      <div className="w-full max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">Complete Your Booking</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-md border-0 dark:border rounded-xl overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-5">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Selected Services</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Review your service selection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-slate-800 p-6">
                <div className="space-y-4">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="flex justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900 dark:text-white">{service.name}</p>
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{service.duration}</span>
                        </div>
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        ₹{parseFloat(service.price.replace(/[^0-9.]/g, '')).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-6 dark:bg-slate-700" />
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg text-slate-900 dark:text-white">Total</p>
                  <p className="font-semibold text-lg text-slate-900 dark:text-white">₹{totalPrice.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0 dark:border rounded-xl overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-5">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Service Provider</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Details about your provider</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-slate-800 p-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-4">
                    {/* Placeholder for provider image */}
                    <User className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{providerData?.businessName}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{providerData?.fullName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="shadow-md border-0 dark:border rounded-xl overflow-hidden h-full">
              <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-5">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Schedule & Payment</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Choose date, time, and payment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-slate-800 p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="date-picker" className="text-sm font-medium text-slate-900 dark:text-white">
                    Select Date
                  </Label>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                    <Calendar
                      id="date-picker"
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      fromDate={new Date()}
                      className="mx-auto"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="time-select" className="text-sm font-medium text-slate-900 dark:text-white">
                    Select Time
                  </Label>
                  <Select onValueChange={setSelectedTime} value={selectedTime} disabled={!selectedDate}>
                    <SelectTrigger id="time-select" className="w-full bg-slate-50 dark:bg-slate-900/50">
                      <SelectValue placeholder={selectedDate ? "Select time slot" : "Choose date first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedDate && selectedTime && (
                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 p-4">
                    <div className="flex">
                      <div className="mr-3 flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-300">Your selected slot</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {selectedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* THIS IS WHERE PAYMENT INTEGRATION OPTIONS WOULD GO */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Options
                  </h3>
                  <RadioGroup defaultValue="pay_at_venue" onValueChange={setPaymentMethod} className="space-y-2">
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <RadioGroupItem value="pay_at_venue" id="pay_at_venue" />
                      <Label htmlFor="pay_at_venue" className="text-sm text-slate-900 dark:text-white cursor-pointer">
                        <Banknote className="h-4 w-4 mr-2 inline-block" /> Pay at Venue
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <RadioGroupItem value="pay_online" id="pay_online" />
                      <Label htmlFor="pay_online" className="text-sm text-slate-900 dark:text-white cursor-pointer">
                         <ShieldCheck className="h-4 w-4 mr-2 inline-block text-green-500" /> Pay Online Securely
                      </Label>
                    </div>
                  </RadioGroup>
                   {/* Placeholder for online payment button/form */}
                   {paymentMethod === "pay_online" && (
                    <div className="mt-4">
                       <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        // onClick={handleInitiateOnlinePayment} // This would trigger your payment gateway
                        disabled={bookingLoading || !selectedDate || !selectedTime}
                       >
                         <CreditCard className="mr-2 h-4 w-4" /> Pay ₹{totalPrice.toFixed(2)} Now
                       </Button>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                         You will be redirected to a secure payment gateway.
                       </p>
                    </div>
                  )}
                   {/* End of payment integration placeholder */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="mt-4 sm:mt-0 bg-white dark:bg-transparent border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          
          {/* The main confirm button's role might change if online payment is chosen first */}
          {paymentMethod === "pay_at_venue" && (
            <Button
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime || bookingLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {bookingLoading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  Confirm Appointment
                  <CheckCircle className="h-4 w-4 ml-2" />
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingConfirmationPage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 pb-[80px]">
        <div className="w-full max-w-4xl px-4">
          <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
          <Skeleton className="h-4 w-1/3 mx-auto mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-xl mb-6" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <BookingConfirmationPageContent />
    </Suspense>
  );
};

export default BookingConfirmationPage;

