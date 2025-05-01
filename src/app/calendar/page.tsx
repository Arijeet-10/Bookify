'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore'; // Added orderBy
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
         // Fetch appointments for the current date when user logs in
        fetchAppointments(currentUser.uid, selectedDate || new Date());
      } else {
        setUser(null);
        setAppointments([]);
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, selectedDate]); // Re-run effect if selectedDate changes initially (though fetch is triggered by selectedDate change effect)

  const fetchAppointments = async (userId: string, date: Date) => {
    setLoading(true);
    setError(null);
    setAppointments([]); // Clear previous appointments for the new date

    try {
      // Calculate the start and end of the selected day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Convert to Firestore Timestamps
      const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
      const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

      // Reference the 'appointments' collection (adjust if your collection name is different)
      const appointmentsRef = collection(db, 'appointments');

      // Query for appointments for the logged-in user on the selected date
      const q = query(
        appointmentsRef,
        where('userId', '==', userId), // Filter by the logged-in user's ID
        where('date', '>=', startOfDayTimestamp), // Appointment date is on or after the start of the day
        where('date', '<=', endOfDayTimestamp), // Appointment date is on or before the end of the day
        orderBy('date', 'asc') // Order appointments by time
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        // Ensure the structure matches the Appointment interface
        const data = doc.data();
        fetchedAppointments.push({
          id: doc.id,
          userId: data.userId,
          providerName: data.providerName || 'N/A', // Add fallbacks
          serviceName: data.serviceName || 'N/A',
          date: data.date as Timestamp, // Ensure date is a Timestamp
          time: data.time, // Optional time string
          userName: data.userName, // Optional user name
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

  // Refetch when selected date changes
  useEffect(() => {
    if (user && selectedDate) {
      fetchAppointments(user.uid, selectedDate);
    } else if (!user) {
        // Clear appointments if user logs out or isn't available
        setAppointments([]);
        setLoading(false); // Ensure loading stops if no user
    }
  }, [selectedDate, user]); // Depend on selectedDate and user

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

   // Format Firestore Timestamp to a readable time string
   const formatAppointmentTime = (timestamp: Timestamp): string => {
       return format(timestamp.toDate(), 'p'); // Example: "10:00 AM"
   };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">My Bookings</CardTitle> {/* Updated title */}
           <CardDescription className="text-center text-muted-foreground">
             Select a date to view your scheduled appointments.
           </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">
          {/* Calendar */}
          <div className="flex justify-center">
             <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border dark:border-muted"
            />
          </div>

          {/* Appointments List */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-muted">
               Appointments for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}
            </h3>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <p className="text-center text-destructive">{error}</p>
            ) : appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No appointments scheduled for this date.</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((appt) => (
                  <li key={appt.id} className="border p-4 rounded-md dark:border-muted hover:bg-muted/50 transition-colors">
                    <p className="font-semibold">{appt.serviceName}</p>
                    <p className="text-sm text-muted-foreground">With: {appt.providerName}</p>
                     {/* Format and display the time from the Timestamp */}
                    <p className="text-sm text-muted-foreground">Time: {formatAppointmentTime(appt.date)}</p>
                    {/* Display other appointment details */}
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
