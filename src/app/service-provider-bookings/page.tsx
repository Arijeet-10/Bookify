
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Define the structure of an appointment object (same as calendar page)
interface AppointmentService {
  id: string;
  name: string;
  price: string;
  duration: string;
}

interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  services: AppointmentService[];
  totalPrice: number;
  date: Timestamp;
  userId: string;
  userName?: string;
  status: string;
  createdAt: Timestamp;
}

const ServiceProviderBookingsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [showIndexAlert, setShowIndexAlert] = useState(false);

  // Fetch all upcoming appointments for the logged-in service provider
  const fetchProviderAppointments = async (providerId: string) => {
    setLoading(true);
    setError(null);
    setShowIndexAlert(false);
    setAppointments([]);

    try {
      const nowTimestamp = Timestamp.now();
      const appointmentsRef = collection(db, 'appointments');

      // Query for appointments where providerId matches the current user's ID
      // and the appointment date is in the future or now.
      // This query requires a composite index on 'providerId' (asc) and 'date' (asc).
      const q = query(
        appointmentsRef,
        where('providerId', '==', providerId), // Match the provider ID
        where('date', '>=', nowTimestamp),     // Appointment date is in the future or now
        orderBy('date', 'asc')                // Order upcoming appointments chronologically
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
         const data = doc.data();
         if (data.userId && data.date && data.services && typeof data.totalPrice === 'number') {
              fetchedAppointments.push({
                 id: doc.id,
                 ...data,
              } as Appointment);
         } else {
             console.warn("Skipping appointment due to missing fields:", doc.id, data);
         }
      });
      setAppointments(fetchedAppointments);

    } catch (err: any) {
      console.error('Error fetching provider appointments:', err);
       if (err.code === 'failed-precondition' && err.message.includes('index')) {
           setError(`Firestore query requires an index. Please create it in the Firebase Console (check the developer console for the exact link needed for the appointments collection query on providerId and date).`);
           setShowIndexAlert(true);
      } else {
           setError('Failed to load appointments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Fetch appointments will be called in the next effect
      } else {
        setUser(null);
        setAppointments([]);
        router.push('/login');
      }
       setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Separate useEffect to fetch data when user is available
  useEffect(() => {
    if (user) {
      fetchProviderAppointments(user.uid); // Use user's UID as providerId
    } else {
      setAppointments([]);
      if (loading) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

   const formatAppointmentDateTime = (timestamp: Timestamp): string => {
       if (!timestamp?.toDate) return "Invalid Date";
       try {
           return format(timestamp.toDate(), 'PPP p');
       } catch (e) {
           console.error("Error formatting date:", e);
           return "Invalid Date";
       }
   };

   const getFirstServiceName = (services: AppointmentService[]): string => {
     if (Array.isArray(services) && services.length > 0 && services[0]?.name) {
        return services[0].name + (services.length > 1 ? ` (+${services.length - 1} more)` : '');
     }
     return 'Service details missing';
   }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Your Upcoming Appointments</CardTitle>
           <CardDescription className="text-center text-muted-foreground">
             Here are the upcoming appointments booked by your customers.
           </CardDescription>
        </CardHeader>
        <CardContent>
           {showIndexAlert && (
               <Alert variant="destructive" className="mb-4">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Heads up! Index Required</AlertTitle>
                   <AlertDescription>
                     {error} Creating the index can take a few minutes. Appointments will load correctly once the index is built. Reload the page after some time.
                   </AlertDescription>
               </Alert>
           )}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : error && !showIndexAlert ? (
              <p className="text-center text-destructive">{error}</p>
            ) : !loading && appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">You have no upcoming customer appointments scheduled.</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((appt) => (
                  <li key={appt.id} className="border p-4 rounded-md dark:border-muted hover:bg-muted/50 transition-colors">
                    <p className="font-semibold text-lg">{getFirstServiceName(appt.services)}</p>
                    <p className="text-sm text-muted-foreground">Customer: {appt.userName || 'N/A'}</p> {/* Display customer name */}
                    <p className="text-sm text-muted-foreground">Date & Time: {formatAppointmentDateTime(appt.date)}</p>
                    <p className="text-sm text-muted-foreground">Status: <span className="capitalize">{appt.status}</span></p>
                    <p className="text-sm text-muted-foreground font-medium">Total: ₹{appt.totalPrice.toFixed(2)}</p>
                     {/* Add more details or actions (e.g., Cancel button) if needed */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderBookingsPage;
