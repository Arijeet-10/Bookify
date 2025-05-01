
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Define the structure of an appointment object (adjust as needed)
interface Appointment {
  id: string;
  providerName: string; // Or providerId and fetch details
  serviceName: string; // Or serviceId and fetch details
  date: Timestamp; // Firestore Timestamp for the appointment date
  time: string; // e.g., "10:00 AM"
  userName?: string; // Name of the user who booked
  // Add other relevant fields like userId, providerId, serviceId, status etc.
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
        // fetchAppointments(currentUser.uid, selectedDate || new Date()); // Fetch initially
      } else {
        setUser(null);
        setAppointments([]);
        setLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // TODO: Implement appointment fetching based on user ID and selected date
  // const fetchAppointments = async (userId: string, date: Date) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     // Example query (adjust collection name and fields)
  //     const appointmentsRef = collection(db, 'appointments'); // Assuming 'appointments' collection
  //     const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  //     const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  //     const q = query(
  //       appointmentsRef,
  //       where('userId', '==', userId), // Fetch for the logged-in user
  //       where('date', '>=', Timestamp.fromDate(startOfDay)),
  //       where('date', '<=', Timestamp.fromDate(endOfDay))
  //       // orderBy('date', 'asc') // Optional sorting
  //     );

  //     const querySnapshot = await getDocs(q);
  //     const fetchedAppointments: Appointment[] = [];
  //     querySnapshot.forEach((doc) => {
  //       fetchedAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
  //     });
  //     setAppointments(fetchedAppointments);
  //   } catch (err) {
  //     console.error('Error fetching appointments:', err);
  //     setError('Failed to load appointments. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Refetch when selected date changes
  useEffect(() => {
      // Currently no data fetching is implemented, placeholder for future use
     setLoading(false); // Simulate loading finished
     setAppointments([]); // Clear appointments when date changes until fetching is implemented
    // if (user && selectedDate) {
    //   fetchAppointments(user.uid, selectedDate);
    // }
  }, [selectedDate, user]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-background p-4 pb-[60px]">
      <Card className="w-full max-w-4xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">My Appointments</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Time: {appt.time}</p>
                    {/* Display other appointment details */}
                  </li>
                ))}
              </ul>
            )}
             {/* Placeholder content until fetching is implemented */}
              {!loading && !error && appointments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Appointment data fetching is not yet implemented.</p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
