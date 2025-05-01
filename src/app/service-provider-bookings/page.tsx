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
import { Terminal, Filter, ArrowUpDown, Search, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the structure of an appointment object
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
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
      const q = query(
        appointmentsRef,
        where('providerId', '==', providerId),
        where('date', '>=', nowTimestamp),
        orderBy('date', 'asc')
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
      setFilteredAppointments(fetchedAppointments);

    } catch (err: any) {
      console.error('Error fetching provider appointments:', err);
       if (err.code === 'failed-precondition' && err.message.includes('index')) {
           setError(`Firestore query requires an index. Please create it in the Firebase Console.`);
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

  // Separate useEffect to fetch data when user is available
  useEffect(() => {
    if (user) {
      fetchProviderAppointments(user.uid);
    } else {
      setAppointments([]);
      if (loading) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter and sort appointments
  useEffect(() => {
    let result = [...appointments];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(appointment => 
        appointment.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getFirstServiceName(appointment.services).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(appointment => appointment.status === statusFilter);
    }
    
    // Apply sort order
    result.sort((a, b) => {
      const dateA = a.date.toDate();
      const dateB = b.date.toDate();
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
    
    setFilteredAppointments(result);
  }, [appointments, searchTerm, statusFilter, sortOrder]);

  const formatAppointmentDateTime = (timestamp: Timestamp): string => {
    if (!timestamp?.toDate) return "Invalid Date";
    try {
        return format(timestamp.toDate(), 'PPP p');
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
  };
  
  const formatAppointmentDate = (timestamp: Timestamp): string => {
    if (!timestamp?.toDate) return "Invalid Date";
    try {
        return format(timestamp.toDate(), 'PP');
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
  };
  
  const formatAppointmentTime = (timestamp: Timestamp): string => {
    if (!timestamp?.toDate) return "Invalid Time";
    try {
        return format(timestamp.toDate(), 'p');
    } catch (e) {
        console.error("Error formatting time:", e);
        return "Invalid Time";
    }
  };

  const getFirstServiceName = (services: AppointmentService[]): string => {
    if (Array.isArray(services) && services.length > 0 && services[0]?.name) {
      return services[0].name + (services.length > 1 ? ` (+${services.length - 1} more)` : '');
    }
    return 'Service details missing';
  };
  
  const getStatusBadge = (status: string) => {
    let badgeClass = '';
    
    switch(status.toLowerCase()) {
      case 'confirmed':
        badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        break;
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        break;
      case 'cancelled':
        badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
    
    return (
      <Badge className={`${badgeClass} capitalize`}>{status}</Badge>
    );
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-background p-4 pb-[80px]">
      <Card className="w-full max-w-7xl dark:bg-card shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Your Upcoming Appointments</CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage all your scheduled customer appointments
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
          
          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search by customer or service..."
                className="pl-8 w-full md:w-[280px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {statusFilter ? `Status: ${statusFilter}` : 'Filter Status'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>
                    Confirmed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" className="h-9" onClick={toggleSortOrder}>
                <Calendar className="mr-2 h-4 w-4" />
                Sort {sortOrder === 'asc' ? 'Earliest' : 'Latest'}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Table of appointments */}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error && !showIndexAlert ? (
            <p className="text-center text-destructive py-8">{error}</p>
          ) : !loading && filteredAppointments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-white dark:bg-card border-gray-200 dark:border-gray-800">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No appointments found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'You have no upcoming appointments scheduled'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Service</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Date & Time
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Customer
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {getFirstServiceName(appt.services)}
                      </td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span>{formatAppointmentDate(appt.date)}</span>
                          <span className="text-gray-500 dark:text-gray-400">{formatAppointmentTime(appt.date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        {appt.userName || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(appt.status)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        ₹{appt.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderBookingsPage;