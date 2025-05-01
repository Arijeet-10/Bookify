
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Define the structure of an appointment object
interface Appointment {
  id: string;
  providerName: string;
  serviceName: string;
  date: Timestamp; // Firestore Timestamp for the appointment date/time
  time?: string; // Optional time string (if stored separately)
  userId: string; // ID of the user who booked
  userName?: string; // Name of the user who booked (optional)
  // Add other relevant fields like providerId, serviceId, status etc.
}

const CalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Fetch all upcoming appointments for the user
  const fetchAppointments = async (userId: string) => {
    setLoading(true);
    setError(null);
    setAppointments([]); // Clear previous appointments

    try {
      // Get current time as Firestore Timestamp
      const nowTimestamp = Timestamp.now();

      // Reference the 'appointments' collection (adjust if your collection name is different)
      const appointmentsRef = collection(db, 'appointments');

      // Query for appointments for the logged-in user with date >= now, ordered by date
      const q = query(
        appointmentsRef,
        where('userId', '==', userId), // Filter by the logged-in user's ID
        where('date', '>=', nowTimestamp), // Appointment date is in the future or now
        orderBy('date', 'asc') // Order upcoming appointments chronologically
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedAppointments.push({
          id: doc.id,
          userId: data.userId,
          providerName: data.providerName || 'N/A',
          serviceName: data.serviceName || 'N/A',
          date: data.date as Timestamp,
          time: data.time,
          userName: data.userName,
        });
      });
      setAppointments(fetchedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">My Upcoming Bookings</CardTitle> {/* Updated title */}
           <CardDescription className="text-center text-muted-foreground">
             Here are your scheduled upcoming appointments.
           </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Appointments List */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <p className="text-center text-destructive">{error}</p>
            ) : appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">You have no upcoming appointments scheduled.</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((appt) => (
                  <li key={appt.id} className="border p-4 rounded-md dark:border-muted hover:bg-muted/50 transition-colors">
                    <p className="font-semibold text-lg">{appt.serviceName}</p>
                    <p className="text-sm text-muted-foreground">With: {appt.providerName}</p>
                     {/* Format and display the date and time from the Timestamp */}
                    <p className="text-sm text-muted-foreground">Date & Time: {formatAppointmentDateTime(appt.date)}</p>
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
