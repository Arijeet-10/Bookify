'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Tag, 
  RefreshCcw, 
  MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  services: AppointmentService[];
  totalPrice: number;
  date: Timestamp;
  userId: string;
  userName?: string;
  status: string;
  createdAt: Timestamp;
}

const CalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const router = useRouter();
  const [showIndexAlert, setShowIndexAlert] = useState(false);

  // Get today's date at the start of the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all upcoming appointments for the user from their subcollection
  const fetchAppointments = async (userId: string) => {
    setLoading(true);
    setError(null);
    setShowIndexAlert(false);
    setAppointments([]);

    try {
      const nowTimestamp = Timestamp.now();
      const userAppointmentsRef = collection(db, 'users', userId, 'appointments');
      
      const q = query(
        userAppointmentsRef,
        where('date', '>=', nowTimestamp),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedAppointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.providerName && data.date && data.services && typeof data.totalPrice === 'number') {
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
      console.error('Error fetching appointments:', err);
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        setError(`Firestore query requires an index for the 'users/{userId}/appointments' subcollection, ordered by 'date'. Please create this composite index in the Firebase Console.`);
        console.error("Index creation required. Follow the link in the Firestore console or use the Firebase CLI to create the index: users/{userId}/appointments -> date (ASC)");
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
      } else {
        setUser(null);
        setAppointments([]);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchAppointments(user.uid);
    } else {
      setAppointments([]);
      if (loading) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Format Firestore Timestamp to readable formats
  const formatAppointmentDate = (timestamp: Timestamp): string => {
    if (!timestamp?.toDate) return "Invalid Date";
    try {
      return format(timestamp.toDate(), 'MMM d, yyyy');
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const formatAppointmentTime = (timestamp: Timestamp): string => {
    if (!timestamp?.toDate) return "Invalid Time";
    try {
      return format(timestamp.toDate(), 'h:mm a');
    } catch (e) {
      console.error("Error formatting time:", e);
      return "Invalid Time";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Group appointments by date for better organization
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const date = formatAppointmentDate(appointment.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  // Get all service names formatted as a list
  const getServicesList = (services: AppointmentService[]): string => {
    if (Array.isArray(services) && services.length > 0) {
      return services.map(service => service.name).join(', ');
    }
    return 'Service details missing';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => user && fetchAppointments(user.uid)}
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {showIndexAlert && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Index Required</AlertTitle>
            <AlertDescription>
              {error} Creating the index can take a few minutes. Appointments will load correctly once the index is built.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="upcoming" className="mb-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
            <TabsTrigger value="upcoming" onClick={() => setActiveTab('upcoming')}>Upcoming</TabsTrigger>
            <TabsTrigger value="all" onClick={() => setActiveTab('all')}>All Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error && !showIndexAlert ? (
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">Unable to Load Appointments</p>
                      <p className="text-gray-500 dark:text-gray-400">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : appointments.length === 0 ? (
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Upcoming Appointments</p>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">You don't have any appointments scheduled at the moment.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{date}</h2>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                      {dateAppointments.map((appointment) => (
                        <Card key={appointment.id} className="overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-colors">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                  {appointment.services[0]?.name}
                                  {appointment.services.length > 1 && <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> + {appointment.services.length - 1} more</span>}
                                </h3>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{appointment.providerName}</span>
                                </div>
                              </div>
                              <Badge className={`${getStatusBadgeVariant(appointment.status)}`}>
                                {appointment.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{formatAppointmentTime(appointment.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Tag className="h-4 w-4 text-gray-400" />
                                <span>₹{appointment.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            {appointment.services.length > 1 && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">Services:</span> {getServicesList(appointment.services)}
                                </p>
                              </div>
                            )}
                            
                            <div className="mt-4 flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 dark:text-red-400">Cancel Appointment</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {/* Same structure as above, but would show all appointments including past ones */}
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">This tab would display all appointments, including past ones.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarPage;