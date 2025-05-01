
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { Terminal } from "lucide-react"; // Import an icon for the alert

// Define the structure of an appointment object
interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  services: Array<{ id: string; name: string; price: string; duration: string }>; // Assuming services are stored as an array
  totalPrice: number;
  date: Timestamp; // Firestore Timestamp for the appointment date/time
  userId: string; // ID of the user who booked
  userName?: string; // Name of the user who booked (optional)
  status: string;
  createdAt: Timestamp;
}

const CalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [showIndexAlert, setShowIndexAlert] = useState(false); // State to control index alert visibility

  // Fetch all upcoming appointments for the user from their subcollection
  const fetchAppointments = async (userId: string) => {
    setLoading(true);
    setError(null);
    setShowIndexAlert(false); // Reset alert state
    setAppointments([]); // Clear previous appointments

    try {
      // Get current time as Firestore Timestamp
      const nowTimestamp = Timestamp.now();

      // Reference the user's 'appointments' subcollection
      const userAppointmentsRef = collection(db, 'users', userId, 'appointments');

      // Query for appointments in the user's subcollection with date >= now, ordered by date
      const q = query(
        userAppointmentsRef,
        // userId filter is no longer needed as we are querying the user's specific subcollection
        where('date', '>=', nowTimestamp), // Appointment date is in the future or now
        orderBy('date', 'asc') // Order upcoming appointments chronologically
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAppointments.push({
          id: doc.id,
          ...doc.data(), // Spread the rest of the data
        } as Appointment); // Cast to Appointment type
      });
      setAppointments(fetchedAppointments);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      // Check if the error is the specific "index required" error
      // Note: The required index might change when querying the subcollection
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
           setError('Firestore query requires an index. Please create it in the Firebase Console (check the console for the exact link).');
           setShowIndexAlert(true); // Show the specific alert
      } else {
           setError('Failed to load appointments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAppointments(currentUser.uid); // Fetch appointments when user logs in
      } else {
        setUser(null);
        setAppointments([]);
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]); // Only depends on router

   // Format Firestore Timestamp to a readable date and time string
   const formatAppointmentDateTime = (timestamp: Timestamp): string => {
       return format(timestamp.toDate(), 'PPP p'); // Example: "Jan 15, 2024 10:00 AM"
   };

   const getFirstServiceName = (services: Appointment['services']): string => {
     if (services && services.length > 0) {
        return services[0].name + (services.length > 1 ? ` + ${services.length - 1} more` : '');
     }
     return 'Service details missing';
   }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">My Upcoming Bookings</CardTitle>
           <CardDescription className="text-center text-muted-foreground">
             Here are your scheduled upcoming appointments.
           </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Show index creation alert if needed */}
           {showIndexAlert && (
               <Alert variant="destructive" className="mb-4">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Heads up! Index Required</AlertTitle>
                   <AlertDescription>
                     {error} You can create the required index by visiting the link provided in the developer console error message (it might be different for the subcollection). Appointments will load correctly once the index is built (this may take a few minutes).
                   </AlertDescription>
               </Alert>
           )}
          {/* Appointments List */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error && !showIndexAlert ? ( // Show general error only if it's not the index error
              <p className="text-center text-destructive">{error}</p>
            ) : appointments.length === 0 && !loading && !showIndexAlert ? ( // Add !loading check
              <p className="text-center text-muted-foreground py-8">You have no upcoming appointments scheduled.</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((appt) => (
                  <li key={appt.id} className="border p-4 rounded-md dark:border-muted hover:bg-muted/50 transition-colors">
                    {/* Display primary service name and indicate if there are more */}
                    <p className="font-semibold text-lg">{getFirstServiceName(appt.services)}</p>
                    <p className="text-sm text-muted-foreground">With: {appt.providerName}</p>
                     {/* Format and display the date and time from the Timestamp */}
                    <p className="text-sm text-muted-foreground">Date & Time: {formatAppointmentDateTime(appt.date)}</p>
                     <p className="text-sm text-muted-foreground">Status: <span className="capitalize">{appt.status}</span></p>
                     <p className="text-sm text-muted-foreground font-medium">Total: ₹{appt.totalPrice.toFixed(2)}</p>
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

export default CalendarPage;
