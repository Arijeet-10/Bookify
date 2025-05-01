
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

// Define the structure of an appointment object based on Firestore data
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
  services: AppointmentService[]; // Use the specific service interface
  totalPrice: number;
  date: Timestamp; // Firestore Timestamp for the appointment date/time
  userId: string; // ID of the user who booked
  userName?: string; // Name of the user who booked (optional)
  status: string;
  createdAt: Timestamp; // Timestamp added during booking creation
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
      // This query requires a composite index on 'date' (asc) in the 'appointments' subcollection
      const q = query(
        userAppointmentsRef,
        where('date', '>=', nowTimestamp), // Appointment date is in the future or now
        orderBy('date', 'asc') // Order upcoming appointments chronologically
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
         // Ensure the data matches the Appointment interface
         const data = doc.data();
          // Basic validation to ensure critical fields exist
         if (data.providerName && data.date && data.services && typeof data.totalPrice === 'number') {
              fetchedAppointments.push({
                 id: doc.id,
                 ...data,
              } as Appointment); // Cast to Appointment type after basic validation
         } else {
             console.warn("Skipping appointment due to missing fields:", doc.id, data);
         }
      });
      setAppointments(fetchedAppointments);

    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      // Check if the error is the specific "index required" error
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
           // Provide a more user-friendly message and instructions for the developer
           setError(`Firestore query requires an index for the 'users/{userId}/appointments' subcollection, ordered by 'date'. Please create this composite index in the Firebase Console. Check the developer console for the exact error message and index creation link.`);
           console.error("Index creation required. Follow the link in the Firestore console or use the Firebase CLI to create the index: users/{userId}/appointments -> date (ASC)"); // Log for developer
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
      setLoading(true); // Set loading true while checking auth
      if (currentUser) {
        setUser(currentUser);
        // fetchAppointments will be called in the next effect
      } else {
        setUser(null);
        setAppointments([]);
        router.push('/login');
      }
       setLoading(false); // Stop loading once auth state is determined (or fetch starts)
    });
    return () => unsubscribe();
  }, [router]); // Only depends on router

  // Separate useEffect to fetch data when user is available
  useEffect(() => {
    if (user) {
      fetchAppointments(user.uid);
    } else {
      // If user becomes null (logged out), clear appointments
      setAppointments([]);
      // Set loading to false only if not already handled by auth check
      if (loading) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-run this effect when the user state changes

   // Format Firestore Timestamp to a readable date and time string
   const formatAppointmentDateTime = (timestamp: Timestamp): string => {
       if (!timestamp?.toDate) return "Invalid Date"; // Add check for valid Timestamp
       try {
           return format(timestamp.toDate(), 'PPP p'); // Example: "Jan 15, 2024 10:00 AM"
       } catch (e) {
           console.error("Error formatting date:", e);
           return "Invalid Date";
       }
   };

   // Get the name of the first service, and indicate if more exist
   const getFirstServiceName = (services: AppointmentService[]): string => {
     if (Array.isArray(services) && services.length > 0 && services[0]?.name) {
        return services[0].name + (services.length > 1 ? ` (+${services.length - 1} more)` : '');
     }
     return 'Service details missing';
   }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[80px]"> {/* Applied pb-[80px] */}
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
                     {error} Creating the index can take a few minutes. Appointments will load correctly once the index is built. Reload the page after some time.
                   </AlertDescription>
               </Alert>
           )}
          {/* Appointments List */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : error && !showIndexAlert ? ( // Show general error only if it's not the index error
              <p className="text-center text-destructive">{error}</p>
            ) : !loading && appointments.length === 0 ? ( // Condition for no appointments (after loading and no error)
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
